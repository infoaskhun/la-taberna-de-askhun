import { Job } from './Job';
import { ApplicationContainer } from '../bootstrap/ApplicationContainer';

export class JobScheduler {
  private jobs = new Map<string, Job>();

  public register(job: Job): void {
    const key = job.name;
    if (this.jobs.has(key)) {
      throw new Error(`Job with name "${key}" is already registered.`);
    }
    this.jobs.set(key, job);
  }

  public get(name: string): Job | undefined {
    return this.jobs.get(name);
  }

  public getAll(): Job[] {
    return Array.from(this.jobs.values());
  }

  public startAll(container: ApplicationContainer): void {
    const logger = container.logger;
    logger.info('Starting all scheduled background jobs...');
    for (const job of this.jobs.values()) {
      try {
        job.start(container);
        logger.info(`Job "${job.name}" started successfully.`);
      } catch (err) {
        logger.error(`Failed to start job "${job.name}":`, err);
      }
    }
  }

  public stopAll(): void {
    for (const job of this.jobs.values()) {
      try {
        job.stop();
      } catch (err) {
        // Log to console if logger is not available or failed
        console.error(`Failed to stop job "${job.name}":`, err);
      }
    }
  }
}
