import { Client, GatewayIntentBits } from 'discord.js';
import crypto from 'crypto';
import * as db from './db';
import { config } from './config';
import { sendUpstreamRequest, isUpstreamSuccess } from './upstream';

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

      client.once('ready', async () => {
        const liveDb = db.loadDb();
        const resObj = liveDb.api_keys[apiKey];
        const customName = resObj?.bot_config?.bot_name || resObj?.username || resObj?.displayName;
        const customAvatar = resObj?.bot_config?.bot_avatar || resObj?.avatar;

        if (customName && client.user) {
          client.user.setUsername(customName).catch(() => {});
        }
        if (customAvatar && client.user) {
          client.user.setAvatar(customAvatar).catch(() => {});
        }

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
        }        const createEmbed = (opts: {
          title: string;
          description?: string;
          color?: number;
          fields?: Array<{ name: string; value: string; inline?: boolean }>;
          footer?: string;
        }) => {
          return {
            embeds: [
              {
                title: opts.title,
                description: opts.description,
                color: opts.color || 0x00F2FE,
                fields: opts.fields || [],
                footer: {
                  text: opts.footer || `${reseller?.username || 'Bypass Engine'} • Whitelist Edge Sync`
                },
                timestamp: new Date().toISOString()
              }
            ]
          };
        };

        // --- COMMAND HANDLERS ---

        if (command === 'help') {
          const customBrand = reseller?.username || reseller?.displayName || 'Reseller Bypass Suite';
          const fields = [
            {
              name: '⚡ WHITELIST COMMANDS',
              value: 
                '`!add <uid> [days]` — Whitelist a game UID node\n' +
                '`!remove <uid>` — Terminate whitelisted UID node\n' +
                '`!replace <old> <new>` — Migrate UID to new node\n' +
                '`!info <uid>` — Check whitelisted UID details & source\n' +
                '`!list` — Display all active whitelisted UIDs',
              inline: false
            }
          ];

          if (isMasterAccount) {
            fields.push({
              name: '👑 MASTER ADMIN COMMANDS',
              value:
                '`!genvoucher <coins> [days]` — Mint gift voucher code\n' +
                '`!createreseller <user> <pass> [limit] [credits]` — Create reseller\n' +
                '`!resellers` — View all resellers registry\n' +
                '`!purgetrials` — Purge 1-day free trial claims\n' +
                '`!stats` — View system overview statistics\n' +
                '`!testwebhook` — Test live Discord Webhook ping',
              inline: false
            });
          }

          await message.reply(createEmbed({
            title: `🛡️ ${customBrand} Whitelist Manual`,
            description: 'Automated Whitelisting Control Suite',
            color: 0x00F2FE,
            fields
          }));

        } else if (command === 'add') {
          const uid = args[1]?.trim();
          const daysStr = args[2]?.trim();
          if (!uid) {
            await message.reply(createEmbed({
              title: '❌ Command Syntax Error',
              description: 'Usage: `!add <uid> [days]` (e.g. `!add 51240182 30`)',
              color: 0xFF3131
            }));
            return;
          }

          if (!/^\d+$/.test(uid)) {
            await message.reply(createEmbed({
              title: '❌ Invalid UID Format',
              description: 'UID must contain numeric digits only.',
              color: 0xFF3131
            }));
            return;
          }

          const days = daysStr ? parseInt(daysStr, 10) : 30;
          if (isNaN(days) || days <= 0) {
            await message.reply(createEmbed({
              title: '❌ Invalid Duration',
              description: 'Expiration days must be a valid positive number.',
              color: 0xFF3131
            }));
            return;
          }

          const freshDb = db.loadDb();
          const currentReseller = freshDb.api_keys[apiKey] || reseller;
          const activeCount = Object.keys(currentReseller?.uids || {}).length;
          const limit = currentReseller?.max_uids || 9999;
          
          if (!isMasterAccount && activeCount >= limit && !currentReseller?.uids?.[uid]) {
            await message.reply(createEmbed({
              title: '❌ Quota Limit Exceeded',
              description: `Your whitelist capacity limit of **${limit}** UIDs has been reached. Contact admin for upgrade.`,
              color: 0xFF3131
            }));
            this.addLog(apiKey, `[WARNING] Command !add failed: Whitelist capacity limit reached (${limit}).`);
            return;
          }

          // Check credit balance for reseller
          const costs: Record<number, number> = { 1: 0.50, 7: 2.40, 15: 3.40, 30: 5.30, 36500: 50.00 };
          const cost = costs[days] || (days * 0.50);

          if (!isMasterAccount && currentReseller) {
            const balance = db.getCredits(currentReseller.owner_id);
            if (balance < cost) {
              await message.reply(createEmbed({
                title: '❌ Insufficient Credits Balance',
                description: `Required: **${cost.toFixed(2)}** coins | Available: **${balance.toFixed(2)}** coins. Please recharge credits.`,
                color: 0xFF3131
              }));
              this.addLog(apiKey, `[WARNING] Command !add failed: Insufficient balance (${balance.toFixed(2)} < ${cost.toFixed(2)}).`);
              return;
            }
          }

          // Forward to GDCC Upstream API
          const isPhpApi = config.baseUrl.includes('api_user.php');
          const pathSuffix = isPhpApi ? '?action=add' : '/add';
          const payload = isPhpApi 
            ? { account_id: parseInt(uid, 10), for_days: days }
            : { uid, days, name: `DiscordBotNode_${uid}` };

          this.addLog(apiKey, `[API] Dispatching upstream request to GDCC API for UID ${uid}...`);
          const upstream = await sendUpstreamRequest('POST', pathSuffix, payload);
          const isSuccess = isUpstreamSuccess(upstream);

          if (isSuccess) {
            if (!isMasterAccount && currentReseller) {
              db.removeCredits(currentReseller.owner_id, cost);
            }
            db.incrementApiUsage(apiKey);
            db.addKeyUid(apiKey, uid, days, 'DISCORD_BOT');

            const expDate = new Date();
            expDate.setDate(expDate.getDate() + days);
            
            await message.reply(createEmbed({
              title: '✅ UID Whitelisted & Patched Upstream',
              color: 0x00FF88,
              fields: [
                { name: 'Target Game UID', value: `\`${uid}\``, inline: true },
                { name: 'Duration Allocated', value: `**${days}** Days`, inline: true },
                { name: 'Source', value: '🤖 Discord Bot', inline: true },
                { name: 'Expires On', value: `\`${expDate.toISOString().split('T')[0]}\``, inline: true },
                { name: 'GDCC API Status', value: '🟢 Synchronized', inline: true }
              ]
            }));
            this.addLog(apiKey, `[SUCCESS] UID ${uid} whitelisted in DB & GDCC API for ${days} days.`);
            
            db.addActivityLog(0, currentReseller?.owner_id || config.masterAdminId, 'ADD_UID', uid, {
              platform: 'discord_bot',
              requested_days: days,
              author_id: authorId
            });
          } else {
            const errorMsg = upstream.data?.error || upstream.data?.message || 'Upstream GDCC API server error occurred.';
            await message.reply(createEmbed({
              title: '❌ GDCC API Whitelisting Failed',
              description: `Upstream error: ${errorMsg}`,
              color: 0xFF3131
            }));
            this.addLog(apiKey, `[ERROR] Command !add failed upstream for UID ${uid}: ${errorMsg}`);
          }

        } else if (command === 'remove') {
          const uid = args[1]?.trim();
          if (!uid) {
            await message.reply(createEmbed({
              title: '❌ Command Syntax Error',
              description: 'Usage: `!remove <uid>` (e.g. `!remove 51240182`)',
              color: 0xFF3131
            }));
            return;
          }

          const freshDb = db.loadDb();
          const currentReseller = freshDb.api_keys[apiKey] || reseller;

          // Main Admin has permission to delete ANY UID across all resellers
          // Regular reseller can only delete UIDs in their active whitelist
          let hasPermission = isMasterAccount;
          if (!hasPermission && currentReseller?.uids?.[uid]) {
            hasPermission = true;
          }

          if (!hasPermission) {
            await message.reply(createEmbed({
              title: '❌ Access Denied / UID Not Found',
              description: `Target UID \`${uid}\` is not registered in your active whitelist.`,
              color: 0xFF3131
            }));
            return;
          }

          // Forward to GDCC Upstream API
          const isPhpApi = config.baseUrl.includes('api_user.php');
          const pathSuffix = isPhpApi ? '?action=remove' : '/remove';
          const payload = isPhpApi ? { account_id: parseInt(uid, 10) } : { uid };

          this.addLog(apiKey, `[API] Dispatching upstream removal request to GDCC API for UID ${uid}...`);
          const upstream = await sendUpstreamRequest('POST', pathSuffix, payload);
          const isSuccess = isUpstreamSuccess(upstream);

          if (isSuccess) {
            db.incrementApiUsage(apiKey);

            if (isMasterAccount) {
              db.removeUidGlobally(uid);
            } else {
              db.removeKeyUid(apiKey, uid);
            }
            
            await message.reply(createEmbed({
              title: '🗑️ UID Terminated & Removed Upstream',
              color: 0xFF3131,
              fields: [
                { name: 'Target UID', value: `\`${uid}\``, inline: true },
                { name: 'Action', value: 'Whitelist Terminated', inline: true },
                { name: 'Operator', value: `<@${authorId}>`, inline: true },
                { name: 'GDCC API Status', value: '🔴 Purged', inline: true }
              ]
            }));
            this.addLog(apiKey, `[SUCCESS] UID ${uid} removed from DB & GDCC API.`);

            db.addActivityLog(0, currentReseller?.owner_id || config.masterAdminId, 'REMOVE_UID', uid, {
              platform: 'discord_bot',
              author_id: authorId
            });
          } else {
            const errorMsg = upstream.data?.error || upstream.data?.message || 'Upstream GDCC API server error occurred.';
            await message.reply(createEmbed({
              title: '❌ GDCC API Removal Failed',
              description: `Upstream error: ${errorMsg}`,
              color: 0xFF3131
            }));
            this.addLog(apiKey, `[ERROR] Command !remove failed upstream for UID ${uid}: ${errorMsg}`);
          }

        } else if (command === 'replace') {
          const oldUid = args[1]?.trim();
          const newUid = args[2]?.trim();
          if (!oldUid || !newUid) {
            await message.reply(createEmbed({
              title: '❌ Command Syntax Error',
              description: 'Usage: `!replace <old_uid> <new_uid>`',
              color: 0xFF3131
            }));
            return;
          }

          if (!/^\d+$/.test(newUid)) {
            await message.reply(createEmbed({
              title: '❌ Invalid New UID Format',
              description: 'New UID must contain numeric digits only.',
              color: 0xFF3131
            }));
            return;
          }

          const freshDb = db.loadDb();
          const currentReseller = freshDb.api_keys[apiKey] || reseller;

          let hasPermission = isMasterAccount;
          if (!hasPermission && currentReseller?.uids?.[oldUid]) {
            hasPermission = true;
          }

          if (!hasPermission) {
            await message.reply(createEmbed({
              title: '❌ Access Denied / Old UID Not Found',
              description: `Old UID \`${oldUid}\` is not registered in your active whitelist.`,
              color: 0xFF3131
            }));
            return;
          }

          // Forward to GDCC Upstream API
          const isPhpApi = config.baseUrl.includes('api_user.php');
          const pathSuffix = isPhpApi ? '?action=change_uid' : '/replace';
          const payload = isPhpApi 
            ? { old_uid: parseInt(oldUid, 10), new_uid: parseInt(newUid, 10) }
            : { old_uid: oldUid, new_uid: newUid };

          this.addLog(apiKey, `[API] Dispatching upstream migration request to GDCC API (${oldUid} -> ${newUid})...`);
          const upstream = await sendUpstreamRequest('POST', pathSuffix, payload);
          const isSuccess = isUpstreamSuccess(upstream);

          if (isSuccess) {
            db.incrementApiUsage(apiKey);
            db.replaceKeyUid(apiKey, oldUid, newUid);

            await message.reply(createEmbed({
              title: '🔄 UID Node Migrated & Patched Upstream',
              color: 0x00FF88,
              fields: [
                { name: 'Original UID', value: `\`${oldUid}\``, inline: true },
                { name: 'New Target UID', value: `\`${newUid}\``, inline: true },
                { name: 'GDCC API Status', value: '🟢 Migrated', inline: true }
              ]
            }));
            this.addLog(apiKey, `[SUCCESS] Node migrated from ${oldUid} to ${newUid} in DB & GDCC API.`);

            db.addActivityLog(0, currentReseller?.owner_id || config.masterAdminId, 'REPLACE_UID', newUid, {
              old_uid: oldUid,
              platform: 'discord_bot'
            });
          } else {
            const errorMsg = upstream.data?.error || upstream.data?.message || 'Upstream GDCC API server error occurred.';
            await message.reply(createEmbed({
              title: '❌ GDCC API Migration Failed',
              description: `Upstream error: ${errorMsg}`,
              color: 0xFF3131
            }));
            this.addLog(apiKey, `[ERROR] Command !replace failed upstream for UID ${oldUid}: ${errorMsg}`);
          }

        } else if (command === 'info') {
          const uid = args[1];
          if (!uid) {
            await message.reply(createEmbed({
              title: '❌ Command Syntax Error',
              description: 'Usage: `!info <uid>`',
              color: 0xFF3131
            }));
            return;
          }

          const uidInfo = reseller?.uids?.[uid];
          if (!uidInfo) {
            await message.reply(createEmbed({
              title: '❌ UID Not Whitelisted',
              description: `Target UID \`${uid}\` is not registered.`,
              color: 0xFF3131
            }));
            return;
          }

          const expDate = new Date(uidInfo.expiry.replace(' ', 'T'));
          const diff = expDate.getTime() - new Date().getTime();
          const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
          const validity = daysLeft <= 0 ? 'Expired' : (daysLeft >= 1000 ? 'Lifetime' : `${daysLeft} Days`);

          const sourceTag = uidInfo.source === 'DISCORD_BOT' ? '🤖 Discord Bot' :
            uidInfo.source === 'FREE_PORTAL' ? '🎁 Free Portal' :
            uidInfo.source === 'ADMIN_PANEL' ? '⚡ Admin Panel' : '🌐 Web API';

          await message.reply(createEmbed({
            title: `ℹ️ UID Node Details: ${uid}`,
            color: 0x00F2FE,
            fields: [
              { name: 'Target UID', value: `\`${uid}\``, inline: true },
              { name: 'Source', value: sourceTag, inline: true },
              { name: 'Remaining Validity', value: `**${validity}**`, inline: true },
              { name: 'Registered Date', value: `\`${uidInfo.added_on}\``, inline: true },
              { name: 'Expiration Date', value: `\`${uidInfo.expiry}\``, inline: true }
            ]
          }));

        } else if (command === 'list') {
          const uids = reseller?.uids || {};
          const list = Object.entries(uids);

          if (list.length === 0) {
            await message.reply(createEmbed({
              title: '📋 Whitelist Directory Empty',
              description: 'No UIDs are currently registered in your account.',
              color: 0x00F2FE
            }));
            return;
          }

          const lines = list.map(([uid, info]: any) => {
            const expDate = new Date(info.expiry.replace(' ', 'T'));
            const diff = expDate.getTime() - new Date().getTime();
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
            const validity = daysLeft <= 0 ? 'Expired' : (daysLeft >= 1000 ? 'Lifetime' : `${daysLeft}d`);
            const sBadge = info.source === 'DISCORD_BOT' ? '🤖 Bot' : info.source === 'FREE_PORTAL' ? '🎁 Portal' : info.source === 'ADMIN_PANEL' ? '⚡ Admin' : '🌐 API';
            return `\`${uid}\` • ${validity} • ${sBadge}`;
          });

          let desc = lines.join('\n');
          if (desc.length > 3900) {
            desc = desc.substring(0, 3850) + '\n... (truncated list due to length limits)';
          }

          await message.reply(createEmbed({
            title: `📋 Whitelisted UIDs Registry (${list.length})`,
            description: desc,
            color: 0x00F2FE
          }));

        } else if (command === 'genvoucher' || command === 'createvoucher') {
          if (!isMasterAccount) {
            await message.reply(createEmbed({
              title: '⛔ Access Denied',
              description: 'Only Master Administrators can mint gift vouchers.',
              color: 0xFF3131
            }));
            return;
          }

          const coinsVal = parseFloat(args[1] || '0');
          const daysVal = parseInt(args[2] || '0', 10);
          if (coinsVal <= 0 && daysVal <= 0) {
            await message.reply(createEmbed({
              title: '❌ Command Syntax Error',
              description: 'Usage: `!genvoucher <coins> [days]` (e.g. `!genvoucher 50 30`)',
              color: 0xFF3131
            }));
            return;
          }

          const voucherCode = `GIFT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          db.createGiftVoucher(config.masterAdminId, voucherCode, coinsVal, daysVal);

          db.addActivityLog(0, config.masterAdminId, 'VOUCHER_CREATE', voucherCode, {
            platform: 'discord_bot',
            coins: coinsVal,
            bonus_days: daysVal
          });

          await message.reply(createEmbed({
            title: '🎁 Gift Voucher Minted',
            color: 0x00FF88,
            fields: [
              { name: 'Voucher Code', value: `\`${voucherCode}\``, inline: false },
              { name: 'Coins Value', value: `**${coinsVal}** Coins`, inline: true },
              { name: 'Bonus Days', value: `**${daysVal}** Days`, inline: true }
            ]
          }));

        } else if (command === 'createreseller') {
          if (!isMasterAccount) {
            await message.reply(createEmbed({
              title: '⛔ Access Denied',
              description: 'Only Master Administrators can create reseller accounts.',
              color: 0xFF3131
            }));
            return;
          }

          const username = args[1];
          const password = args[2];
          const maxUids = parseInt(args[3] || '100', 10);
          const initialCredits = parseFloat(args[4] || '0');

          if (!username || !password) {
            await message.reply(createEmbed({
              title: '❌ Command Syntax Error',
              description: 'Usage: `!createreseller <user> <pass> [max_uids] [initial_credits]`',
              color: 0xFF3131
            }));
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

          await message.reply(createEmbed({
            title: '👤 Reseller Account Created',
            color: 0x00FF88,
            fields: [
              { name: 'Username', value: `\`${username}\``, inline: true },
              { name: 'Password', value: `\`${password}\``, inline: true },
              { name: 'License Key', value: `\`${newKey}\``, inline: false },
              { name: 'UID Capacity Limit', value: `**${maxUids}** UIDs`, inline: true },
              { name: 'Initial Credits', value: `**${initialCredits}** Coins`, inline: true }
            ]
          }));

        } else if (command === 'resellers' || command === 'listresellers') {
          if (!isMasterAccount) {
            await message.reply(createEmbed({
              title: '⛔ Access Denied',
              description: 'Only Master Administrators can view active resellers.',
              color: 0xFF3131
            }));
            return;
          }

          const liveDb = db.loadDb();
          const list = Object.values(liveDb.api_keys || {});
          
          if (list.length === 0) {
            await message.reply(createEmbed({
              title: '📋 System Resellers Registry Empty',
              description: 'No reseller accounts registered.',
              color: 0x00F2FE
            }));
            return;
          }

          const fields = list.map((info: any) => {
            const coins = db.getCredits(info.owner_id);
            const activeUids = Object.keys(info.uids || {}).length;
            return {
              name: `👤 ${info.username || info.owner_id}`,
              value: `UIDs: \`${activeUids}/${info.max_uids || 100}\` | Credits: \`${coins.toFixed(2)}\` | Status: \`${info.is_active !== false ? 'Active' : 'Suspended'}\``,
              inline: false
            };
          });

          await message.reply(createEmbed({
            title: `📋 System Resellers Registry (${list.length})`,
            color: 0x00F2FE,
            fields
          }));

        } else if (command === 'purgetrials') {
          if (!isMasterAccount) {
            await message.reply(createEmbed({
              title: '⛔ Access Denied',
              description: 'Only Master Administrators can purge trial claims.',
              color: 0xFF3131
            }));
            return;
          }

          const claims = db.resetFreeClaimsData();
          const count = Object.keys(claims).length;

          db.addActivityLog(0, config.masterAdminId, 'RESET_CLAIMS', 'ALL_TRIAL_UIDS', {
            platform: 'discord_bot',
            count
          });

          await message.reply(createEmbed({
            title: '🧹 Free Trial Claims Purged',
            description: `Successfully wiped **${count}** trial nodes from system memory registry.`,
            color: 0xFF3131
          }));

        } else if (command === 'stats' || command === 'systemstats') {
          if (!isMasterAccount) {
            await message.reply(createEmbed({
              title: '⛔ Access Denied',
              description: 'Only Master Administrators can view system stats.',
              color: 0xFF3131
            }));
            return;
          }

          const liveDb = db.loadDb();
          let systemTotalUids = 0;
          let systemActiveAdmins = Object.keys(liveDb.api_keys || {}).length;
          for (const info of Object.values(liveDb.api_keys || {})) {
            if (info.uids) systemTotalUids += Object.keys(info.uids).length;
          }

          await message.reply(createEmbed({
            title: '📊 System Overview Statistics',
            color: 0x00F2FE,
            fields: [
              { name: 'Total Whitelisted UIDs', value: `\`${systemTotalUids}\``, inline: true },
              { name: 'Active Resellers', value: `\`${systemActiveAdmins}\``, inline: true },
              { name: 'Engine Sync', value: '`STABLE • Edge Proxy`', inline: true }
            ]
          }));

        } else if (command === 'testwebhook') {
          if (!isMasterAccount) {
            await message.reply(createEmbed({
              title: '⛔ Access Denied',
              description: 'Only Master Administrators can trigger webhook test pings.',
              color: 0xFF3131
            }));
            return;
          }

          db.dispatchActionWebhook('TEST_PING', reseller?.owner_id || config.masterAdminId, 'LIVE_TEST', {
            platform: 'discord_bot_command'
          });

          await message.reply(createEmbed({
            title: '⚡ Live Webhook Test Dispatched',
            description: 'A test ping embed has been dispatched to your configured Discord Webhook URL.',
            color: 0x9B51E0
          }));
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
