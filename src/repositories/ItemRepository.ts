import { SupabaseClient } from '@supabase/supabase-js';

export interface Item {
  id?: number;
  name: string;
  type: 'food' | 'drink';
  price: number;
  active: boolean;
  message?: string;
}

export class ItemRepository {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  public async getAll(): Promise<Item[]> {
    const { data, error } = await this.client
      .from('items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Database error while fetching items: ${error.message}`);
    }

    return data.map((item) => this.mapToDomain(item));
  }

  public async getAllActiveByType(type: 'food' | 'drink'): Promise<Item[]> {
    const { data, error } = await this.client
      .from('items')
      .select('*')
      .eq('type', type)
      .eq('active', true)
      .order('price', { ascending: true });

    if (error) {
      throw new Error(`Database error while fetching active items: ${error.message}`);
    }

    return data.map((item) => this.mapToDomain(item));
  }

  public async getByNameAndType(name: string, type: 'food' | 'drink'): Promise<Item | null> {
    const { data, error } = await this.client
      .from('items')
      .select('*')
      .ilike('name', name) // Case-insensitive matching for user inputs
      .eq('type', type)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error while searching for item: ${error.message}`);
    }

    return data ? this.mapToDomain(data) : null;
  }

  public async create(item: Omit<Item, 'id'>): Promise<Item> {
    const { data, error } = await this.client
      .from('items')
      .insert({
        name: item.name,
        type: item.type,
        price: item.price,
        active: item.active,
        message: item.message,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while creating item: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  public async update(id: number, updates: Partial<Omit<Item, 'id'>>): Promise<Item> {
    const { data, error } = await this.client
      .from('items')
      .update({
        name: updates.name,
        price: updates.price,
        active: updates.active,
        message: updates.message,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while updating item: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  public async delete(id: number): Promise<void> {
    const { error } = await this.client
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error while deleting item: ${error.message}`);
    }
  }

  private mapToDomain(dbData: any): Item {
    return {
      id: dbData.id,
      name: dbData.name,
      type: dbData.type,
      price: dbData.price,
      active: dbData.active,
      message: dbData.message || undefined,
    };
  }
}
