import { GuildMember, EmbedBuilder } from 'discord.js';
import { Event } from './Event';
import { ApplicationContainer } from '../bootstrap/ApplicationContainer';

export class GuildMemberAddEvent implements Event {
  public readonly name = 'guildMemberAdd';
  public readonly once = false;

  public async execute(container: ApplicationContainer, member: GuildMember): Promise<void> {
    const logger = container.logger;
    const economyService = container.economyService;
    const settingsRepo = container.guildSettingsRepository;

    logger.info(`Event guildMemberAdd triggered for user: ${member.id} (${member.user.tag})`);

    try {
      const settings = await settingsRepo.getByGuildId(member.guild.id);
      const welcomeCelesios = settings?.welcomeCelesios ?? 15;

      // Grant the welcome celesios if they join for the first time
      const welcomeGranted = await economyService.handleUserJoin(member.id, welcomeCelesios);

      if (welcomeGranted) {
        const recuerdaChan = settings?.recuerdaChannelId ? `<#${settings.recuerdaChannelId}>` : '#recuerda';

        // Send welcome message via DM
        const welcomeText =
          `*Al cruzar el umbral, todavía asombrado y algo mareado, encuentras una extraña bolsa en una esquina apartada, sobre el suelo. La abres. Dentro hay **${welcomeCelesios} Celesios** y una nota que dice:*\n\n` +
          `> *Todo viajero merece empezar con algo en el bolsillo. Lo que hagas con ello es cosa tuya.*\n\n` +
          `> *— El Tabernero.*\n\n` +
          `*Dirígete al canal ${recuerdaChan} si quieres conocer la verdad de tu viaje. Hay cosas que necesitas saber.*`;

        const embed = new EmbedBuilder()
          .setColor(0x1a1a2e)
          .setDescription(welcomeText)
          .setFooter({ text: 'La Taberna de Askhun · El Umbral' })
          .setTimestamp();

        try {
          await member.send({ embeds: [embed] });
          logger.info(`Sent welcome DM embed to user: ${member.id}`);
        } catch (dmErr) {
          logger.warn(`Could not send welcome DM embed to user ${member.id} (DMs might be closed):`, dmErr);
        }
      } else {
        logger.info(`User ${member.id} rejoined the server. No welcome gift granted.`);
      }
    } catch (err) {
      logger.error(`Error handling guildMemberAdd event for user ${member.id}:`, err);
    }
  }
}
export default GuildMemberAddEvent;
