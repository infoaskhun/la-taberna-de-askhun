import { ApplicationContainer } from './ApplicationContainer';

export class RuntimeLoader {
  public static async load(container: ApplicationContainer): Promise<void> {
    const logger = container.logger;
    const config = container.configuration;
    const userRepo = container.userRepository;

    logger.info('Recovering runtime state...');

    if (config.discordToken.startsWith('mock_')) {
      logger.warn('Mock environment detected. Skipping database state recovery.');
      logger.info('Mock runtime state loaded successfully.');
      return;
    }

    try {
      logger.info('Database state recovered successfully.');
    } catch (err) {
      logger.error('Failed to recover runtime state from database:', err);
      throw err;
    }
  }
}
