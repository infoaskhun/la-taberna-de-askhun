import { Job } from './Job';
import { ApplicationContainer } from '../bootstrap/ApplicationContainer';
import { TextChannel } from 'discord.js';
import { PredictionRenderer } from '../utils/PredictionRenderer';

export class PredictionExpirationJob implements Job {
  public readonly name = 'PredictionExpirationJob';
  private timer: NodeJS.Timeout | null = null;

  public start(container: ApplicationContainer): void {
    container.logger.info('PredictionExpirationJob background service started.');
    // Check every 30 seconds
    this.timer = setInterval(async () => {
      try {
        await this.execute(container);
      } catch (err) {
        container.logger.error('Error executing PredictionExpirationJob interval:', err);
      }
    }, 30000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  public async execute(container: ApplicationContainer): Promise<void> {
    const predictionRepo = container.resolve<any>('PredictionRepository');
    const logger = container.logger;
    const discordClient = container.discord;

    const active = await predictionRepo.getActivePrediction();
    if (!active || active.status !== 'open') {
      return;
    }

    // Check if prediction expiration time has arrived
    if (active.endsAt && Date.now() > active.endsAt.getTime()) {
      logger.info(`PredictionExpirationJob: Prediction "${active.title}" (ID: ${active.id}) voting time has expired. Processing automatic close.`);

      try {
        // 1. Close status in DB
        await predictionRepo.updateStatus(active.id, 'closed', null, new Date());
        logger.info(`PredictionExpirationJob: Updated database status to 'closed' for prediction ID: ${active.id}`);

        // Get fresh closed prediction object
        const closedPrediction = await predictionRepo.getById(active.id);
        if (!closedPrediction) return;

        // 2. Edit Discord original message
        if (closedPrediction.channelId && closedPrediction.messageId) {
          const channel = await discordClient.channels.fetch(closedPrediction.channelId).catch(() => null);

          if (channel && (channel.isTextBased() || (channel as any).isThread?.())) {
            const message = await (channel as any).messages.fetch(closedPrediction.messageId).catch(() => null);

            if (message) {
              const existingDesc = message.embeds[0]?.description || '';
              const customMessage = existingDesc.includes('**Recompensa:**') ? existingDesc.split('**Recompensa:**')[0].trim() : null;

              const options = await predictionRepo.getOptions(closedPrediction.id);
              const votes = await predictionRepo.getVotes(closedPrediction.id);

              const memberResolver = async (userId: string): Promise<string> => {
                try {
                  const member = await message.guild?.members.fetch(userId);
                  return member ? member.displayName : userId;
                } catch {
                  return userId;
                }
              };

              const { embed, components } = await PredictionRenderer.render(closedPrediction, options, votes, 1, memberResolver, null, customMessage);

              await message.edit({ embeds: [embed], components });
              logger.info(`PredictionExpirationJob: Successfully updated embed status to closed for message ${closedPrediction.messageId}`);

              // Send notification message in channel
              await (channel as any).send({ content: `*"Las apuestas están hechas. Los dados del destino ya ruedan. Que el Dios Beodo ampare a los que han apostado con el corazón... y castigue a los que lo hicieron con los ojos cerrados."*` });
            }
          }
        }
      } catch (err) {
        logger.error(`PredictionExpirationJob: Failed to close prediction ID ${active.id} automatically:`, err);
      }
    }
  }
}

export default PredictionExpirationJob;
