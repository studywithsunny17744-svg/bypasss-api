import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from './config';

export interface UidInfo {
  added_on: string;
  days: number;
  expiry: string;
}

export interface BotConfig {
  token: string;
  guild_id: string;
  channel_id: string;
  is_active: boolean;
  suspended_reason?: string;
  owner_id?: string;
  bot_name?: string;
  bot_avatar?: string;
}

export interface ApiKeyInfo {
  owner_id: string | number;
  created_at: string;
  requests_count?: number;
  is_active?: boolean;
  max_uids?: number;
  uids?: Record<string, UidInfo>;
  username?: string;
  password?: string;
  displayName?: string;
  avatar?: string;
  bot_config?: BotConfig;
  expiry?: string;
}

export interface ActivityLog {
  timestamp: string;
  guild_id: string | number;
  user_id: string | number;
  action: string;
  uid: string;
  details?: Record<string, any>;
}

export function isMaster(key: string): boolean {
  return key === config.masterApiKey;
}

export interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  sent_at: string;
  user_id: string;
}

export interface FreePortal {
  id: string;
  owner_id: string;
  api_key: string;
  title: string;
  days: number;
  max_claims: number;
  claimed_ips: Record<string, { uid: string; claimed_at: string }>;
  claimed_uids: Record<string, { ip: string; claimed_at: string }>;
  created_at: string;
  is_active: boolean;
}

export interface DatabaseSchema {
  resellers: (string | number)[];
  whitelisted_channels: (string | number)[];
  free_channels: (string | number)[];
  free_claims: Record<string, string>;
  reseller_credits: Record<string, number>;
  reselling_admins: (string | number)[];
  blocked_guilds: (string | number)[];
  api_keys: Record<string, ApiKeyInfo>;
  activity_logs: ActivityLog[];
  user_languages: Record<string, string>;
  vouchers?: Record<string, any>;
  lockdown?: { active: boolean; reason: string };
  user_names_cache?: Record<string, string>;
  chat_messages?: ChatMessage[];
  free_portals?: Record<string, FreePortal>;
}

const defaultDb = (): DatabaseSchema => ({
  resellers: [],
  whitelisted_channels: [],
  free_channels: [],
  free_claims: {},
  reseller_credits: {},
  reselling_admins: [],
  blocked_guilds: [],
  api_keys: {},
  activity_logs: [],
  user_languages: {},
  chat_messages: []
});

export function loadDb(): DatabaseSchema {
  try {
    let rawData: any = {};
    let shouldSave = false;
    if (!fs.existsSync(config.dbPath)) {
      rawData = defaultDb();
      shouldSave = true;
    } else {
      const raw = fs.readFileSync(config.dbPath, 'utf8');
      rawData = JSON.parse(raw);
    }
    
    // Normalize data structures
    const base = defaultDb();
    const db = { ...base, ...rawData };

    if (config.masterApiKey) {
      if (!db.api_keys) {
        db.api_keys = {};
        shouldSave = true;
      }
      if (!db.api_keys[config.masterApiKey]) {
        db.api_keys[config.masterApiKey] = {
          owner_id: config.masterAdminId,
          created_at: new Date().toISOString(),
          requests_count: 0,
          is_active: true,
          max_uids: 99999,
          uids: {},
          username: 'admin',
          displayName: 'Master Administrator'
        };
        shouldSave = true;
      }
    }

    if (shouldSave) {
      fs.writeFileSync(config.dbPath, JSON.stringify(db, null, 4), 'utf8');
    }

    return db;
  } catch (err) {
    console.error('Error reading/parsing database.json:', err);
    return defaultDb();
  }
}

export function saveDb(data: DatabaseSchema): void {
  try {
    const tempFile = `${config.dbPath}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 4), 'utf8');
    fs.renameSync(tempFile, config.dbPath);
  } catch (err) {
    console.error('Error writing database.json:', err);
  }
}

// Reseller & Key Authentication Logic
export function getApiKeys(): Record<string, ApiKeyInfo> {
  return loadDb().api_keys || {};
}

export function getApiKeyInfo(key: string): ApiKeyInfo | null {
  const keys = getApiKeys();
  return keys[key] || null;
}

export function incrementApiUsage(key: string): void {
  const db = loadDb();
  if (db.api_keys && db.api_keys[key]) {
    db.api_keys[key].requests_count = (db.api_keys[key].requests_count || 0) + 1;
    saveDb(db);
  }
}

export function addKeyUid(key: string, uid: string, days: number): boolean {
  const db = loadDb();
  if (db.api_keys && db.api_keys[key]) {
    const info = db.api_keys[key];
    if (!info.uids) {
      info.uids = {};
    }
    
    const addedOn = new Date();
    const expiry = new Date();
    expiry.setDate(addedOn.getDate() + days);
    
    const formatDate = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    info.uids[uid] = {
      added_on: formatDate(addedOn),
      days: days,
      expiry: formatDate(expiry)
    };
    
    saveDb(db);
    return true;
  }
  return false;
}

export function removeKeyUid(key: string, uid: string): boolean {
  const db = loadDb();
  if (db.api_keys && db.api_keys[key]) {
    const info = db.api_keys[key];
    if (info.uids && info.uids[uid]) {
      delete info.uids[uid];
      saveDb(db);
      return true;
    }
  }
  return false;
}

export function replaceKeyUid(key: string, oldUid: string, newUid: string): boolean {
  const db = loadDb();
  if (db.api_keys && db.api_keys[key]) {
    const info = db.api_keys[key];
    if (info.uids && info.uids[oldUid]) {
      const oldInfo = info.uids[oldUid];
      delete info.uids[oldUid];
      
      const addedOn = new Date();
      const expiry = new Date();
      expiry.setDate(addedOn.getDate() + (oldInfo.days || 30));
      
      const formatDate = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };
      
      info.uids[newUid] = {
        added_on: formatDate(addedOn),
        days: oldInfo.days || 30,
        expiry: formatDate(expiry)
      };
      
      saveDb(db);
      return true;
    }
  }
  return false;
}

// Activity Auditing Logs
export function dispatchActionWebhook(
  action: string,
  userId: string | number,
  uid: string,
  details: Record<string, any> = {}
): void {
  const webhookUrl = process.env.LOG_WEBHOOK_URL || '';
  if (!webhookUrl) return;

  const actUpper = (action || '').toUpperCase();
  let title = '📝 System Activity Logged';
  let color = 3447003; // Blue #3498db

  if (actUpper.includes('ADD') || actUpper.includes('CLAIM')) {
    title = '🟢 UID Whitelisted / Added';
    color = 65416; // Green #00FF88
  } else if (actUpper.includes('REMOVE') || actUpper.includes('PURGE')) {
    title = '🔴 UID Purged / Removed';
    color = 16724785; // Red #FF3131
  } else if (actUpper.includes('REPLACE') || actUpper.includes('MIGRATE')) {
    title = '🔄 UID Migrated / Replaced';
    color = 10179040; // Purple #9B51E0
  } else if (actUpper.includes('VOUCHER_CREATE')) {
    title = '🎁 Gift Voucher Minted';
    color = 15570240; // Gold
  } else if (actUpper.includes('VOUCHER_REDEEM')) {
    title = '💳 Gift Voucher Redeemed';
    color = 65416; // Green
  } else if (actUpper.includes('RESELLER_CREATE')) {
    title = '👤 New Reseller Account Created';
    color = 65534; // Cyan
  } else if (actUpper.includes('RESELLER_UPDATE') || actUpper.includes('RESELLER_TOGGLE')) {
    title = '⚙️ Reseller Account Modified';
    color = 3447003; // Blue
  } else if (actUpper.includes('RESELLER_DELETE')) {
    title = '🗑️ Reseller Account Wiped';
    color = 16724785; // Red
  } else if (actUpper.includes('LOGIN')) {
    title = '🔐 User Session Authenticated';
    color = 65534; // Cyan
  } else if (actUpper.includes('BOT')) {
    title = '🤖 Discord Bot Action';
    color = 10179040; // Purple
  }

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: 'Action Type', value: `\`${action}\``, inline: true },
    { name: 'User / Reseller', value: `\`${userId}\``, inline: true }
  ];

  if (uid && uid !== 'SYSTEM' && uid !== 'N/A') {
    fields.push({ name: 'Target UID', value: `\`${uid}\``, inline: true });
  }

  for (const [key, val] of Object.entries(details)) {
    if (val !== undefined && val !== null && key !== 'key' && key !== 'api_key_used') {
      fields.push({ name: key.replace(/_/g, ' ').toUpperCase(), value: String(val), inline: true });
    }
  }

  fields.push({ name: 'Timestamp', value: new Date().toLocaleString(), inline: false });

  const payload = {
    content: `⚡ **MANI272 Bypass Gateway Audit Log**`,
    embeds: [
      {
        title,
        color,
        fields,
        footer: { text: 'MANI272 Command Suite • Real-time Webhook Diagnostics' }
      }
    ]
  };

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

export function addActivityLog(
  guildId: string | number,
  userId: string | number,
  action: string,
  uid: string,
  details: Record<string, any> = {}
): void {
  const db = loadDb();
  if (!db.activity_logs) {
    db.activity_logs = [];
  }
  
  const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  const entry: ActivityLog = {
    timestamp: formatDate(new Date()),
    guild_id: guildId,
    user_id: userId,
    action,
    uid,
    details
  };
  
  db.activity_logs.push(entry);
  if (db.activity_logs.length > 1000) {
    db.activity_logs = db.activity_logs.slice(-1000);
  }
  
  saveDb(db);

  // Dispatch live Webhook audit log
  dispatchActionWebhook(action, userId, uid, details);
}

// Credits Coin Purse
export function getCredits(userId: string | number): number {
  const db = loadDb();
  const strId = String(userId);
  return Number(db.reseller_credits?.[strId] || 0);
}

export function addCredits(userId: string | number, amount: number): number {
  const db = loadDb();
  const strId = String(userId);
  if (!db.reseller_credits) {
    db.reseller_credits = {};
  }
  const current = Number(db.reseller_credits[strId] || 0);
  db.reseller_credits[strId] = current + amount;
  saveDb(db);
  return db.reseller_credits[strId];
}

export function removeCredits(userId: string | number, amount: number): boolean {
  const current = getCredits(userId);
  if (current < amount) return false;
  addCredits(userId, -amount);
  return true;
}

// Vouchers Generation Vault
export function createGiftVoucher(creatorId: string | number, code: string, amount: number, days: number): boolean {
  const db = loadDb();
  if (!db.vouchers) {
    db.vouchers = {};
  }
  
  const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  db.vouchers[code] = {
    creator_id: creatorId,
    amount,
    days,
    claimed: false,
    claimed_by: null,
    created_at: formatDate(new Date())
  };
  saveDb(db);
  return true;
}

export function claimGiftVoucher(userId: string | number, code: string): { success: boolean; message?: string; amount?: number; days?: number } {
  const db = loadDb();
  const vouchers = db.vouchers || {};
  const upperCode = code.trim().toUpperCase();
  
  if (!vouchers[upperCode]) {
    return { success: false, message: 'Invalid or expired voucher code.' };
  }
  
  const vData = vouchers[upperCode];
  if (vData.claimed) {
    return { success: false, message: 'This voucher has already been claimed.' };
  }
  
  vData.claimed = true;
  vData.claimed_by = userId;
  
  const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  vData.claimed_at = formatDate(new Date());
  
  const amount = Number(vData.amount || 0);
  if (amount > 0) {
    if (!db.reseller_credits) {
      db.reseller_credits = {};
    }
    const current = Number(db.reseller_credits[String(userId)] || 0);
    db.reseller_credits[String(userId)] = current + amount;
  }
  
  saveDb(db);
  return { success: true, amount, days: vData.days || 0 };
}

// Master Admin & Reseller Free Portal Trial System
export function createFreePortal(
  apiKey: string,
  ownerId: string,
  title: string,
  days: number = 1,
  maxClaims: number = 0
): FreePortal {
  const db = loadDb();
  if (!db.free_portals) db.free_portals = {};

  const portalId = `portal_${crypto.randomBytes(4).toString('hex')}`;
  const portal: FreePortal = {
    id: portalId,
    owner_id: String(ownerId),
    api_key: apiKey,
    title: title.trim() || 'Complimentary Free Trial Bypass Portal',
    days: days > 0 ? days : 1,
    max_claims: maxClaims >= 0 ? maxClaims : 0,
    claimed_ips: {},
    claimed_uids: {},
    created_at: new Date().toLocaleString(),
    is_active: true
  };

  db.free_portals[portalId] = portal;
  saveDb(db);
  return portal;
}

export function getFreePortal(portalId: string): FreePortal | null {
  const db = loadDb();
  return db.free_portals?.[portalId] || null;
}

export function claimFreePortalUid(
  portalId: string,
  ip: string,
  uid: string
): { success: boolean; message: string } {
  const db = loadDb();
  if (!db.free_portals || !db.free_portals[portalId]) {
    return { success: false, message: 'Free trial portal not found or invalid.' };
  }

  const portal = db.free_portals[portalId];
  if (!portal.is_active) {
    return { success: false, message: 'This free trial portal is currently disabled.' };
  }

  const cleanIp = ip.split(',')[0].trim();

  if (portal.claimed_ips && portal.claimed_ips[cleanIp]) {
    const existing = portal.claimed_ips[cleanIp];
    return {
      success: false,
      message: `Your IP address has already claimed a trial UID (${existing.uid}). Only 1 claim allowed per IP.`
    };
  }

  const totalClaims = Object.keys(portal.claimed_ips || {}).length;
  if (portal.max_claims > 0 && totalClaims >= portal.max_claims) {
    return { success: false, message: 'This free trial portal has reached its maximum claim capacity.' };
  }

  // Whitelist the UID under the reseller's API key
  const added = addKeyUid(portal.api_key, uid, portal.days);
  if (!added) {
    return { success: false, message: 'Failed to record UID to whitelisting engine.' };
  }

  const timestamp = new Date().toLocaleString();
  if (!portal.claimed_ips) portal.claimed_ips = {};
  if (!portal.claimed_uids) portal.claimed_uids = {};

  portal.claimed_ips[cleanIp] = { uid, claimed_at: timestamp };
  portal.claimed_uids[uid] = { ip: cleanIp, claimed_at: timestamp };

  saveDb(db);

  addActivityLog(0, portal.owner_id, 'FREE_CLAIM', uid, {
    portal_id: portalId,
    ip: cleanIp,
    days: portal.days
  });

  return { success: true, message: `Successfully whitelisted UID ${uid} for ${portal.days} day(s)!` };
}

export function resetFreePortalClaims(
  portalId: string,
  ownerId?: string
): { success: boolean; count: number } {
  const db = loadDb();
  if (!db.free_portals || !db.free_portals[portalId]) {
    return { success: false, count: 0 };
  }

  const portal = db.free_portals[portalId];
  if (ownerId && ownerId !== config.masterAdminId && String(portal.owner_id) !== String(ownerId)) {
    return { success: false, count: 0 };
  }

  const uidsToRemove = Object.keys(portal.claimed_uids || {});
  const count = uidsToRemove.length;

  // Remove UIDs from reseller's key
  if (db.api_keys && db.api_keys[portal.api_key] && db.api_keys[portal.api_key].uids) {
    uidsToRemove.forEach(uid => {
      delete db.api_keys[portal.api_key].uids![uid];
    });
  }

  // Clear portal IP & UID locks
  portal.claimed_ips = {};
  portal.claimed_uids = {};

  saveDb(db);
  return { success: true, count };
}

export function deleteFreePortal(portalId: string, ownerId?: string): boolean {
  const db = loadDb();
  if (!db.free_portals || !db.free_portals[portalId]) return false;

  const portal = db.free_portals[portalId];
  if (ownerId && ownerId !== config.masterAdminId && String(portal.owner_id) !== String(ownerId)) {
    return false;
  }

  delete db.free_portals[portalId];
  saveDb(db);
  return true;
}

// Master Admin panel controls
export function resetFreeClaimsData(): Record<string, string> {
  const db = loadDb();
  const claims = db.free_claims || {};
  db.free_claims = {};
  saveDb(db);
  return claims;
}

export function updateEnvVariable(varName: string, value: string): boolean {
  process.env[varName] = value;
  try {
    let lines: string[] = [];
    if (fs.existsSync(config.envPath)) {
      const raw = fs.readFileSync(config.envPath, 'utf8');
      lines = raw.split(/\r?\n/);
    }
    let found = false;
    const newLines = lines.map(line => {
      if (line.trim().startsWith(`${varName}=`)) {
        found = true;
        return `${varName}=${value}`;
      }
      return line;
    });
    
    if (!found) {
      newLines.push(`${varName}=${value}`);
    }
    
    fs.writeFileSync(config.envPath, newLines.join('\n'), 'utf8');
    return true;
  } catch (err) {
    console.error(`Failed to write env variable ${varName} to disk:`, err);
    return true; // Still true because in-memory process.env was updated
  }
}

export function createApiKeyEntry(
  newKey: string, 
  ownerId: string | number, 
  maxUids: number = 100,
  username?: string,
  password?: string,
  expiry?: string
): void {
  const db = loadDb();
  if (!db.api_keys) {
    db.api_keys = {};
  }
  
  const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  db.api_keys[newKey] = {
    owner_id: ownerId,
    created_at: formatDate(new Date()),
    requests_count: 0,
    is_active: true,
    max_uids: maxUids,
    uids: {},
    username: username || '',
    password: password || '',
    expiry: expiry || ''
  };
  
  saveDb(db);
}

export function updateKeyMaxUids(apiKey: string, maxUids: number): boolean {
  const db = loadDb();
  if (db.api_keys && db.api_keys[apiKey]) {
    db.api_keys[apiKey].max_uids = maxUids;
    saveDb(db);
    return true;
  }
  return false;
}

export function toggleKeyStatus(apiKey: string): boolean {
  const db = loadDb();
  if (db.api_keys && db.api_keys[apiKey]) {
    const current = db.api_keys[apiKey].is_active !== false;
    db.api_keys[apiKey].is_active = !current;
    saveDb(db);
    return !current;
  }
  return false;
}

export function deleteApiKey(apiKey: string): boolean {
  const db = loadDb();
  if (db.api_keys && db.api_keys[apiKey]) {
    delete db.api_keys[apiKey];
    saveDb(db);
    return true;
  }
  return false;
}

// Persistent Chat Helper Functions
export function getChatMessages(): ChatMessage[] {
  const db = loadDb();
  const messages = db.chat_messages || [];
  
  // Seed with default instructions if completely empty
  if (messages.length === 0) {
    const formatDate = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    return [
      {
        id: 1,
        sender: 'Support Bot',
        text: 'Welcome to the Team Chat! Type below to ask support or coordinate with admins.',
        sent_at: formatDate(new Date(Date.now() - 3600000)),
        user_id: 'system'
      },
      {
        id: 2,
        sender: 'Admin Mani',
        text: 'All bypass servers are running operational on Azion Cloud Edge nodes. Upstream speeds optimized.',
        sent_at: formatDate(new Date(Date.now() - 1800000)),
        user_id: '1457931837769908467'
      }
    ];
  }
  return messages;
}

export function addChatMessage(sender: string, text: string, userId: string): ChatMessage {
  const db = loadDb();
  if (!db.chat_messages) {
    db.chat_messages = [];
  }

  const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const newMsg: ChatMessage = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    sender,
    text: text.trim(),
    sent_at: formatDate(new Date()),
    user_id: String(userId)
  };

  db.chat_messages.push(newMsg);

  // Limit cache to last 100 messages to prevent JSON size bloating
  if (db.chat_messages.length > 100) {
    db.chat_messages = db.chat_messages.slice(-100);
  }

  saveDb(db);
  return newMsg;
}
