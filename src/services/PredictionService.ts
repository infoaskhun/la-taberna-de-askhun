import { PredictionRepository, Prediction, PredictionOption } from '../repositories/PredictionRepository';
import { EconomyService } from './EconomyService';
import { Logger } from '../utils/logger';

export class PredictionService {
  private predictionRepo: PredictionRepository;
  private economyService: EconomyService;
  private logger: Logger;

  constructor(predictionRepo: PredictionRepository, economyService: EconomyService, logger: Logger) {
    this.predictionRepo = predictionRepo;
    this.economyService = economyService;
    this.logger = logger;
  }

  /**
   * Creates a new prediction and opens it immediately.
   * Only one active (draft, open, closed) prediction can exist at a time.
   */
  public async createAndOpenPrediction(
    title: string,
    reward: number,
    optionNames: string[],
    createdBy: string,
    durationMinutes: number
  ): Promise<{ prediction: Prediction; options: PredictionOption[] }> {
    this.logger.info(`Creating new prediction: "${title}" with reward ${reward} and duration ${durationMinutes}m`);

    if (optionNames.length < 2) {
      throw new Error('A prediction must contain at least 2 options.');
    }

    if (durationMinutes <= 0) {
      throw new Error('The voting duration must be at least 1 minute.');
    }

    // Check if there is an active prediction
    const active = await this.predictionRepo.getActivePrediction();
    if (active) {
      throw new Error('Only one active prediction can exist at a time.');
    }

    // Calculate expiration date
    const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // 1. Create prediction in 'open' state directly to start voting
    const prediction = await this.predictionRepo.create({
      title,
      reward,
      status: 'open',
      createdBy,
      endsAt,
    });

    // 2. Create the associated options
    const options = await this.predictionRepo.createOptions(prediction.id, optionNames);

    this.logger.info(`Prediction ${prediction.id} created and opened successfully with ${options.length} options.`);
    return { prediction, options };
  }

  /**
   * Casts a vote for a user on the active prediction.
   */
  public async castVote(userId: string, optionId: number): Promise<void> {
    const active = await this.predictionRepo.getActivePrediction();
    if (!active || active.status !== 'open') {
      throw new Error('There is no active open prediction to vote on.');
    }

    // Check if voting time has expired
    if (active.endsAt && Date.now() > active.endsAt.getTime()) {
      throw new Error('Voting time has expired. The prediction is closed for voting.');
    }

    // Verify option belongs to this prediction
    const options = await this.predictionRepo.getOptions(active.id);
    const validOption = options.find((opt) => opt.id === optionId);
    if (!validOption) {
      throw new Error('Selected option is not valid for the active prediction.');
    }

    // Check if user already voted
    const existingVote = await this.predictionRepo.getVote(active.id, userId);
    if (existingVote) {
      throw new Error('You have already cast a vote for this prediction. Votes are immutable.');
    }

    // Register the vote
    await this.predictionRepo.castVote(active.id, userId, optionId);
    this.logger.info(`User ${userId} cast vote for option ${optionId} on prediction ${active.id}`);
  }

  /**
   * Closes the active prediction, stopping new votes.
   */
  public async closeActivePrediction(): Promise<Prediction> {
    const active = await this.predictionRepo.getActivePrediction();
    if (!active || active.status !== 'open') {
      throw new Error('There is no active open prediction to close.');
    }

    await this.predictionRepo.updateStatus(active.id, 'closed', null, new Date());
    this.logger.info(`Prediction ${active.id} has been closed for voting.`);

    const updated = await this.predictionRepo.getById(active.id);
    return updated!;
  }

  public async resolvePrediction(optionPosition: number): Promise<void> {
    const active = await this.predictionRepo.getActivePrediction();
    if (!active) {
      throw new Error('There is no active prediction to resolve.');
    }

    const isClosed = active.status === 'closed';
    const isExpiredOpen = active.status === 'open' && active.endsAt && Date.now() > active.endsAt.getTime();

    if (!isClosed && !isExpiredOpen) {
      throw new Error('The prediction must be closed or its voting time expired before resolving.');
    }

    // Get active options ordered by their creation (which is default from repo as it orders by id)
    const options = await this.predictionRepo.getOptions(active.id);
    
    // Check if requested position is within range
    if (optionPosition < 1 || optionPosition > options.length) {
      throw new Error(`Invalid option position. Please select a number between 1 and ${options.length}.`);
    }

    const winnerOption = options[optionPosition - 1];
    const winnerOptionId = winnerOption.id;

    // Get all votes
    const votes = await this.predictionRepo.getVotes(active.id);
    const winningVotes = votes.filter((v) => v.optionId === winnerOptionId);

    this.logger.info(`Resolving prediction ${active.id} (Winner Option: ${winnerOptionId}). Total winners: ${winningVotes.length}`);

    // Grant rewards to winners
    for (const vote of winningVotes) {
      try {
        await this.economyService.grantCelesios(
          vote.userId,
          active.reward,
          `Recompensa por pronóstico acertado: ${active.title}`
        );
      } catch (err) {
        this.logger.error(`Failed to grant reward to user ${vote.userId} for prediction ${active.id}:`, err);
      }
    }

    // Update status to resolved
    await this.predictionRepo.updateStatus(active.id, 'resolved', winnerOptionId);
    this.logger.info(`Prediction ${active.id} resolved successfully.`);
  }

  /**
   * Cancels the active prediction.
   */
  public async cancelPrediction(): Promise<void> {
    const active = await this.predictionRepo.getActivePrediction();
    if (!active) {
      throw new Error('There is no active prediction to cancel.');
    }

    await this.predictionRepo.updateStatus(active.id, 'cancelled');
    this.logger.info(`Prediction ${active.id} has been cancelled.`);
  }

  /**
   * Gets the current active prediction and its options.
   */
  public async getActive(): Promise<{ prediction: Prediction; options: PredictionOption[] } | null> {
    const prediction = await this.predictionRepo.getActivePrediction();
    if (!prediction) return null;

    const options = await this.predictionRepo.getOptions(prediction.id);
    return { prediction, options };
  }
}
