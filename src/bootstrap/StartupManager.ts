import { ApplicationContainer } from './ApplicationContainer';
import { EnvironmentLoader } from './EnvironmentLoader';
import { EnvironmentValidator } from './EnvironmentValidator';
import { ConfigurationService } from '../config/ConfigurationService';
import { Logger } from '../utils/logger';
import { createSupabaseClient } from '../config/supabaseClient';
import { createDiscordClient } from '../config/discordClient';
import { CommandRegistry } from '../commands/CommandRegistry';
import { CommandLoader } from '../commands/CommandLoader';
import { EventRegistry } from '../events/EventRegistry';
import { EventLoader } from '../events/EventLoader';
import { JobScheduler } from '../jobs/JobScheduler';
import { JobInitializer } from '../jobs/JobInitializer';
import { RuntimeLoader } from './RuntimeLoader';
import { UserRepository } from '../repositories/UserRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { EconomyService } from '../services/EconomyService';
import { ItemRepository } from '../repositories/ItemRepository';
import { TavernService } from '../services/TavernService';
import { TitleRepository } from '../repositories/TitleRepository';
import { TitleService } from '../services/TitleService';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { PredictionService } from '../services/PredictionService';
import { RankingService } from '../services/RankingService';
import { GuildSettingsRepository } from '../repositories/GuildSettingsRepository';
import { TavernPhrasesRepository } from '../repositories/TavernPhrasesRepository';

export class StartupManager {
  private container: ApplicationContainer;
  private logger!: Logger;

  constructor(container: ApplicationContainer) {
    this.container = container;
  }

  public async runStartupSequence(): Promise<void> {
    // Phase 1: Load Environment
    EnvironmentLoader.load();

    // Phase 2: Validate Environment
    const validation = EnvironmentValidator.validate();
    if (!validation.isValid) {
      console.error('FATAL: Environment validation failed:');
      for (const err of validation.errors) {
        console.error(`  - [${err.category}] ${err.message}`);
      }
      throw new Error('Environment validation failed.');
    }

    // Phase 3: Initialize Logger
    const config = new ConfigurationService();
    this.container.register('ConfigurationService', config);

    const logger = new Logger(config);
    this.container.register('Logger', logger);
    this.logger = logger;

    this.logger.info('Startup Sequence initiated.');
    this.logger.info(`Environment loaded and validated. Mode: ${config.nodeEnv}`);

    // Phase 4: Initialize Supabase
    this.logger.info('Initializing Supabase client...');
    try {
      const supabase = createSupabaseClient(config);
      this.container.register('SupabaseClient', supabase);
      
      const userRepo = new UserRepository(supabase);
      const transactionRepo = new TransactionRepository(supabase);
      const itemRepo = new ItemRepository(supabase);
      const titleRepo = new TitleRepository(supabase);
      const predictionRepo = new PredictionRepository(supabase);
      const guildSettingsRepo = new GuildSettingsRepository(supabase);
      const tavernPhrasesRepo = new TavernPhrasesRepository(supabase);
      this.container.register('UserRepository', userRepo);
      this.container.register('TransactionRepository', transactionRepo);
      this.container.register('ItemRepository', itemRepo);
      this.container.register('TitleRepository', titleRepo);
      this.container.register('PredictionRepository', predictionRepo);
      this.container.register('GuildSettingsRepository', guildSettingsRepo);
      this.container.register('TavernPhrasesRepository', tavernPhrasesRepo);
      
      const economyService = new EconomyService(userRepo, transactionRepo, this.logger);
      this.container.register('EconomyService', economyService);

      const tavernService = new TavernService(itemRepo, economyService, this.logger, guildSettingsRepo, tavernPhrasesRepo);
      this.container.register('TavernService', tavernService);

      const titleService = new TitleService(titleRepo, economyService, this.logger, tavernPhrasesRepo);
      this.container.register('TitleService', titleService);

      const predictionService = new PredictionService(predictionRepo, economyService, this.logger);
      this.container.register('PredictionService', predictionService);

      const rankingService = new RankingService(userRepo, this.logger);
      this.container.register('RankingService', rankingService);
      
      this.logger.info('Supabase client, repositories, and services initialized and registered successfully.');
    } catch (err) {
      this.logger.error('Failed to initialize Supabase client, repositories and core services:', err);
      throw err;
    }

    // Phase 5: Initialize Discord
    this.logger.info('Initializing Discord client...');
    try {
      const discord = createDiscordClient(config);
      this.container.register('DiscordClient', discord);
      this.logger.info('Discord client initialized and registered successfully.');
    } catch (err) {
      this.logger.error('Failed to initialize Discord client:', err);
      throw err;
    }

    // Phase 6: Load Commands
    this.logger.info('Loading slash commands...');
    try {
      const registry = new CommandRegistry();
      await CommandLoader.load(registry, this.logger);
      this.container.register('CommandRegistry', registry);
      this.logger.info(`Commands loaded successfully. Total: ${registry.getAll().length}`);
    } catch (err) {
      this.logger.error('Failed to load commands:', err);
      throw err;
    }

    // Phase 7: Load Events
    this.logger.info('Registering events...');
    try {
      const registry = new EventRegistry();
      const discord = this.container.discord;
      await EventLoader.load(registry, discord, this.container, this.logger);
      this.container.register('EventRegistry', registry);
      this.logger.info(`Events registered successfully. Total: ${registry.getAll().length}`);
    } catch (err) {
      this.logger.error('Failed to register events:', err);
      throw err;
    }

    // Phase 8: Initialize Jobs
    this.logger.info('Initializing background jobs...');
    try {
      const scheduler = new JobScheduler();
      await JobInitializer.load(scheduler, this.logger);
      this.container.register('JobScheduler', scheduler);
      this.logger.info(`Jobs initialized successfully. Total: ${scheduler.getAll().length}`);
    } catch (err) {
      this.logger.error('Failed to initialize jobs:', err);
      throw err;
    }

    // Phase 9: Discord Login
    this.logger.info('Logging in to Discord...');
    try {
      const discord = this.container.discord;
      const token = config.discordToken;

      if (token.startsWith('mock_')) {
        this.logger.warn('Using a MOCK discord token. Bypassing real Discord Gateway login.');
      } else {
        await discord.login(token);
      }
      this.logger.info('Discord login sequence completed.');
    } catch (err) {
      this.logger.error('Failed to log in to Discord:', err);
      throw err;
    }

    // Phase 10: Ready Event
    this.logger.info('Waiting for Discord client ready event...');
    try {
      const discord = this.container.discord;
      const token = config.discordToken;

      if (token.startsWith('mock_')) {
        this.logger.warn('Simulating ready event for mock connection...');
        discord.emit('clientReady', discord as any);
      } else {
        if (!discord.readyAt) {
          await new Promise<void>((resolve, reject) => {
            const onReady = () => {
              cleanup();
              resolve();
            };
            const onError = (err: any) => {
              cleanup();
              reject(err);
            };
            const cleanup = () => {
              discord.off('clientReady', onReady);
              discord.off('error', onError);
            };
            discord.once('clientReady', onReady);
            discord.once('error', onError);
          });
        }
      }
      this.logger.info('Discord client connected successfully.');
    } catch (err) {
      this.logger.error('Failed waiting for Discord ready event:', err);
      throw err;
    }

    // Phase 11: Load Runtime State
    await RuntimeLoader.load(this.container);

    // Phase 12: Start Running
    this.logger.info('Starting background jobs...');
    try {
      const scheduler = this.container.resolve<JobScheduler>('JobScheduler');
      scheduler.startAll(this.container);
    } catch (err) {
      this.logger.error('Failed to start background jobs:', err);
      throw err;
    }
    this.logger.info('Startup Sequence completed successfully. Bot is RUNNING.');
  }
}
