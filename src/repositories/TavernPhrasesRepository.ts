import { SupabaseClient } from '@supabase/supabase-js';

export type TavernCharacter = 'gram' | 'grum' | 'oracion';
export type TavernEvent = 'no_existe' | 'sin_saldo' | 'ya_obtenido' | 'progreso_invalido';

export interface TavernPhrase {
  id: string;
  guildId: string;
  character: TavernCharacter;
  event: TavernEvent;
  phrase: string;
  createdAt: string;
}

export class TavernPhrasesRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public async getAll(guildId: string, character: TavernCharacter, event: TavernEvent): Promise<TavernPhrase[]> {
    const { data, error } = await this.supabase
      .from('tavern_phrases')
      .select('*')
      .eq('guild_id', guildId)
      .eq('character', character)
      .eq('event', event)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Error fetching tavern phrases: ${error.message}`);
    return (data || []).map(this.map);
  }

  public async add(guildId: string, character: TavernCharacter, event: TavernEvent, phrase: string): Promise<TavernPhrase> {
    const { data, error } = await this.supabase
      .from('tavern_phrases')
      .insert({ guild_id: guildId, character, event, phrase })
      .select()
      .single();

    if (error) throw new Error(`Error adding tavern phrase: ${error.message}`);
    return this.map(data);
  }

  public async removeByIndex(guildId: string, character: TavernCharacter, event: TavernEvent, index: number): Promise<boolean> {
    const phrases = await this.getAll(guildId, character, event);
    const target = phrases[index - 1]; // 1-based to 0-based
    if (!target) return false;

    const { error } = await this.supabase
      .from('tavern_phrases')
      .delete()
      .eq('id', target.id)
      .eq('guild_id', guildId);

    if (error) throw new Error(`Error removing tavern phrase: ${error.message}`);
    return true;
  }

  public async updateByIndex(guildId: string, character: TavernCharacter, event: TavernEvent, index: number, newPhrase: string): Promise<TavernPhrase | null> {
    const phrases = await this.getAll(guildId, character, event);
    const target = phrases[index - 1]; // 1-based to 0-based
    if (!target) return null;

    const { data, error } = await this.supabase
      .from('tavern_phrases')
      .update({ phrase: newPhrase })
      .eq('id', target.id)
      .eq('guild_id', guildId)
      .select()
      .single();

    if (error) throw new Error(`Error updating tavern phrase: ${error.message}`);
    return this.map(data);
  }

  private map(row: any): TavernPhrase {
    return {
      id: row.id,
      guildId: row.guild_id,
      character: row.character,
      event: row.event,
      phrase: row.phrase,
      createdAt: row.created_at,
    };
  }
}
