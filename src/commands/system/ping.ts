import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';

export class PingCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const logger = container.logger;
    logger.info('Ping command executed.');
    await interaction.reply({ content: 'Pong!', flags: MessageFlags.Ephemeral });
  }
}
