import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags, AutocompleteInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';
import { WebhookHelper } from '../../utils/WebhookHelper';
import { EmojiHelper } from '../../utils/EmojiHelper';


export class GrumCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('grum')
    .setDescription('Pídele una bebida al cantinero Grum.')
    .addStringOption((option) =>
      option
        .setName('bebida')
        .setDescription('El nombre de la bebida que deseas ordenar.')
        .setAutocomplete(true)
        .setRequired(true)
    );

  public async autocomplete(interaction: AutocompleteInteraction, container: ApplicationContainer): Promise<void> {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    try {
      const items = await container.itemRepository.getAllActiveByType('drink');
      const filtered = items.filter(item => {
        const displayName = `una jarra de ${item.name}`.toLowerCase();
        return displayName.includes(focusedValue) || item.name.toLowerCase().includes(focusedValue);
      });
      const choices = filtered.slice(0, 25).map(item => ({
        name: `una jarra de ${item.name}`,
        value: item.name
      }));
      await interaction.respond(choices);
    } catch (err) {
      container.logger.error('Error in /grum autocomplete:', err);
      await interaction.respond([]);
    }
  }

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const logger = container.logger;
    const config = container.configuration;
    const tavernService = container.tavernService;

    // Validate channel dynamically from DB setup
    const guildId = interaction.guildId;
    if (guildId) {
      const channelName = (interaction.channel as any)?.name?.toLowerCase();
      const isModerationChannel = channelName === 'askhun-moderation';

      const settingsRepo = container.guildSettingsRepository;
      const settings = await settingsRepo.getByGuildId(guildId);
      const isTabernaChannel = settings && (settings.tabernaChannelId === interaction.channelId || 
                                           (interaction.channel as any)?.parentId === settings.tabernaChannelId);

      if (!isModerationChannel && !isTabernaChannel) {
        const replyChan = settings?.tabernaChannelId ? `<#${settings.tabernaChannelId}> y sus hilos` : 'el canal de la taberna (aún no configurado)';
        await interaction.reply({ content: `Este comando solo puede ser ejecutado en ${replyChan} o en #askhun-moderation.`, flags: MessageFlags.Ephemeral });
        return;
      }
    }

    let bebida = interaction.options.getString('bebida', true);
    if (bebida.toLowerCase().startsWith('una jarra de ')) {
      bebida = bebida.slice('una jarra de '.length);
    }
    const userId = interaction.user.id;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const result = await tavernService.purchaseItem(userId, bebida, 'drink', guildId);
      const settingsRepo = container.guildSettingsRepository;
      const settings = guildId ? await settingsRepo.getByGuildId(guildId) : null;

      if (result.status === 'success' || result.status === 'unknown_product' || result.status === 'insufficient_balance') {
        const messageText = result.narrativeMessage || 'Pedido procesado.';
        
        const embed = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setDescription(messageText)
          .setTimestamp();

        if (result.status === 'insufficient_balance') {
          const emoji = await EmojiHelper.getCelesioRotoEmoji(interaction.guild);
          const emojiUrl = await EmojiHelper.getCelesioRotoEmojiUrl(interaction.guild);
          embed.setTitle(`${emoji} Celesios insuficientes`);
          if (emojiUrl) {
            embed.setThumbnail(emojiUrl);
          }
        } else if (result.status === 'unknown_product') {
          embed.setTitle('Comando inexistente');
        }

        await WebhookHelper.sendWebhookMessage(
          interaction.channel,
          'Grum (Cantinero)',
          settings?.grumAvatarUrl || null,
          {
            content: `<@${userId}>`,
            embeds: [embed]
          }
        );

        await interaction.deleteReply();
      } else {
        await interaction.editReply(result.errorMessage || 'Hubo un problema al procesar tu pedido.');
      }
    } catch (err) {
      logger.error('Error executing /grum command:', err);
      await interaction.editReply('Ocurrió un error inesperado al procesar tu pedido con Grum.');
    }
  }
}

export default GrumCommand;
