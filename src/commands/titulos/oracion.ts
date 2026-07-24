import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember, MessageFlags, AutocompleteInteraction } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';
import { EmojiHelper } from '../../utils/EmojiHelper';

export class OracionCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('oracion')
    .setDescription('Realiza una oración en el Templo para ascender de rango y adquirir un título.')
    .addStringOption((option) =>
      option
        .setName('oracion')
        .setDescription('El nombre de la oración que deseas adquirir orando.')
        .setAutocomplete(true)
        .setRequired(true)
    );

  public async autocomplete(interaction: AutocompleteInteraction, container: ApplicationContainer): Promise<void> {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    try {
      const activeTitles = await container.titleRepository.getAllActive();
      const filtered = activeTitles.filter(title =>
        title.name.toLowerCase().includes(focusedValue)
      );
      const choices = filtered.slice(0, 25).map(title => ({
        name: title.name,
        value: title.name
      }));
      await interaction.respond(choices);
    } catch (err) {
      container.logger.error('Error in /oracion autocomplete:', err);
      await interaction.respond([]);
    }
  }

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const logger = container.logger;
    const titleService = container.titleService;
    const titleName = interaction.options.getString('oracion', true);
    const member = interaction.member as GuildMember;

    if (!member) {
      await interaction.reply({ content: 'Este comando solo puede usarse dentro de un servidor.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Validate channel dynamically from DB setup
    const guildId = interaction.guildId;
    if (guildId) {
      const channelName = (interaction.channel as any)?.name?.toLowerCase();
      const isModerationChannel = channelName === 'askhun-moderation';
      const settingsRepo = container.guildSettingsRepository;
      const settings = await settingsRepo.getByGuildId(guildId);
      const isTemploChannel = settings && (settings.temploChannelId === interaction.channelId ||
        (interaction.channel as any)?.parentId === settings.temploChannelId);

      if (!isModerationChannel && !isTemploChannel) {
        const replyChan = settings?.temploChannelId ? `<#${settings.temploChannelId}> y sus hilos` : 'el canal del templo (aún no configurado)';
        await interaction.reply({ content: `Este comando solo puede ser ejecutado en ${replyChan} o en #askhun-moderation.`, flags: MessageFlags.Ephemeral });
        return;
      }
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const result = await titleService.purchaseTitle(member, titleName);

      const embed = new EmbedBuilder().setTimestamp();

      if (result.status === 'success') {
        embed
          .setColor(0x2b2d31)
          .setTitle('Oración escuchada')
          .setDescription(result.narrativeMessage || `Has adquirido el título de **${result.title?.name}**.`);
      } else if (result.status === 'unknown_title') {
        embed
          .setColor(0x2b2d31)
          .setTitle('Oración desconocida')
          .setDescription(result.narrativeMessage || 'Ese título no existe.');
      } else if (result.status === 'already_owned') {
        embed
          .setColor(0x2b2d31)
          .setTitle('Bendición ya obtenida')
          .setDescription(result.narrativeMessage || '*"Beodo ya te ha bendecido con esta oración, no necesitas ser bendecido de nuevo."*.');
      } else if (result.status === 'invalid_progression') {
        embed
          .setColor(0x2b2d31)
          .setTitle('Requisitos insuficientes')
          .setDescription(result.narrativeMessage || 'Parece que tu oración no es escuchada por el Dios Beodo. No considera que cumplas con los requisitos necesarios para ser atendido por él.');
      } else if (result.status === 'insufficient_balance') {
        const emoji = await EmojiHelper.getCelesioRotoEmoji(interaction.guild);
        const emojiUrl = await EmojiHelper.getCelesioRotoEmojiUrl(interaction.guild);
        embed
          .setColor(0x2b2d31)
          .setTitle(`${emoji} Celesios insuficientes`)
          .setDescription(result.narrativeMessage || 'Tus ofrendas son insuficientes para que el Dios Beodo escuche tu oración.');
        if (emojiUrl) {
          embed.setThumbnail(emojiUrl);
        }
      } else {
        embed
          .setColor(0x2b2d31)
          .setTitle('⚠️ Error')
          .setDescription(result.errorMessage || 'Hubo un problema al procesar tu compra.');
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error('Error executing /oracion command:', err);
      await interaction.editReply('Ocurrió un error inesperado al procesar tu petición en el Templo del Dios Beodo.');
    }
  }
}

export default OracionCommand;
