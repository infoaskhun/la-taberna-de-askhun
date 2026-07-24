export class ConfigurationService {
  public readonly nodeEnv: string;
  public readonly discordToken: string;
  public readonly discordClientId: string;
  public readonly supabaseUrl: string;
  public readonly supabaseServiceRoleKey: string;
  public readonly logLevel: string;

  constructor() {
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.discordToken = process.env.DISCORD_TOKEN || '';
    this.discordClientId = process.env.DISCORD_CLIENT_ID || '';
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
  }

  // Helper method to redact sensitive data in logs if needed
  public getPublicConfig(): Record<string, string> {
    return {
      NODE_ENV: this.nodeEnv,
      DISCORD_CLIENT_ID: this.discordClientId,
      SUPABASE_URL: this.supabaseUrl,
      LOG_LEVEL: this.logLevel,
    };
  }
}
