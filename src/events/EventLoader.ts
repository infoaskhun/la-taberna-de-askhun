import * as fs from 'fs';
import * as path from 'path';
import { Client as DiscordClient } from 'discord.js';
import { EventRegistry } from './EventRegistry';
import { Logger } from '../utils/logger';
import { Event } from './Event';
import { ApplicationContainer } from '../bootstrap/ApplicationContainer';

export class EventLoader {
  public static async load(
    registry: EventRegistry,
    client: DiscordClient,
    container: ApplicationContainer,
    logger: Logger
  ): Promise<void> {
    const eventsDir = __dirname;

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
          file !== 'Event.ts' &&
          file !== 'Event.js' &&
          file !== 'EventRegistry.ts' &&
          file !== 'EventRegistry.js' &&
          file !== 'EventLoader.ts' &&
          file !== 'EventLoader.js' &&
          file !== '.gitkeep'
        ) {
          try {
            const module = require(fullPath);
            const EventClass = module.default || Object.values(module)[0];
            if (EventClass && typeof EventClass === 'function') {
              const eventInstance = new EventClass() as Event;
              if (eventInstance.name && typeof eventInstance.execute === 'function') {
                registry.register(eventInstance);

                if (eventInstance.once) {
                  client.once(eventInstance.name, (...args) =>
                    eventInstance.execute(container, ...args).catch((err) =>
                      logger.error(`Error in event listener "${eventInstance.name}":`, err)
                    )
                  );
                } else {
                  client.on(eventInstance.name, (...args) =>
                    eventInstance.execute(container, ...args).catch((err) =>
                      logger.error(`Error in event listener "${eventInstance.name}":`, err)
                    )
                  );
                }

                logger.info(`Registered event listener for: ${eventInstance.name}`);
              }
            }
          } catch (err) {
            logger.error(`Failed to load event file ${file}:`, err);
            throw err;
          }
        }
      }
    };

    scanDir(eventsDir);
  }
}
