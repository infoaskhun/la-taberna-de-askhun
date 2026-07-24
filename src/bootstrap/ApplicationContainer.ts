import { Client as DiscordClient } from 'discord.js';
import { SupabaseClient } from '@supabase/supabase-js';
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

export class ApplicationContainer {
  private instances = new Map<string, any>();

  public register<T>(key: string, instance: T): void {
    if (this.instances.has(key)) {
      throw new Error(`Component with key "${key}" is already registered.`);
    }
    this.instances.set(key, instance);
  }

  public resolve<T>(key: string): T {
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`Component with key "${key}" is not registered.`);
    }
    return instance;
  }

  // Typed helper accessors
  public get configuration(): any {
    return this.resolve('ConfigurationService');
  }

  public get logger(): any {
    return this.resolve('Logger');
  }

  public get supabase(): SupabaseClient {
    return this.resolve<SupabaseClient>('SupabaseClient');
  }

  public get discord(): DiscordClient {
    return this.resolve<DiscordClient>('DiscordClient');
  }

  public get userRepository(): UserRepository {
    return this.resolve<UserRepository>('UserRepository');
  }

  public get transactionRepository(): TransactionRepository {
    return this.resolve<TransactionRepository>('TransactionRepository');
  }

  public get economyService(): EconomyService {
    return this.resolve<EconomyService>('EconomyService');
  }

  public get itemRepository(): ItemRepository {
    return this.resolve<ItemRepository>('ItemRepository');
  }

  public get tavernService(): TavernService {
    return this.resolve<TavernService>('TavernService');
  }

  public get titleRepository(): TitleRepository {
    return this.resolve<TitleRepository>('TitleRepository');
  }

  public get titleService(): TitleService {
    return this.resolve<TitleService>('TitleService');
  }

  public get predictionRepository(): PredictionRepository {
    return this.resolve<PredictionRepository>('PredictionRepository');
  }

  public get predictionService(): PredictionService {
    return this.resolve<PredictionService>('PredictionService');
  }

  public get rankingService(): RankingService {
    return this.resolve<RankingService>('RankingService');
  }

  public get guildSettingsRepository(): GuildSettingsRepository {
    return this.resolve<GuildSettingsRepository>('GuildSettingsRepository');
  }

  public get tavernPhrasesRepository(): TavernPhrasesRepository {
    return this.resolve<TavernPhrasesRepository>('TavernPhrasesRepository');
  }
}
