import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';

export class ModificarOracionCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('modificaroracion')
    .setDescription('Modifica las propiedades de una oración existente.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((opt) => opt.setName('id').setDescription('ID de la oración que deseas modificar.').setRequired(true))
    .addStringOption((opt) => opt.setName('nuevo_nombre').setDescription('Nuevo nombre para la oración (opcional).').setRequired(false))
    .addIntegerOption((opt) => opt.setName('nuevo_coste').setDescription('Nuevo coste en Celesios (opcional).').setRequired(false))
    .addStringOption((opt) => opt.setName('nuevo_rol_id').setDescription('Nuevo ID del rol de Discord asociado (opcional).').setRequired(false))
    .addIntegerOption((opt) => opt.setName('nuevo_req_id').setDescription('Nuevo ID de la oración previa requerida (opcional).').setRequired(false))
    .addStringOption((opt) => opt.setName('nuevo_mensaje').setDescription('Nuevo mensaje personalizado de entrega (opcional).').setRequired(false));

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const logger = container.logger;
    const titleRepo = container.titleRepository;
    const userRepo = container.userRepository;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: 'Este comando solo puede usarse dentro de un servidor.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Validate admin/owner permissions
    const callerProfile = await userRepo.getById(interaction.user.id);
    if (!callerProfile || (!callerProfile.isAdmin && !callerProfile.isOwner)) {
      await interaction.reply({ content: 'No tienes permisos para usar este comando administrativo.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Validate channel strictly (must be #askhun-moderation)
    const channelName = (interaction.channel as any)?.name?.toLowerCase();
    if (channelName !== 'askhun-moderation') {
      await interaction.reply({ content: 'Este comando solo puede ser ejecutado en el canal de moderación **#askhun-moderation**.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply();

    try {
      const id = interaction.options.getInteger('id', true);
      const nuevoNombre = interaction.options.getString('nuevo_nombre');
      const nuevoCoste = interaction.options.getInteger('nuevo_coste');
      const nuevoRolId = interaction.options.getString('nuevo_rol_id');
      const nuevoReqId = interaction.options.getInteger('nuevo_req_id');
      const nuevoMensajeInput = interaction.options.getString('nuevo_mensaje');

      // Fetch existing title
      const title = await titleRepo.getById(id);
      if (!title || !title.active) {
        await interaction.editReply(`❌ No se encontró ninguna oración activa con el ID **${id}**. Usa \`/oraciones\` para ver la lista actual.`);
        return;
      }

      // Build updates object
      const updates: any = {};
      if (nuevoNombre !== null) updates.name = nuevoNombre;
      if (nuevoCoste !== null) updates.cost = nuevoCoste;
      if (nuevoRolId !== null) updates.roleId = nuevoRolId;
      if (nuevoReqId !== null) updates.requiredTitleId = nuevoReqId === 0 ? null : nuevoReqId; // Use 0 to clear requirement
      if (nuevoMensajeInput !== null) {
        if (nuevoMensajeInput.length > 2000) {
          await interaction.editReply('❌ El mensaje personalizado modificado no puede superar los 2000 caracteres.');
          return;
        }
        updates.message = nuevoMensajeInput === 'ninguno' ? null : nuevoMensajeInput.replace(/\\n/g, '\n');
      }

      if (Object.keys(updates).length === 0) {
        await interaction.editReply('⚠️ No especificaste ninguna propiedad para modificar.');
        return;
      }

      const updatedTitle = await titleRepo.update(id, updates);

      await interaction.editReply(`✅ Oración **${updatedTitle.name}** (ID: ${updatedTitle.id}) modificada con éxito.`);
    } catch (err: any) {
      logger.error('Error executing /modificaroracion command:', err);
      await interaction.editReply(`❌ Error al modificar la oración: ${err.message || 'Error inesperado.'}`);
    }
  }
}

export default ModificarOracionCommand;
