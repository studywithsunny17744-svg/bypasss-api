import fs from 'fs';
import path from 'path';
import { config } from './config';

export interface UidInfo {
  added_on: string;
  days: number;
  expiry: string;
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
}

export interface ActivityLog {
  timestamp: string;
  guild_id: string | number;
  user_id: string | number;
  action: string;
  uid: string;
  details?: Record<string, any>;
}

export interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  sent_at: string;
  user_id: string;
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
  password?: string
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
    password: password || ''
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
