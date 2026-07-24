import { ChatInputCommandInteraction, SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import { ApplicationContainer } from '../bootstrap/ApplicationContainer';

export interface Command {
  data: any;
  execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction, container: ApplicationContainer): Promise<void>;
}

