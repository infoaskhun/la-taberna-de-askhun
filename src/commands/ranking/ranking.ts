import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';

export class RankingCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Muestra el ranking oficial de Clientes Habituales de la taberna.');

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const config = container.configuration;
    const logger = container.logger;
    const rankingService = container.rankingService;

    // Validate channel/thread dynamically from DB setup
    const guildId = interaction.guildId;
    if (guildId) {
      const channelName = (interaction.channel as any)?.name?.toLowerCase();
      const isModerationChannel = channelName === 'askhun-moderation';
      const settingsRepo = container.guildSettingsRepository;
      const settings = await settingsRepo.getByGuildId(guildId);
      const isRankingChannel = settings && (settings.rankingThreadId === interaction.channelId || 
                                            (interaction.channel as any)?.parentId === settings.rankingThreadId);

      if (!isModerationChannel && !isRankingChannel) {
        const replyChan = settings?.rankingThreadId ? `<#${settings.rankingThreadId}> y sus hilos` : 'el hilo de ranking configurado';
        await interaction.reply({ content: `Este comando solo puede ser ejecutado en ${replyChan} o en #askhun-moderation.`, flags: MessageFlags.Ephemeral });
        return;
      }
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const topUsers = await rankingService.getHabitualCustomerRanking(50);

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('🏆 RANKING DE CLIENTES HABITUALES')
        .setDescription(
          `A continuación se muestran los clientes más distinguidos de **La Taberna de Askhun**:\n\n` +
          (topUsers.length === 0
            ? '*La taberna está silenciosa. Nadie ha gastado Celesios aún.*'
            : topUsers
                .map((u, index) => {
                  let medal = '';
                  if (index === 0) medal = '🥇 ';
                  else if (index === 1) medal = '🥈 ';
                  else if (index === 2) medal = '🥉 ';
                  else medal = `[#${index + 1}] `;

                  return `${medal}<@${u.id}>`;
                })
                .join('\n'))
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error('Error executing /ranking command:', err);
      await interaction.editReply('Ocurrió un error inesperado al intentar generar el ranking.');
    }
  }
}

export default RankingCommand;
