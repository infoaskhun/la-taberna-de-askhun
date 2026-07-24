import { Guild } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

export class EmojiHelper {
  /**
   * Returns the string representation of the celesio custom emoji.
   * If the custom emoji does not exist in the guild, it uploads it from assets.
   * Falls back to the default "🪙" if it cannot resolve or upload it.
   */
  public static async getCelesioEmoji(guild: Guild | null): Promise<string> {
    if (!guild) return '🪙';

    try {
      // Fetch emojis from the API to ensure they are detected even if not cached
      const emojis = await guild.emojis.fetch();
      const existingEmoji = emojis.find((e) => e.name === 'celesio');

      if (existingEmoji) {
        return existingEmoji.toString();
      }

      // Resolve asset path from process.cwd()
      const assetPath = path.join(process.cwd(), 'src', 'assets', 'celesios.png');
      if (fs.existsSync(assetPath)) {
        const emoji = await guild.emojis.create({
          attachment: assetPath,
          name: 'celesio',
          reason: 'Icono personalizado de Celesios',
        });
        return emoji.toString();
      }
    } catch (err: any) {
      console.error('Failed to resolve or upload celesio emoji:', err);
      try {
        fs.writeFileSync(
          path.join(process.cwd(), 'celesio_error.log'),
          `Error at ${new Date().toISOString()}:\nMessage: ${err.message}\nStack: ${err.stack}\n`
        );
      } catch (logErr) {}
    }

    return '🪙';
  }

  /**
   * Returns the string representation of the celesio_roto custom emoji.
   * If the custom emoji does not exist in the guild, it uploads it from assets.
   * Falls back to the default "🪙" if it cannot resolve or upload it.
   */
  public static async getCelesioRotoEmoji(guild: Guild | null): Promise<string> {
    if (!guild) return '🪙';

    try {
      const emojis = await guild.emojis.fetch();
      const existingEmoji = emojis.find((e) => e.name === 'celesio_roto');

      if (existingEmoji) {
        return existingEmoji.toString();
      }

      const assetPath = path.join(process.cwd(), 'src', 'assets', 'celesios roto.png');
      if (fs.existsSync(assetPath)) {
        const emoji = await guild.emojis.create({
          attachment: assetPath,
          name: 'celesio_roto',
          reason: 'Icono personalizado de Celesio Roto',
        });
        return emoji.toString();
      }
    } catch (err: any) {
      console.error('Failed to resolve or upload celesio_roto emoji:', err);
    }

    return '🪙';
  }

  /**
   * Returns the URL of the celesio_roto custom emoji.
   * If the emoji does not exist, it tries to upload it first.
   * Returns null if it cannot resolve or upload it.
   */
  public static async getCelesioRotoEmojiUrl(guild: Guild | null): Promise<string | null> {
    if (!guild) return null;

    try {
      const emojis = await guild.emojis.fetch();
      let existingEmoji = emojis.find((e) => e.name === 'celesio_roto');

      if (!existingEmoji) {
        const assetPath = path.join(process.cwd(), 'src', 'assets', 'celesios roto.png');
        if (fs.existsSync(assetPath)) {
          existingEmoji = await guild.emojis.create({
            attachment: assetPath,
            name: 'celesio_roto',
            reason: 'Icono personalizado de Celesio Roto',
          });
        }
      }

      if (existingEmoji) {
        return existingEmoji.imageURL();
      }
    } catch (err: any) {
      console.error('Failed to resolve, upload or get URL for celesio_roto emoji:', err);
    }

    return null;
  }
}

