import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';
import { config } from './config';
import * as db from './db';
import { BotManager } from './botManager';

const app = express();

app.use(cors());
app.use(express.json());

// Helper to determine if a key belongs to the Master Admin
function isMaster(apiKey: string): boolean {
  if (apiKey === config.masterApiKey) {
    return true;
  }
  const keyInfo = db.getApiKeyInfo(apiKey);
  if (keyInfo && String(keyInfo.owner_id) === String(config.masterAdminId)) {
    return true;
  }
  return false;
}

// Helper to forward requests to the upstream API
async function sendUpstreamRequest(method: 'GET' | 'POST', pathSuffix: string, payload?: any): Promise<{ status: number; data: any }> {
  const isPhpApi = config.baseUrl.includes('api_user.php');
  let url = config.baseUrl;
  
  if (isPhpApi) {
    url = `${config.baseUrl}${pathSuffix}`;
  } else {
    // REST API formatting
    const cleanedSuffix = pathSuffix.replace('?action=', '/api/v1/uids/');
    url = `${config.baseUrl}${cleanedSuffix}`;
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'X-AUTH-KEY': config.masterApiKey,
    'X-API-KEY': config.masterApiKey,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: payload,
      timeout: 15000
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error(`Upstream error targeting ${url}:`, error.message);
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: `Connection to registry failed: ${error.message}` } };
  }
}

// 1. Health Diagnostic Route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'operational',
    brand: config.appBrandName,
    port: config.port,
    upstream: config.baseUrl ? 'configured' : 'missing'
  });
});

// 2. Authentication Route
app.post('/api/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // 1. Check Admin credentials
  if (username === config.adminUsername && password === config.adminPassword) {
    return res.json({
      success: true,
      isMaster: true,
      owner_id: config.masterAdminId,
      max_uids: 99999,
      requests_count: 0,
      apiKey: config.masterApiKey
    });
  }

  // 2. Check Reseller credentials
  const database = db.loadDb();
  const keys = database.api_keys || {};
  const foundEntry = Object.entries(keys).find(([_, info]) => {
    return info.username === username && info.password === password;
  });

  if (!foundEntry) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const [apiKey, keyInfo] = foundEntry;

  if (keyInfo.expiry) {
    const expDate = new Date(keyInfo.expiry);
    if (expDate < new Date()) {
      keyInfo.is_active = false;
      db.saveDb(database);
      return res.status(403).json({ error: 'Your reseller account subscription has expired' });
    }
  }

  if (keyInfo.is_active === false) {
    return res.status(403).json({ error: 'Account is currently suspended or inactive' });
  }

  db.addActivityLog(0, keyInfo.username || keyInfo.owner_id, 'LOGIN', 'N/A', { is_master: false });

  res.json({
    success: true,
    isMaster: false,
    owner_id: keyInfo.owner_id || config.masterAdminId,
    max_uids: keyInfo.max_uids || 100,
    requests_count: keyInfo.requests_count || 0,
    apiKey: apiKey
  });
});

// 3. Reseller Dashboard Data Retrieval Route
app.get('/api/dashboard', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  const isMasterKey = isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);

  if (!isMasterKey && !keyInfo) {
    return res.status(401).json({ error: 'Invalid API authorization key' });
  }

  const database = db.loadDb();
  
  if (keyInfo && keyInfo.expiry) {
    const expDate = new Date(keyInfo.expiry);
    if (expDate < new Date()) {
      // Auto suspend
      const liveDb = db.loadDb();
      if (liveDb.api_keys[apiKey]) {
        liveDb.api_keys[apiKey].is_active = false;
        db.saveDb(liveDb);
      }
      return res.status(401).json({ error: 'Your reseller account has expired. Please contact administration.' });
    }
  }

  // Calculate analytics
  const credits = db.getCredits(keyInfo?.owner_id || config.masterAdminId);
  const activeUids = Object.keys(keyInfo?.uids || {}).length;
  const maxLimit = keyInfo?.max_uids || 99999;
  
  // Calculate system-wide stats
  let systemTotalUids = 0;
  let systemActiveAdmins = Object.keys(database.api_keys || {}).length;
  let systemAddedToday = 0;
  let systemExpiringSoon = 0;
  const allUids: Record<string, any> = {};

  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  for (const [k, info] of Object.entries(database.api_keys || {})) {
    if (info.uids) {
      for (const [uid, uidData] of Object.entries(info.uids)) {
        systemTotalUids++;
        allUids[uid] = {
          ...uidData,
          added_by: info.username || `Reseller_${info.owner_id}`
        };

        if (uidData.added_on && uidData.added_on.startsWith(todayStr)) {
          systemAddedToday++;
        }
        
        if (uidData.expiry) {
          const expiryDate = new Date(uidData.expiry);
          if (expiryDate > new Date() && expiryDate <= threeDaysFromNow) {
            systemExpiringSoon++;
          }
        }
      }
    }
  }

  // Filter activity logs
  const logs = (database.activity_logs || [])
    .filter(log => isMasterKey || String(log.user_id) === String(keyInfo?.owner_id))
    .slice(-30)
    .reverse();

  const userDisplayName = isMasterKey 
    ? (database.user_names_cache?.['admin_display'] || 'Mani272') 
    : (keyInfo?.displayName || keyInfo?.username || String(keyInfo?.owner_id || 'Mani272'));

  const userAvatar = isMasterKey 
    ? (database.user_names_cache?.['admin_avatar'] || '') 
    : (keyInfo?.avatar || '');

  const brandLogo = database.user_names_cache?.['admin_avatar'] || '';

  res.json({
    success: true,
    credits,
    activeUids,
    maxLimit,
    isMaster: isMasterKey,
    uids: keyInfo?.uids || {},
    logs,
    ownerId: keyInfo?.owner_id || config.masterAdminId,
    displayName: userDisplayName,
    avatar: userAvatar,
    brandLogo,
    botConfig: keyInfo?.bot_config || null,
    expiry: keyInfo?.expiry || 'Lifetime',
    username: keyInfo?.username || config.adminUsername,
    systemStats: {
      totalUids: systemTotalUids,
      activeAdmins: systemActiveAdmins,
      addedToday: systemAddedToday,
      expiringSoon: systemExpiringSoon
    },
    allUids
  });
});

// 4. Register UID Route
app.post('/api/uids/add', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { uid, days, bluestack } = req.body;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });
  if (!uid || !days) return res.status(400).json({ error: 'UID and validity days are required' });

  const cleanUid = String(uid).trim();
  if (!/^\d+$/.test(cleanUid)) {
    return res.status(400).json({ error: 'UID must contain digits only' });
  }

  const isMasterKey = isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);

  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized key' });
  if (keyInfo && keyInfo.is_active === false) return res.status(403).json({ error: 'Revoked API key' });

  // Calculate pricing
  const numDays = parseInt(days, 10);
  const costs: Record<number, number> = { 1: 0.50, 7: 2.40, 15: 3.40, 30: 5.30, 36500: 50.00 };
  const cost = costs[numDays] || (numDays * 0.50);

  // Check limits and balance
  if (!isMasterKey) {
    const activeCount = Object.keys(keyInfo?.uids || {}).length;
    if (activeCount >= (keyInfo?.max_uids || 100)) {
      return res.status(400).json({ error: 'UID limit has been reached' });
    }
    const balance = db.getCredits(keyInfo!.owner_id);
    if (balance < cost) {
      return res.status(400).json({ error: `Insufficient credits. Required: ${cost.toFixed(2)}, Available: ${balance.toFixed(2)}` });
    }
  }

  // Forward request upstream
  const isPhpApi = config.baseUrl.includes('api_user.php');
  const pathSuffix = isPhpApi ? '?action=add' : '/add';
  const payload = isPhpApi 
    ? { account_id: parseInt(cleanUid, 10), for_days: numDays }
    : { uid: cleanUid, days: numDays, name: `WebNode_${cleanUid}` };

  const upstream = await sendUpstreamRequest('POST', pathSuffix, payload);

  const isSuccess = upstream.data?.success === true || upstream.status === 200 || upstream.data?.status === 'success';

  if (isSuccess) {
    if (!isMasterKey) {
      db.removeCredits(keyInfo!.owner_id, cost);
    }
    db.incrementApiUsage(apiKey);
    db.addKeyUid(apiKey, cleanUid, numDays, 'WEB_API');
    
    db.addActivityLog(0, keyInfo?.owner_id || config.masterAdminId, 'add', cleanUid, {
      user_name: isMasterKey ? 'Master Administrator' : `Reseller_${keyInfo?.owner_id}`,
      api_key_used: apiKey,
      cost,
      duration: numDays,
      platform: bluestack ? 'Bluestacks' : 'Other'
    });

    res.json({ success: true, message: 'UID Whitelisted successfully', upstream: upstream.data });
  } else {
    const errorMsg = upstream.data?.error || upstream.data?.message || 'Upstream server error occurred';
    res.status(upstream.status || 400).json({ error: errorMsg });
  }
});

// 5. Terminate UID Route
app.post('/api/uids/remove', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { uid } = req.body;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });
  if (!uid) return res.status(400).json({ error: 'UID is required' });

  const cleanUid = String(uid).trim();
  const isMasterKey = isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);

  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized key' });

  // Verify reseller has access to this UID (Master Admin has global access)
  if (!isMasterKey) {
    if (!keyInfo || !keyInfo.uids || !keyInfo.uids[cleanUid]) {
      return res.status(403).json({ error: 'You are not authorized to remove this UID' });
    }
  }

  // Forward request upstream
  const isPhpApi = config.baseUrl.includes('api_user.php');
  const pathSuffix = isPhpApi ? '?action=remove' : '/remove';
  const payload = isPhpApi ? { account_id: parseInt(cleanUid, 10) } : { uid: cleanUid };

  const upstream = await sendUpstreamRequest('POST', pathSuffix, payload);
  const isSuccess = upstream.data?.success === true || upstream.status === 200 || upstream.data?.status === 'success';

  if (isSuccess) {
    db.incrementApiUsage(apiKey);
    db.removeKeyUid(apiKey, cleanUid);

    db.addActivityLog(0, keyInfo?.owner_id || config.masterAdminId, 'remove', cleanUid, {
      user_name: isMasterKey ? 'Master Administrator' : `Reseller_${keyInfo?.owner_id}`,
      api_key_used: apiKey
    });

    res.json({ success: true, message: 'UID removed successfully', upstream: upstream.data });
  } else {
    const errorMsg = upstream.data?.error || upstream.data?.message || 'Upstream server error occurred';
    res.status(upstream.status || 400).json({ error: errorMsg });
  }
});

// 6. Migrate/Replace UID Route
app.post('/api/uids/replace', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { oldUid, newUid } = req.body;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });
  if (!oldUid || !newUid) return res.status(400).json({ error: 'Old UID and New UID are required' });

  const cleanOld = String(oldUid).trim();
  const cleanNew = String(newUid).trim();

  if (!/^\d+$/.test(cleanNew)) {
    return res.status(400).json({ error: 'New UID must contain digits only' });
  }

  const isMasterKey = isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);

  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized key' });

  // Verify reseller has access to the UID they are migrating
  if (!isMasterKey) {
    if (!keyInfo || !keyInfo.uids || !keyInfo.uids[cleanOld]) {
      return res.status(403).json({ error: 'You are not authorized to migrate this UID' });
    }
  }

  // Forward request upstream
  const isPhpApi = config.baseUrl.includes('api_user.php');
  const pathSuffix = isPhpApi ? '?action=change_uid' : '/replace';
  const payload = isPhpApi 
    ? { old_uid: parseInt(cleanOld, 10), new_uid: parseInt(cleanNew, 10) }
    : { old_uid: cleanOld, new_uid: cleanNew };

  const upstream = await sendUpstreamRequest('POST', pathSuffix, payload);
  const isSuccess = upstream.data?.success === true || upstream.status === 200 || upstream.data?.status === 'success';

  if (isSuccess) {
    db.incrementApiUsage(apiKey);
    db.replaceKeyUid(apiKey, cleanOld, cleanNew);

    db.addActivityLog(0, keyInfo?.owner_id || config.masterAdminId, 'replace', `${cleanOld} -> ${cleanNew}`, {
      user_name: isMasterKey ? 'Master Administrator' : `Reseller_${keyInfo?.owner_id}`,
      api_key_used: apiKey
    });

    res.json({ success: true, message: 'UID migrated successfully', upstream: upstream.data });
  } else {
    const errorMsg = upstream.data?.error || upstream.data?.message || 'Upstream server error occurred';
    res.status(upstream.status || 400).json({ error: errorMsg });
  }
});

// 7. Voucher Creation Route (Master Admin Only)
app.post('/api/vouchers/create', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { amount, days } = req.body;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const isMasterKey = isMaster(apiKey);

  if (!isMasterKey) {
    return res.status(403).json({ error: 'Only administrators are permitted to generate gift vouchers.' });
  }

  const numCoins = parseFloat(amount || '0');
  const numDays = parseInt(days || '0', 10);

  if (numCoins <= 0 && numDays <= 0) {
    return res.status(400).json({ error: 'Voucher must contain coins or days value.' });
  }

  const code = `GIFT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  db.createGiftVoucher(config.masterAdminId, code, numCoins, numDays);

  db.addActivityLog(0, config.masterAdminId, 'VOUCHER_CREATE', code, { coins: numCoins, bonus_days: numDays });

  res.json({
    success: true,
    code,
    amount: numCoins,
    days: numDays
  });
});

// 8. Voucher Redemption Route
app.post('/api/vouchers/redeem', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { code } = req.body;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });
  if (!code) return res.status(400).json({ error: 'Voucher code is required' });

  const keyInfo = db.getApiKeyInfo(apiKey);
  const isMasterKey = isMaster(apiKey);

  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized key' });

  const userId = keyInfo?.owner_id || config.masterAdminId;
  const result = db.claimGiftVoucher(userId, code);

  if (result.success) {
    db.addActivityLog(0, userId, 'VOUCHER_REDEEM', code, { coins_added: result.amount, bonus_days: result.days });

    res.json({
      success: true,
      amount: result.amount,
      days: result.days,
      message: `Voucher claimed successfully! Added ${result.amount} coins and ${result.days} bonus days.`
    });
  } else {
    res.status(400).json({ error: result.message });
  }
});

// 9. Reseller Leaderboards
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const database = db.loadDb();
  const credits = database.reseller_credits || {};
  
  const board = Object.entries(credits)
    .map(([uid, coins]) => ({
      userId: uid,
      coins: Number(coins),
      name: database.user_names_cache?.[uid] || `Reseller_${uid.slice(-4)}`
    }))
    .sort((a, b) => b.coins - a.coins)
    .slice(0, 10);

  res.json({ success: true, leaderboard: board });
});

// 10. SYSTEM MANAGEMENT COMMAND SERVICES (Strictly Master Admin Auth)
app.use('/api/admin/*', (req: Request, res: Response, next) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey || !isMaster(apiKey)) {
    return res.status(403).json({ error: 'Access Denied. Global system administration privileges required' });
  }
  next();
});

// Read Resellers Keys List
app.get('/api/admin/keys', (req: Request, res: Response) => {
  const keys = db.getApiKeys();
  const formatted = Object.entries(keys).map(([key, info]) => ({
    key,
    owner_id: info.owner_id,
    created_at: info.created_at,
    requests_count: info.requests_count || 0,
    is_active: info.is_active !== false,
    max_uids: info.max_uids || 100,
    active_uids: Object.keys(info.uids || {}).length,
    username: info.username || '',
    password: info.password || '',
    expiry: info.expiry || '',
    credits: db.getCredits(info.owner_id)
  }));
  res.json({ success: true, keys: formatted });
});

// Create New Reseller
app.post('/api/admin/keys', (req: Request, res: Response) => {
  const { username, password, userId, maxUids, initialCredits, expiry } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Check if username already exists in registry
  const database = db.loadDb();
  const usernameExists = Object.values(database.api_keys || {}).some(
    info => info.username === username
  );
  if (usernameExists || username === config.adminUsername) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const cleanUserId = userId ? String(userId).trim() : `user_${Date.now()}`;
  const prefix = config.apiKeyPrefix;
  const newKey = `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
  
  db.createApiKeyEntry(newKey, cleanUserId, parseInt(maxUids || '100', 10), username, password, expiry);

  // Set initial credits if provided
  const coins = parseFloat(initialCredits || '0');
  if (coins > 0) {
    db.addCredits(cleanUserId, coins);
  }

  db.addActivityLog(0, cleanUserId, 'RESELLER_CREATE', username, { max_uids: maxUids || 100, credits: coins, expiry: expiry || 'Lifetime' });

  res.json({
    success: true,
    key: newKey,
    owner_id: cleanUserId,
    max_uids: maxUids || 100,
    username,
    password,
    expiry: expiry || '',
    credits: coins
  });
});

// Update Reseller Key Limits and password / credits
app.put('/api/admin/keys/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  const { maxUids, password, credits, expiry } = req.body;

  const database = db.loadDb();
  if (!database.api_keys || !database.api_keys[key]) {
    return res.status(404).json({ error: 'API key not found' });
  }

  const info = database.api_keys[key];
  if (password) {
    info.password = password;
  }
  if (maxUids !== undefined) {
    info.max_uids = parseInt(maxUids, 10);
  }
  if (expiry !== undefined) {
    info.expiry = expiry;
  }
  if (credits !== undefined) {
    const userId = info.owner_id;
    if (!database.reseller_credits) database.reseller_credits = {};
    database.reseller_credits[String(userId)] = parseFloat(credits);
  }

  db.saveDb(database);
  db.addActivityLog(0, info.owner_id, 'RESELLER_UPDATE', info.username || key, { max_uids: maxUids, credits, expiry });

  res.json({ success: true, message: 'Reseller updated successfully' });
});

// Update Reseller Key Limits (Legacy endpoint compatibility)
app.put('/api/admin/keys/:key/limit', (req: Request, res: Response) => {
  const { key } = req.params;
  const { maxUids } = req.body;

  if (db.updateKeyMaxUids(key, parseInt(maxUids, 10))) {
    res.json({ success: true, message: `Updated limit to ${maxUids} successfully` });
  } else {
    res.status(404).json({ error: 'API key not found' });
  }
});

// Toggle Reseller Active/Suspend State
app.post('/api/admin/keys/:key/toggle', (req: Request, res: Response) => {
  const { key } = req.params;
  const newStatus = db.toggleKeyStatus(key);
  const info = db.getApiKeyInfo(key);

  db.addActivityLog(0, info?.owner_id || key, 'RESELLER_TOGGLE', info?.username || key, { is_active: newStatus });

  res.json({ success: true, is_active: newStatus });
});

// Delete Reseller Key
app.delete('/api/admin/keys/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  const info = db.getApiKeyInfo(key);
  const username = info?.username || key;
  const ownerId = info?.owner_id || key;

  if (db.deleteApiKey(key)) {
    db.addActivityLog(0, ownerId, 'RESELLER_DELETE', username, {});
    res.json({ success: true, message: 'API key deleted permanently' });
  } else {
    res.status(404).json({ error: 'API key not found' });
  }
});

// Purge/Reset Free Claims Memory
app.post('/api/admin/reset-claims', async (req: Request, res: Response) => {
  try {
    const claims = db.resetFreeClaimsData();
    const count = Object.keys(claims).length;

    // Async task to remove UIDs upstream
    for (const uid of Object.values(claims)) {
      const isPhpApi = config.baseUrl.includes('api_user.php');
      const suffix = isPhpApi ? '?action=remove' : '/remove';
      const payload = isPhpApi ? { account_id: parseInt(uid, 10) } : { uid };
      sendUpstreamRequest('POST', suffix, payload).catch(err => console.error('Claims cleanup err:', err));
    }

    db.addActivityLog(0, config.masterAdminId, 'RESET_CLAIMS', 'ALL_TRIAL_UIDS', { count });

    res.json({ success: true, message: `Free Whitelisted Claims Purged: scheduled cleanup of ${count} nodes upstream` });
  } catch (err: any) {
    res.status(500).json({ error: `Claims wipe execution failed: ${err.message}` });
  }
});

// --- FREE PORTAL TRIAL SYSTEM ROUTES ---

// Create Free Trial Portal Link
app.post('/api/free-portal/create', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { title, days, maxClaims } = req.body;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const isMasterKey = db.isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);

  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized API key' });

  const ownerId = isMasterKey ? config.masterAdminId : keyInfo?.owner_id || 'unknown';
  const numDays = parseInt(days || '1', 10);
  const numMaxClaims = parseInt(maxClaims || '0', 10);

  const portal = db.createFreePortal(apiKey, String(ownerId), title || '', numDays, numMaxClaims);

  res.json({
    success: true,
    portal,
    claimUrl: `/free-claim/${portal.id}`
  });
});

// Get List of Free Portals
app.get('/api/free-portal/list', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const isMasterKey = db.isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);

  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized API key' });

  const database = db.loadDb();
  const portals = database.free_portals || {};
  const ownerId = String(isMasterKey ? config.masterAdminId : keyInfo?.owner_id);

  const filtered = Object.values(portals).filter(p => isMasterKey || String(p.owner_id) === ownerId);

  res.json({
    success: true,
    portals: filtered
  });
});

// Public info for a Free Trial Portal
app.get('/api/free-portal/info/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const portal = db.getFreePortal(id);

  if (!portal || !portal.is_active) {
    return res.status(404).json({ error: 'Free trial portal not found or inactive' });
  }

  const database = db.loadDb();
  let hostName = 'System Administrator';
  if (portal.owner_id !== config.masterAdminId && database.api_keys[portal.api_key]) {
    hostName = database.api_keys[portal.api_key].username || `Reseller_${portal.owner_id}`;
  }

  const totalClaims = Object.keys(portal.claimed_ips || {}).length;

  res.json({
    success: true,
    id: portal.id,
    title: portal.title,
    hostName,
    days: portal.days,
    maxClaims: portal.max_claims,
    totalClaims,
    created_at: portal.created_at
  });
});

// Public Claim UID Route
app.post('/api/free-portal/claim', (req: Request, res: Response) => {
  const { portalId, uid } = req.body;
  if (!portalId || !uid || !uid.trim()) {
    return res.status(400).json({ error: 'Portal ID and target UID are required' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string || req.ip || '127.0.0.1').split(',')[0].trim();
  const result = db.claimFreePortalUid(portalId.trim(), clientIp, uid.trim());

  if (result.success) {
    res.json({ success: true, message: result.message });
  } else {
    res.status(400).json({ error: result.message });
  }
});

// Reset Free Portal IP Locks & Purge Claimed UIDs
app.post('/api/free-portal/reset/:id', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { id } = req.params;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const isMasterKey = db.isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);

  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized API key' });

  const ownerId = isMasterKey ? config.masterAdminId : keyInfo?.owner_id;
  const result = db.resetFreePortalClaims(id, String(ownerId));

  if (result.success) {
    db.addActivityLog(0, String(ownerId), 'RESET_FREE_PORTAL', id, { purged_uids_count: result.count });
    res.json({ success: true, message: `Portal IP locks reset and ${result.count} trial UIDs purged!` });
  } else {
    res.status(400).json({ error: 'Failed to reset free portal claims.' });
  }
});

// Delete Free Portal Link
app.delete('/api/free-portal/:id', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { id } = req.params;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const isMasterKey = db.isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);

  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized API key' });

  const ownerId = isMasterKey ? config.masterAdminId : keyInfo?.owner_id;
  const deleted = db.deleteFreePortal(id, String(ownerId));

  if (deleted) {
    res.json({ success: true, message: 'Free trial portal deleted.' });
  } else {
    res.status(400).json({ error: 'Failed to delete portal.' });
  }
});

// Update Environment Configuration Variables
app.post('/api/admin/env', (req: Request, res: Response) => {
  const { upstreamKey, baseUrl, webhookUrl, prefix, brand } = req.body;
  try {
    if (upstreamKey) db.updateEnvVariable('API_KEY', upstreamKey.trim());
    if (baseUrl) db.updateEnvVariable('BASE_URL', baseUrl.trim());
    if (webhookUrl) db.updateEnvVariable('LOG_WEBHOOK_URL', webhookUrl.trim());
    if (prefix) db.updateEnvVariable('API_KEY_PREFIX', prefix.trim());
    if (brand) db.updateEnvVariable('APP_BRAND_NAME', brand.trim());

    res.json({ success: true, message: 'System environment variables updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: `Environment updates write failed: ${err.message}` });
  }
});

// Live Webhook Testing Route
app.post('/api/admin/test-webhook', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const targetWebhookUrl = req.body.webhookUrl?.trim() || process.env.LOG_WEBHOOK_URL || '';
  if (!targetWebhookUrl) {
    return res.status(400).json({ error: 'Webhook URL is missing. Please provide a valid HTTP/Discord Webhook URL.' });
  }

  try {
    const payload = {
      content: '⚡ **MANI272 Bypass Engine — Webhook Integration Test**',
      embeds: [
        {
          title: '🟢 Webhook Connection Test Successful!',
          description: 'This is an immediate live diagnostic test ping sent from your **UID Manager Command Suite**.',
          color: 65416,
          fields: [
            { name: 'Status', value: '✅ ACTIVE & FUNCTIONAL', inline: true },
            { name: 'Timestamp', value: new Date().toLocaleString(), inline: true },
            { name: 'Engine Sync', value: 'STABLE • Edge Proxy Gateway', inline: false }
          ],
          footer: { text: 'MANI272 Command Suite • Real-time Webhook Diagnostics' }
        }
      ]
    };

    const webhookRes = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (webhookRes.ok || webhookRes.status === 204) {
      return res.json({ success: true, message: 'Live Webhook test message dispatched successfully! Check your channel.' });
    } else {
      const errText = await webhookRes.text().catch(() => '');
      return res.status(400).json({ error: `Webhook endpoint returned HTTP ${webhookRes.status}: ${errText.slice(0, 100)}` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: `Failed to dispatch live webhook ping: ${err.message}` });
  }
});

// Reseller Bot Hosting Routes
app.get('/api/bot/status', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const database = db.loadDb();
  const reseller = database.api_keys[apiKey];
  if (!reseller) return res.status(401).json({ error: 'Invalid API authorization key' });

  const running = BotManager.isBotRunning(apiKey);
  res.json({
    success: true,
    running,
    config: reseller.bot_config || null
  });
});

app.get('/api/bot/logs', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const logs = BotManager.getLogs(apiKey);
  res.json({ success: true, logs });
});

app.post('/api/bot/deploy', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { botToken, guildId, channelId, ownerId, botName, botAvatar } = req.body;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });
  if (!botToken || !guildId || !channelId) {
    return res.status(400).json({ error: 'Token, Server ID, and Channel ID are required' });
  }

  const database = db.loadDb();
  const reseller = database.api_keys[apiKey];
  if (!reseller) return res.status(401).json({ error: 'Invalid API authorization key' });

  // Validate credits
  const credits = db.getCredits(reseller.owner_id);
  if (credits < 0.05) {
    return res.status(400).json({ error: 'Insufficient credits (minimum 0.05 coins required) to initialize bot hosting.' });
  }

  // Save config
  reseller.bot_config = {
    token: botToken.trim(),
    guild_id: guildId.trim(),
    channel_id: channelId.trim(),
    is_active: true,
    owner_id: ownerId ? String(ownerId).trim() : String(reseller.owner_id),
    bot_name: botName ? String(botName).trim() : undefined,
    bot_avatar: botAvatar ? String(botAvatar).trim() : undefined
  };
  delete reseller.bot_config.suspended_reason;

  db.saveDb(database);

  // Deploy bot asynchronously
  BotManager.startBot(apiKey, botToken.trim(), guildId.trim(), channelId.trim())
    .then((success) => {
      if (!success) {
        const freshDb = db.loadDb();
        if (freshDb.api_keys[apiKey]?.bot_config) {
          freshDb.api_keys[apiKey].bot_config!.is_active = false;
          db.saveDb(freshDb);
        }
      }
    })
    .catch(() => {});

  res.json({ success: true, message: 'Discord Bot deployment process initiated successfully.' });
});

app.post('/api/bot/stop', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const database = db.loadDb();
  const reseller = database.api_keys[apiKey];
  if (!reseller) return res.status(401).json({ error: 'Invalid API authorization key' });

  if (reseller.bot_config) {
    reseller.bot_config.is_active = false;
    db.saveDb(database);
  }

  BotManager.stopBot(apiKey);
  res.json({ success: true, message: 'Discord Bot client connection terminated.' });
});

// Admin compatibility route
app.post('/api/admin/deploy', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { botToken, guildId, channelId } = req.body;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });
  if (!botToken || !guildId || !channelId) {
    return res.status(400).json({ error: 'Token, Server ID, and Channel ID are required' });
  }

  const database = db.loadDb();
  const reseller = database.api_keys[apiKey];
  if (!reseller) return res.status(401).json({ error: 'Invalid API authorization key' });

  reseller.bot_config = {
    token: botToken.trim(),
    guild_id: guildId.trim(),
    channel_id: channelId.trim(),
    is_active: true
  };
  delete reseller.bot_config.suspended_reason;

  db.saveDb(database);

  BotManager.startBot(apiKey, botToken.trim(), guildId.trim(), channelId.trim()).catch(() => {});

  res.json({ success: true, message: 'Discord Bot deployment process initiated successfully.' });
});

// Update reseller display name/avatar
app.post('/api/profile/update', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { displayName, avatar } = req.body;
  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const isMasterKey = isMaster(apiKey);
  const database = db.loadDb();

  if (isMasterKey) {
    if (!database.user_names_cache) {
      database.user_names_cache = {};
    }
    database.user_names_cache['admin_display'] = displayName || 'Mani272';
    database.user_names_cache['admin_avatar'] = avatar || '';
    db.saveDb(database);
    db.addActivityLog(0, config.masterAdminId, 'PROFILE_UPDATE', displayName || 'Admin', { avatar: !!avatar });
    return res.json({ success: true, displayName: displayName || 'Mani272', avatar: avatar || '' });
  }

  const keys = database.api_keys || {};
  if (!keys[apiKey]) {
    return res.status(401).json({ error: 'Invalid API authorization key' });
  }

  if (displayName !== undefined) keys[apiKey].displayName = displayName;
  if (avatar !== undefined) keys[apiKey].avatar = avatar;

  db.saveDb(database);
  db.addActivityLog(0, keys[apiKey].owner_id, 'PROFILE_UPDATE', keys[apiKey].displayName || 'Reseller', { avatar: !!avatar });

  res.json({
    success: true,
    displayName: keys[apiKey].displayName,
    avatar: keys[apiKey].avatar
  });
});

// Reset API Key for Reseller
app.post('/api/profile/reset-key', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  if (isMaster(apiKey)) {
    return res.status(400).json({ error: 'Cannot reset the Master Admin Upstream key.' });
  }

  const database = db.loadDb();
  const keys = database.api_keys || {};
  if (!keys[apiKey]) {
    return res.status(401).json({ error: 'Invalid API authorization key' });
  }

  const keyData = keys[apiKey];
  const newKey = `${config.apiKeyPrefix}_${crypto.randomBytes(16).toString('hex')}`;
  
  keys[newKey] = keyData;
  delete keys[apiKey];

  db.saveDb(database);
  res.json({
    success: true,
    newApiKey: newKey
  });
});

// Bulk delete UIDs
app.post('/api/uids/bulk-remove', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { uids } = req.body; // array of UIDs

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });
  if (!uids || !Array.isArray(uids) || uids.length === 0) {
    return res.status(400).json({ error: 'List of UIDs is required' });
  }

  const isMasterKey = isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);

  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized key' });
  if (keyInfo && keyInfo.is_active === false) return res.status(403).json({ error: 'Revoked API key' });

  const database = db.loadDb();
  const keys = database.api_keys || {};
  let removedCount = 0;

  for (const uid of uids) {
    const cleanUid = String(uid).trim();
    
    let hasAccess = isMasterKey;
    if (!hasAccess && keyInfo && keyInfo.uids && keyInfo.uids[cleanUid]) {
      hasAccess = true;
    }

    if (hasAccess) {
      const isPhpApi = config.baseUrl.includes('api_user.php');
      const suffix = isPhpApi ? '?action=remove' : '/remove';
      const payload = isPhpApi ? { account_id: parseInt(cleanUid, 10) } : { uid: cleanUid };
      
      const upstream = await sendUpstreamRequest('POST', suffix, payload);
      const isSuccess = upstream.data?.success === true || upstream.status === 200 || upstream.data?.status === 'success';

      if (isSuccess) {
        if (isMasterKey) {
          for (const [k, info] of Object.entries(keys)) {
            if (info.uids && info.uids[cleanUid]) {
              delete info.uids[cleanUid];
            }
          }
        } else if (keyInfo && keyInfo.uids) {
          delete keyInfo.uids[cleanUid];
        }

        db.addActivityLog(0, keyInfo?.owner_id || config.masterAdminId, 'remove', cleanUid, {
          user_name: isMasterKey ? 'Master Administrator' : `Reseller_${keyInfo?.owner_id}`,
          api_key_used: apiKey,
          details: { action_type: 'bulk_remove' }
        });
        removedCount++;
      }
    }
  }

  db.saveDb(database);
  res.json({ success: true, message: `Successfully bulk deleted ${removedCount} UIDs.` });
});

// 11. Team Chat API Endpoints
app.get('/api/chat', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return res.status(401).json({ error: 'API key is required' });
  const isMasterKey = isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);
  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized key' });

  const messages = db.getChatMessages();
  res.json({ success: true, messages });
});

app.post('/api/chat', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { text } = req.body;
  
  if (!apiKey) return res.status(401).json({ error: 'API key is required' });
  if (!text || !text.trim()) return res.status(400).json({ error: 'Message text is required' });

  const isMasterKey = isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);
  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized key' });

  let senderName = '';
  let userId = '';

  const database = db.loadDb();
  if (isMasterKey) {
    senderName = database.user_names_cache?.['admin_display'] || 'Admin Mani';
    userId = String(config.masterAdminId);
  } else if (keyInfo) {
    senderName = keyInfo.displayName || keyInfo.username || `Reseller_${String(keyInfo.owner_id).slice(-4)}`;
    userId = String(keyInfo.owner_id);
  }

  const newMsg = db.addChatMessage(senderName, text.trim(), userId);
  res.json({ success: true, message: newMsg });
});

// Serve compiled static frontend React files
const frontendDist = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('*', (req: Request, res: Response) => {
    res.status(200).send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
        <h2>API Core Operational</h2>
        <p>Frontend production files not compiled yet. Build the frontend app using: <br/><code>npm run build</code></p>
      </div>
    `);
  });
}

// Start Server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`White-Label Console backend listening on port ${config.port}`);
  console.log(`Shared Database target path: ${config.dbPath}`);

  // 1. Startup: Launch all active bots
  const database = db.loadDb();
  if (database.api_keys) {
    for (const [apiKey, reseller] of Object.entries(database.api_keys)) {
      if (reseller.bot_config?.is_active && !reseller.bot_config?.suspended_reason) {
        console.log(`Starting Discord bot for reseller API Key: ${apiKey.slice(0, 10)}...`);
        BotManager.startBot(
          apiKey,
          reseller.bot_config.token,
          reseller.bot_config.guild_id,
          reseller.bot_config.channel_id
        ).catch(() => {});
      }
    }
  }

  // 2. Billing loop: Deduct reseller credits for active bot hosting (every 2 minutes)
  setInterval(() => {
    const liveDb = db.loadDb();
    let updated = false;

    if (liveDb.api_keys) {
      for (const [apiKey, reseller] of Object.entries(liveDb.api_keys)) {
        if (reseller.bot_config?.is_active) {
          const ownerId = reseller.owner_id;
          const currentCredits = db.getCredits(ownerId);
          const activeCost = 0.05; // 0.05 coins charge per billing tick

          if (currentCredits < activeCost) {
            // Insufficient credits -> Suspend bot!
            reseller.bot_config.is_active = false;
            reseller.bot_config.suspended_reason = 'insufficient_credits';
            updated = true;

            BotManager.addLog(apiKey, '[ERROR] Hosting suspended: Insufficient coin credits balance.');
            BotManager.stopBot(apiKey);

            db.addActivityLog(0, ownerId, 'bot_suspend', 'system', {
              user_name: reseller.username || 'System Billing',
              api_key_used: apiKey,
              details: { reason: 'insufficient_credits' }
            });
          } else {
            // Deduct credits
            if (!liveDb.reseller_credits) liveDb.reseller_credits = {};
            liveDb.reseller_credits[String(ownerId)] = Math.max(0, currentCredits - activeCost);
            updated = true;
            
            BotManager.addLog(apiKey, `[BILLING] Deducted ${activeCost} coins for active bot hosting.`);
          }
        }
      }
    }

    if (updated) {
      db.saveDb(liveDb);
    }
  }, 120000);
});
