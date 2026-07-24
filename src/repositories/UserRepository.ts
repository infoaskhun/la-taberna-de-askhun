import { SupabaseClient } from '@supabase/supabase-js';

export interface UserProfile {
  id: string; // Discord User ID
  balance: number;
  totalSpent: number;
  welcomeReceived: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  createdAt: Date;
  lastSpentAt?: Date | null;
}

export class UserRepository {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  public async getById(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Record not found
      }
      throw new Error(`Database error while fetching profile: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  public async create(profile: Omit<UserProfile, 'createdAt'>): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('profiles')
      .insert({
        id: profile.id,
        balance: profile.balance,
        total_spent: profile.totalSpent,
        welcome_received: profile.welcomeReceived,
        is_admin: profile.isAdmin,
        is_owner: profile.isOwner,
        last_spent_at: profile.lastSpentAt || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while creating profile: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  public async updateBalance(id: string, newBalance: number, newTotalSpent?: number, lastSpentAt?: Date): Promise<UserProfile> {
    const updateData: Record<string, any> = { balance: newBalance };
    if (newTotalSpent !== undefined) {
      updateData.total_spent = newTotalSpent;
      updateData.last_spent_at = lastSpentAt || new Date();
    }

    const { data, error } = await this.client
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while updating profile balance: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  public async updateWelcomeReceived(id: string, welcomeReceived: boolean, newBalance?: number): Promise<UserProfile> {
    const updateData: Record<string, any> = { welcome_received: welcomeReceived };
    if (newBalance !== undefined) {
      updateData.balance = newBalance;
    }

    const { data, error } = await this.client
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while updating profile welcome: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  public async updateRoles(id: string, isAdmin: boolean, isOwner?: boolean): Promise<UserProfile> {
    const updateData: Record<string, any> = { is_admin: isAdmin };
    if (isOwner !== undefined) {
      updateData.is_owner = isOwner;
    }

    const { data, error } = await this.client
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while updating profile roles: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  public async getTopUsersByTotalSpent(limit: number): Promise<UserProfile[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .neq('is_owner', true)
      .neq('is_admin', true)
      .order('total_spent', { ascending: false })
      .order('last_spent_at', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) {
      throw new Error(`Database error while fetching top users: ${error.message}`);
    }

    return data.map((item) => this.mapToDomain(item));
  }

  private mapToDomain(dbData: any): UserProfile {
    return {
      id: dbData.id,
      balance: dbData.balance,
      totalSpent: dbData.total_spent,
      welcomeReceived: dbData.welcome_received,
      isAdmin: dbData.is_admin,
      isOwner: dbData.is_owner,
      createdAt: new Date(dbData.created_at),
      lastSpentAt: dbData.last_spent_at ? new Date(dbData.last_spent_at) : null,
    };
  }
}
