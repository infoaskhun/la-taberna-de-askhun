import { UserRepository, UserProfile } from '../repositories/UserRepository';
import { Logger } from '../utils/logger';

export class RankingService {
  private userRepo: UserRepository;
  private logger: Logger;

  constructor(userRepo: UserRepository, logger: Logger) {
    this.userRepo = userRepo;
    this.logger = logger;
  }

  /**
   * Returns the top users by total spent, excluding the administrator.
   */
  public async getHabitualCustomerRanking(limit: number = 50): Promise<UserProfile[]> {
    this.logger.info(`Fetching top ${limit} habitual customers (excluding owner profiles)`);
    try {
      return await this.userRepo.getTopUsersByTotalSpent(limit);
    } catch (err) {
      this.logger.error('Error generating habitual customer ranking:', err);
      throw err;
    }
  }
}
