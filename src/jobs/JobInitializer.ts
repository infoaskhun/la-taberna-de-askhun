import * as fs from 'fs';
import * as path from 'path';
import { JobScheduler } from './JobScheduler';
import { Logger } from '../utils/logger';
import { Job } from './Job';

export class JobInitializer {
  public static async load(scheduler: JobScheduler, logger: Logger): Promise<void> {
    const jobsDir = __dirname;

    const scanDir = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (
          (file.endsWith('.ts') || file.endsWith('.js')) &&
          !file.endsWith('.d.ts') &&
          file !== 'Job.ts' &&
          file !== 'Job.js' &&
          file !== 'JobScheduler.ts' &&
          file !== 'JobScheduler.js' &&
          file !== 'JobInitializer.ts' &&
          file !== 'JobInitializer.js' &&
          file !== '.gitkeep'
        ) {
          try {
            const module = require(fullPath);
            const JobClass = module.default || Object.values(module)[0];
            if (JobClass && typeof JobClass === 'function') {
              const jobInstance = new JobClass() as Job;
              if (jobInstance.name && typeof jobInstance.execute === 'function') {
                scheduler.register(jobInstance);
                logger.info(`Loaded background job: ${jobInstance.name}`);
              }
            }
          } catch (err) {
            logger.error(`Failed to load job file ${file}:`, err);
            throw err;
          }
        }
      }
    };

    scanDir(jobsDir);
  }
}
