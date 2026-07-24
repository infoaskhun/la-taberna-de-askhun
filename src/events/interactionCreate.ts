import { Interaction, MessageFlags } from 'discord.js';
import { Event } from './Event';
import { ApplicationContainer } from '../bootstrap/ApplicationContainer';
import { PredictionRenderer } from '../utils/PredictionRenderer';

export class InteractionCreateEvent implements Event {
  public readonly name = 'interactionCreate';
  public readonly once = false;

  public async execute(container: ApplicationContainer, interaction: Interaction): Promise<void> {
    const logger = container.logger;

    if (interaction.isChatInputCommand()) {
      const commandName = interaction.commandName;
      const registry = container.resolve<any>('CommandRegistry');
      const command = registry.get(commandName);

      if (!command) {
        logger.warn(`Received command interaction for unregistered command: /${commandName}`);
        await interaction.reply({ content: 'Este comando no existe o no está registrado.', flags: MessageFlags.Ephemeral });
        return;
      }

      try {
        logger.info(`User ${interaction.user.id} executed command: /${commandName}`);
        await command.execute(interaction, container);
      } catch (err) {
        logger.error(`Error executing command /${commandName}:`, err);
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply('Hubo un error al ejecutar este comando.');
        } else {
          await interaction.reply({ content: 'Hubo un error al ejecutar este comando.', flags: MessageFlags.Ephemeral });
        }
      }
    } else if (interaction.isAutocomplete()) {
      const commandName = interaction.commandName;
      const registry = container.resolve<any>('CommandRegistry');
      const command = registry.get(commandName);

      if (command && typeof command.autocomplete === 'function') {
        try {
          await command.autocomplete(interaction, container);
        } catch (err) {
          logger.error(`Error executing autocomplete for /${commandName}:`, err);
        }
      }
    } else if (interaction.isButton()) {
      const customId = interaction.customId;
      logger.info(`User ${interaction.user.id} clicked button: ${customId}`);

      const predictionRepo = container.resolve<any>('PredictionRepository');
      const predictionService = container.resolve<any>('PredictionService');

      const memberResolver = async (userId: string): Promise<string> => {
        try {
          const member = await interaction.guild?.members.fetch(userId);
          return member ? member.displayName : userId;
        } catch {
          return userId;
        }
      };

      if (customId.startsWith('prediction_vote:')) {
        const parts = customId.split(':');
        const predictionId = parseInt(parts[1], 10);
        const optionId = parseInt(parts[2], 10);

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
          // 1. Cast the vote in DB
          await predictionService.castVote(interaction.user.id, optionId);

          // 2. Fetch fresh prediction, options and votes to re-render
          const prediction = await predictionRepo.getById(predictionId);
          if (prediction && prediction.channelId && prediction.messageId) {
            const options = await predictionRepo.getOptions(predictionId);
            const votes = await predictionRepo.getVotes(predictionId);

            // Edit original public message
            const message = await interaction.channel?.messages.fetch(prediction.messageId).catch(() => null);
            if (message) {
              const existingDesc = message.embeds[0]?.description || '';
              const customMessage = existingDesc.includes('**Recompensa:**') ? existingDesc.split('**Recompensa:**')[0].trim() : null;

              // Re-render embed & components
              const { embed, components } = await PredictionRenderer.render(prediction, options, votes, 1, memberResolver, null, customMessage);
              await message.edit({ embeds: [embed], components });
            }
          }

          await interaction.editReply('¡Tu voto ha sido registrado con éxito! Tu voto es inmutable y no puede ser modificado.');
        } catch (err: any) {
          logger.warn(`User ${interaction.user.id} failed to vote: ${err.message}`);
          await interaction.editReply(err.message || 'No se pudo registrar tu voto.');
        }

      } else if (customId.startsWith('prediction_page:')) {
        const parts = customId.split(':');
        const predictionId = parseInt(parts[1], 10);
        const page = parseInt(parts[2], 10);

        try {
          const prediction = await predictionRepo.getById(predictionId);
          if (prediction) {
            const options = await predictionRepo.getOptions(predictionId);
            const votes = await predictionRepo.getVotes(predictionId);

            // Render selected page
            const message = interaction.message;
            const existingDesc = message.embeds[0]?.description || '';
            const customMessage = existingDesc.includes('**Recompensa:**') ? existingDesc.split('**Recompensa:**')[0].trim() : null;

            const { embed, components } = await PredictionRenderer.render(prediction, options, votes, page, memberResolver, null, customMessage);

            // Edit message components & embed
            await interaction.update({ embeds: [embed], components });
          }
        } catch (err: any) {
          logger.error(`Error paginating prediction ID ${predictionId}:`, err);
        }
      }
    }
  }
}

export default InteractionCreateEvent;
