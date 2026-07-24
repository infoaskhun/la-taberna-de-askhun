import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';

export class SaldoCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('saldo')
    .setDescription('Consulta tu saldo de Celesios.');

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const logger = container.logger;
    const economyService = container.economyService;
    const userId = interaction.user.id;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const balance = await economyService.getBalance(userId);

      const roleplaceText =
        `*Te acercas al **Rincón de las Gárgolas**, ese recoveco oscuro junto a la chimenea donde tres figuras de piedra observan desde la pared con la boca abierta. Introduces tu nota entre los dientes de la del centro. La piedra cruje. La nota desaparece.*\n\n` +
        `*Un momento después, algo roza tu mano. Un pergamino diminuto, doblado con precisión quirúrgica. La letra es pequeña y exacta:*\n\n` +
        `> Tus arcas contienen **${balance} Celesios**. Custodiados. Contados. Intactos.\n> \n> *Fdo: Tu Tesorero*`;

      const embed = new EmbedBuilder()
        .setColor(0x1a1a2e)
        .setDescription(roleplaceText)
        .setFooter({ text: 'La Taberna de Askhun · Rincón de las Gárgolas' })
        .setTimestamp();

      try {
        await interaction.user.send({ embeds: [embed] });
        await interaction.editReply({ content: '*La gárgola del centro parpadea. Un instante. El mensaje ya está en camino.*' });
      } catch (dmErr) {
        logger.warn(`Failed to send balance DM to user ${userId}:`, dmErr);
        await interaction.editReply(
          '❌ No he podido enviarte el mensaje privado. Por favor, asegúrate de tener los mensajes directos activados en la configuración de privacidad de este servidor.'
        );
      }
    } catch (err) {
      logger.error('Error executing /saldo command:', err);
      await interaction.editReply('Ocurrió un error inesperado al consultar tu saldo.');
    }
  }
}

export default SaldoCommand;
