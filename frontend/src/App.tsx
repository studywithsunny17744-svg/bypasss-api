import React, { useState, useEffect } from 'react';
import SplashCursor from './SplashCursor';
import { GradientText, CountUp, GlowCard, GlitchText } from './ReactBitsComponents';
import FloatingLines from './FloatingLines';
import WelcomeOverlay from './WelcomeOverlay';


// --- INLINE SVG COMPONENTS (Accurately matching the screenshot icons) ---
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
);
const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
);
const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
);
const LogIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);
const SwapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3L21 7L17 11"/><path d="M3 17L7 21L3 25"/><path d="M21 7H9M3 17H15"/></svg>
);
const CoinsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8a2.5 2.5 0 0 1 2 2"></path><path d="M12 12a2.5 2.5 0 0 0 2-2"></path></svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);
const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a6 6 0 0 1 6 6v3.5c0 3-2.5 5.5-6 5.5s-6-2.5-6-5.5V8a6 6 0 0 1 6-6z"></path></svg>
);
const GiftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="22" x2="12" y2="8"></line><path d="M5 12H2v10h3V12zM22 12h-3v10h3V12z"></path><path d="M12 8H5a3 3 0 0 1 0-6h7v6zM12 8h7a3 3 0 0 0 0-6h-7v6z"></path></svg>
);
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);

interface UidData {
  added_on: string;
  days: number;
  expiry: string;
}

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('api_key') || '');
  const [isMasterState, setIsMasterState] = useState<boolean>(false);
  
  // Login credentials states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // UI Navigation tabs states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'apikey' | 'apidocs' | 'profile' | 'chat' | 'analytics' | 'logs' | 'resellers' | 'purge' | 'bot' | 'system'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [apiAccessEnabled, setApiAccessEnabled] = useState(true);

  // Stats / Dashboard Info
  const [loading, setLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState('');
  const [errorAlert, setErrorAlert] = useState('');
  const [stats, setStats] = useState({ credits: 0, activeUids: 0, maxLimit: 100, isMaster: false, ownerId: '', username: '' });
  const [uidsList, setUidsList] = useState<Record<string, UidData>>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [uidSearch, setUidSearch] = useState('');

  // Business Action input states
  const [addUidInput, setAddUidInput] = useState('');
  const [addUidDays, setAddUidDays] = useState('30');
  const [addUidBluestack, setAddUidBluestack] = useState(true);
  const [migrateOldUid, setMigrateOldUid] = useState('');
  const [migrateNewUid, setMigrateNewUid] = useState('');

  // System-wide statistics
  const [systemStats, setSystemStats] = useState({ totalUids: 0, activeAdmins: 0, addedToday: 0, expiringSoon: 0 });
  const [allUidsList, setAllUidsList] = useState<Record<string, any>>({});
  
  // Dashboard view customization
  const [dashboardFilter, setDashboardFilter] = useState<'my' | 'all'>('my');
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [showAddUidModal, setShowAddUidModal] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [maskApiKey, setMaskApiKey] = useState(true);

  // Profile personal settings
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  
  // Voucher action states
  const [claimVoucherCode, setClaimVoucherCode] = useState('');
  const [genVoucherCoins, setGenVoucherCoins] = useState('');
  const [genVoucherDays, setGenVoucherDays] = useState('');
  const [generatedVoucherCode, setGeneratedVoucherCode] = useState('');

  // Admin reseller creation states
  const [genResellerUsername, setGenResellerUsername] = useState('');
  const [genResellerPassword, setGenResellerPassword] = useState('');
  const [genResellerId, setGenResellerId] = useState('');
  const [genResellerLimit, setGenResellerLimit] = useState('100');
  const [genResellerCredits, setGenResellerCredits] = useState('0');
  const [generatedResellerKey, setGeneratedResellerKey] = useState('');

  // Registry List of Resellers
  const [adminResellers, setAdminResellers] = useState<any[]>([]);
  
  // Admin System configurator variables
  const [sysUpstreamKey, setSysUpstreamKey] = useState('');
  const [sysBaseUrl, setSysBaseUrl] = useState('');
  const [sysWebhookUrl, setSysWebhookUrl] = useState('');
  const [sysKeyPrefix, setSysKeyPrefix] = useState('');
  const [sysBrandName, setSysBrandName] = useState('');

  // Bot deploying states
  const [botToken, setBotToken] = useState('');
  const [botGuildId, setBotGuildId] = useState('');
  const [botChannelId, setBotChannelId] = useState('');
  const [botActive, setBotActive] = useState(false);
  const [botSuspendedReason, setBotSuspendedReason] = useState('');

  // Doc panel code snippets tab state
  const [docSnippetLang, setDocSnippetLang] = useState<'curl' | 'python' | 'node'>('curl');

  // Simulated Team Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [brandLogo, setBrandLogo] = useState('');
  const [deployConsoleLogs, setDeployConsoleLogs] = useState<string[]>([]);
  const [isDeployingBot, setIsDeployingBot] = useState(false);
  const [userExpiry, setUserExpiry] = useState('Lifetime');
  const [genResellerExpiry, setGenResellerExpiry] = useState('');

  // Auto-dismiss Alerts
  useEffect(() => {
    if (successAlert) {
      const timer = setTimeout(() => setSuccessAlert(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successAlert]);

  useEffect(() => {
    if (errorAlert) {
      const timer = setTimeout(() => setErrorAlert(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorAlert]);

  const fetchDashboardData = async (key: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard', {
        headers: { 'x-api-key': key }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setStats({
          credits: result.credits,
          activeUids: result.activeUids,
          maxLimit: result.maxLimit,
          isMaster: result.isMaster,
          ownerId: result.ownerId,
          username: result.username || ''
        });
        setIsMasterState(result.isMaster);
        setUidsList(result.uids || {});
        setAuditLogs(result.logs || []);

        if (result.systemStats) {
          setSystemStats(result.systemStats);
        }
        if (result.allUids) {
          setAllUidsList(result.allUids);
        }
        if (result.displayName) {
          setUserDisplayName(result.displayName);
        }
        if (result.avatar !== undefined) {
          setUserAvatar(result.avatar);
        }
        if (result.brandLogo !== undefined) {
          setBrandLogo(result.brandLogo);
        }
        if (result.botConfig) {
          setBotToken(result.botConfig.token || '');
          setBotGuildId(result.botConfig.guild_id || '');
          setBotChannelId(result.botConfig.channel_id || '');
          setBotActive(result.botConfig.is_active || false);
          setBotSuspendedReason(result.botConfig.suspended_reason || '');
        } else {
          setBotActive(false);
          setBotSuspendedReason('');
        }
        if (result.expiry) {
          setUserExpiry(result.expiry);
        }
        
        if (result.isMaster) {
          fetchResellersList(key);
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
      setErrorAlert('Technical failure: could not synchronize dashboard status.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResellersList = async (key: string) => {
    try {
      const res = await fetch('/api/admin/keys', {
        headers: { 'x-api-key': key }
      });
      const data = await res.json();
      if (data.success) {
        setAdminResellers(data.keys || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatMessages = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/chat', {
        headers: { 'x-api-key': apiKey }
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchDashboardData(apiKey);
      fetchLeaderboard();
      const seen = sessionStorage.getItem('welcome_seen');
      if (!seen) {
        setShowWelcome(true);
      }
      const interval = setInterval(() => {
        fetchDashboardData(apiKey);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey && activeTab === 'chat') {
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [apiKey, activeTab]);

  const fetchBotLogs = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/bot/logs', {
        headers: { 'x-api-key': apiKey }
      });
      const data = await res.json();
      if (data.success) {
        setDeployConsoleLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching bot logs:', err);
    }
  };

  useEffect(() => {
    if (apiKey && activeTab === 'bot') {
      fetchBotLogs();
      const interval = setInterval(fetchBotLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [apiKey, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword.trim()) return;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim()
        })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        sessionStorage.removeItem('welcome_seen');
        localStorage.setItem('api_key', data.apiKey);
        setIsMasterState(data.isMaster);
        setApiKey(data.apiKey);
        setShowWelcome(true);
      } else {
        setLoginError(data.error || 'Invalid username or password.');
      }
    } catch (err) {
      setLoginError('Failed to establish link with login servers.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('api_key');
    setApiKey('');
    setIsMasterState(false);
    setStats({ credits: 0, activeUids: 0, maxLimit: 100, isMaster: false, ownerId: '', username: '' });
    setUidsList({});
    setAuditLogs([]);
    setAdminResellers([]);
    setActiveTab('dashboard');
  };

  // --- BUSINESS OPERATION HANDLERS ---
  const handleAddUid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUidInput.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/uids/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          uid: addUidInput.trim(),
          days: addUidDays,
          bluestack: addUidBluestack
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert(`Authorized whitelisting: UID ${addUidInput} is now registered.`);
        setAddUidInput('');
        fetchDashboardData(apiKey);
      } else {
        setErrorAlert(data.error || 'The upstream server declined the registration.');
      }
    } catch (err) {
      setErrorAlert('Unexpected system fault while proxying whitelisting request.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUid = async (uid: string) => {
    if (!confirm(`Are you sure you want to terminate whitelisting parameters for UID ${uid}?`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/uids/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ uid })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert(`Wipe complete: terminated credentials for UID ${uid}.`);
        fetchDashboardData(apiKey);
      } else {
        setErrorAlert(data.error || 'Purge override request rejected by upstream registry.');
      }
    } catch (err) {
      setErrorAlert('Network error occurred during purging sequence.');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateUid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!migrateOldUid.trim() || !migrateNewUid.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/uids/replace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          oldUid: migrateOldUid.trim(),
          newUid: migrateNewUid.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert(`Secure Migration success: Node migrated from ${migrateOldUid} to ${migrateNewUid}.`);
        setMigrateOldUid('');
        setMigrateNewUid('');
        fetchDashboardData(apiKey);
      } else {
        setErrorAlert(data.error || 'Server rejected migration payload.');
      }
    } catch (err) {
      setErrorAlert('Network failure during node data migration.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimVoucherCode.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ code: claimVoucherCode.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert(data.message || 'Gift voucher redeemed successfully!');
        setClaimVoucherCode('');
        fetchDashboardData(apiKey);
      } else {
        setErrorAlert(data.error || 'Voucher code redemption failed.');
      }
    } catch (err) {
      setErrorAlert('Redemption servers could not be contacted.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const coinsVal = parseFloat(genVoucherCoins || '0');
    const daysVal = parseInt(genVoucherDays || '0', 10);
    if (isNaN(coinsVal) && isNaN(daysVal)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/vouchers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ amount: coinsVal, days: daysVal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedVoucherCode(data.code);
        setGenVoucherCoins('');
        setGenVoucherDays('');
        setSuccessAlert(`Gift voucher created successfully!`);
        fetchDashboardData(apiKey);
      } else {
        setErrorAlert(data.error || 'Gift voucher creation failed.');
      }
    } catch (err) {
      setErrorAlert('Technical failure generating gift voucher.');
    } finally {
      setLoading(false);
    }
  };

  // --- SYSTEM MASTER ADMIN CONTROL HANDLERS ---
  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genResellerUsername.trim() || !genResellerPassword.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          username: genResellerUsername.trim(),
          password: genResellerPassword.trim(),
          userId: genResellerId.trim() || undefined,
          maxUids: parseInt(genResellerLimit, 10) || 100,
          initialCredits: parseFloat(genResellerCredits) || 0,
          expiry: genResellerExpiry || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedResellerKey(data.key);
        setGenResellerUsername('');
        setGenResellerPassword('');
        setGenResellerId('');
        setGenResellerCredits('0');
        setGenResellerExpiry('');
        setSuccessAlert('Reseller account created successfully!');
        fetchResellersList(apiKey);
      } else {
        setErrorAlert(data.error || 'Registry reseller write operation failed.');
      }
    } catch (err) {
      setErrorAlert('Network error creating reseller entry in database.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResellerExpiry = async (resKey: string, currentExpiry: string) => {
    const promptVal = prompt('Enter new Expiration Date (YYYY-MM-DD) or leave blank for Lifetime:', currentExpiry);
    if (promptVal === null) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/keys/${resKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ expiry: promptVal.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert('Reseller expiration updated successfully!');
        fetchResellersList(apiKey);
      } else {
        setErrorAlert(data.error || 'Failed to update reseller expiry.');
      }
    } catch (err) {
      setErrorAlert('Network error updating reseller expiry.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReseller = async (resKey: string) => {
    try {
      const res = await fetch(`/api/admin/keys/${resKey}/toggle`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert(`Reseller key active status updated.`);
        fetchResellersList(apiKey);
      }
    } catch (err) {
      setErrorAlert('Status toggle failed.');
    }
  };

  const handleUpdateResellerLimit = async (resKey: string, currentLimit: number) => {
    const promptLimit = prompt(`Enter new maximum UID allocation limit (Current: ${currentLimit}):`, String(currentLimit));
    if (promptLimit === null) return;
    const numLimit = parseInt(promptLimit, 10);
    if (isNaN(numLimit)) return;

    try {
      const res = await fetch(`/api/admin/keys/${resKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ maxUids: numLimit })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert('Reseller capacity limits adjusted.');
        fetchResellersList(apiKey);
      }
    } catch (err) {
      setErrorAlert('Limits adjustments update failed.');
    }
  };

  const handleUpdateResellerCredits = async (resKey: string, currentCredits: number) => {
    const promptCredits = prompt(`Enter new credits balance (Current: ${currentCredits}):`, String(currentCredits));
    if (promptCredits === null) return;
    const numCredits = parseFloat(promptCredits);
    if (isNaN(numCredits)) return;

    try {
      const res = await fetch(`/api/admin/keys/${resKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ credits: numCredits })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert('Reseller credits balance adjusted.');
        fetchResellersList(apiKey);
      }
    } catch (err) {
      setErrorAlert('Credits adjustments update failed.');
    }
  };

  const handleUpdateResellerPassword = async (resKey: string, currentPassword: string) => {
    const promptPassword = prompt(`Enter new password for this reseller:`, currentPassword);
    if (promptPassword === null || !promptPassword.trim()) return;

    try {
      const res = await fetch(`/api/admin/keys/${resKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ password: promptPassword.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert('Reseller password updated successfully.');
        fetchResellersList(apiKey);
      }
    } catch (err) {
      setErrorAlert('Password update failed.');
    }
  };

  const handleDeleteReseller = async (resKey: string) => {
    if (!confirm('Are you sure you want to permanently delete this reseller? This action is irreversible.')) return;

    try {
      const res = await fetch(`/api/admin/keys/${resKey}`, {
        method: 'DELETE',
        headers: { 'x-api-key': apiKey }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert('Reseller wiped from system registries.');
        fetchResellersList(apiKey);
      }
    } catch (err) {
      setErrorAlert('Key deletion failed.');
    }
  };

  const handleResetFreeClaims = async () => {
    if (!confirm('Purge all whitelisted free trial UIDs? This deletes them from the database and registry servers.')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-claims', {
        method: 'POST',
        headers: { 'x-api-key': apiKey }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert(data.message || 'Free Whitelisted allocations successfully purged.');
        fetchDashboardData(apiKey);
      } else {
        setErrorAlert(data.error || 'Free claims purge failed.');
      }
    } catch (err) {
      setErrorAlert('Error processing free claims database reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEnvVariables = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          upstreamKey: sysUpstreamKey,
          baseUrl: sysBaseUrl,
          webhookUrl: sysWebhookUrl,
          prefix: sysKeyPrefix,
          brand: sysBrandName
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert('Environment configuration modified and saved.');
        setSysUpstreamKey('');
        setSysBaseUrl('');
        setSysWebhookUrl('');
        setSysKeyPrefix('');
        setSysBrandName('');
      } else {
        setErrorAlert(data.error || 'Fail to write config params to .env');
      }
    } catch (err) {
      setErrorAlert('Error saving technical env settings.');
    } finally {
      setLoading(false);
    }
  };

  const consoleEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (deployConsoleLogs.length > 0) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deployConsoleLogs]);

  const handleDeployBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim() || !botGuildId.trim() || !botChannelId.trim()) return;

    setIsDeployingBot(true);
    setDeployConsoleLogs([]);

    const timestamp = () => {
      const date = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `[${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}]`;
    };

    const addLog = (text: string) => {
      setDeployConsoleLogs(prev => [...prev, `${timestamp()} ${text}`]);
    };

    addLog('[INFO] Handshaking with bot orchestrator daemon...');

    try {
      const res = await fetch('/api/bot/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          botToken: botToken.trim(),
          guildId: botGuildId.trim(),
          channelId: botChannelId.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addLog(`[ERROR] Server validation failed: ${data.error || 'Unknown deployment error'}`);
        setIsDeployingBot(false);
        return;
      }

      addLog('[SUCCESS] Deployment request acknowledged. Spawning Discord Client...');
      // Start background logs check loop
      fetchBotLogs();
      
      // Stop the loading indicator after launch trigger
      setTimeout(() => {
        setIsDeployingBot(false);
        setBotActive(true);
        setSuccessAlert('Discord Bot deployment launched!');
        fetchDashboardData(apiKey);
      }, 1500);

    } catch (err) {
      addLog('[ERROR] Connection failed: bot deployment process launcher timed out.');
      setIsDeployingBot(false);
    }
  };

  const handleStopBot = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bot/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBotActive(false);
        setSuccessAlert('Discord Bot successfully shut down.');
        fetchDashboardData(apiKey);
      } else {
        setErrorAlert(data.error || 'Failed to stop bot client.');
      }
    } catch (err) {
      setErrorAlert('Error shutting down bot connection.');
    } finally {
      setLoading(false);
    }
  };

  // Profile Change Password Handler
  const handleProfileChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const promptPass = prompt('Enter your new password:');
    if (!promptPass || !promptPass.trim()) return;
    
    setLoading(true);
    try {
      // Find reseller key in list
      const selfKey = apiKey;
      const res = await fetch(`/api/admin/keys/${selfKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ password: promptPass.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert('Account password updated successfully.');
      } else {
        setErrorAlert('Failed to update password.');
      }
    } catch (err) {
      setErrorAlert('Technical failure updating profile password.');
    } finally {
      setLoading(false);
    }
  };

  // Update Profile Name & Avatar
  const handleUpdateProfileDetails = async (displayNameVal: string, avatarVal: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ displayName: displayNameVal, avatar: avatarVal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserDisplayName(data.displayName || displayNameVal);
        setUserAvatar(data.avatar || avatarVal);
        setSuccessAlert('Profile details updated successfully!');
      } else {
        setErrorAlert(data.error || 'Failed to update profile details.');
      }
    } catch (err) {
      setErrorAlert('Error sending profile updates.');
    } finally {
      setLoading(false);
    }
  };

  // Reset API Key
  const handleResetApiKey = async () => {
    if (!confirm('Are you sure you want to reset your API key? All your active integrations using the old key will stop working immediately.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/profile/reset-key', {
        method: 'POST',
        headers: { 'x-api-key': apiKey }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('api_key', data.newApiKey);
        setApiKey(data.newApiKey);
        setSuccessAlert('API key reset successfully!');
      } else {
        setErrorAlert(data.error || 'API key reset failed.');
      }
    } catch (err) {
      setErrorAlert('Technical failure resetting API key.');
    } finally {
      setLoading(false);
    }
  };

  // Bulk Remove selected UIDs
  const handleBulkDeleteSelected = async () => {
    if (selectedUids.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete the ${selectedUids.length} selected UIDs?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/uids/bulk-remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ uids: selectedUids })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessAlert(data.message || 'Selected UIDs deleted.');
        setSelectedUids([]);
        fetchDashboardData(apiKey);
      } else {
        setErrorAlert(data.error || 'Bulk deletion failed.');
      }
    } catch (err) {
      setErrorAlert('Technical error bulk removing UIDs.');
    } finally {
      setLoading(false);
    }
  };

  // Send message team chat handler via backend API
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const textVal = chatInput.trim();
    setChatInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ text: textVal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchChatMessages();
      } else {
        setErrorAlert(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setErrorAlert('Error connecting to chat server.');
    }
  };

  // Helper: Get remaining validity text
  const getDaysRemaining = (expiryStr: string) => {
    const expDate = new Date(expiryStr.replace(' ', 'T'));
    const diff = expDate.getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 1000 ? 'Lifetime' : `${days} Days`;
  };

  // Search filtered UIDs
  const filteredUids = Object.entries(uidsList).filter(([uid]) => 
    uid.includes(uidSearch.trim())
  );

  if (false as any) {
    console.log(leaderboard, filteredUids);
  }



  return (
    <div className="app-container">
      <SplashCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1440}
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        COLOR_UPDATE_SPEED={10}
      />
      {/* Alert Overlay Notification System */}
      {showWelcome && apiKey && (
        <WelcomeOverlay
          displayName={userDisplayName || stats.ownerId}
          role={stats.isMaster ? 'Administrator' : 'Reseller'}
          avatar={userAvatar}
          onClose={() => {
            sessionStorage.setItem('welcome_seen', 'true');
            setShowWelcome(false);
          }}
        />
      )}
      {successAlert && (
        <div className="glass-card rb-alert" style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 1000,
          borderLeft: '4px solid var(--accent-green)', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(10, 12, 16, 0.95)',
          backdropFilter: 'blur(12px)', boxShadow: '0 0 24px rgba(0,255,136,0.1)'
        }}>
          <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>SUCCESS</span>
          <span style={{ fontSize: '14px' }}>{successAlert}</span>
        </div>
      )}
      {errorAlert && (
        <div className="glass-card rb-alert" style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 1000,
          borderLeft: '4px solid var(--accent-red)', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(10, 12, 16, 0.95)',
          backdropFilter: 'blur(12px)', boxShadow: '0 0 24px rgba(255,49,49,0.1)'
        }}>
          <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>ERROR</span>
          <span style={{ fontSize: '14px' }}>{errorAlert}</span>
        </div>
      )}

      {/* --- SIDEBAR PANEL (Exactly matching custom screenshot) --- */}
      {apiKey && (
        <aside className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: sidebarCollapsed ? '80px' : '280px' }}>
          
          {/* Header section with brand avatar, titles and collapse */}
          <div className="sidebar-header">
            <div className="sidebar-brand-wrapper">
              <div style={{ position: 'relative' }}>
                <div style={{ height: '8px', width: '8px', borderRadius: '50%', background: 'var(--accent-cyan)', position: 'absolute', right: '-1px', bottom: '-1px', border: '1.5px solid var(--bg-secondary)' }} className="pulse"></div>
                <img 
                  src={
                    brandLogo 
                      ? brandLogo 
                      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300f2fe'%3E%3Cpath d='M12 2L2 22h20L12 2zm0 3.99L18.86 19H5.14L12 5.99zM11 11h2v4h-2v-4zm0 6h2v2h-2v-2z'/%3E%3C/svg%3E"
                  } 
                  alt="Avatar" 
                  className="sidebar-avatar" 
                  style={{ objectFit: 'cover' }}
                />
              </div>
              {!sidebarCollapsed && (
                <div className="sidebar-brand-info">
                  <span className="sidebar-title">UID Manager</span>
                  <span className="sidebar-subtitle">{stats.isMaster ? 'ADMIN PANEL' : 'RESELLER PANEL'}</span>
                </div>
              )}
            </div>
            
            <button className="sidebar-collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? '»' : '«'}
            </button>
          </div>

          {/* Navigation Items (Sections: Menu, Social, Insights) */}
          <div className="sidebar-nav">
            
            {/* Section: MENU */}
            {!sidebarCollapsed && <div className="sidebar-section-title">Menu</div>}
            <button className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}>
              <DashboardIcon />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>
            
            <button className={`sidebar-btn ${activeTab === 'apikey' ? 'active' : ''}`} onClick={() => { setActiveTab('apikey'); setSidebarOpen(false); }}>
              <KeyIcon />
              {!sidebarCollapsed && <span>{stats.isMaster ? 'Keys Directory' : 'My API Key'}</span>}
            </button>
            
            <button className={`sidebar-btn ${activeTab === 'apidocs' ? 'active' : ''}`} onClick={() => { setActiveTab('apidocs'); setSidebarOpen(false); }}>
              <BookIcon />
              {!sidebarCollapsed && <span>API Docs</span>}
            </button>

            <button className={`sidebar-btn ${activeTab === 'bot' ? 'active' : ''}`} onClick={() => { setActiveTab('bot'); setSidebarOpen(false); }}>
              <SwapIcon />
              {!sidebarCollapsed && <span>Bot Deploy</span>}
            </button>

            {/* Section: SOCIAL */}
            {!sidebarCollapsed && <div className="sidebar-section-title">Social</div>}
            <button className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}>
              <UserIcon />
              {!sidebarCollapsed && <span>My Profile</span>}
            </button>
            
            <button className={`sidebar-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }}>
              <MessageIcon />
              {!sidebarCollapsed && <span>Team Chat</span>}
            </button>

            {/* Section: INSIGHTS */}
            {!sidebarCollapsed && <div className="sidebar-section-title">Insights</div>}
            <button className={`sidebar-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}>
              <ChartIcon />
              {!sidebarCollapsed && <span>Analytics</span>}
            </button>
            
            <button className={`sidebar-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => { setActiveTab('logs'); setSidebarOpen(false); }}>
              <LogIcon />
              {!sidebarCollapsed && <span>Activity Log</span>}
            </button>

            {isMasterState && (
              <>
                {!sidebarCollapsed && <div className="sidebar-section-title">Admin Controls</div>}
                <button className={`sidebar-btn ${activeTab === 'resellers' ? 'active' : ''}`} onClick={() => { setActiveTab('resellers'); setSidebarOpen(false); }}>
                  <ShieldIcon />
                  {!sidebarCollapsed && <span>Resellers Registry</span>}
                </button>
                <button className={`sidebar-btn ${activeTab === 'purge' ? 'active' : ''}`} onClick={() => { setActiveTab('purge'); setSidebarOpen(false); }}>
                  <TrashIcon />
                  {!sidebarCollapsed && <span>Purge Gate</span>}
                </button>
                <button className={`sidebar-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => { setActiveTab('system'); setSidebarOpen(false); }}>
                  <KeyIcon />
                  {!sidebarCollapsed && <span>System Config</span>}
                </button>
              </>
            )}

          </div>

          {/* Bottom Footer Section with API toggle & profile card */}
          <div className="sidebar-footer">
            
            {!sidebarCollapsed && (
              <div className="api-access-wrapper">
                <span className="api-access-label">API Access</span>
                <span className="api-access-status" style={{
                  background: apiAccessEnabled ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 49, 49, 0.1)',
                  color: apiAccessEnabled ? 'var(--accent-green)' : 'var(--accent-red)'
                }} onClick={() => setApiAccessEnabled(!apiAccessEnabled)}>
                  {apiAccessEnabled ? 'On' : 'Off'}
                </span>
              </div>
            )}

            <div className="sidebar-profile-card">
              <div className="profile-avatar-info">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" style={{ height: '30px', width: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: '30px', width: '30px', borderRadius: '50%', background: '#ff3366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', color: '#fff' }}>
                    {stats.isMaster ? 'A' : 'R'}
                  </div>
                )}
                {!sidebarCollapsed && (
                  <div className="profile-info">
                    <span className="profile-name">{userDisplayName || stats.ownerId || 'Mani272'}</span>
                    <span className="profile-role">{stats.isMaster ? 'Administrator' : 'Reseller'}</span>
                  </div>
                )}
              </div>
              <button className="profile-logout-btn" onClick={handleLogout} title="Logout Account">
                <LogoutIcon />
              </button>
            </div>

          </div>

        </aside>
      )}

      {/* --- CONTENT AREA WRAPPER --- */}
      <div className="content-wrapper">
        
        {/* Mobile screen hamburger toggle header */}
        {apiKey && (
          <header className="mobile-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px' }}>
                <span className="text-gradient-cyan">MANI272</span> BYPASS
              </span>
            </div>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
          </header>
        )}

        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          {/* ReactBits Floating Lines WebGL Background */}
          <FloatingLines
            speed={0.8}
            lineCount={14}
            interactive={true}
            lineColor={[
              [0.0, 0.949, 0.996],
              [0.384, 0.2,  0.878],
              [0.914, 0.278, 0.961],
            ]}
            style={{ opacity: 0.18 }}
          />
          
          {/* LOGIN WINDOW SCREEN (When NOT Authenticated) */}
          {!apiKey ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '80vh',
              width: '100%',
              background: 'var(--bg-primary)',
              padding: '20px'
            }}>
              <div className="glass-card glass-card-glow" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '10px' }}>
                  <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid var(--border-glass-glow)', marginBottom: '16px' }}>
                    <KeyIcon />
                  </div>
                   <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>
                    <GlitchText enableOnHover speed={1.5} color="#fff">Security authentication</GlitchText>
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sign in to manage active whitelisting nodes</p>
                </div>

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Username</label>
                    <input type="text" placeholder="Enter username" className="glow-input" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} required />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Password</label>
                    <input type="password" placeholder="Enter password" className="glow-input" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                  </div>
                  {loginError && <p style={{ color: 'var(--accent-red)', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>{loginError}</p>}
                  
                  <button type="submit" className="btn-neon" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} disabled={loading}>
                    {loading ? <span className="spinner">⌛</span> : 'VERIFY & AUTHENTICATE'}
                  </button>
                </form>

                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <InfoIcon />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Whitelists are automatically routed through edge bypass proxy gateways in real-time.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            
            /* TAB RENDERS AREA (When Authenticated) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Core metrics counters */}
              {activeTab !== 'apidocs' && activeTab !== 'chat' && activeTab !== 'system' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '8px' }}>
                  {activeTab === 'dashboard' || activeTab === 'analytics' ? (
                    <>
                      {/* Card 1: Total UIDs */}
                      <GlowCard style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total UIDs</span>
                          <UsersIcon />
                        </div>
                        <div style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                          <CountUp target={systemStats.totalUids} />
                        </div>
                      </GlowCard>

                      {/* Card 2: My UIDs or Active Admins */}
                      <GlowCard style={{ borderLeft: '3px solid var(--accent-purple)' }} glowColor="rgba(155,81,224,0.15)">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            {activeTab === 'analytics' ? 'Active Admins' : 'My UIDs'}
                          </span>
                          <ShieldIcon />
                        </div>
                        <div style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                          <CountUp target={activeTab === 'analytics' ? systemStats.activeAdmins : stats.activeUids} />
                        </div>
                      </GlowCard>

                      {/* Card 3: Added Today */}
                      <GlowCard style={{ borderLeft: '3px solid var(--accent-green)' }} glowColor="rgba(0,255,136,0.15)">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Added Today</span>
                          <CoinsIcon />
                        </div>
                        <div style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                          <CountUp target={systemStats.addedToday} />
                        </div>
                      </GlowCard>

                      {/* Card 4: Expiring Soon */}
                      <GlowCard style={{ borderLeft: '3px solid var(--accent-red)' }} glowColor="rgba(255,49,49,0.15)">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Expiring Soon</span>
                          <TrophyIcon />
                        </div>
                        <div style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                          <CountUp target={systemStats.expiringSoon} />
                        </div>
                      </GlowCard>
                    </>
                  ) : (
                    <>
                      {/* Fallback metrics for other pages */}
                      <div className="glass-card" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Wallet Balance</span>
                          <CoinsIcon />
                        </div>
                        <div style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 800 }} className="text-gradient-cyan">
                          {stats.credits.toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 500 }}>Coins</span>
                        </div>
                      </div>

                      <div className="glass-card" style={{ borderLeft: '3px solid var(--accent-purple)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Whitelisted Capacity</span>
                          <UsersIcon />
                        </div>
                        <div style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 800 }} className="text-gradient-purple">
                          {stats.activeUids} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {stats.maxLimit} max</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB CONTENT: Registered Account IDs (Dashboard) */}
              {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Dashboard header and search controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        <GradientText colors={['#00f2fe', '#9b51e0', '#00ff88', '#00f2fe']} speed={6} fontSize="20px">
                          Registered Account IDs
                        </GradientText>
                      </h2>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {dashboardFilter === 'my' 
                          ? `${stats.activeUids} of ${systemStats.totalUids} total` 
                          : `${systemStats.totalUids} total UIDs in registry`
                        }
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      
                      {/* Search Input */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          placeholder="Search UID..." 
                          className="glow-input" 
                          style={{ padding: '8px 12px 8px 32px', fontSize: '13px', width: '220px' }} 
                          value={uidSearch} 
                          onChange={e => setUidSearch(e.target.value)} 
                        />
                        <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', fontSize: '14px' }}>🔍</span>
                      </div>

                      {/* Filter pills: My UIDs / All Admins */}
                      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '2px' }}>
                        <button 
                          className={`sidebar-btn`} 
                          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: 'none', background: dashboardFilter === 'my' ? 'rgba(0, 242, 254, 0.05)' : 'transparent', color: dashboardFilter === 'my' ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: 600, minWidth: '80px', height: 'auto', margin: 0, boxShadow: 'none' }} 
                          onClick={() => { setDashboardFilter('my'); setSelectedUids([]); }}
                        >
                          My UIDs
                        </button>
                        <button 
                          className={`sidebar-btn`} 
                          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: 'none', background: dashboardFilter === 'all' ? 'rgba(0, 242, 254, 0.05)' : 'transparent', color: dashboardFilter === 'all' ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: 600, minWidth: '90px', height: 'auto', margin: 0, boxShadow: 'none' }} 
                          onClick={() => { setDashboardFilter('all'); setSelectedUids([]); }}
                        >
                          All Admins
                        </button>
                      </div>

                      {/* Select Expired button */}
                      <button 
                        className="btn-neon btn-neon-red" 
                        style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600 }}
                        onClick={() => {
                          const shownUidsList = dashboardFilter === 'my' 
                            ? Object.entries(uidsList) 
                            : Object.entries(allUidsList).map(([uid, val]: any) => [uid, val]);
                          const expired = shownUidsList
                            .filter(([uid, data]: any) => {
                              const isOwn = stats.isMaster || !!uidsList[uid];
                              return isOwn && getDaysRemaining(data.expiry) === 'Expired';
                            })
                            .map(([uid]) => uid);
                          if (expired.length === 0) {
                            setSuccessAlert('No expired UIDs found in the current view.');
                          } else {
                            setSelectedUids(expired);
                            setSuccessAlert(`Selected ${expired.length} expired UIDs.`);
                          }
                        }}
                      >
                        Select Expired
                      </button>

                      {/* Add UID button */}
                      <button 
                        className="btn-neon btn-neon-green" 
                        style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setShowAddUidModal(true)}
                      >
                        ➕ Add UID
                      </button>

                    </div>
                  </div>

                  {/* Registered Account IDs Table Card */}
                  <div className="glass-card">
                    <div className="table-container">
                      <table className="custom-table" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}>
                              <input 
                                type="checkbox" 
                                checked={
                                  (() => {
                                    const shownUids = (dashboardFilter === 'my' 
                                      ? Object.keys(uidsList) 
                                      : Object.keys(allUidsList)
                                    ).filter(uid => {
                                      const isOwn = stats.isMaster || !!uidsList[uid];
                                      return isOwn && uid.includes(uidSearch.trim());
                                    });
                                    return shownUids.length > 0 && shownUids.every(uid => selectedUids.includes(uid));
                                  })()
                                }
                                onChange={(e) => {
                                  const shownUids = (dashboardFilter === 'my' 
                                    ? Object.keys(uidsList) 
                                    : Object.keys(allUidsList)
                                  ).filter(uid => {
                                    const isOwn = stats.isMaster || !!uidsList[uid];
                                    return isOwn && uid.includes(uidSearch.trim());
                                  });
                                  if (e.target.checked) {
                                    setSelectedUids(prev => [...new Set([...prev, ...shownUids])]);
                                  } else {
                                    setSelectedUids(prev => prev.filter(uid => !shownUids.includes(uid)));
                                  }
                                }}
                              />
                            </th>
                            <th>ACCOUNT ID</th>
                            <th>ADDED BY</th>
                            <th>ADDED</th>
                            <th>EXPIRES</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const shownUidsList = dashboardFilter === 'my' 
                              ? Object.entries(uidsList) 
                              : Object.entries(allUidsList);
                            
                            const filtered = shownUidsList.filter(([uid]) => uid.includes(uidSearch.trim()));

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No registered account IDs found matching your view/search filter.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map(([uid, data]: any) => {
                              const daysLeft = getDaysRemaining(data.expiry);
                              const isExpired = daysLeft === 'Expired';
                              const addedBy = data.added_by || (stats.isMaster ? 'Master Admin' : 'Mani272');
                              
                              return (
                                <tr key={uid}>
                                  <td>
                                    {(stats.isMaster || !!uidsList[uid]) ? (
                                      <input 
                                        type="checkbox" 
                                        checked={selectedUids.includes(uid)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedUids(prev => [...prev, uid]);
                                          } else {
                                            setSelectedUids(prev => prev.filter(x => x !== uid));
                                          }
                                        }}
                                      />
                                    ) : (
                                      <input type="checkbox" disabled style={{ opacity: 0.3 }} />
                                    )}
                                  </td>
                                  <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{uid}</td>
                                  <td style={{ color: 'var(--text-muted)' }}>{addedBy}</td>
                                  <td style={{ fontSize: '12px' }}>{data.added_on}</td>
                                  <td style={{ fontSize: '12px' }}>{data.expiry}</td>
                                  <td>
                                    <span className={`status-badge ${isExpired ? 'status-badge-suspended' : 'status-badge-active'}`}>
                                      {daysLeft}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    {(stats.isMaster || !!uidsList[uid]) ? (
                                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button 
                                          className="profile-logout-btn" 
                                          style={{ padding: '6px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)' }}
                                          title="Migrate UID"
                                          onClick={() => {
                                            setMigrateOldUid(uid);
                                            setShowMigrateModal(true);
                                          }}
                                        >
                                          ✏️
                                        </button>
                                        <button 
                                          className="profile-logout-btn" 
                                          style={{ padding: '6px', background: 'rgba(255, 49, 49, 0.05)', border: '1px solid rgba(255, 49, 49, 0.1)', color: 'var(--accent-red)' }} 
                                          title="Terminate UID"
                                          onClick={() => handleRemoveUid(uid)}
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Locked</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sticky Bulk Action Bar */}
                  {selectedUids.length > 0 && (
                    <div style={{
                      position: 'fixed',
                      bottom: '24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(20, 20, 25, 0.9)',
                      border: '1px solid var(--accent-red)',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      zIndex: 1000,
                      backdropFilter: 'blur(12px)'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedUids.length} UIDs selected</span>
                      <button 
                        className="btn-neon btn-neon-red" 
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                        onClick={handleBulkDeleteSelected}
                      >
                        Delete Selected
                      </button>
                      <button 
                        className="btn-neon" 
                        style={{ padding: '8px 16px', fontSize: '12px', background: 'transparent', border: '1px solid var(--border-glass)' }}
                        onClick={() => setSelectedUids([])}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Add UID Modal Dialog Overlay */}
                  {showAddUidModal && (
                    <div style={{
                      position: 'fixed',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 2000,
                      backdropFilter: 'blur(4px)'
                    }}>
                      <div className="glass-card glass-card-glow" style={{ width: '100%', maxWidth: '420px', margin: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Authorize New UID Node</h3>
                          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowAddUidModal(false)}>×</button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddUid(e); setShowAddUidModal(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>UID / Account ID</label>
                            <input type="text" placeholder="e.g. 524104278..." className="glow-input" value={addUidInput} onChange={e => setAddUidInput(e.target.value)} required />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Term Validity</label>
                            <select className="glow-input" value={addUidDays} onChange={e => setAddUidDays(e.target.value)}>
                              <option value="1">1 Day (0.50 Coins)</option>
                              <option value="7">7 Days (2.40 Coins)</option>
                              <option value="15">15 Days (3.40 Coins)</option>
                              <option value="30">30 Days (5.30 Coins)</option>
                              <option value="36500">Lifetime (50.00 Coins)</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" id="modal-bluestack" checked={addUidBluestack} onChange={e => setAddUidBluestack(e.target.checked)} />
                            <label htmlFor="modal-bluestack" style={{ fontSize: '12px', cursor: 'pointer' }}>Require Bluestacks Emulator Bypass</label>
                          </div>
                          <button type="submit" className="btn-neon btn-neon-green" style={{ width: '100%', fontSize: '13px', marginTop: '8px', padding: '10px' }}>
                            AUTHORIZE ACCESS
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Migrate UID Modal Dialog Overlay */}
                  {showMigrateModal && (
                    <div style={{
                      position: 'fixed',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 2000,
                      backdropFilter: 'blur(4px)'
                    }}>
                      <div className="glass-card glass-card-glow" style={{ width: '100%', maxWidth: '420px', margin: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Migrate Access Node</h3>
                          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowMigrateModal(false)}>×</button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleMigrateUid(e); setShowMigrateModal(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Current UID Location</label>
                            <input type="text" className="glow-input" value={migrateOldUid} readOnly style={{ opacity: 0.7 }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>New Destination UID</label>
                            <input type="text" placeholder="e.g. 84210459..." className="glow-input" value={migrateNewUid} onChange={e => setMigrateNewUid(e.target.value)} required />
                          </div>
                          <button type="submit" className="btn-neon btn-neon-purple" style={{ width: '100%', fontSize: '13px', marginTop: '8px', padding: '10px' }}>
                            EXECUTE MIGRATION
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB CONTENT: API License Keys Registry / Management */}
              {activeTab === 'apikey' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* If Logged in as Admin: show full Resellers Directory and registry */}
                  {stats.isMaster ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Create reseller */}
                      <div className="glass-card">
                        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Create New Reseller Profile</h3>
                        <form onSubmit={handleCreateReseller} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Username</label>
                            <input type="text" placeholder="Login username" className="glow-input" value={genResellerUsername} onChange={e => setGenResellerUsername(e.target.value)} required />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Password</label>
                            <input type="text" placeholder="Account password" className="glow-input" value={genResellerPassword} onChange={e => setGenResellerPassword(e.target.value)} required />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Discord ID (Optional)</label>
                            <input type="text" placeholder="14579318..." className="glow-input" value={genResellerId} onChange={e => setGenResellerId(e.target.value)} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Max UID Limit</label>
                            <input type="number" className="glow-input" value={genResellerLimit} onChange={e => setGenResellerLimit(e.target.value)} required />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Initial Credits Coins</label>
                            <input type="number" step="0.1" className="glow-input" value={genResellerCredits} onChange={e => setGenResellerCredits(e.target.value)} required />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Expiry Date (Optional)</label>
                            <input type="date" className="glow-input" value={genResellerExpiry} onChange={e => setGenResellerExpiry(e.target.value)} />
                          </div>
                          <div>
                            <button type="submit" className="btn-neon btn-neon-green" style={{ width: '100%', fontSize: '13px' }}>
                              MINT PROFILE
                            </button>
                          </div>
                        </form>

                        {generatedResellerKey && (
                          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0, 255, 136, 0.03)', border: '1px dashed var(--accent-green)', borderRadius: '6px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>RESELLER LICENSE KEY GENERATED</div>
                            <code style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: 'bold', wordBreak: 'break-all' }}>{generatedResellerKey}</code>
                          </div>
                        )}
                      </div>

                      {/* Resellers registry */}
                      <div className="glass-card">
                        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Active Resellers Registry ({adminResellers.length})</h3>
                        <div className="table-container">
                          <table className="custom-table" style={{ fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th>Username</th>
                                <th>Password</th>
                                <th>Discord ID</th>
                                <th>Active UIDs</th>
                                <th>Max Limit</th>
                                <th>Credits Coins</th>
                                <th>Requests</th>
                                <th>Created On</th>
                                <th>Expiry</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminResellers.map(res => (
                                <tr key={res.key}>
                                  <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{res.username || 'N/A'}</td>
                                  <td><code>{res.password || 'N/A'}</code></td>
                                  <td><span style={{ color: 'var(--text-muted)' }}>{res.owner_id}</span></td>
                                  <td style={{ fontWeight: 600 }}>{res.active_uids}</td>
                                  <td>{res.max_uids}</td>
                                  <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{res.credits.toFixed(2)}</td>
                                  <td>{res.requests_count}</td>
                                  <td style={{ fontSize: '10px' }}>{res.created_at}</td>
                                  <td style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>{res.expiry || 'Lifetime'}</td>
                                  <td>
                                    <span className={`status-badge ${res.is_active ? 'status-badge-active' : 'status-badge-suspended'}`}>
                                      {res.is_active ? 'Active' : 'Suspended'}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button className="btn-neon" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleToggleReseller(res.key)}>
                                        Toggle Status
                                      </button>
                                      <button className="btn-neon btn-neon-purple" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleUpdateResellerPassword(res.key, res.password)}>
                                        Change Password
                                      </button>
                                      <button className="btn-neon btn-neon-green" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleUpdateResellerCredits(res.key, res.credits)}>
                                        Adjust Credits
                                      </button>
                                      <button className="btn-neon btn-neon-purple" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleUpdateResellerLimit(res.key, res.max_uids)}>
                                        Adjust Limit
                                      </button>
                                      <button className="btn-neon btn-neon-purple" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleUpdateResellerExpiry(res.key, res.expiry)}>
                                        Adjust Expiry
                                      </button>
                                      <button className="btn-neon btn-neon-red" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleDeleteReseller(res.key)}>
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  ) : (
                    
                    /* If Logged in as Reseller: show their specific Key information + Whitelist manager */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>My API Key</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Use this key to authenticate API requests</p>
                      </div>

                      <div className="glass-card" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                        
                        {/* YOUR API KEY card */}
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>YOUR API KEY</label>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                              type={maskApiKey ? 'password' : 'text'} 
                              className="glow-input" 
                              style={{ fontFamily: maskApiKey ? 'initial' : 'monospace', fontSize: '13px', letterSpacing: maskApiKey ? '4px' : '0.5px' }} 
                              value={apiKey} 
                              readOnly 
                            />
                            
                            {/* Toggle visibility eye button */}
                            <button 
                              className="profile-logout-btn" 
                              style={{ padding: '8px 12px', border: '1px solid var(--border-glass)' }}
                              onClick={() => setMaskApiKey(!maskApiKey)}
                              title={maskApiKey ? 'Show key' : 'Hide key'}
                            >
                              👁️
                            </button>

                            {/* Copy button */}
                            <button 
                              className="profile-logout-btn" 
                              style={{ padding: '8px 12px', border: '1px solid var(--border-glass)' }}
                              onClick={() => {
                                navigator.clipboard.writeText(apiKey);
                                setSuccessAlert('API key copied to clipboard!');
                              }}
                              title="Copy API key"
                            >
                              📋
                            </button>
                          </div>
                        </div>

                        {/* RESET KEY section */}
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 600 }}>RESET KEY</h4>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expires In (days)</label>
                              <input 
                                type="number" 
                                className="glow-input" 
                                style={{ width: '80px', padding: '6px 10px', fontSize: '12px' }} 
                                value="0" 
                                readOnly 
                              />
                            </div>
                            <button 
                              className="btn-neon" 
                              style={{ padding: '8px 20px', fontSize: '12px', background: '#fff', color: '#000', fontWeight: 'bold', border: 'none', alignSelf: 'flex-end' }}
                              onClick={handleResetApiKey}
                            >
                              Reset Key
                            </button>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            0 days = never expires. Old key stops working immediately.
                          </span>
                        </div>

                        {/* Circular plus button at bottom right */}
                        <div 
                          style={{
                            height: '32px',
                            width: '32px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-glass)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            cursor: 'pointer',
                            position: 'absolute',
                            right: '20px',
                            bottom: '20px',
                            color: 'var(--text-muted)'
                          }}
                          onClick={() => setSuccessAlert('Additional API parameters config desk.')}
                        >
                          +
                        </div>

                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* TAB CONTENT: API Reference Documentation */}
              {activeTab === 'apidocs' && (
                <div className="glass-card">
                  <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Bypass registry API Reference Documentation</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                    Integrate your reseller whitelisting node registry directly in scripts or bot commands using standard REST APIs.
                  </p>

                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '20px' }}>
                    <button className={`btn-neon ${docSnippetLang === 'curl' ? 'btn-neon-purple' : ''}`} style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setDocSnippetLang('curl')}>cURL</button>
                    <button className={`btn-neon ${docSnippetLang === 'python' ? 'btn-neon-purple' : ''}`} style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setDocSnippetLang('python')}>Python</button>
                    <button className={`btn-neon ${docSnippetLang === 'node' ? 'btn-neon-purple' : ''}`} style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setDocSnippetLang('node')}>Node.js</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>1. Add/Whitelist UID Node (POST)</h4>
                      <div className="code-container">
                        {docSnippetLang === 'curl' ? (
`curl -X POST http://localhost:3000/api/uids/add \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || 'sk_your_api_key'}" \\
  -d '{"uid": "51240182", "days": 30}'`
                        ) : docSnippetLang === 'python' ? (
`import requests

url = "http://localhost:3000/api/uids/add"
headers = {
    "x-api-key": "${apiKey || 'sk_your_api_key'}",
    "Content-Type": "application/json"
}
payload = {
    "uid": "51240182",
    "days": 30
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
                        ) : (
`const axios = require('axios');

axios.post('http://localhost:3000/api/uids/add', {
  uid: '51240182',
  days: 30
}, {
  headers: { 'x-api-key': '${apiKey || 'sk_your_api_key'}' }
})
.then(res => console.log(res.data))
.catch(err => console.error(err));`
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>2. Terminate/Remove UID Node (POST)</h4>
                      <div className="code-container">
                        {docSnippetLang === 'curl' ? (
`curl -X POST http://localhost:3000/api/uids/remove \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || 'sk_your_api_key'}" \\
  -d '{"uid": "51240182"}'`
                        ) : docSnippetLang === 'python' ? (
`import requests

url = "http://localhost:3000/api/uids/remove"
headers = {
    "x-api-key": "${apiKey || 'sk_your_api_key'}",
    "Content-Type": "application/json"
}
payload = {
    "uid": "51240182"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
                        ) : (
`const axios = require('axios');

axios.post('http://localhost:3000/api/uids/remove', {
  uid: '51240182'
}, {
  headers: { 'x-api-key': '${apiKey || 'sk_your_api_key'}' }
})
.then(res => console.log(res.data))
.catch(err => console.error(err));`
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Reseller Profile Details */}
              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '6px' }}>My Profile</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Manage your account information</p>
                  </div>

                  <div className="glass-card" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Profile Header Avatar & Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ height: '10px', width: '10px', borderRadius: '50%', background: 'var(--accent-green)', position: 'absolute', right: '-2px', bottom: '-2px', border: '2px solid var(--bg-card)' }} className="pulse"></div>
                        <img 
                          src={userAvatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300f2fe'%3E%3Cpath d='M12 2L2 22h20L12 2zm0 3.99L18.86 19H5.14L12 5.99zM11 11h2v4h-2v-4zm0 6h2v2h-2v-2z'/%3E%3C/svg%3E"} 
                          alt="Avatar" 
                          style={{ width: '80px', height: '80px', borderRadius: '12px', border: '1.5px solid var(--accent-cyan)', objectFit: 'cover' }} 
                        />
                      </div>
                      {isEditingProfile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Display Name</label>
                            <input 
                              type="text" 
                              className="glow-input" 
                              value={editDisplayName} 
                              onChange={e => setEditDisplayName(e.target.value)} 
                              placeholder="Enter display name"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Avatar URL</label>
                            <input 
                              type="text" 
                              className="glow-input" 
                              value={editAvatarUrl} 
                              onChange={e => setEditAvatarUrl(e.target.value)} 
                              placeholder="Enter avatar image URL"
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                            <button className="btn-neon btn-neon-green" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={async () => {
                              await handleUpdateProfileDetails(editDisplayName, editAvatarUrl);
                              setIsEditingProfile(false);
                            }}>Save</button>
                            <button className="btn-neon" style={{ padding: '6px 16px', fontSize: '12px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }} onClick={() => {
                              setIsEditingProfile(false);
                            }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>{userDisplayName || stats.username || stats.ownerId || 'Mani272'}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stats.isMaster ? 'Administrator' : 'Reseller'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-neon" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => {
                              setEditDisplayName(userDisplayName || stats.username || stats.ownerId || 'Mani272');
                              setEditAvatarUrl(userAvatar);
                              setIsEditingProfile(true);
                            }}>Edit Profile</button>
                            <button className="btn-neon" style={{ padding: '6px 16px', fontSize: '12px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }} onClick={() => handleUpdateProfileDetails('', '')}>Remove</button>
                          </div>
                        </div>
                      )}
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

                    {/* Inputs Row 1: Username & Role */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Username</label>
                        <input type="text" className="glow-input" value={stats.username || stats.ownerId || 'Mani272'} readOnly style={{ color: '#fff', cursor: 'default' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Role</label>
                        <input type="text" className="glow-input" value={stats.isMaster ? 'Administrator' : 'Reseller'} readOnly style={{ color: '#fff', cursor: 'default' }} />
                      </div>
                    </div>

                    {/* Inputs Row 2: UID Limit & UIDs Used */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>UID Limit</label>
                        <input type="text" className="glow-input" value={stats.maxLimit >= 9999 ? 'Unlimited' : stats.maxLimit} readOnly style={{ color: '#fff', cursor: 'default' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>UIDs Used</label>
                        <input type="text" className="glow-input" value={`${stats.activeUids} / ${stats.maxLimit >= 9999 ? '∞' : stats.maxLimit}`} readOnly style={{ color: '#fff', cursor: 'default' }} />
                      </div>
                    </div>

                    {/* Inputs Row 3: Account Expires */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Account Expires</label>
                      <input type="text" className="glow-input" value={userExpiry || 'Lifetime'} readOnly style={{ color: '#fff', cursor: 'default' }} />
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

                    {/* Permissions Section */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>Permissions</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <span style={{
                          background: 'rgba(0, 255, 136, 0.1)',
                          color: 'var(--accent-green)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          border: '1px solid rgba(0, 255, 136, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}>
                          ✓ API Access
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Change Account Credentials */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Manage Account Security</h3>
                    <form onSubmit={handleProfileChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        Update the password you use to log in to this locally hosted reseller command suite console.
                      </p>
                      <button type="submit" className="btn-neon btn-neon-purple" style={{ fontSize: '13px' }}>
                        CHANGE SECURITY PASSWORD
                      </button>
                    </form>
                  </div>

                  {/* Generate Voucher (Master Admin Only) */}
                  {isMasterState && (
                    <div className="glass-card">
                      <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><GiftIcon /> Generate Gift Voucher</h3>
                      <form onSubmit={handleCreateVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Credit Amount (Coins)</label>
                          <input type="number" step="0.01" placeholder="Coins amount to credit" className="glow-input" value={genVoucherCoins} onChange={e => setGenVoucherCoins(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Bonus Whitelist Days</label>
                          <input type="number" placeholder="Bonus days (optional)" className="glow-input" value={genVoucherDays} onChange={e => setGenVoucherDays(e.target.value)} />
                        </div>
                        <button type="submit" className="btn-neon btn-neon-purple" style={{ fontSize: '13px' }}>
                          GENERATE GIFT VOUCHER
                        </button>
                      </form>

                      {generatedVoucherCode && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(155, 81, 224, 0.03)', border: '1px dashed var(--accent-purple)', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>GIFT VOUCHER CODE GENERATED</div>
                          <code style={{ fontSize: '14px', color: 'var(--accent-purple)', fontWeight: 'bold' }}>{generatedVoucherCode}</code>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Redeem Gift Voucher (Resellers & Admins) */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><GiftIcon /> Redeem Gift Voucher</h3>
                    <form onSubmit={handleClaimVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Voucher Code</label>
                        <input type="text" placeholder="Enter voucher code (e.g. GIFT-XXXX)" className="glow-input" value={claimVoucherCode} onChange={e => setClaimVoucherCode(e.target.value)} required />
                      </div>
                      <button type="submit" className="btn-neon btn-neon-green" style={{ fontSize: '13px' }}>
                        REDEEM GIFT VOUCHER
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Team Chat (Mock) */}
              {activeTab === 'chat' && (
                <div className="glass-card">
                  <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Announcements & Reseller Team Chat</h3>
                  <div className="chat-container">
                    <div className="chat-messages">
                      {chatMessages.map(msg => (
                        <div key={msg.id} className={`chat-bubble ${msg.sent ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                          <div style={{ fontSize: '10px', color: msg.sent ? '#000' : 'var(--accent-cyan)', marginBottom: '4px', opacity: 0.8, fontWeight: 'bold' }}>
                            {msg.sender}
                          </div>
                          <div>{msg.text}</div>
                        </div>
                      ))}
                    </div>
                    
                    <form onSubmit={handleSendChatMessage} className="chat-input-bar">
                      <input type="text" placeholder="Type message to support team..." className="glow-input" style={{ flex: 1 }} value={chatInput} onChange={e => setChatInput(e.target.value)} />
                      <button type="submit" className="btn-neon btn-neon-purple" style={{ padding: '10px 20px' }}>SEND</button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Redesigned Analytics tab showing Live Reseller analytics */}
              {activeTab === 'analytics' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  
                  {/* Left Column: UIDs Added chart + Activity Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* UIDs Added (Last 7 Days) */}
                    <div className="glass-card">
                      <h3 style={{ fontSize: '15px', marginBottom: '20px', fontWeight: 600 }}>UIDs Added (Last 7 Days)</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', padding: '10px 0' }}>
                        {(() => {
                          const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                          const last7Days = [];
                          
                          for (let i = 6; i >= 0; i--) {
                            const d = new Date();
                            d.setDate(d.getDate() - i);
                            const dateStr = d.toISOString().split('T')[0];
                            const dayIndex = d.getDay();
                            // Adjust getDay() (where 0 is Sunday) to match our label array
                            const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                            const label = daysOfWeek[adjustedIndex];
                            
                            let count = 0;
                            Object.values(allUidsList).forEach((uidData: any) => {
                              if (uidData.added_on && uidData.added_on.startsWith(dateStr)) {
                                count++;
                              }
                            });
                            
                            last7Days.push({ label, count });
                          }

                          const maxCount = Math.max(...last7Days.map(d => d.count), 1);

                          return last7Days.map((d, i) => {
                            const percentHeight = (d.count / maxCount) * 100;
                            return (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{d.count}</div>
                                <div style={{ 
                                  width: '12px', 
                                  height: `${percentHeight * 1.2}px`, 
                                  maxHeight: '120px',
                                  background: i === 6 ? 'var(--accent-cyan)' : 'rgba(0, 242, 254, 0.2)', 
                                  borderRadius: '4px',
                                  transition: 'height 0.5s ease'
                                }}></div>
                                <div style={{ fontSize: '11px', fontWeight: 600 }}>{d.label}</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Activity Breakdown (7 Days) */}
                    <div className="glass-card">
                      <h3 style={{ fontSize: '15px', marginBottom: '16px', fontWeight: 600 }}>Activity Breakdown (7 Days)</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(() => {
                          const counts: Record<string, number> = {
                            'bulk_remove': 0,
                            'add_uid': 0,
                            'remove_uid': 0,
                            'migrate_uid': 0
                          };
                          
                          const sevenDaysAgo = new Date();
                          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                          
                          auditLogs.forEach(log => {
                            const logDate = new Date(log.timestamp.replace(' ', 'T'));
                            if (logDate >= sevenDaysAgo) {
                              if (log.action === 'add') counts['add_uid']++;
                              else if (log.action === 'remove') counts['remove_uid']++;
                              else if (log.action === 'replace') counts['migrate_uid']++;
                              
                              if (log.details?.details?.action_type === 'bulk_remove') {
                                counts['bulk_remove']++;
                              }
                            }
                          });

                          return Object.entries(counts).map(([label, count], i) => (
                            <span key={i} style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--border-glass)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              {label}: <strong style={{ color: 'var(--accent-cyan)' }}>{count}</strong>
                            </span>
                          ));
                        })()}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Top Resellers + Recent Activity */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Top Resellers by UID Count */}
                    <div className="glass-card">
                      <h3 style={{ fontSize: '15px', marginBottom: '16px', fontWeight: 600 }}>Top Resellers by UID Count</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {(() => {
                          const resellers: Record<string, number> = {};
                          
                          Object.values(allUidsList).forEach((uidData: any) => {
                            const name = uidData.added_by || 'System Admin';
                            resellers[name] = (resellers[name] || 0) + 1;
                          });

                          const sortedList = Object.entries(resellers)
                            .map(([name, count]) => ({ name, count }))
                            .sort((a, b) => b.count - a.count);

                          const maxResellerCount = sortedList[0]?.count || 1;

                          return sortedList.map((adm, i) => {
                            const widthPercent = (adm.count / maxResellerCount) * 100;
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{i + 1}</span>
                                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{adm.name}</span>
                                </div>
                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.01)', height: '6px', borderRadius: '3px', position: 'relative' }}>
                                  <div style={{ 
                                    position: 'absolute', 
                                    top: 0, left: 0, bottom: 0, 
                                    width: `${widthPercent}%`, 
                                    background: adm.name === 'Mani272' ? 'var(--accent-purple)' : 'var(--border-glass-glow)', 
                                    borderRadius: '3px' 
                                  }}></div>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '40px', textAlign: 'right' }}>{adm.count}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="glass-card">
                      <h3 style={{ fontSize: '15px', marginBottom: '16px', fontWeight: 600 }}>Recent Activity</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
                        {auditLogs.slice(0, 10).map((log, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600 }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>{log.details?.user_name || 'System Admin'}</span>{' '}
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                  {log.action === 'add' ? 'added UID' : log.action === 'remove' ? 'removed UID' : 'migrated UID'}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                                {log.action === 'replace' ? log.uid : `UID: ${log.uid}`}
                              </div>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {log.timestamp.split(' ')[1] || log.timestamp}
                            </span>
                          </div>
                        ))}
                        {auditLogs.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                            No recent activity logged.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB CONTENT: Detailed filterable audit logs */}
              {activeTab === 'logs' && (
                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ fontSize: '16px' }}>Security Audit Actions Log History</h3>
                    <input type="text" placeholder="Filter by UID..." className="glow-input" style={{ maxWidth: '240px', padding: '6px 12px', fontSize: '12px' }} value={uidSearch} onChange={e => setUidSearch(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
                    {auditLogs
                      .filter(log => log.uid.includes(uidSearch.trim()))
                      .map((log, index) => (
                        <div key={index} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>
                              <span style={{ color: log.action === 'add' ? 'var(--accent-green)' : log.action === 'remove' ? 'var(--accent-red)' : 'var(--accent-purple)' }}>
                                {log.action.toUpperCase()}
                              </span>{' '}
                              UID: <code style={{ color: 'var(--accent-cyan)' }}>{log.uid}</code>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Timestamp: {log.timestamp} | Operator: {log.details?.user_name || 'System Admin'} | Duration: {log.details?.duration ? `${log.details.duration} Days` : 'N/A'}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                            {log.details?.cost ? `${log.details.cost} Coins` : '0 Coins'}
                          </span>
                        </div>
                      ))}
                    {auditLogs.filter(log => log.uid.includes(uidSearch.trim())).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No audit actions logged matching the specified filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Resellers Registry */}
              {isMasterState && activeTab === 'resellers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Create Reseller Account */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldIcon /> Create New Reseller Profile</h3>
                    <form onSubmit={handleCreateReseller} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Username</label>
                        <input type="text" placeholder="Login username" className="glow-input" value={genResellerUsername} onChange={e => setGenResellerUsername(e.target.value)} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Password</label>
                        <input type="text" placeholder="Account password" className="glow-input" value={genResellerPassword} onChange={e => setGenResellerPassword(e.target.value)} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Discord User ID (Optional)</label>
                        <input type="text" placeholder="14579318..." className="glow-input" value={genResellerId} onChange={e => setGenResellerId(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Max UID Limit</label>
                        <input type="number" className="glow-input" value={genResellerLimit} onChange={e => setGenResellerLimit(e.target.value)} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Initial Coins Credits</label>
                        <input type="number" step="0.1" className="glow-input" value={genResellerCredits} onChange={e => setGenResellerCredits(e.target.value)} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Expiry Date (Optional)</label>
                        <input type="date" className="glow-input" value={genResellerExpiry} onChange={e => setGenResellerExpiry(e.target.value)} />
                      </div>
                      <div>
                        <button type="submit" className="btn-neon btn-neon-green" style={{ width: '100%', fontSize: '13px' }}>
                          Create Reseller
                        </button>
                      </div>
                    </form>

                    {generatedResellerKey && (
                      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0, 255, 136, 0.03)', border: '1px dashed var(--accent-green)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>RESELLER LICENSE KEY MINTED</div>
                        <code style={{ fontSize: '14px', color: 'var(--accent-green)', fontWeight: 'bold', wordBreak: 'break-all' }}>{generatedResellerKey}</code>
                      </div>
                    )}
                  </div>

                  {/* Active Reseller Registry Table */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Active Resellers Keys Registry ({adminResellers.length})</h3>
                    <div className="table-container">
                      <table className="custom-table" style={{ fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Password</th>
                            <th>Discord ID</th>
                            <th>Active UIDs</th>
                            <th>Max Limit</th>
                            <th>Credits (Coins)</th>
                            <th>Requests</th>
                            <th>Created On</th>
                            <th>Expiry</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminResellers.map(res => (
                            <tr key={res.key}>
                              <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{res.username || 'N/A'}</td>
                              <td><code>{res.password || 'N/A'}</code></td>
                              <td><span style={{ color: 'var(--text-muted)' }}>{res.owner_id}</span></td>
                              <td style={{ fontWeight: 600 }}>{res.active_uids}</td>
                              <td>{res.max_uids}</td>
                              <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{res.credits.toFixed(2)}</td>
                              <td>{res.requests_count}</td>
                              <td style={{ fontSize: '10px' }}>{res.created_at}</td>
                              <td style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>{res.expiry || 'Lifetime'}</td>
                              <td>
                                <span className={`status-badge ${res.is_active ? 'status-badge-active' : 'status-badge-suspended'}`}>
                                  {res.is_active ? 'Active' : 'Suspended'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="btn-neon" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleToggleReseller(res.key)}>
                                    Toggle Status
                                  </button>
                                  <button className="btn-neon btn-neon-purple" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleUpdateResellerPassword(res.key, res.password)}>
                                    Change Password
                                  </button>
                                  <button className="btn-neon btn-neon-green" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleUpdateResellerCredits(res.key, res.credits)}>
                                    Adjust Credits
                                  </button>
                                  <button className="btn-neon btn-neon-purple" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleUpdateResellerLimit(res.key, res.max_uids)}>
                                    Adjust Limit
                                  </button>
                                  <button className="btn-neon btn-neon-purple" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleUpdateResellerExpiry(res.key, res.expiry)}>
                                    Adjust Expiry
                                  </button>
                                  <button className="btn-neon btn-neon-red" style={{ padding: '4px 6px', fontSize: '10px' }} onClick={() => handleDeleteReseller(res.key)}>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Purge Gate */}
              {isMasterState && activeTab === 'purge' && (
                <div className="glass-card" style={{ maxWidth: '600px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Free Allocation Purge Gate</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                    Triggering this action will immediately remove all UIDs created under the complimentary 1-day tier from both the local database and upstream registry servers.
                  </p>
                  <button className="btn-neon btn-neon-red" style={{ width: '100%', fontSize: '13px', padding: '12px' }} onClick={handleResetFreeClaims}>
                    PURGE CLAIMS MEMORY
                  </button>
                </div>
              )}

              {/* TAB CONTENT: Discord Bot launcher */}
              {activeTab === 'bot' && (
                <div className="glass-card" style={{ maxWidth: '600px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>Automated Discord Bot Process Launcher</h3>
                    <span className={`status-badge ${botActive ? 'status-badge-active' : botSuspendedReason ? 'status-badge-suspended' : 'status-badge-offline'}`} style={{ textTransform: 'uppercase', fontSize: '10px', padding: '4px 10px', borderRadius: '12px' }}>
                      {botActive ? 'Online' : botSuspendedReason ? 'Suspended' : 'Stopped'}
                    </span>
                  </div>

                  {botSuspendedReason === 'insufficient_credits' && (
                    <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255, 49, 49, 0.05)', border: '1px dashed var(--accent-red)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>⚠️ INSTANCE SUSPENDED:</span> Your whitelisting bot client hosting was suspended due to insufficient coin credits. Please adjust credits or redeem a gift voucher to resume bot operation.
                    </div>
                  )}

                  {!stats.isMaster && (
                    <div style={{ marginBottom: '16px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                      💡 <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>Hosting Charge:</span> Bot hosting costs **0.05 coins** per billing interval. Ensure your wallet has credits to prevent automatic server suspension.
                    </div>
                  )}

                  <form onSubmit={handleDeployBot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Discord Bot Token</label>
                      <input type="password" placeholder="MTUyMzEx..." className="glow-input" value={botToken} onChange={e => setBotToken(e.target.value)} required readOnly={botActive} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Discord Guild ID</label>
                        <input type="text" placeholder="14396178..." className="glow-input" value={botGuildId} onChange={e => setBotGuildId(e.target.value)} required readOnly={botActive} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Audit Channel ID</label>
                        <input type="text" placeholder="15088337..." className="glow-input" value={botChannelId} onChange={e => setBotChannelId(e.target.value)} required readOnly={botActive} />
                      </div>
                    </div>
                    
                    {botActive ? (
                      <button type="button" className="btn-neon btn-neon-red" style={{ fontSize: '13px', padding: '12px' }} onClick={handleStopBot}>
                        SHUT DOWN BOT CLIENT
                      </button>
                    ) : (
                      <button type="submit" className="btn-neon btn-neon-purple" style={{ fontSize: '13px', padding: '12px' }} disabled={isDeployingBot}>
                        {isDeployingBot ? 'LAUNCHING DEPLOYMENT...' : 'DEPLOY BOT INSTANCE'}
                      </button>
                    )}
                  </form>

                  {deployConsoleLogs.length > 0 && (
                    <div className="terminal-console-box" style={{
                      background: '#040508',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginTop: '20px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: 'var(--accent-cyan)',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      boxShadow: '0 0 20px rgba(0, 242, 254, 0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 'bold' }}>
                        <span>DEPLOYMENT CONSOLE STDOUT</span>
                        <span style={{ color: isDeployingBot ? 'var(--accent-cyan)' : botActive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {isDeployingBot ? 'RUNNING' : botActive ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                      {deployConsoleLogs.map((log, idx) => (
                        <div key={idx} style={{ marginBottom: '4px', lineHeight: '1.4', color: log.includes('[ERROR]') ? 'var(--accent-red)' : log.includes('[SUCCESS]') ? 'var(--accent-green)' : 'var(--accent-cyan)' }}>
                          {log}
                        </div>
                      ))}
                      <div ref={consoleEndRef} />
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: System Config (.env) */}
              {isMasterState && activeTab === 'system' && (
                <div className="glass-card">
                  <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Global Systems Variables Configurator (.env)</h3>
                  <form onSubmit={handleSaveEnvVariables} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Master Upstream Key (API_KEY)</label>
                      <input type="password" placeholder="Enter Upstream key values" className="glow-input" value={sysUpstreamKey} onChange={e => setSysUpstreamKey(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Upstream Target URL (BASE_URL)</label>
                      <input type="text" placeholder="https://gtccheats.xyz/..." className="glow-input" value={sysBaseUrl} onChange={e => setSysBaseUrl(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Central Webhook URL (LOG_WEBHOOK_URL)</label>
                      <input type="text" placeholder="https://discord.com/api/webhooks/..." className="glow-input" value={sysWebhookUrl} onChange={e => setSysWebhookUrl(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Minting Key Prefix (API_KEY_PREFIX)</label>
                      <input type="text" placeholder="Mani272" className="glow-input" value={sysKeyPrefix} onChange={e => setSysKeyPrefix(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Console Brand Name (APP_BRAND_NAME)</label>
                      <input type="text" placeholder="Mani272 API" className="glow-input" value={sysBrandName} onChange={e => setSysBrandName(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button type="submit" className="btn-neon btn-neon-green" style={{ width: '100%', fontSize: '13px', padding: '12px' }}>
                        SAVE CONFIGURATIONS
                      </button>
                    </div>
                  </form>
                </div>
              )}


            </div>
          )}

        </main>
      </div>

    </div>
  );
}
