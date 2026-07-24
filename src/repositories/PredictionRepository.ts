import { SupabaseClient } from '@supabase/supabase-js';

export interface Prediction {
  id: number;
  title: string;
  reward: number;
  status: 'draft' | 'open' | 'closed' | 'resolved' | 'cancelled';
  createdBy: string;
  winnerOptionId: number | null;
  createdAt: Date;
  closedAt: Date | null;
  endsAt: Date | null;
  messageId: string | null;
  channelId: string | null;
}

export interface PredictionOption {
  id: number;
  predictionId: number;
  name: string;
}

export interface PredictionVote {
  predictionId: number;
  userId: string;
  optionId: number;
}

export class PredictionRepository {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  public async getActivePrediction(): Promise<Prediction | null> {
    const { data, error } = await this.client
      .from('predictions')
      .select('*')
      .in('status', ['draft', 'open', 'closed'])
      .maybeSingle();

    if (error) {
      throw new Error(`Database error while fetching active prediction: ${error.message}`);
    }

    return data ? this.mapToDomain(data) : null;
  }

  public async getById(id: number): Promise<Prediction | null> {
    const { data, error } = await this.client
      .from('predictions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error while fetching prediction: ${error.message}`);
    }

    return data ? this.mapToDomain(data) : null;
  }

  public async create(prediction: Omit<Prediction, 'id' | 'createdAt' | 'winnerOptionId' | 'closedAt' | 'messageId' | 'channelId'>): Promise<Prediction> {
    const { data, error } = await this.client
      .from('predictions')
      .insert({
        title: prediction.title,
        reward: prediction.reward,
        status: prediction.status,
        created_by: prediction.createdBy,
        ends_at: prediction.endsAt ? prediction.endsAt.toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error while creating prediction: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  public async updateMessageInfo(id: number, messageId: string, channelId: string): Promise<void> {
    const { error } = await this.client
      .from('predictions')
      .update({
        message_id: messageId,
        channel_id: channelId,
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Database error while updating message info: ${error.message}`);
    }
  }

  public async updateStatus(
    id: number,
    status: 'draft' | 'open' | 'closed' | 'resolved' | 'cancelled',
    winnerOptionId: number | null = null,
    closedAt: Date | null = null
  ): Promise<void> {
    const updateData: Record<string, any> = { status };
    if (winnerOptionId !== null) {
      updateData.winner_option_id = winnerOptionId;
    }
    if (closedAt !== null) {
      updateData.closed_at = closedAt.toISOString();
    }

    const { error } = await this.client
      .from('predictions')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Database error while updating prediction status: ${error.message}`);
    }
  }

  public async getOptions(predictionId: number): Promise<PredictionOption[]> {
    const { data, error } = await this.client
      .from('prediction_options')
      .select('*')
      .eq('prediction_id', predictionId)
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Database error while fetching prediction options: ${error.message}`);
    }

    return data.map((opt) => ({
      id: opt.id,
      predictionId: opt.prediction_id,
      name: opt.name,
    }));
  }

  public async createOptions(predictionId: number, optionNames: string[]): Promise<PredictionOption[]> {
    const rows = optionNames.map((name) => ({
      prediction_id: predictionId,
      name,
    }));

    const { data, error } = await this.client
      .from('prediction_options')
      .insert(rows)
      .select();

    if (error) {
      throw new Error(`Database error while creating prediction options: ${error.message}`);
    }

    return data.map((opt) => ({
      id: opt.id,
      predictionId: opt.prediction_id,
      name: opt.name,
    }));
  }

  public async getVote(predictionId: number, userId: string): Promise<PredictionVote | null> {
    const { data, error } = await this.client
      .from('prediction_votes')
      .select('*')
      .eq('prediction_id', predictionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error while fetching user vote: ${error.message}`);
    }

    return data
      ? {
          predictionId: data.prediction_id,
          userId: data.user_id,
          optionId: data.option_id,
        }
      : null;
  }

  public async castVote(predictionId: number, userId: string, optionId: number): Promise<void> {
    const { error } = await this.client
      .from('prediction_votes')
      .insert({
        prediction_id: predictionId,
        user_id: userId,
        option_id: optionId,
      });

    if (error) {
      throw new Error(`Database error while casting vote: ${error.message}`);
    }
  }

  public async getVotes(predictionId: number): Promise<PredictionVote[]> {
    const { data, error } = await this.client
      .from('prediction_votes')
      .select('*')
      .eq('prediction_id', predictionId);

    if (error) {
      throw new Error(`Database error while fetching votes: ${error.message}`);
    }

    return data.map((v) => ({
      predictionId: v.prediction_id,
      userId: v.user_id,
      optionId: v.option_id,
    }));
  }

  private mapToDomain(dbData: any): Prediction {
    return {
      id: dbData.id,
      title: dbData.title,
      reward: dbData.reward,
      status: dbData.status,
      createdBy: dbData.created_by,
      winnerOptionId: dbData.winner_option_id || null,
      createdAt: new Date(dbData.created_at),
      closedAt: dbData.closed_at ? new Date(dbData.closed_at) : null,
      endsAt: dbData.ends_at ? new Date(dbData.ends_at) : null,
      messageId: dbData.message_id || null,
      channelId: dbData.channel_id || null,
    };
  }
}
