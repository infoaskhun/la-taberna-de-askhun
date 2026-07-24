import { Events, REST, Routes } from 'discord.js';
import { Event } from './Event';
import { ApplicationContainer } from '../bootstrap/ApplicationContainer';

export class ReadyEvent implements Event {
  public readonly name = 'clientReady';
  public readonly once = true;

  public async execute(container: ApplicationContainer): Promise<void> {
    const logger = container.logger;
    const config = container.configuration;
    const registry = container.resolve<any>('CommandRegistry');

    logger.info('Discord client is fully connected and ready!');

    if (config.discordToken.startsWith('mock_')) {
      logger.info('Mock environment detected. Skipping REST slash command registration.');
      return;
    }

    try {
      logger.info('Deploying slash commands to Discord globally...');
      const rest = new REST({ version: '10' }).setToken(config.discordToken);
      const commandData = registry.getAll().map((cmd: any) => cmd.data.toJSON());

      // Register commands globally
      await rest.put(
        Routes.applicationCommands(config.discordClientId),
        { body: commandData }
      );

      logger.info('Slash commands successfully registered globally!');
    } catch (err) {
      logger.error('Failed to deploy slash commands to Discord:', err);
    }
  }
}

export default ReadyEvent;
