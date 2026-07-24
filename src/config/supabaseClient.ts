import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigurationService } from './ConfigurationService';

export function createSupabaseClient(config: ConfigurationService): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
