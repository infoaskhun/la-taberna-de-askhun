import { TextChannel, Webhook } from 'discord.js';

export class WebhookHelper {
  /**
   * Sends a message to a text channel or thread using a webhook, customizing the username and avatar.
   * If the channel is a thread, it manages the webhook on the parent channel and targets the thread.
   */
  public static async sendWebhookMessage(
    channel: any,
    username: string,
    avatarUrl: string | null,
    payload: string | { content?: string; embeds?: any[] }
  ): Promise<void> {
    try {
      const isThread = typeof channel.isThread === 'function' && channel.isThread();
      const targetChannel = isThread ? (channel.parent as TextChannel) : (channel as TextChannel);

      if (!targetChannel) {
        throw new Error('No valid text channel found.');
      }

      // Find all webhooks in the target parent channel
      const webhooks = await targetChannel.fetchWebhooks();
      // Find one created by our bot client
      let webhook = webhooks.find(wh => wh.owner?.id === channel.client.user?.id);

      if (!webhook) {
        webhook = await targetChannel.createWebhook({
          name: 'La Taberna de Askhun',
          reason: 'Webhook para mensajes de los taberneros',
        });
      }

      // Send the payload
      const sendPayload: any = {
        username,
        avatarURL: avatarUrl || undefined,
        ...(typeof payload === 'string' ? { content: payload } : payload),
      };

      if (isThread) {
        sendPayload.threadId = channel.id;
      }

      await webhook.send(sendPayload);
    } catch (err) {
      console.error('Error sending webhook message:', err);
      // Fallback: If webhook fails (e.g. missing Manage Webhooks permission), send standard channel message
      try {
        if (typeof payload === 'string') {
          await channel.send({
            content: `**${username}**: ${payload}`
          });
        } else {
          const fallbackPayload = { ...payload };
          if (fallbackPayload.content) {
            fallbackPayload.content = `**${username}**: ${fallbackPayload.content}`;
          }
          await channel.send(fallbackPayload);
        }
      } catch (fallbackErr) {
        console.error('Fallback channel send also failed:', fallbackErr);
      }
    }
  }
}
