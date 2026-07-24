import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { Command } from '../Command';
import { ApplicationContainer } from '../../bootstrap/ApplicationContainer';
import { GuildSettings } from '../../repositories/GuildSettingsRepository';

export class ConfiguracionCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName('configuracion')
    .setDescription('Comandos de configuración administrativa de la taberna.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('comidacrear')
        .setDescription('Crea o actualiza una comida en el menú.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la comida.').setRequired(true))
        .addIntegerOption((opt) => opt.setName('precio').setDescription('Precio en Celesios.').setRequired(true))
        .addStringOption((opt) => opt.setName('mensaje').setDescription('Mensaje personalizado de entrega.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('comidamodificar')
        .setDescription('Modifica parcialmente una comida del menú.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la comida a modificar.').setRequired(true))
        .addIntegerOption((opt) => opt.setName('nuevo_precio').setDescription('Nuevo precio en Celesios (opcional).').setRequired(false))
        .addStringOption((opt) => opt.setName('nuevo_mensaje').setDescription('Nuevo mensaje personalizado de entrega o "ninguno" (opcional).').setRequired(false))
        .addBooleanOption((opt) => opt.setName('activo').setDescription('Activar o desactivar el item (opcional).').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('comidaactivar')
        .setDescription('Activa una comida del menú.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la comida a activar.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('comidadesactivar')
        .setDescription('Desactiva una comida del menú.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la comida a desactivar.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('bebidacrear')
        .setDescription('Crea o actualiza una bebida en el menú.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la bebida.').setRequired(true))
        .addIntegerOption((opt) => opt.setName('precio').setDescription('Precio en Celesios.').setRequired(true))
        .addStringOption((opt) => opt.setName('mensaje').setDescription('Mensaje personalizado de entrega.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('bebidamodificar')
        .setDescription('Modifica parcialmente una bebida del menú.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la bebida a modificar.').setRequired(true))
        .addIntegerOption((opt) => opt.setName('nuevo_precio').setDescription('Nuevo precio en Celesios (opcional).').setRequired(false))
        .addStringOption((opt) => opt.setName('nuevo_mensaje').setDescription('Nuevo mensaje personalizado de entrega o "ninguno" (opcional).').setRequired(false))
        .addBooleanOption((opt) => opt.setName('activo').setDescription('Activar o desactivar el item (opcional).').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('bebidaactivar')
        .setDescription('Activa una bebida del menú.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la bebida a activar.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('bebidadesactivar')
        .setDescription('Desactiva una bebida del menú.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la bebida a desactivar.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('oracioncrear')
        .setDescription('Crea o actualiza una oración.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la oración.').setRequired(true))
        .addIntegerOption((opt) => opt.setName('coste').setDescription('Coste en Celesios.').setRequired(true))
        .addStringOption((opt) => opt.setName('rol_id').setDescription('ID del rol de Discord asociado.').setRequired(true))
        .addIntegerOption((opt) => opt.setName('req_id').setDescription('ID de la oración previa requerida (opcional).').setRequired(false))
        .addStringOption((opt) => opt.setName('mensaje').setDescription('Mensaje personalizado que se enviará al comprar la oración (opcional).').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('oracionactivar')
        .setDescription('Activa una oración.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la oración a activar.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('oraciondesactivar')
        .setDescription('Desactiva una oración.')
        .addStringOption((opt) => opt.setName('nombre').setDescription('Nombre de la oración a desactivar.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('creadmin')
        .setDescription('Otorga rango de Administrador a un usuario (Solo Dueño).')
        .addUserOption((opt) => opt.setName('usuario').setDescription('El usuario a promover.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('quitaradmin')
        .setDescription('Remueve el rango de Administrador a un usuario (Solo Dueño).')
        .addUserOption((opt) => opt.setName('usuario').setDescription('El usuario a demover.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('saldoinicial')
        .setDescription('Configura la cantidad de Celesios que reciben los nuevos miembros (Solo Dueño/Admin).')
        .addIntegerOption((opt) => opt.setName('celesios').setDescription('La cantidad de Celesios iniciales.').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('vincularcanal')
        .setDescription('Vincula un canal específico a una función de la taberna (Solo Dueño/Admin).')
        .addStringOption((opt) =>
          opt
            .setName('tipo')
            .setDescription('La función del canal.')
            .setRequired(true)
            .addChoices(
              { name: 'Taberna', value: 'taberna' },
              { name: 'Templo del Dios Beodo', value: 'templo' },
              { name: 'Ranking (Hilo)', value: 'ranking' },
              { name: 'Pronósticos', value: 'pronosticos' },
              { name: 'Recuerda', value: 'recuerda' }
            )
        )
        .addChannelOption((opt) =>
          opt
            .setName('canal')
            .setDescription('El canal o hilo a vincular.')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('avatar')
        .setDescription('Establece la imagen (URL) de Gram o Grum (Solo Dueño/Admin).')
        .addStringOption((opt) =>
          opt
            .setName('personaje')
            .setDescription('El personaje a modificar.')
            .setRequired(true)
            .addChoices(
              { name: 'Gram (Cocinero)', value: 'gram' },
              { name: 'Grum (Cantinero)', value: 'grum' }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName('url')
            .setDescription('El enlace directo a la imagen.')
            .setRequired(true)
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('frase')
        .setDescription('Gestiona la pool de frases de diálogo para Gram, Grum o las Oraciones.')
        .addSubcommand((sub) =>
          sub
            .setName('agregar')
            .setDescription('Añade una frase a la pool de un personaje/sistema y evento.')
            .addStringOption((opt) =>
              opt.setName('personaje').setDescription('El personaje o sistema.').setRequired(true)
                .addChoices(
                  { name: 'Gram (Cocinero)', value: 'gram' },
                  { name: 'Grum (Cantinero)', value: 'grum' },
                  { name: 'Oración (Templo)', value: 'oracion' }
                )
            )
            .addStringOption((opt) =>
              opt.setName('evento').setDescription('El evento.').setRequired(true)
                .addChoices(
                  { name: 'Producto/Rango No Existe', value: 'no_existe' },
                  { name: 'Saldo Insuficiente', value: 'sin_saldo' },
                  { name: 'Honor Ya Obtenido', value: 'ya_obtenido' },
                  { name: 'Progresión Inválida', value: 'progreso_invalido' }
                )
            )
            .addStringOption((opt) =>
              opt.setName('frase').setDescription('La frase.').setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName('listar')
            .setDescription('Lista las frases de la pool de un personaje/sistema y evento.')
            .addStringOption((opt) =>
              opt.setName('personaje').setDescription('El personaje o sistema.').setRequired(true)
                .addChoices(
                  { name: 'Gram (Cocinero)', value: 'gram' },
                  { name: 'Grum (Cantinero)', value: 'grum' },
                  { name: 'Oración (Templo)', value: 'oracion' }
                )
            )
            .addStringOption((opt) =>
              opt.setName('evento').setDescription('El evento.').setRequired(true)
                .addChoices(
                  { name: 'Producto/Rango No Existe', value: 'no_existe' },
                  { name: 'Saldo Insuficiente', value: 'sin_saldo' },
                  { name: 'Honor Ya Obtenido', value: 'ya_obtenido' },
                  { name: 'Progresión Inválida', value: 'progreso_invalido' }
                )
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName('eliminar')
            .setDescription('Elimina una frase de la pool por su número de índice.')
            .addStringOption((opt) =>
              opt.setName('personaje').setDescription('El personaje o sistema.').setRequired(true)
                .addChoices(
                  { name: 'Gram (Cocinero)', value: 'gram' },
                  { name: 'Grum (Cantinero)', value: 'grum' },
                  { name: 'Oración (Templo)', value: 'oracion' }
                )
            )
            .addStringOption((opt) =>
              opt.setName('evento').setDescription('El evento.').setRequired(true)
                .addChoices(
                  { name: 'Producto/Rango No Existe', value: 'no_existe' },
                  { name: 'Saldo Insuficiente', value: 'sin_saldo' },
                  { name: 'Honor Ya Obtenido', value: 'ya_obtenido' },
                  { name: 'Progresión Inválida', value: 'progreso_invalido' }
                )
            )
            .addIntegerOption((opt) =>
              opt.setName('indice').setDescription('Número de la frase en la lista (usa /configuracion frase listar primero).').setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName('modificar')
            .setDescription('Modifica una frase existente por su número de índice.')
            .addStringOption((opt) =>
              opt.setName('personaje').setDescription('El personaje o sistema.').setRequired(true)
                .addChoices(
                  { name: 'Gram (Cocinero)', value: 'gram' },
                  { name: 'Grum (Cantinero)', value: 'grum' },
                  { name: 'Oración (Templo)', value: 'oracion' }
                )
            )
            .addStringOption((opt) =>
              opt.setName('evento').setDescription('El evento.').setRequired(true)
                .addChoices(
                  { name: 'Producto/Rango No Existe', value: 'no_existe' },
                  { name: 'Saldo Insuficiente', value: 'sin_saldo' },
                  { name: 'Honor Ya Obtenido', value: 'ya_obtenido' },
                  { name: 'Progresión Inválida', value: 'progreso_invalido' }
                )
            )
            .addIntegerOption((opt) =>
              opt.setName('indice').setDescription('Número de la frase a modificar.').setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName('frase').setDescription('El nuevo texto de la frase.').setRequired(true)
            )
        )
    );

  public async execute(interaction: ChatInputCommandInteraction, container: ApplicationContainer): Promise<void> {
    const config = container.configuration;
    const logger = container.logger;
    const itemRepo = container.itemRepository;
    const titleRepo = container.titleRepository;
    const userRepo = container.userRepository;

    // Validate admin/owner permission dynamically from DB
    const callerProfile = await userRepo.getById(interaction.user.id);
    if (!callerProfile || (!callerProfile.isAdmin && !callerProfile.isOwner)) {
      await interaction.reply({ content: 'No tienes permisos para usar este comando de configuración.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Validate channel strictly (must be #askhun-moderation)
    const channelName = (interaction.channel as any)?.name?.toLowerCase();
    if (channelName !== 'askhun-moderation') {
      await interaction.reply({ content: 'Este comando solo puede ser ejecutado en el canal de moderación **#askhun-moderation**.', flags: MessageFlags.Ephemeral });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup(false);

    // Check OWNER-only subcommands
    if ((subcommand === 'creadmin' || subcommand === 'quitaradmin') && !callerProfile.isOwner) {
      await interaction.reply({ content: 'Solo el dueño supremo de la taberna puede otorgar o remover permisos de administrador.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply();

    try {
      if (subcommand === 'comidacrear' || subcommand === 'bebidacrear') {
        const name = interaction.options.getString('nombre', true);
        const price = interaction.options.getInteger('precio', true);
        const customMessage = interaction.options.getString('mensaje', true);
        const type = subcommand === 'comidacrear' ? 'food' : 'drink';

        if (customMessage.length > 2000) {
          await interaction.editReply('❌ El mensaje personalizado no puede superar los 2000 caracteres.');
          return;
        }

        // Check if exists
        const existing = await itemRepo.getByNameAndType(name, type);
        if (existing) {
          await interaction.editReply(`El registro ya existe, utiliza \`/configuracion ${type === 'food' ? 'comidaactivar' : 'bebidaactivar'}\``);
          return;
        }

        const item = await itemRepo.create({ name, price, type, active: true, message: customMessage });
        await interaction.editReply(`Nuevo item creado: **${item.name}** (${type}) - Coste: ${item.price} Celesios.`);

      } else if (subcommand === 'comidamodificar' || subcommand === 'bebidamodificar') {
        const name = interaction.options.getString('nombre', true);
        const type = subcommand === 'comidamodificar' ? 'food' : 'drink';

        const existing = await itemRepo.getByNameAndType(name, type);
        if (!existing || existing.id === undefined) {
          await interaction.editReply(`❌ No se encontró ningún item con el nombre "${name}" (${type === 'food' ? 'comida' : 'bebida'}).`);
          return;
        }

        const newPrice = interaction.options.getInteger('nuevo_precio');
        const newMessageInput = interaction.options.getString('nuevo_mensaje');
        const newActive = interaction.options.getBoolean('activo');

        const updates: any = {};
        if (newPrice !== null) {
          updates.price = newPrice;
        }

        if (newMessageInput !== null) {
          if (newMessageInput.toLowerCase() === 'ninguno') {
            updates.message = null;
          } else {
            if (newMessageInput.length > 2000) {
              await interaction.editReply('❌ El mensaje personalizado no puede superar los 2000 caracteres.');
              return;
            }
            updates.message = newMessageInput;
          }
        }

        if (newActive !== null) {
          updates.active = newActive;
        }

        if (Object.keys(updates).length === 0) {
          await interaction.editReply('⚠️ No especificaste ningún campo para modificar (especifica nuevo_precio, nuevo_mensaje o activo).');
          return;
        }

        const updated = await itemRepo.update(existing.id, updates);
        await interaction.editReply(`✅ Item modificado: **${updated.name}** (${type === 'food' ? 'comida' : 'bebida'}) actualizado con éxito.`);

      } else if (subcommand === 'comidaactivar' || subcommand === 'bebidaactivar') {
        const name = interaction.options.getString('nombre', true);
        const type = subcommand === 'comidaactivar' ? 'food' : 'drink';

        const existing = await itemRepo.getByNameAndType(name, type);
        if (!existing || existing.id === undefined) {
          await interaction.editReply(`❌ No se encontró ningún item con el nombre "${name}" (${type === 'food' ? 'comida' : 'bebida'}).`);
          return;
        }

        if (existing.active) {
          await interaction.editReply(`⚠️ El item **${existing.name}** ya se encuentra activo.`);
          return;
        }

        await itemRepo.update(existing.id, { active: true });
        await interaction.editReply(`✅ Item activado con éxito: **${existing.name}** (${type === 'food' ? 'comida' : 'bebida'}).`);

      } else if (subcommand === 'comidadesactivar' || subcommand === 'bebidadesactivar') {
        const name = interaction.options.getString('nombre', true);
        const type = subcommand === 'comidadesactivar' ? 'food' : 'drink';

        const existing = await itemRepo.getByNameAndType(name, type);
        if (!existing || existing.id === undefined) {
          await interaction.editReply(`No se encontró ningún item activo con el nombre "${name}" (${type}).`);
          return;
        }

        await itemRepo.update(existing.id, { active: false });
        await interaction.editReply(`Item desactivado: **${existing.name}** (${type}).`);

      } else if (subcommand === 'oracioncrear') {
        const name = interaction.options.getString('nombre', true);
        const cost = interaction.options.getInteger('coste', true);
        const roleId = interaction.options.getString('rol_id', true);
        const requiredTitleId = interaction.options.getInteger('req_id') || null;
        const customMessageInput = interaction.options.getString('mensaje');

        if (customMessageInput && customMessageInput.length > 2000) {
          await interaction.editReply('❌ El mensaje personalizado de la oración no puede superar los 2000 caracteres.');
          return;
        }

        const message = customMessageInput ? customMessageInput.replace(/\\n/g, '\n') : null;

        const existing = await titleRepo.getByName(name);
        if (existing) {
          await interaction.editReply('El registro ya existe, utiliza `/configuracion oracionactivar`');
          return;
        }

        const title = await titleRepo.create({ name, cost, roleId, requiredTitleId, message, active: true });
        await interaction.editReply(`Nueva oración creada: **${title.name}** (ID: ${title.id}) - Coste: ${title.cost} Celesios.`);

      } else if (subcommand === 'oracionactivar') {
        const name = interaction.options.getString('nombre', true);

        const existing = await titleRepo.getByName(name);
        if (!existing) {
          await interaction.editReply(`❌ No se encontró ninguna oración con el nombre "${name}".`);
          return;
        }

        if (existing.active) {
          await interaction.editReply(`⚠️ La oración **${existing.name}** ya se encuentra activa.`);
          return;
        }

        await titleRepo.update(existing.id, { active: true });
        await interaction.editReply(`✅ Oración activada con éxito: **${existing.name}** (ID: ${existing.id}).`);

      } else if (subcommand === 'oraciondesactivar') {
        const name = interaction.options.getString('nombre', true);

        const existing = await titleRepo.getByName(name);
        if (!existing) {
          await interaction.editReply(`No se encontró ninguna oración activa con el nombre "${name}".`);
          return;
        }

        await titleRepo.update(existing.id, { active: false });
        await interaction.editReply(`Oración desactivada: **${existing.name}** (ID: ${existing.id}).`);

      } else if (subcommand === 'creadmin') {
        const targetUser = interaction.options.getUser('usuario', true);

        let targetProfile = await userRepo.getById(targetUser.id);
        if (!targetProfile) {
          targetProfile = await userRepo.create({
            id: targetUser.id,
            balance: 0,
            totalSpent: 0,
            welcomeReceived: false,
            isAdmin: true,
            isOwner: false,
          });
        } else {
          await userRepo.updateRoles(targetUser.id, true);
        }
        await interaction.editReply(`Se han otorgado permisos de **Administrador** a <@${targetUser.id}>.`);

      } else if (subcommand === 'quitaradmin') {
        const targetUser = interaction.options.getUser('usuario', true);

        const targetProfile = await userRepo.getById(targetUser.id);
        if (!targetProfile || targetProfile.isOwner) {
          await interaction.editReply(`No puedes remover permisos a este usuario.`);
          return;
        }

        await userRepo.updateRoles(targetUser.id, false);
        await interaction.editReply(`Se han removido los permisos de **Administrador** a <@${targetUser.id}>.`);

      } else if (subcommand === 'saldoinicial') {
        const celesios = interaction.options.getInteger('celesios', true);
        const guildId = interaction.guildId;

        if (!guildId) {
          await interaction.editReply('Este comando solo puede ejecutarse dentro de un servidor.');
          return;
        }

        if (celesios < 0) {
          await interaction.editReply('❌ La cantidad de Celesios iniciales no puede ser menor que cero.');
          return;
        }

        const settingsRepo = container.guildSettingsRepository;
        let settings = await settingsRepo.getByGuildId(guildId);

        if (!settings) {
          settings = {
            guildId,
            tabernaChannelId: null,
            temploChannelId: null,
            rankingThreadId: null,
            pronosticosChannelId: null,
            recuerdaChannelId: null,
            welcomeCelesios: 15,
            gramAvatarUrl: null,
            grumAvatarUrl: null,
            gramMsgNotFound: null,
            gramMsgNoMoney: null,
            grumMsgNotFound: null,
            grumMsgNoMoney: null,
          };
        }

        settings.welcomeCelesios = celesios;
        await settingsRepo.save(settings);

        await interaction.editReply(`✅ El saldo inicial para nuevos miembros de este servidor se ha configurado en **${celesios} Celesios**.`);

      } else if (subcommand === 'vincularcanal') {
        const tipo = interaction.options.getString('tipo', true);
        const canal = interaction.options.getChannel('canal', true);
        const guildId = interaction.guildId;

        if (!guildId) {
          await interaction.editReply('Este comando solo puede ejecutarse dentro de un servidor.');
          return;
        }

        const settingsRepo = container.guildSettingsRepository;
        let settings = await settingsRepo.getByGuildId(guildId);

        if (!settings) {
          settings = {
            guildId,
            tabernaChannelId: null,
            temploChannelId: null,
            rankingThreadId: null,
            pronosticosChannelId: null,
            recuerdaChannelId: null,
            welcomeCelesios: 15,
            gramAvatarUrl: null,
            grumAvatarUrl: null,
            gramMsgNotFound: null,
            gramMsgNoMoney: null,
            grumMsgNotFound: null,
            grumMsgNoMoney: null,
          };
        }

        if (tipo === 'taberna') {
          settings.tabernaChannelId = canal.id;
        } else if (tipo === 'templo') {
          settings.temploChannelId = canal.id;
        } else if (tipo === 'ranking') {
          settings.rankingThreadId = canal.id;
        } else if (tipo === 'pronosticos') {
          settings.pronosticosChannelId = canal.id;
        } else if (tipo === 'recuerda') {
          settings.recuerdaChannelId = canal.id;
        }

        await settingsRepo.save(settings);
        await interaction.editReply(`El canal/hilo para **${tipo}** ha sido vinculado correctamente a <#${canal.id}>.`);

      } else if (subcommand === 'avatar') {
        const personaje = interaction.options.getString('personaje', true);
        const url = interaction.options.getString('url', true);
        const guildId = interaction.guildId;

        if (!guildId) {
          await interaction.editReply('Este comando solo puede ejecutarse dentro de un servidor.');
          return;
        }

        const settingsRepo = container.guildSettingsRepository;
        let settings: GuildSettings = await settingsRepo.getByGuildId(guildId) ?? {
          guildId,
          tabernaChannelId: null,
          temploChannelId: null,
          rankingThreadId: null,
          pronosticosChannelId: null,
          recuerdaChannelId: null,
          welcomeCelesios: 15,
          gramAvatarUrl: null,
          grumAvatarUrl: null,
          gramMsgNotFound: null,
          gramMsgNoMoney: null,
          grumMsgNotFound: null,
          grumMsgNoMoney: null,
        };

        if (personaje === 'gram') {
          settings.gramAvatarUrl = url;
        } else if (personaje === 'grum') {
          settings.grumAvatarUrl = url;
        }

        await settingsRepo.save(settings);
        await interaction.editReply(`La imagen de **${personaje === 'gram' ? 'Gram' : 'Grum'}** ha sido actualizada con éxito.`);

      } else if (subcommandGroup === 'frase') {
        const personaje = interaction.options.getString('personaje', true) as any;
        const evento = interaction.options.getString('evento', true) as any;
        const guildId = interaction.guildId;

        if (!guildId) {
          await interaction.editReply('Este comando solo puede ejecutarse dentro de un servidor.');
          return;
        }

        const phrasesRepo = container.tavernPhrasesRepository;
        const personajeName = personaje === 'gram' ? 'Gram' : (personaje === 'grum' ? 'Grum' : 'Oración (Templo)');
        
        let eventoName = '';
        if (evento === 'no_existe') eventoName = 'Producto/Rango No Existe';
        else if (evento === 'sin_saldo') eventoName = 'Saldo Insuficiente';
        else if (evento === 'ya_obtenido') eventoName = 'Honor Ya Obtenido';
        else if (evento === 'progreso_invalido') eventoName = 'Progresión Inválida';

        if (subcommand === 'agregar') {
          const frase = interaction.options.getString('frase', true);
          const added = await phrasesRepo.add(guildId, personaje, evento, frase);
          const all = await phrasesRepo.getAll(guildId, personaje, evento);
          await interaction.editReply(
            `✅ Frase añadida a la pool de **${personajeName}** / **${eventoName}** (ahora hay **${all.length}** frase(s)).
> ${added.phrase}`
          );

        } else if (subcommand === 'listar') {
          const all = await phrasesRepo.getAll(guildId, personaje, evento);
          if (all.length === 0) {
            await interaction.editReply(`No hay frases configuradas para **${personajeName}** / **${eventoName}**. Se usará el texto por defecto.`);
            return;
          }
          const list = all.map((p, i) => `**${i + 1}.** ${p.phrase}`).join('\n');
          await interaction.editReply(`**Frases de ${personajeName} — ${eventoName}:**\n${list}`);

        } else if (subcommand === 'eliminar') {
          const indice = interaction.options.getInteger('indice', true);
          const removed = await phrasesRepo.removeByIndex(guildId, personaje, evento, indice);
          if (!removed) {
            await interaction.editReply(`❌ No existe ninguna frase en el índice **${indice}** para **${personajeName}** / **${eventoName}**. Usa \`/configuracion frase listar\` para ver la lista actual.`);
            return;
          }
          const remaining = await phrasesRepo.getAll(guildId, personaje, evento);
          await interaction.editReply(`✅ Frase **${indice}** eliminada. Quedan **${remaining.length}** frase(s) en la pool.`);

        } else if (subcommand === 'modificar') {
          const indice = interaction.options.getInteger('indice', true);
          const frase = interaction.options.getString('frase', true);
          const updated = await phrasesRepo.updateByIndex(guildId, personaje, evento, indice, frase);
          if (!updated) {
            await interaction.editReply(`❌ No existe ninguna frase en el índice **${indice}** para **${personajeName}** / **${eventoName}**. Usa \`/configuracion frase listar\` para ver la lista actual.`);
            return;
          }
          await interaction.editReply(`✅ Frase **${indice}** actualizada para **${personajeName}** / **${eventoName}**:\n> ${updated.phrase}`);
        }
      }
    } catch (err: any) {
      logger.error(`Error in /configuracion ${subcommand}:`, err);
      await interaction.editReply(`Error al configurar: ${err.message || 'Error inesperado.'}`);
    }
  }
}

export default ConfiguracionCommand;
