import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, TextChannel, PermissionFlagsBits } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';
import { PredictionRenderer } from '../../utils/PredictionRenderer';

export class PronosticoCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('pronostico')
    .setDescription('Comandos de administración para pronósticos.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('crear')
        .setDescription('Crea y abre un nuevo pronóstico de votación.')
        .addStringOption((opt) => opt.setName('titulo').setDescription('El título del pronóstico.').setRequired(true))
        .addIntegerOption((opt) => opt.setName('recompensa').setDescription('Cantidad de Celesios para ganadores.').setRequired(true))
        .addStringOption((opt) => opt.setName('opciones').setDescription('Opciones separadas por comas (mínimo 2, ej. "opcion A, opcion B").').setRequired(true))
        .addIntegerOption((opt) => opt.setName('tiempo').setDescription('Tiempo en minutos que estará abierta la votación.').setRequired(true))
        .addStringOption((opt) => opt.setName('mensaje').setDescription('Mensaje personalizado que se mostrará debajo del título.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('cerrar')
        .setDescription('Cierra la votación del pronóstico activo.')
    )
    .addSubcommand((sub) =>
      sub
        .setName('resolver')
        .setDescription('Resuelve el pronóstico cerrado asignando una opción ganadora por su posición.')
        .addIntegerOption((opt) => opt.setName('posicion').setDescription('Número de la opción ganadora (1, 2, 3...).').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('cancelar')
        .setDescription('Cancela el pronóstico activo actual.')
    );

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const logger = container.logger;
    const predictionService = container.predictionService;
    const userRepo = container.userRepository;
    const settingsRepo = container.guildSettingsRepository;

    // Validate admin/owner permission dynamically from DB
    const callerProfile = await userRepo.getById(interaction.user.id);
    if (!callerProfile || (!callerProfile.isAdmin && !callerProfile.isOwner)) {
      await interaction.reply({ content: 'No tienes permisos para usar este comando de administración.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Validate channel dynamically (admin command must run in moderacion or linked pronosticos channel)
    const guildId = interaction.guildId;
    let isAllowedChannel = false;
    let allowedChannelMention = '**#askhun-moderation** o el canal vinculado a **pronosticos**';

    if (guildId) {
      const settings = await settingsRepo.getByGuildId(guildId);
      if (settings && settings.pronosticosChannelId) {
        isAllowedChannel = interaction.channelId === settings.pronosticosChannelId ||
          (interaction.channel as any)?.parentId === settings.pronosticosChannelId;
        allowedChannelMention = `<#${settings.pronosticosChannelId}> y sus hilos`;
      } else {
        const channelName = (interaction.channel as any)?.name?.toLowerCase();
        isAllowedChannel = channelName === 'askhun-moderation';
      }
    } else {
      const channelName = (interaction.channel as any)?.name?.toLowerCase();
      isAllowedChannel = channelName === 'askhun-moderation';
    }

    if (!isAllowedChannel) {
      await interaction.reply({ content: `Este comando solo puede ser ejecutado en el canal de administración ${allowedChannelMention}.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // DisplayName Resolver function
    const memberResolver = async (userId: string): Promise<string> => {
      if (!interaction.guild) return userId;
      try {
        const member = await interaction.guild.members.fetch(userId);
        return member.displayName;
      } catch {
        return userId;
      }
    };

    try {
      if (subcommand === 'crear') {
        if (!guildId) {
          await interaction.editReply('Este comando solo puede ejecutarse dentro de un servidor.');
          return;
        }

        // Fetch settings to ensure target public channel exists
        const settings = await settingsRepo.getByGuildId(guildId);
        if (!settings || !settings.pronosticosChannelId) {
          await interaction.editReply('Primero debes configurar el canal de pronósticos con `/configuracion vincularcanal tipo:Pronósticos canal:[#canal]`.');
          return;
        }

        const targetChannel = interaction.channel as any;
        if (!targetChannel) {
          await interaction.editReply('No se ha podido acceder al canal actual.');
          return;
        }

        const title = interaction.options.getString('titulo', true);
        const reward = interaction.options.getInteger('recompensa', true);
        const optionsStr = interaction.options.getString('opciones', true);
        const durationMinutes = interaction.options.getInteger('tiempo', true);
        const customMessage = interaction.options.getString('mensaje', true);
        const optionNames = optionsStr.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

        if (optionNames.length < 2) {
          await interaction.editReply('Debes especificar al menos 2 opciones válidas separadas por comas.');
          return;
        }

        if (optionNames.length > 10) {
          await interaction.editReply('❌ No puedes crear un pronóstico con más de 10 opciones.');
          return;
        }

        const { prediction, options } = await predictionService.createAndOpenPrediction(
          title,
          reward,
          optionNames,
          interaction.user.id,
          durationMinutes
        );

        // Render embed & components
        const { embed, components } = await PredictionRenderer.render(prediction, options, [], 1, memberResolver, null, customMessage);

        // Send public message
        const publicMessage = await targetChannel.send({ embeds: [embed], components });

        // Save message details to DB
        await predictionService['predictionRepo'].updateMessageInfo(prediction.id, publicMessage.id, publicMessage.channelId);

        await interaction.editReply(`El pronóstico ha sido creado con éxito y publicado en <#${targetChannel.id}>.`);

      } else if (subcommand === 'cerrar') {
        const prediction = await predictionService.closeActivePrediction();

        // Update original message
        if (prediction.channelId && prediction.messageId) {
          const channel = await interaction.guild?.channels.fetch(prediction.channelId).catch(() => null);
          if (channel && (channel.isTextBased() || (channel as any).isThread?.())) {
            const message = await (channel as any).messages.fetch(prediction.messageId).catch(() => null);
            if (message) {
              const existingDesc = message.embeds[0]?.description || '';
              const customMessage = existingDesc.includes('**Recompensa:**') ? existingDesc.split('**Recompensa:**')[0].trim() : null;

              const options = await predictionService['predictionRepo'].getOptions(prediction.id);
              const votes = await predictionService['predictionRepo'].getVotes(prediction.id);
              const { embed, components } = await PredictionRenderer.render(prediction, options, votes, 1, memberResolver, null, customMessage);
              await message.edit({ embeds: [embed], components });
            }
          }
        }

        await interaction.editReply(`El pronóstico **"${prediction.title}"** ha sido cerrado. Ya no se admiten nuevos votos.`);

      } else if (subcommand === 'resolver') {
        const position = interaction.options.getInteger('posicion', true);

        // Fetch active prediction options before resolving to get winner option name
        const active = await predictionService.getActive();
        if (!active) {
          await interaction.editReply('No hay ningún pronóstico activo para resolver.');
          return;
        }

        if (position < 1 || position > active.options.length) {
          await interaction.editReply(`Opción inválida. Selecciona un número entre 1 y ${active.options.length}.`);
          return;
        }

        const winnerOptionName = active.options[position - 1].name;

        await predictionService.resolvePrediction(position);

        // Get updated object to render final closed state
        const resolvedPrediction = await predictionService['predictionRepo'].getById(active.prediction.id);

        if (resolvedPrediction && resolvedPrediction.channelId && resolvedPrediction.messageId) {
          const channel = await interaction.guild?.channels.fetch(resolvedPrediction.channelId).catch(() => null);
          if (channel && (channel.isTextBased() || (channel as any).isThread?.())) {
            const message = await (channel as any).messages.fetch(resolvedPrediction.messageId).catch(() => null);
            if (message) {
              const existingDesc = message.embeds[0]?.description || '';
              const customMessage = existingDesc.includes('**Recompensa:**') ? existingDesc.split('**Recompensa:**')[0].trim() : null;

              const options = await predictionService['predictionRepo'].getOptions(resolvedPrediction.id);
              const votes = await predictionService['predictionRepo'].getVotes(resolvedPrediction.id);
              const { embed, components } = await PredictionRenderer.render(resolvedPrediction, options, votes, 1, memberResolver, winnerOptionName, customMessage);
              await message.edit({ embeds: [embed], components });
            }
          }
        }

        await interaction.editReply(`*"¡El Dios Beodo ha hablado! La partida ha terminado. Los que supieron ver lo que otros no vieron reciben su recompensa: Los Celesios caen en sus arcas. El resto... que ahogue sus penas en la barra."*`);

      } else if (subcommand === 'cancelar') {
        const active = await predictionService.getActive();
        if (!active) {
          await interaction.editReply('No hay ningún pronóstico activo para cancelar.');
          return;
        }

        await predictionService.cancelPrediction();

        // Update public message if possible
        if (active.prediction.channelId && active.prediction.messageId) {
          const channel = await interaction.guild?.channels.fetch(active.prediction.channelId).catch(() => null);
          if (channel && (channel.isTextBased() || (channel as any).isThread?.())) {
            const message = await (channel as any).messages.fetch(active.prediction.messageId).catch(() => null);
            if (message) {
              const cancelledEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle(`PRONÓSTICO CANCELADO: ${active.prediction.title}`)
                .setDescription(`*Este pronóstico ha sido cancelado por la administración. No se repartirán recompensas.*`)
                .setTimestamp();
              await message.edit({ embeds: [cancelledEmbed], components: [] });
            }
          }
        }

        await interaction.editReply(`El pronóstico activo ha sido cancelado con éxito.`);
      }
    } catch (err: any) {
      logger.error(`Error in /pronostico ${subcommand}:`, err);
      await interaction.editReply(`Error: ${err.message || 'Error al procesar la acción.'}`);
    }
  }
}

export default PronosticoCommand;
