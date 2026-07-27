import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';
import { config } from './config';
import * as db from './db';

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

  if (keyInfo.is_active === false) {
    return res.status(403).json({ error: 'Account is currently suspended or inactive' });
  }

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
    db.addKeyUid(apiKey, cleanUid, numDays);
    
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

// 7. Voucher Creation Route
app.post('/api/vouchers/create', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { amount, days } = req.body;

  if (!apiKey) return res.status(401).json({ error: 'API key is required' });

  const isMasterKey = isMaster(apiKey);
  const keyInfo = db.getApiKeyInfo(apiKey);

  if (!isMasterKey && !keyInfo) return res.status(401).json({ error: 'Unauthorized key' });

  const numCoins = parseFloat(amount || '0');
  const numDays = parseInt(days || '0', 10);

  if (numCoins <= 0 && numDays <= 0) {
    return res.status(400).json({ error: 'Voucher must contain coins or days value' });
  }

  // Deduct balance from reseller (Master Admin is exempt)
  if (!isMasterKey && numCoins > 0) {
    const balance = db.getCredits(keyInfo!.owner_id);
    if (balance < numCoins) {
      return res.status(400).json({ error: 'Insufficient reseller balance to wrap coins' });
    }
    db.removeCredits(keyInfo!.owner_id, numCoins);
  }

  const code = `GIFT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  db.createGiftVoucher(keyInfo?.owner_id || config.masterAdminId, code, numCoins, numDays);

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
    credits: db.getCredits(info.owner_id)
  }));
  res.json({ success: true, keys: formatted });
});

// Create New Reseller
app.post('/api/admin/keys', (req: Request, res: Response) => {
  const { username, password, userId, maxUids, initialCredits } = req.body;
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
  
  db.createApiKeyEntry(newKey, cleanUserId, parseInt(maxUids || '100', 10), username, password);

  // Set initial credits if provided
  const coins = parseFloat(initialCredits || '0');
  if (coins > 0) {
    db.addCredits(cleanUserId, coins);
  }

  res.json({
    success: true,
    key: newKey,
    owner_id: cleanUserId,
    max_uids: maxUids || 100,
    username,
    password,
    credits: coins
  });
});

// Update Reseller Key Limits and password / credits
app.put('/api/admin/keys/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  const { maxUids, password, credits } = req.body;

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
  if (credits !== undefined) {
    const userId = info.owner_id;
    if (!database.reseller_credits) database.reseller_credits = {};
    database.reseller_credits[String(userId)] = parseFloat(credits);
  }

  db.saveDb(database);
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
  res.json({ success: true, is_active: newStatus });
});

// Delete Reseller Key
app.delete('/api/admin/keys/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  if (db.deleteApiKey(key)) {
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

    res.json({ success: true, message: `Free Whitelisted Claims Purged: scheduled cleanup of ${count} nodes upstream` });
  } catch (err: any) {
    res.status(500).json({ error: `Claims wipe execution failed: ${err.message}` });
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

// Mock Bot Deploy Route
app.post('/api/admin/deploy', (req: Request, res: Response) => {
  const { botToken, guildId, channelId } = req.body;
  if (!botToken || !guildId || !channelId) {
    return res.status(400).json({ error: 'Token, Server ID, and Log channel ID are required' });
  }
  // Mock bot launcher success
  res.json({ success: true, message: 'Discord Bot deployment process initiated successfully' });
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
    return res.json({ success: true, displayName: displayName || 'Mani272', avatar: avatar || '' });
  }

  const keys = database.api_keys || {};
  if (!keys[apiKey]) {
    return res.status(401).json({ error: 'Invalid API authorization key' });
  }

  if (displayName) keys[apiKey].displayName = displayName;
  if (avatar) keys[apiKey].avatar = avatar;

  db.saveDb(database);
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
});
