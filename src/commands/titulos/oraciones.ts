import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';
import { EmojiHelper } from '../../utils/EmojiHelper';

export class OracionesCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('oraciones')
    .setDescription('Muestra la lista de oraciones disponibles en el altar, sus costes e IDs.');

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const logger = container.logger;
    const titleRepo = container.titleRepository;
    const settingsRepo = container.guildSettingsRepository;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: 'Este comando solo puede usarse dentro de un servidor.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Channel restriction validation
    const settings = await settingsRepo.getByGuildId(guildId);
    const channelName = (interaction.channel as any)?.name?.toLowerCase();
    const isModerationChannel = channelName === 'askhun-moderation';

    const isTemploChannel = settings && (settings.temploChannelId === interaction.channelId ||
      (interaction.channel as any)?.parentId === settings.temploChannelId);

    if (guildId) {
      if (!isModerationChannel && !isTemploChannel) {
        const replyChan = settings?.temploChannelId ? `<#${settings.temploChannelId}> y sus hilos` : 'el canal del templo (aún no configurado)';
        await interaction.reply({
          content: `Este comando solo puede ser ejecutado en ${replyChan} o en #askhun-moderation.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const userRepo = container.userRepository;
      const callerProfile = await userRepo.getById(interaction.user.id);
      const isAdmin = callerProfile?.isAdmin || callerProfile?.isOwner || false;

      const activeTitles = await titleRepo.getAllActive();

      if (activeTitles.length === 0) {
        await interaction.editReply('Actualmente no hay ninguna oración disponible para su adquisición.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('📜 Oraciones Disponibles')
        .setDescription('*"Acércate al altar y reza al dios Beodo usando el comando `/oracion` para recibir su bendición. A continuación, se detallan las oraciones disponibles:"*\n\n')
        .setTimestamp();

      const emoji = await EmojiHelper.getCelesioEmoji(interaction.guild);

      // Build hierarchy map for display
      const titlesMap = new Map(activeTitles.map(t => [t.id, t]));

      activeTitles.forEach((title) => {
        let reqText = 'Ninguno';
        if (title.requiredTitleId) {
          const reqTitle = titlesMap.get(title.requiredTitleId);
          reqText = reqTitle
            ? (isAdmin ? `**${reqTitle.name}** (ID: \`${title.requiredTitleId}\`)` : `**${reqTitle.name}**`)
            : `Título ID \`${title.requiredTitleId}\``;
        }

        const displayName = isAdmin ? `${title.name} (ID: \`${title.id}\`)` : title.name;

        embed.addFields({
          name: displayName,
          value: `Coste: \`${title.cost} Celesios\` ${emoji}\nRequisito previo: ${reqText}\nRol asociado: <@&${title.roleId}>`,
          inline: false
        });
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error('Error executing /oraciones command:', err);
      await interaction.editReply('Ocurrió un error inesperado al intentar listar las oraciones.');
    }
  }
}

export default OracionesCommand;
