import { Job } from './Job';
import { ApplicationContainer } from '../bootstrap/ApplicationContainer';

export class SupabaseKeepAliveJob implements Job {
  public readonly name = 'SupabaseKeepAliveJob';
  private timer: NodeJS.Timeout | null = null;

  public start(container: ApplicationContainer): void {
    container.logger.info('SupabaseKeepAliveJob started.');
    
    // Execute every 5 hours (18,000,000 milliseconds) to keep the DB connection active
    this.timer = setInterval(async () => {
      try {
        await this.execute(container);
      } catch (err) {
        container.logger.error('Error executing SupabaseKeepAliveJob interval:', err);
      }
    }, 18000000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  public async execute(container: ApplicationContainer): Promise<void> {
    const supabase = container.supabase;
    const logger = container.logger;

    logger.info('Executing Supabase keep-alive query...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      logger.error(`Supabase keep-alive query failed: ${error.message}`);
    } else {
      logger.info('Supabase keep-alive query completed successfully.');
    }
  }
}

export default SupabaseKeepAliveJob;
