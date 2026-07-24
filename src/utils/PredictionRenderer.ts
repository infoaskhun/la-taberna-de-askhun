import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Prediction, PredictionOption, PredictionVote } from '../repositories/PredictionRepository';

export class PredictionRenderer {
  /**
   * Generates the Embed and Component Rows for a prediction message on Discord
   * @param prediction The prediction object
   * @param options The list of options
   * @param votes The list of votes
   * @param currentPage The current page of voters to display (1-based)
   * @param memberResolver A function that resolves a userId to a guild member display name
   */
  public static async render(
    prediction: Prediction,
    options: PredictionOption[],
    votes: PredictionVote[],
    currentPage: number = 1,
    memberResolver: (userId: string) => Promise<string>,
    winnerOptionName: string | null = null,
    customMessage: string | null = null
  ): Promise<{ embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] }> {

    const isExpired = prediction.endsAt && Date.now() > prediction.endsAt.getTime();
    const isClosed = prediction.status !== 'open' || isExpired;
    const isResolved = prediction.status === 'resolved';

    // 1. Title formatting
    let title = `PRONÓSTICO ACTIVO: ${prediction.title}`;
    if (isResolved) {
      title = `PRONÓSTICO RESUELTO: ${prediction.title}`;
    } else if (isClosed) {
      title = `PRONÓSTICO CERRADO: ${prediction.title}`;
    }

    // 2. Build the basic description
    const endsAtTimestamp = prediction.endsAt ? Math.floor(prediction.endsAt.getTime() / 1000) : 0;
    const timerText = isClosed
      ? `Cerrado (<t:${endsAtTimestamp}:f>)`
      : `<t:${endsAtTimestamp}:R> (<t:${endsAtTimestamp}:f>)`;

    let description = '';
    if (customMessage) {
      description += `${customMessage}\n\n`;
    }

    description += `**Recompensa:** ${prediction.reward} Celesios\n` +
      `**Cierre de votaciones:** ${timerText}\n\n` +
      `**Opciones disponibles:**\n` +
      options.map((opt, idx) => `**${idx + 1}.** ${opt.name}`).join('\n');

    // Show winner if resolved
    let winnerName = winnerOptionName;
    if (isResolved && !winnerName && prediction.winnerOptionId) {
      winnerName = options.find(opt => opt.id === prediction.winnerOptionId)?.name || null;
    }

    if (isResolved && winnerName) {
      description += `\n\n🏆 **OPCIÓN GANADORA:** **${winnerName}**\n*"¡El Dios Beodo ha hablado! La partida ha terminado. Los que supieron ver lo que otros no vieron reciben su recompensa: Los Celesios caen en sus arcas. El resto... que ahogue sus penas en la barra."*`;
    }

    // 3. Paginate voters list (15 per page)
    const itemsPerPage = 15;
    const totalVotes = votes.length;
    const totalPages = Math.max(1, Math.ceil(totalVotes / itemsPerPage));
    const page = Math.min(totalPages, Math.max(1, currentPage));

    description += `\n\n📊 **Votaciones (${totalVotes}):**\n`;

    if (totalVotes === 0) {
      description += `*Nadie ha votado todavía.*`;
    } else {
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalVotes);
      const pageVotes = votes.slice(startIndex, endIndex);

      const resolvedVoters = await Promise.all(
        pageVotes.map(async (v) => {
          const name = await memberResolver(v.userId);
          const choice = options.find((opt) => opt.id === v.optionId)?.name || 'Desconocida';
          return `🔹 ${name} -> ${choice}`;
        })
      );

      description += resolvedVoters.join('\n');
      if (totalPages > 1) {
        description += `\n\n*Página ${page} de ${totalPages}*`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();

    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    // 4. Create Option Buttons row (only if NOT closed/resolved)
    if (!isClosed && !isResolved) {
      const chunkedOptions: PredictionOption[][] = [];
      const tempOptions = options.slice(0, 10);
      for (let i = 0; i < tempOptions.length; i += 5) {
        chunkedOptions.push(tempOptions.slice(i, i + 5));
      }

      for (const chunk of chunkedOptions) {
        const optionsRow = new ActionRowBuilder<ButtonBuilder>();
        for (const opt of chunk) {
          optionsRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`prediction_vote:${prediction.id}:${opt.id}`)
              .setLabel(opt.name.length > 80 ? opt.name.substring(0, 77) + '...' : opt.name)
              .setStyle(ButtonStyle.Primary)
          );
        }
        components.push(optionsRow);
      }
    }

    // 5. Create Navigation Buttons row (only if there is more than 1 page)
    if (totalPages > 1) {
      const navRow = new ActionRowBuilder<ButtonBuilder>();
      navRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`prediction_page:${prediction.id}:${page - 1}`)
          .setLabel('◀ Página Anterior')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page <= 1),
        new ButtonBuilder()
          .setCustomId(`prediction_page:${prediction.id}:${page + 1}`)
          .setLabel('Página Siguiente ▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= totalPages)
      );
      components.push(navRow);
    }

    return { embed, components };
  }
}
