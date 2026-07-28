import { Client, GatewayIntentBits } from 'discord.js';
import crypto from 'crypto';
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
        this.addLog(apiKey, `[SUCCESS] Full Admin Command Suite & Owner ID Guard Active (!help).`);
        
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

        this.addLog(apiKey, `[COMMAND] Received command: !${command} from user ${message.author.tag}`);

        // Check reseller account info
        const database = db.loadDb();
        const reseller = database.api_keys[apiKey];
        const isMasterAccount = db.isMaster(apiKey) || (reseller && String(reseller.owner_id) === String(config.masterAdminId));

        // Strict Owner ID Authorization Guard
        const targetOwnerId = reseller?.bot_config?.owner_id || reseller?.owner_id || config.masterAdminId;
        const authorId = String(message.author.id);

        if (targetOwnerId && targetOwnerId !== 'N/A' && targetOwnerId !== 'admin' && String(targetOwnerId) !== authorId) {
          this.addLog(apiKey, `[SECURITY] Command !${command} blocked: user ${message.author.tag} (${authorId}) does not match Owner ID (${targetOwnerId}).`);
          await message.reply(`⛔ **Access Denied:** Only the designated bot owner (<@${targetOwnerId}>) is authorized to execute commands on this bot instance.`);
          return;
        }

        // --- COMMAND HANDLERS ---

        if (command === 'help') {
          let helpMsg = `🛡️ **MANI272 Bypass Bot Manual**\n\n` +
            `• \`!add <uid> [days]\` - Whitelist a new UID node\n` +
            `• \`!remove <uid>\` - Terminate/Remove UID node\n` +
            `• \`!replace <old_uid> <new_uid>\` - Migrate UID to new node\n` +
            `• \`!info <uid>\` - Check whitelisted UID details\n` +
            `• \`!list\` - Display active whitelisted UIDs\n`;

          if (isMasterAccount) {
            helpMsg += `\n👑 **MASTER ADMIN EXCLUSIVE COMMANDS:**\n` +
              `• \`!genvoucher <coins> [days]\` - Mint a new gift voucher code\n` +
              `• \`!createreseller <user> <pass> [limit] [credits]\` - Create reseller account\n` +
              `• \`!resellers\` - View all active resellers registry\n` +
              `• \`!purgetrials\` - Purge all 1-day free trial claims\n` +
              `• \`!stats\` - View live system-wide statistics\n` +
              `• \`!testwebhook\` - Trigger live Discord Webhook ping test\n`;
          }

          await message.reply(helpMsg);

        } else if (command === 'add') {
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

          // Check reseller capacity limits
          const activeCount = Object.keys(reseller?.uids || {}).length;
          const limit = reseller?.max_uids || 9999;
          
          if (!isMasterAccount && activeCount >= limit && !reseller?.uids?.[uid]) {
            await message.reply(`❌ **Error:** Whitelisting limit reached. Your maximum capacity is **${limit}** UIDs.`);
            this.addLog(apiKey, `[WARNING] Command !add failed: Whitelist capacity limit reached (${limit}).`);
            return;
          }

          const added = db.addKeyUid(apiKey, uid, days);
          if (added) {
            await message.reply(`✅ **Successfully Whitelisted UID:** \`${uid}\` for **${days}** days.`);
            this.addLog(apiKey, `[SUCCESS] UID ${uid} registered via Discord command for ${days} days.`);
            
            db.addActivityLog(0, reseller?.owner_id || config.masterAdminId, 'ADD_UID', uid, {
              platform: 'discord_bot',
              requested_days: days,
              author_id: authorId
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

          if (!reseller?.uids?.[uid]) {
            await message.reply(`❌ **Error:** UID \`${uid}\` is not registered in your whitelist directory.`);
            return;
          }

          const freshDb = db.loadDb();
          if (freshDb.api_keys[apiKey]?.uids?.[uid]) {
            delete freshDb.api_keys[apiKey].uids[uid];
            db.saveDb(freshDb);
            
            await message.reply(`✅ **Successfully Removed UID:** \`${uid}\` from whitelist.`);
            this.addLog(apiKey, `[SUCCESS] UID ${uid} removed via Discord command.`);

            db.addActivityLog(0, reseller?.owner_id || config.masterAdminId, 'REMOVE_UID', uid, {
              platform: 'discord_bot',
              author_id: authorId
            });
          } else {
            await message.reply('❌ **Error:** Failed to remove whitelisted UID.');
          }

        } else if (command === 'replace') {
          const oldUid = args[1];
          const newUid = args[2];
          if (!oldUid || !newUid) {
            await message.reply('❌ **Usage:** `!replace <old_uid> <new_uid>`');
            return;
          }

          const replaced = db.replaceKeyUid(apiKey, oldUid, newUid);
          if (replaced) {
            await message.reply(`🔄 **Successfully Migrated UID:** \`${oldUid}\` ➔ \`${newUid}\`.`);
            this.addLog(apiKey, `[SUCCESS] Node migrated from ${oldUid} to ${newUid} via Discord command.`);

            db.addActivityLog(0, reseller?.owner_id || config.masterAdminId, 'REPLACE_UID', newUid, {
              old_uid: oldUid,
              platform: 'discord_bot'
            });
          } else {
            await message.reply(`❌ **Error:** Target UID \`${oldUid}\` was not found in your active whitelist.`);
          }

        } else if (command === 'info') {
          const uid = args[1];
          if (!uid) {
            await message.reply('❌ **Usage:** `!info <uid>`');
            return;
          }

          const uidInfo = reseller?.uids?.[uid];
          if (!uidInfo) {
            await message.reply(`❌ **Error:** UID \`${uid}\` is not whitelisted.`);
            return;
          }

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
          const uids = reseller?.uids || {};
          const list = Object.entries(uids);

          if (list.length === 0) {
            await message.reply('📋 Your whitelist registry directory is completely empty.');
            return;
          }

          const replyLines = ['📋 **Whitelisted UIDs Directory:**'];
          list.forEach(([uid, info]: any) => {
            const expDate = new Date(info.expiry.replace(' ', 'T'));
            const diff = expDate.getTime() - new Date().getTime();
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
            const validity = daysLeft <= 0 ? 'Expired' : (daysLeft >= 1000 ? 'Lifetime' : `${daysLeft}d`);
            replyLines.push(`• \`${uid}\` - Expiry: \`${validity}\` (\`${info.expiry.split(' ')[0]}\`)`);
          });

          let replyStr = replyLines.join('\n');
          if (replyStr.length > 1950) {
            replyStr = replyStr.substring(0, 1900) + '\n... (truncated list due to length limits)';
          }

          await message.reply(replyStr);

        } else if (command === 'genvoucher' || command === 'createvoucher') {
          if (!isMasterAccount) {
            await message.reply('⛔ **Access Denied:** Only Master Administrators can mint gift vouchers.');
            return;
          }

          const coinsVal = parseFloat(args[1] || '0');
          const daysVal = parseInt(args[2] || '0', 10);
          if (coinsVal <= 0 && daysVal <= 0) {
            await message.reply('❌ **Usage:** `!genvoucher <coins> [days]` (e.g. `!genvoucher 50 30`)');
            return;
          }

          const voucherCode = `GIFT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          db.createGiftVoucher(config.masterAdminId, voucherCode, coinsVal, daysVal);

          db.addActivityLog(0, config.masterAdminId, 'VOUCHER_CREATE', voucherCode, {
            platform: 'discord_bot',
            coins: coinsVal,
            bonus_days: daysVal
          });

          await message.reply(
            `🎁 **Gift Voucher Code Minted!**\n` +
            `• **Voucher Code:** \`${voucherCode}\`\n` +
            `• **Coins Value:** **${coinsVal}** Coins\n` +
            `• **Bonus Days:** **${daysVal}** Days`
          );

        } else if (command === 'createreseller') {
          if (!isMasterAccount) {
            await message.reply('⛔ **Access Denied:** Only Master Administrators can create new reseller accounts.');
            return;
          }

          const username = args[1];
          const password = args[2];
          const maxUids = parseInt(args[3] || '100', 10);
          const initialCredits = parseFloat(args[4] || '0');

          if (!username || !password) {
            await message.reply('❌ **Usage:** `!createreseller <username> <password> [max_uids] [initial_credits]`');
            return;
          }

          const cleanUserId = `user_${Date.now()}`;
          const newKey = `${config.apiKeyPrefix}_${crypto.randomBytes(16).toString('hex')}`;
          
          db.createApiKeyEntry(newKey, cleanUserId, maxUids, username, password, '');
          if (initialCredits > 0) {
            db.addCredits(cleanUserId, initialCredits);
          }

          db.addActivityLog(0, cleanUserId, 'RESELLER_CREATE', username, {
            platform: 'discord_bot',
            max_uids: maxUids,
            credits: initialCredits
          });

          await message.reply(
            `👤 **New Reseller Account Created!**\n` +
            `• **Username:** \`${username}\`\n` +
            `• **Password:** \`${password}\`\n` +
            `• **License Key:** \`${newKey}\`\n` +
            `• **Max Allocation Limit:** **${maxUids}** UIDs\n` +
            `• **Initial Credits:** **${initialCredits}** Coins`
          );

        } else if (command === 'resellers' || command === 'listresellers') {
          if (!isMasterAccount) {
            await message.reply('⛔ **Access Denied:** Only Master Administrators can view active resellers.');
            return;
          }

          const liveDb = db.loadDb();
          const list = Object.values(liveDb.api_keys || {});
          
          if (list.length === 0) {
            await message.reply('📋 Active resellers registry is currently empty.');
            return;
          }

          const replyLines = ['📋 **System Resellers Registry:**'];
          list.forEach((info: any) => {
            const coins = db.getCredits(info.owner_id);
            const activeUids = Object.keys(info.uids || {}).length;
            replyLines.push(`• **${info.username || info.owner_id}** - UIDs: \`${activeUids}/${info.max_uids || 100}\` | Credits: \`${coins.toFixed(2)}\` Coins | Status: \`${info.is_active !== false ? 'Active' : 'Suspended'}\``);
          });

          await message.reply(replyLines.join('\n'));

        } else if (command === 'purgetrials') {
          if (!isMasterAccount) {
            await message.reply('⛔ **Access Denied:** Only Master Administrators can purge trial claims.');
            return;
          }

          const claims = db.resetFreeClaimsData();
          const count = Object.keys(claims).length;

          db.addActivityLog(0, config.masterAdminId, 'RESET_CLAIMS', 'ALL_TRIAL_UIDS', {
            platform: 'discord_bot',
            count
          });

          await message.reply(`🧹 **Free Trial Claims Purged:** Successfully wiped **${count}** trial nodes from registry.`);

        } else if (command === 'stats' || command === 'systemstats') {
          if (!isMasterAccount) {
            await message.reply('⛔ **Access Denied:** Only Master Administrators can view system stats.');
            return;
          }

          const liveDb = db.loadDb();
          let systemTotalUids = 0;
          let systemActiveAdmins = Object.keys(liveDb.api_keys || {}).length;
          for (const info of Object.values(liveDb.api_keys || {})) {
            if (info.uids) systemTotalUids += Object.keys(info.uids).length;
          }

          await message.reply(
            `📊 **System Overview Statistics:**\n` +
            `• **Total Whitelisted UIDs:** \`${systemTotalUids}\`\n` +
            `• **Active Resellers:** \`${systemActiveAdmins}\`\n` +
            `• **Engine Sync:** \`STABLE • Edge Proxy Gateway\``
          );

        } else if (command === 'testwebhook') {
          if (!isMasterAccount) {
            await message.reply('⛔ **Access Denied:** Only Master Administrators can trigger webhook test pings.');
            return;
          }

          db.dispatchActionWebhook('TEST_PING', reseller?.owner_id || config.masterAdminId, 'LIVE_TEST', {
            platform: 'discord_bot_command'
          });

          await message.reply('⚡ **Live Webhook Test Dispatched!** Check your Discord webhook log channel.');
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

      // Fallback timeout resolved as failed if took longer than 7 seconds to ready
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
