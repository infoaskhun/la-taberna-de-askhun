import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';
import { EmojiHelper } from '../../utils/EmojiHelper';

export class DarCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('dar')
    .setDescription('Otorga Celesios a un usuario (Admin).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) => opt.setName('usuario').setDescription('El usuario que recibirá los Celesios.').setRequired(true))
    .addIntegerOption((opt) => opt.setName('cantidad').setDescription('La cantidad de Celesios a otorgar.').setRequired(true));

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const config = container.configuration;
    const logger = container.logger;
    const economyService = container.economyService;
    const userRepo = container.userRepository;

    // Validate admin/owner permission dynamically from DB
    const callerProfile = await userRepo.getById(interaction.user.id);
    if (!callerProfile || (!callerProfile.isAdmin && !callerProfile.isOwner)) {
      await interaction.reply({ content: 'No tienes permisos para usar este comando administrativo.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Validate channel
    const channelName = (interaction.channel as any)?.name?.toLowerCase();
    if (channelName !== 'askhun-moderation') {
      await interaction.reply({ content: 'Este comando solo puede ser ejecutado en el canal de moderación **#askhun-moderation**.', flags: MessageFlags.Ephemeral });
      return;
    }

    const targetUser = interaction.options.getUser('usuario', true);
    const amount = interaction.options.getInteger('cantidad', true);

    if (amount <= 0) {
      await interaction.reply({ content: 'La cantidad debe ser mayor que cero.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply();

    try {
      const newBalance = await economyService.grantCelesios(
        targetUser.id,
        amount,
        `Depósito administrativo por ${interaction.user.tag}`
      );

      const emoji = await EmojiHelper.getCelesioEmoji(interaction.guild);

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle(`${emoji} Celesios Otorgados`)
        .setDescription(`Se han otorgado **${amount} Celesios** a <@${targetUser.id}>.\nNuevo saldo: **${newBalance} Celesios**.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      logger.error('Error executing /dar command:', err);
      await interaction.editReply(`Error al otorgar Celesios: ${err.message || 'Error inesperado.'}`);
    }
  }
}

export default DarCommand;
