import { Client, GatewayIntentBits } from 'discord.js';
import * as db from './db';
import { config } from './config';

export class BotManager {
  private static clients = new Map<string, Client>();
  private static logs = new Map<string, string[]>();

  public static addLog(apiKey: string, text: string) {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] ${text}`;
    if (!this.logs.has(apiKey)) {
      this.logs.set(apiKey, []);
    }
    this.logs.get(apiKey)!.push(formatted);
    // Keep last 40 lines
    if (this.logs.get(apiKey)!.length > 40) {
      this.logs.get(apiKey)!.shift();
    }
  }

  public static getLogs(apiKey: string): string[] {
    return this.logs.get(apiKey) || [];
  }

  public static isBotRunning(apiKey: string): boolean {
    return this.clients.has(apiKey);
  }

  public static async startBot(
    apiKey: string,
    token: string,
    guildId: string,
    channelId: string
  ): Promise<boolean> {
    // If bot already running, stop it first
    if (this.isBotRunning(apiKey)) {
      this.stopBot(apiKey);
    }

    this.logs.set(apiKey, []); // reset console
    this.addLog(apiKey, '[INFO] Initializing Discord Bot client connection...');

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    return new Promise((resolve) => {
      let isResolved = false;

      client.once('ready', () => {
        this.addLog(apiKey, `[SUCCESS] Logged in as ${client.user?.tag}`);
        this.addLog(apiKey, `[INFO] Server (Guild ID) target: "${guildId}"`);
        this.addLog(apiKey, `[INFO] Whitelist Audit channel (Channel ID): "${channelId}"`);
        this.addLog(apiKey, `[SUCCESS] Prefix commands listener active (!add, !remove, !info, !list).`);
        
        // Save the client to memory
        this.clients.set(apiKey, client);
        
        if (!isResolved) {
          isResolved = true;
          resolve(true);
        }
      });

      client.on('error', (err) => {
        this.addLog(apiKey, `[ERROR] Gateway connection error: ${err.message}`);
      });

      // Prefix message listener
      client.on('messageCreate', async (message) => {
        // Only run commands from user in specified Guild and Channel
        if (message.author.bot) return;
        if (String(message.guildId) !== String(guildId)) return;
        if (String(message.channelId) !== String(channelId)) return;

        const content = message.content.trim();
        if (!content.startsWith('!')) return;

        const args = content.slice(1).split(/\s+/);
        const command = args[0].toLowerCase();

        this.addLog(apiKey, `[COMMAND] Received command: !${command} in channel`);

        // Check reseller capacity / info
        const database = db.loadDb();
        const reseller = database.api_keys[apiKey];
        if (!reseller) return;

        if (command === 'add') {
          const uid = args[1];
          const daysStr = args[2];
          if (!uid) {
            await message.reply('❌ **Usage:** `!add <uid> [days]` (e.g. `!add 123456 30`)');
            return;
          }

          const days = daysStr ? parseInt(daysStr, 10) : 30;
          if (isNaN(days) || days <= 0) {
            await message.reply('❌ **Error:** Expiration days must be a valid positive number.');
            return;
          }

          // Check limits
          const activeCount = Object.keys(reseller.uids || {}).length;
          const limit = reseller.max_uids || 100;
          
          if (activeCount >= limit && !reseller.uids?.[uid]) {
            await message.reply(`❌ **Error:** Whitelisting limit reached. Your maximum capacity is **${limit}** UIDs.`);
            this.addLog(apiKey, `[WARNING] Command !add failed: reseller Whitelist capacity limit reached (${limit}).`);
            return;
          }

          const added = db.addKeyUid(apiKey, uid, days);
          if (added) {
            await message.reply(`✅ **Successfully Whitelisted UID:** \`${uid}\` for **${days}** days.`);
            this.addLog(apiKey, `[SUCCESS] UID ${uid} registered via Discord command for ${days} days.`);
            
            // Trigger system log
            db.addActivityLog(0, reseller.owner_id, 'add', uid, {
              user_name: reseller.username || 'Discord Bot',
              api_key_used: apiKey,
              details: { platform: 'discord_bot', requested_days: days }
            });
          } else {
            await message.reply('❌ **Error:** Failed to record whitelisted UID into database.');
          }

        } else if (command === 'remove') {
          const uid = args[1];
          if (!uid) {
            await message.reply('❌ **Usage:** `!remove <uid>`');
            return;
          }

          if (!reseller.uids?.[uid]) {
            await message.reply(`❌ **Error:** UID \`${uid}\` is not registered in your whitelist directory.`);
            return;
          }

          // Delete UID
          const freshDb = db.loadDb();
          if (freshDb.api_keys[apiKey]?.uids?.[uid]) {
            delete freshDb.api_keys[apiKey].uids[uid];
            db.saveDb(freshDb);
            
            await message.reply(`✅ **Successfully Removed UID:** \`${uid}\` from whitelist.`);
            this.addLog(apiKey, `[SUCCESS] UID ${uid} removed via Discord command.`);

            db.addActivityLog(0, reseller.owner_id, 'remove', uid, {
              user_name: reseller.username || 'Discord Bot',
              api_key_used: apiKey,
              details: { platform: 'discord_bot' }
            });
          } else {
            await message.reply('❌ **Error:** Failed to remove whitelisted UID.');
          }

        } else if (command === 'info') {
          const uid = args[1];
          if (!uid) {
            await message.reply('❌ **Usage:** `!info <uid>`');
            return;
          }

          const uidInfo = reseller.uids?.[uid];
          if (!uidInfo) {
            await message.reply(`❌ **Error:** UID \`${uid}\` is not whitelisted.`);
            return;
          }

          // Calculate remaining
          const expDate = new Date(uidInfo.expiry.replace(' ', 'T'));
          const diff = expDate.getTime() - new Date().getTime();
          const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
          const validity = daysLeft <= 0 ? 'Expired' : (daysLeft >= 1000 ? 'Lifetime' : `${daysLeft} Days`);

          await message.reply(
            `ℹ️ **Whitelisted UID Info:**\n` +
            `• **UID:** \`${uid}\`\n` +
            `• **Registered On:** \`${uidInfo.added_on}\`\n` +
            `• **Valid For:** \`${validity}\` (Expires: \`${uidInfo.expiry}\`)`
          );

        } else if (command === 'list') {
          const uids = reseller.uids || {};
          const list = Object.entries(uids);

          if (list.length === 0) {
            await message.reply('📋 Your whitelist registry directory is completely empty.');
            return;
          }

          const replyLines = ['📋 **Whitelisted UIDs Directory:**'];
          list.forEach(([uid, info]) => {
            const expDate = new Date(info.expiry.replace(' ', 'T'));
            const diff = expDate.getTime() - new Date().getTime();
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
            const validity = daysLeft <= 0 ? 'Expired' : (daysLeft >= 1000 ? 'Lifetime' : `${daysLeft}d`);
            replyLines.push(`• \`${uid}\` - Expiry: \`${validity}\` (\`${info.expiry.split(' ')[0]}\`)`);
          });

          // Truncate list if too long for Discord message limits (2000 chars)
          let replyStr = replyLines.join('\n');
          if (replyStr.length > 1950) {
            replyStr = replyStr.substring(0, 1900) + '\n... (truncated list due to length limits)';
          }

          await message.reply(replyStr);
        }
      });

      // Login trigger
      client.login(token).catch((err) => {
        this.addLog(apiKey, `[ERROR] Failed to login to Discord: ${err.message}`);
        if (!isResolved) {
          isResolved = true;
          resolve(false);
        }
      });

      // Fallback timeout resolved as failed if took longer than 6 seconds to ready
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.addLog(apiKey, '[ERROR] Discord Gateway login timeout.');
          resolve(false);
        }
      }, 7000);
    });
  }

  public static stopBot(apiKey: string) {
    if (this.clients.has(apiKey)) {
      const client = this.clients.get(apiKey);
      try {
        client?.destroy();
        this.addLog(apiKey, '[INFO] Discord Client connection terminated.');
      } catch (err) {
        // ignored
      }
      this.clients.delete(apiKey);
    }
  }

  public static shutdown() {
    for (const [key, client] of this.clients.entries()) {
      try {
        client.destroy();
      } catch (err) {}
    }
    this.clients.clear();
  }
}
