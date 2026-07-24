import { SupabaseClient } from '@supabase/supabase-js';

export interface Title {
  id: number;
  name: string;
  cost: number;
  requiredTitleId: number | null;
  roleId: string;
  active: boolean;
  message: string | null;
}

export class TitleRepository {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  public async getAllActive(): Promise<Title[]> {
    const { data, error } = await this.client
      .from('titles')
      .select('*')
      .eq('active', true)
      .order('cost', { ascending: true });

    if (error) {
      throw new Error(`Database error while fetching active titles: ${error.message}`);
    }

    return data.map((item) => this.mapToDomain(item));
  }

  public async getById(id: number): Promise<Title | null> {
    const { data, error } = await this.client
      .from('titles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error while fetching title by ID: ${error.message}`);
    }

    return data ? this.mapToDomain(data) : null;
  }

  public async getByName(name: string): Promise<Title | null> {
    const { data, error } = await this.client
      .from('titles')
      .select('*')
      .ilike('name', name) // Case-insensitive matching
      .maybeSingle();

    if (error) {
      throw new Error(`Database error while fetching title by name: ${error.message}`);
    }

    return data ? this.mapToDomain(data) : null;
  }

  public async getUserTitles(userId: string): Promise<number[]> {
    const { data, error } = await this.client
      .from('user_titles')
      .select('title_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Database error while fetching user titles: ${error.message}`);
    }

    return data.map((row) => row.title_id);
  }

  public async addUserTitle(userId: string, titleId: number): Promise<void> {
    const { error } = await this.client
      .from('user_titles')
      .insert({
        user_id: userId,
        title_id: titleId,
      });

    if (error) {
      throw new Error(`Database error while adding user title: ${error.message}`);
    }
  }

  public async create(title: Omit<Title, 'id'>): Promise<Title> {
    const { data, error } = await this.client
      .from('titles')
      .insert({
        name: title.name,
        cost: title.cost,
        required_title_id: title.requiredTitleId,
        role_id: title.roleId,
        active: title.active,
        message: title.message,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while creating title: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  public async update(id: number, updates: Partial<Omit<Title, 'id'>>): Promise<Title> {
    const { data, error } = await this.client
      .from('titles')
      .update({
        name: updates.name,
        cost: updates.cost,
        required_title_id: updates.requiredTitleId,
        role_id: updates.roleId,
        active: updates.active,
        message: updates.message,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while updating title: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  private mapToDomain(dbData: any): Title {
    return {
      id: dbData.id,
      name: dbData.name,
      cost: dbData.cost,
      requiredTitleId: dbData.required_title_id,
      roleId: dbData.role_id,
      active: dbData.active,
      message: dbData.message,
    };
  }
}
