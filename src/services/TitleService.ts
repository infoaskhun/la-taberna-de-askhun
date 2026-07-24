import { TitleRepository, Title } from '../repositories/TitleRepository';
import { EconomyService } from './EconomyService';
import { GuildMember } from 'discord.js';
import { Logger } from '../utils/logger';
import { TavernPhrasesRepository } from '../repositories/TavernPhrasesRepository';

export interface TitlePurchaseResult {
  status: 'success' | 'unknown_title' | 'already_owned' | 'invalid_progression' | 'insufficient_balance' | 'error';
  title?: Title;
  newBalance?: number;
  narrativeMessage?: string;
  errorMessage?: string;
}

export class TitleService {
  private titleRepo: TitleRepository;
  private economyService: EconomyService;
  private logger: Logger;
  private tavernPhrasesRepo?: TavernPhrasesRepository;

  constructor(
    titleRepo: TitleRepository,
    economyService: EconomyService,
    logger: Logger,
    tavernPhrasesRepo?: TavernPhrasesRepository
  ) {
    this.titleRepo = titleRepo;
    this.economyService = economyService;
    this.logger = logger;
    this.tavernPhrasesRepo = tavernPhrasesRepo;
  }

  /**
   * Resolves a narrative phrase from the DB pool, or falls back to the default.
   */
  private async resolvePhrase(
    guildId: string | null | undefined,
    event: 'no_existe' | 'sin_saldo' | 'ya_obtenido' | 'progreso_invalido',
    replacements: Record<string, string> = {}
  ): Promise<string> {
    const DEFAULTS = {
      no_existe: `**Templo del Dios Beodo**: "Ese título no existe en nuestros pergaminos ni es reconocido por los sacerdotes del templo."`,
      ya_obtenido: `**Templo del Dios Beodo**: "Ya posees el rango de **{title}**. Los dioses no conceden el mismo honor por duplicado."`,
      progreso_invalido: `**Templo del Dios Beodo**: "No cumples con la consagración exigida. Necesitas alcanzar primero el título de **{reqTitle}** antes de aspirar a este rango."`,
      sin_saldo: `**Templo del Dios Beodo**: "Tus ofrendas son insuficientes. El título de **{title}** requiere una ofrenda de {cost} Celesios, pero solo tienes {balance}."`,
    };

    let template = DEFAULTS[event];

    if (guildId && this.tavernPhrasesRepo) {
      try {
        const pool = await this.tavernPhrasesRepo.getAll(guildId, 'oracion', event);
        if (pool.length > 0) {
          template = pool[Math.floor(Math.random() * pool.length)].phrase;
        }
      } catch {
        // silently fall back to default if DB fails
      }
    }

    return Object.entries(replacements).reduce(
      (str, [key, val]) => str.replaceAll(`{${key}}`, val),
      template
    );
  }

  /**
   * Purchases a title for a user, validating eligibility, progression, and balance, then assigns the Discord role.
   */
  public async purchaseTitle(member: GuildMember, titleName: string): Promise<TitlePurchaseResult> {
    const userId = member.id;
    const guildId = member.guild.id;
    this.logger.info(`User ${userId} requested purchase of title: "${titleName}"`);

    try {
      // 1. Check if title exists
      const title = await this.titleRepo.getByName(titleName);
      if (!title || !title.active) {
        const narrativeMessage = await this.resolvePhrase(guildId, 'no_existe', { title: titleName });
        return {
          status: 'unknown_title',
          narrativeMessage,
        };
      }

      // 2. Check if already owned
      const ownedTitleIds = await this.titleRepo.getUserTitles(userId);
      if (ownedTitleIds.includes(title.id)) {
        const narrativeMessage = await this.resolvePhrase(guildId, 'ya_obtenido', { title: title.name });
        return {
          status: 'already_owned',
          narrativeMessage,
        };
      }

      // 3. Check progression
      if (title.requiredTitleId !== null) {
        if (!ownedTitleIds.includes(title.requiredTitleId)) {
          const reqTitle = await this.titleRepo.getById(title.requiredTitleId);
          const narrativeMessage = await this.resolvePhrase(guildId, 'progreso_invalido', {
            reqTitle: reqTitle ? reqTitle.name : 'previo',
            title: title.name,
          });
          return {
            status: 'invalid_progression',
            narrativeMessage,
          };
        }
      }

      // 4. Check balance
      const currentBalance = await this.economyService.getBalance(userId);
      if (currentBalance < title.cost) {
        const narrativeMessage = await this.resolvePhrase(guildId, 'sin_saldo', {
          title: title.name,
          cost: title.cost.toString(),
          balance: currentBalance.toString(),
        });
        return {
          status: 'insufficient_balance',
          narrativeMessage,
        };
      }

      // 5. Complete purchase in Economy (deduct balance, write transaction)
      const newBalance = await this.economyService.removeCelesios(
        userId,
        title.cost,
        `Compra de título: ${title.name}`
      );

      // Increment totalSpent
      const userProfile = await this.economyService['userRepo'].getById(userId);
      if (userProfile) {
        const newTotalSpent = userProfile.totalSpent + title.cost;
        await this.economyService['userRepo'].updateBalance(userId, newBalance, newTotalSpent);
      }

      // 6. Record user title ownership
      await this.titleRepo.addUserTitle(userId, title.id);

      // 7. Assign Discord Role
      try {
        await member.roles.add(title.roleId);
        this.logger.info(`Assigned role ${title.roleId} to user ${userId} for title ${title.name}`);
      } catch (roleErr) {
        this.logger.error(`Failed to assign Discord role ${title.roleId} to user ${userId}:`, roleErr);
      }

      let narrativeMessage = '';
      if (title.message) {
        // Dynamic replacement of static username mentions like @username matching the buyer
        const username = member.user.username;
        const displayName = member.displayName;
        const escapedUser = username.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const escapedDisplay = displayName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

        narrativeMessage = title.message
          .replace(/\\n/g, '\n')
          .replace(/\[nombre de usuario\]/g, `<@${userId}>`)
          .replace(/\{user\}/g, `<@${userId}>`)
          .replace(new RegExp(`@${escapedUser}`, 'gi'), `<@${userId}>`)
          .replace(new RegExp(`@${escapedDisplay}`, 'gi'), `<@${userId}>`)
          .replace(/\{balance\}/g, newBalance.toString());
      } else {
        narrativeMessage = `**Templo del Dios Beodo**: "¡Las deidades han bendecido tu ascenso! Se te concede oficialmente el título de **${title.name}** a cambio de ${title.cost} Celesios. Te quedan ${newBalance} Celesios."`;
      }

      return {
        status: 'success',
        title,
        newBalance,
        narrativeMessage,
      };

    } catch (err: any) {
      this.logger.error(`Error purchasing title "${titleName}" for user ${userId}:`, err);
      return {
        status: 'error',
        errorMessage: err.message || 'Error inesperado al comprar el título.',
      };
    }
  }
}
