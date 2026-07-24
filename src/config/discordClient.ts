import { Client as DiscordClient, GatewayIntentBits, Partials } from 'discord.js';
import { ConfigurationService } from './ConfigurationService';

export function createDiscordClient(config: ConfigurationService): DiscordClient {
  return new DiscordClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction,
    ],
  });
}
