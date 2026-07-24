import { SupabaseClient } from '@supabase/supabase-js';

export interface DBTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  reason?: string;
  createdAt: Date;
}

export class TransactionRepository {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  public async getByUserId(userId: string): Promise<DBTransaction[]> {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error while fetching user transactions: ${error.message}`);
    }

    return data.map((item) => this.mapToDomain(item));
  }

  public async create(transaction: Omit<DBTransaction, 'id' | 'createdAt'>): Promise<DBTransaction> {
    const { data, error } = await this.client
      .from('transactions')
      .insert({
        user_id: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        reason: transaction.reason,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while creating transaction: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  private mapToDomain(dbData: any): DBTransaction {
    return {
      id: dbData.id,
      userId: dbData.user_id,
      amount: dbData.amount,
      type: dbData.type,
      reason: dbData.reason || undefined,
      createdAt: new Date(dbData.created_at),
    };
  }
}
