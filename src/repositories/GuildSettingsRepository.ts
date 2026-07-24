import { SupabaseClient } from '@supabase/supabase-js';

export interface GuildSettings {
  guildId: string;
  tabernaChannelId: string | null;
  temploChannelId: string | null;
  rankingThreadId: string | null;
  pronosticosChannelId: string | null;
  recuerdaChannelId: string | null;
  welcomeCelesios: number;
  gramAvatarUrl: string | null;
  grumAvatarUrl: string | null;
  gramMsgNotFound: string | null;
  gramMsgNoMoney: string | null;
  grumMsgNotFound: string | null;
  grumMsgNoMoney: string | null;
}

export class GuildSettingsRepository {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  public async getByGuildId(guildId: string): Promise<GuildSettings | null> {
    const { data, error } = await this.client
      .from('guild_settings')
      .select('*')
      .eq('guild_id', guildId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error while fetching guild settings: ${error.message}`);
    }

    return data ? this.mapToDomain(data) : null;
  }

  public async save(settings: GuildSettings): Promise<GuildSettings> {
    const { data, error } = await this.client
      .from('guild_settings')
      .upsert({
        guild_id: settings.guildId,
        taberna_channel_id: settings.tabernaChannelId,
        templo_channel_id: settings.temploChannelId,
        ranking_thread_id: settings.rankingThreadId,
        pronosticos_channel_id: settings.pronosticosChannelId,
        recuerda_channel_id: settings.recuerdaChannelId,
        welcome_celesios: settings.welcomeCelesios,
        gram_avatar_url: settings.gramAvatarUrl,
        grum_avatar_url: settings.grumAvatarUrl,
        gram_msg_not_found: settings.gramMsgNotFound,
        gram_msg_no_money: settings.gramMsgNoMoney,
        grum_msg_not_found: settings.grumMsgNotFound,
        grum_msg_no_money: settings.grumMsgNoMoney,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while saving guild settings: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  private mapToDomain(dbData: any): GuildSettings {
    return {
      guildId: dbData.guild_id,
      tabernaChannelId: dbData.taberna_channel_id,
      temploChannelId: dbData.templo_channel_id,
      rankingThreadId: dbData.ranking_thread_id,
      pronosticosChannelId: dbData.pronosticos_channel_id || null,
      recuerdaChannelId: dbData.recuerda_channel_id || null,
      welcomeCelesios: dbData.welcome_celesios ?? 15,
      gramAvatarUrl: dbData.gram_avatar_url,
      grumAvatarUrl: dbData.grum_avatar_url,
      gramMsgNotFound: dbData.gram_msg_not_found,
      gramMsgNoMoney: dbData.gram_msg_no_money,
      grumMsgNotFound: dbData.grum_msg_not_found,
      grumMsgNoMoney: dbData.grum_msg_no_money,
    };
  }
}
