import { UserRepository } from '../repositories/UserRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { Logger } from '../utils/logger';

export class EconomyService {
  private userRepo: UserRepository;
  private transactionRepo: TransactionRepository;
  private logger: Logger;

  constructor(userRepo: UserRepository, transactionRepo: TransactionRepository, logger: Logger) {
    this.userRepo = userRepo;
    this.transactionRepo = transactionRepo;
    this.logger = logger;
  }

  /**
   * Processes a user joining the guild for the first time.
   * Grants them the welcome gift (15 Celesios) and registers a transaction.
   * If the user already exists, they do not receive the welcome gift again.
   * Returns true if welcome gift was given, false otherwise.
   */
  public async handleUserJoin(userId: string, welcomeCelesios: number = 15): Promise<boolean> {
    this.logger.info(`Processing welcome verification for user: ${userId} with gift: ${welcomeCelesios}`);
    try {
      const existingProfile = await this.userRepo.getById(userId);

      if (existingProfile && existingProfile.welcomeReceived) {
        this.logger.info(`User ${userId} already has a profile and has received the welcome gift. Skipping.`);
        return false;
      }

      if (existingProfile) {
        // User profile exists but they haven't received the welcome gift yet
        const newBalance = existingProfile.balance + welcomeCelesios;
        await this.userRepo.updateWelcomeReceived(userId, true, newBalance);
        this.logger.info(`User ${userId} had a profile without welcome. Updated balance to ${newBalance} and set welcomeReceived to true.`);
      } else {
        // Create new profile with welcome gift
        await this.userRepo.create({
          id: userId,
          balance: welcomeCelesios,
          totalSpent: 0,
          welcomeReceived: true,
          isAdmin: false,
          isOwner: false,
        });
        this.logger.info(`User ${userId} registered successfully. Granted ${welcomeCelesios} Celesios welcome gift.`);
      }

      // Record welcome transaction
      await this.transactionRepo.create({
        userId,
        amount: welcomeCelesios,
        type: 'welcome',
        reason: 'Regalo de bienvenida de La Taberna de Askhun',
      });

      return true;
    } catch (err) {
      this.logger.error(`Error during handleUserJoin for user ${userId}:`, err);
      throw err;
    }
  }

  /**
   * Gets the balance of a user.
   */
  public async getBalance(userId: string): Promise<number> {
    try {
      const profile = await this.userRepo.getById(userId);
      if (!profile) {
        // If user doesn't exist yet, we create a profile with 0 balance (they missed join event or it failed)
        const newProfile = await this.userRepo.create({
          id: userId,
          balance: 0,
          totalSpent: 0,
          welcomeReceived: false,
          isAdmin: false,
          isOwner: false,
        });
        return newProfile.balance;
      }
      return profile.balance;
    } catch (err) {
      this.logger.error(`Error fetching balance for user ${userId}:`, err);
      throw err;
    }
  }

  /**
   * Admin operation to grant Celesios to a user.
   */
  public async grantCelesios(targetId: string, amount: number, reason: string): Promise<number> {
    if (amount <= 0) {
      throw new Error('Grant amount must be greater than zero.');
    }

    this.logger.info(`Granting ${amount} Celesios to user ${targetId}. Reason: ${reason}`);
    try {
      let profile = await this.userRepo.getById(targetId);
      if (!profile) {
        profile = await this.userRepo.create({
          id: targetId,
          balance: 0,
          totalSpent: 0,
          welcomeReceived: false,
          isAdmin: false,
          isOwner: false,
        });
      }

      const newBalance = profile.balance + amount;
      await this.userRepo.updateBalance(targetId, newBalance);
      await this.transactionRepo.create({
        userId: targetId,
        amount,
        type: 'admin_give',
        reason,
      });

      return newBalance;
    } catch (err) {
      this.logger.error(`Error granting Celesios to user ${targetId}:`, err);
      throw err;
    }
  }

  /**
   * Admin operation to remove Celesios from a user.
   */
  public async removeCelesios(targetId: string, amount: number, reason: string): Promise<number> {
    if (amount <= 0) {
      throw new Error('Remove amount must be greater than zero.');
    }

    this.logger.info(`Removing ${amount} Celesios from user ${targetId}. Reason: ${reason}`);
    try {
      const profile = await this.userRepo.getById(targetId);
      if (!profile) {
        throw new Error('User profile does not exist.');
      }

      if (profile.balance < amount) {
        throw new Error(`Insufficient balance. User only has ${profile.balance} Celesios.`);
      }

      const newBalance = profile.balance - amount;
      await this.userRepo.updateBalance(targetId, newBalance);
      await this.transactionRepo.create({
        userId: targetId,
        amount: -amount,
        type: 'admin_remove',
        reason,
      });

      return newBalance;
    } catch (err) {
      this.logger.error(`Error removing Celesios from user ${targetId}:`, err);
      throw err;
    }
  }
}
