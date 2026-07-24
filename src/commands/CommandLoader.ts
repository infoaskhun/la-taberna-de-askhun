import * as fs from 'fs';
import * as path from 'path';
import { CommandRegistry } from './CommandRegistry';
import { Logger } from '../utils/logger';
import { Command } from './Command';

export class CommandLoader {
  public static async load(registry: CommandRegistry, logger: Logger): Promise<void> {
    const commandsDir = __dirname;

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
          file !== 'Command.ts' &&
          file !== 'Command.js' &&
          file !== 'CommandRegistry.ts' &&
          file !== 'CommandRegistry.js' &&
          file !== 'CommandLoader.ts' &&
          file !== 'CommandLoader.js' &&
          file !== '.gitkeep'
        ) {
          try {
            const module = require(fullPath);
            const CommandClass = module.default || Object.values(module)[0];
            if (CommandClass && typeof CommandClass === 'function') {
              const commandInstance = new CommandClass() as Command;
              if (commandInstance.data && typeof commandInstance.execute === 'function') {
                registry.register(commandInstance);
                logger.info(`Loaded command: /${commandInstance.data.name}`);
              }
            }
          } catch (err) {
            logger.error(`Failed to load command file ${file}:`, err);
            throw err;
          }
        }
      }
    };

    scanDir(commandsDir);
  }
}
