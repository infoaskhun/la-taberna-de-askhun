import { ItemRepository, Item } from '../repositories/ItemRepository';
import { EconomyService } from './EconomyService';
import { Logger } from '../utils/logger';
import { TavernPhrasesRepository } from '../repositories/TavernPhrasesRepository';

export interface PurchaseResult {
  status: 'success' | 'unknown_product' | 'insufficient_balance' | 'error';
  item?: Item;
  newBalance?: number;
  narrativeMessage?: string;
  errorMessage?: string;
}

// ── Single default fallbacks (used only when no phrases exist in the DB) ──────

const DEFAULTS = {
  gram_no_existe: `**Gram** gruñe: *"Eso no está en mi menú. Pide algo que exista."*`,
  gram_sin_saldo: `**Gram** te señala con el cucharón: *"Sin monedas no hay comida."*`,
  grum_no_existe: `**Grum** te mira fijamente: *"Eso no lo sirvo. Mira la barra."*`,
  grum_sin_saldo: `**Grum** golpea la barra: *"Sin Celesios no hay trago. Así de simple."*`,
};

// ─────────────────────────────────────────────────────────────────────────────

export class TavernService {
  private itemRepo: ItemRepository;
  private economyService: EconomyService;
  private logger: Logger;
  private guildSettingsRepo?: any;
  private tavernPhrasesRepo?: TavernPhrasesRepository;

  constructor(
    itemRepo: ItemRepository,
    economyService: EconomyService,
    logger: Logger,
    guildSettingsRepo?: any,
    tavernPhrasesRepo?: TavernPhrasesRepository
  ) {
    this.itemRepo = itemRepo;
    this.economyService = economyService;
    this.logger = logger;
    this.guildSettingsRepo = guildSettingsRepo;
    this.tavernPhrasesRepo = tavernPhrasesRepo;
  }

  /**
   * Resolves a narrative phrase from the DB pool, or falls back to the default.
   */
  private async resolvePhrase(
    guildId: string | null | undefined,
    character: 'gram' | 'grum',
    event: 'no_existe' | 'sin_saldo',
    replacements: Record<string, string> = {}
  ): Promise<string> {
    const defaultKey = `${character}_${event}` as keyof typeof DEFAULTS;
    let template = DEFAULTS[defaultKey];

    if (guildId && this.tavernPhrasesRepo) {
      try {
        const pool = await this.tavernPhrasesRepo.getAll(guildId, character, event);
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
   * Processes a purchase order for a food or drink item.
   */
  public async purchaseItem(
    userId: string,
    itemName: string,
    type: 'food' | 'drink',
    guildId?: string | null
  ): Promise<PurchaseResult> {
    this.logger.info(`User ${userId} requested purchase of ${type}: "${itemName}"`);

    try {
      // 1. Find the item in the catalog
      const item = await this.itemRepo.getByNameAndType(itemName, type);

      if (!item || !item.active) {
        const character = type === 'drink' ? 'grum' : 'gram';
        const narrativeMessage = await this.resolvePhrase(guildId, character, 'no_existe', { item: itemName });
        return { status: 'unknown_product', narrativeMessage };
      }

      // 2. Validate user balance
      const currentBalance = await this.economyService.getBalance(userId);
      if (currentBalance < item.price) {
        const character = type === 'drink' ? 'grum' : 'gram';
        const narrativeMessage = await this.resolvePhrase(guildId, character, 'sin_saldo', {
          price: item.price.toString(),
          balance: currentBalance.toString(),
          item: item.name,
        });
        return { status: 'insufficient_balance', item, narrativeMessage };
      }

      // 3. Coordinate purchase with the Economy module
      const newBalance = await this.economyService.removeCelesios(
        userId,
        item.price,
        `Compra de ${type === 'drink' ? 'bebida' : 'comida'}: ${item.name}`
      );

      // Increment totalSpent
      const userProfile = await this.economyService['userRepo'].getById(userId);
      if (userProfile) {
        const newTotalSpent = userProfile.totalSpent + item.price;
        await this.economyService['userRepo'].updateBalance(userId, newBalance, newTotalSpent);
      }

      // 4. Generate success narrative
      const narrativeMessage = item.message
        ? item.message.replace('{balance}', newBalance.toString())
        : (type === 'drink'
          ? `**Grum** te sirve con brusquedad: *"¡Aquí tienes tu **${item.name}**! Te quedan ${newBalance} Celesios."*`
          : `**Gram** te entrega un plato caliente: *"Recién salido del fuego: **${item.name}**. Que te aproveche. Te quedan ${newBalance} Celesios."*`);

      this.logger.info(`User ${userId} successfully bought "${item.name}" for ${item.price} Celesios.`);

      return { status: 'success', item, newBalance, narrativeMessage };

    } catch (err: any) {
      this.logger.error(`Error processing purchase of "${itemName}" for user ${userId}:`, err);
      return {
        status: 'error',
        errorMessage: err.message || 'Error inesperado al procesar el pedido.',
      };
    }
  }
}
