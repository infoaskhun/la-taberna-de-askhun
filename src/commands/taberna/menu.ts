import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';
import { WebhookHelper } from '../../utils/WebhookHelper';
import { EmojiHelper } from '../../utils/EmojiHelper';

export class MenuCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Consulta la carta de comidas de Gram o la barra de bebidas de Grum.')
    .addStringOption((opt) =>
      opt
        .setName('personaje')
        .setDescription('Elige de quién deseas ver la carta.')
        .setRequired(true)
        .addChoices(
          { name: 'Gram (Cocinero)', value: 'gram' },
          { name: 'Grum (Cantinero)', value: 'grum' }
        )
    );

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const config = container.configuration;
    const itemRepo = container.itemRepository;
    const settingsRepo = container.guildSettingsRepository;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: 'Este comando solo puede ejecutarse dentro de un servidor.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Validate execution channel (must be configured taberna channel)
    const settings = await settingsRepo.getByGuildId(guildId);
    if (!settings || !settings.tabernaChannelId) {
      await interaction.reply({
        content: 'La taberna aún no tiene un canal vinculado. Pídele a un administrador que configure la sala de la taberna.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channelName = (interaction.channel as any)?.name?.toLowerCase();
    const isModerationChannel = channelName === 'askhun-moderation';
    const isTabernaChannel = interaction.channelId === settings.tabernaChannelId ||
      (interaction.channel as any)?.parentId === settings.tabernaChannelId;

    if (!isTabernaChannel && !isModerationChannel) {
      await interaction.reply({
        content: `Este comando solo puede utilizarse en el canal vinculado a la taberna (<#${settings.tabernaChannelId}>), en sus hilos, o en #askhun-moderation.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const personaje = interaction.options.getString('personaje', true);
      const type = personaje === 'gram' ? 'food' : 'drink';

      // Fetch active items of selected type
      const items = await itemRepo.getAllActiveByType(type);
      const emoji = await EmojiHelper.getCelesioEmoji(interaction.guild);
      let messageContent = '';

      if (personaje === 'gram') {
        messageContent += `**🍴 LA COCINA DE GRAM - CARTA DE COMIDAS**\n\n`;
        if (items.length === 0) {
          messageContent += `*Gram está limpiando los fogones... Hoy no hay platos disponibles en el menú.*`;
        } else {
          messageContent += `*"La carta. Léela rápido, que Gram no tiene todo el día."*\n\n`;
          items.forEach((item) => {
            messageContent += `🔹 **${item.name}** — ${emoji} \`${item.price} Celesios\`\n`;
          });
        }
      } else {
        messageContent += `**🍺 LA BARRA DE GRUM - CARTA DE BEBIDAS**\n\n`;
        if (items.length === 0) {
          messageContent += `*Grum está ordenando los barriles... Hoy no hay bebidas disponibles en la barra.*`;
        } else {
          messageContent += `*"¡Grum te enseña la carta! Elige bien... o elige mal. Grum sirve igual."*\n\n`;
          items.forEach((item) => {
            messageContent += `🔹 **${item.name}** — ${emoji} \`${item.price} Celesios\`\n`;
          });
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setAuthor({
          name: personaje === 'gram' ? 'Gram (Cocinero)' : 'Grum (Cantinero)',
          iconURL: (personaje === 'gram' ? settings.gramAvatarUrl : settings.grumAvatarUrl) ?? undefined
        })
        .setDescription(messageContent)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      container.logger.error('Error fetching menu:', err);
      await interaction.editReply('Hubo un error al intentar consultar el menú. Por favor, inténtalo de nuevo más tarde.');
    }
  }
}

export default MenuCommand;
