'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useClerk, SignInButton } from '@clerk/nextjs';
import { 
  Lock, 
  User, 
  Loader2, 
  Database, 
  Users, 
  Key, 
  Activity, 
  Search, 
  RefreshCw, 
  Power, 
  ArrowLeft, 
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';

interface LogEntry {
  _id: string;
  ip: string;
  timestamp: string;
  action: string;
  url?: string;
  platform?: string;
  apiUsed?: string;
  status: string;
  errorMessage?: string;
}

interface FeedbackEntry {
  _id: string;
  ip: string;
  timestamp: string;
  url?: string;
  errorMessage?: string;
  feedbackText: string;
}

interface AdminMetrics {
  totalScans: number;
  uniqueUsers: number;
  todayScans: number;
  configuredKeysCount: number;
  totalKeysCount: number;
}

interface ApiUsageStats {
  [key: string]: {
    usage: number;
    limit: number;
    label: string;
  };
}

interface ApiKeysStatus {
  [key: string]: boolean;
}

export default function AdminPanel() {
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [apiKeysStatus, setApiKeysStatus] = useState<ApiKeysStatus | null>(null);
  const [apiUsageStats, setApiUsageStats] = useState<ApiUsageStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  
  // Pagination & Filters states
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'logs' | 'feedbacks' | 'users' | 'config'>('logs');
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Users and configs states
  const [users, setUsers] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);

  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (clerkLoaded) {
      if (clerkUser) {
        fetchStats(page, search, actionFilter);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, [clerkUser, clerkLoaded]);

  useEffect(() => {
    if (activeTab === 'users' && isAuthenticated) {
      fetchUsers();
    } else if (activeTab === 'config' && isAuthenticated) {
      fetchConfigs();
    }
  }, [activeTab, isAuthenticated]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchConfigs = async () => {
    setIsLoadingConfigs(true);
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (err) {
      console.error('Failed to fetch configs:', err);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const handleUpdateUserRole = async (email: string, role: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      if (res.ok) {
        fetchUsers();
        fetchStats(page, search, actionFilter);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update user role');
      }
    } catch (err) {
      console.error('Update user role error:', err);
    }
  };

  const handleUpdateConfig = async (featureName: string, requiredLevel: string) => {
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureName, requiredLevel })
      });
      if (res.ok) {
        fetchConfigs();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update config');
      }
    } catch (err) {
      console.error('Update config error:', err);
    }
  };

  const fetchStats = async (pageNumber: number = 1, searchQuery: string = '', action: string = '') => {
    setIsLoadingStats(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageNumber.toString(),
        limit: '20',
        search: searchQuery,
        action: action
      });
      const res = await fetch(`/api/admin/stats?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setApiKeysStatus(data.apiKeysStatus);
        setApiUsageStats(data.apiUsageStats);
        setLogs(data.logs);
        setFeedbacks(data.feedbacks || []);
        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setIsAuthenticated(true);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        setLoginError('');
        setIsAuthenticated(true);
        fetchStats();
      } else {
        const data = await res.json();
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setMetrics(null);
      setLogs([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Re-run search/filter fetchers
  const applyFilters = () => {
    fetchStats(1, search, actionFilter);
  };

  const clearFilters = () => {
    setSearch('');
    setActionFilter('');
    fetchStats(1, '', '');
  };

  // Auth check in loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center gap-3 text-zinc-500 dots-bg">
        <Loader2 className="animate-spin text-violet-600" size={36} />
        <p className="text-sm font-medium tracking-wide">Validating session...</p>
      </div>
    );
  }

  // 1. LOGIN INTERFACE (Unauthenticated state)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col justify-center items-center px-4 relative overflow-hidden dots-bg">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-3xl p-8 shadow-2xl relative z-10 animate-slide-up-in">
          <div className="text-center mb-8 select-none">
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight uppercase">Admin Portal</h1>
            <p className="text-xs text-zinc-400 mt-1.5 font-light">Sign in to monitor usage logs and API statuses</p>
          </div>

          {clerkUser ? (
            <div className="space-y-5">
              <div className="p-4 bg-rose-50/70 border border-rose-200/80 text-rose-650 rounded-2xl text-xs space-y-2 font-light leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-rose-700">
                  <ShieldAlert size={16} />
                  <span>Access Denied</span>
                </div>
                <p>
                  You are signed in as <strong className="font-mono text-zinc-900">{clerkUser.emailAddresses[0]?.emailAddress}</strong>, but this account does not have Administrator permissions.
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border-0"
              >
                Sign Out of Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <SignInButton mode="modal">
                <button
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border-0"
                >
                  Sign In with Google (Admin)
                </button>
              </SignInButton>
            </div>
          )}

          <div className="mt-8 text-center border-t border-zinc-200/60 pt-4 select-none">
            <a href="/" className="text-xs text-zinc-400 hover:text-zinc-600 transition-all font-medium">← Back to Homepage</a>
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD VIEW (Authenticated state)
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 flex flex-col font-sans relative overflow-hidden dots-bg">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-gradient-to-bl from-violet-600/5 to-transparent pointer-events-none z-0"></div>

      {/* Top Navbar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex justify-between items-center text-zinc-800 shadow-sm select-none">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow shadow-violet-600/25">EU</div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">EnterURL Admin</h2>
            <p className="text-[10px] text-zinc-500 font-light">Live Traffic & System Metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-xs text-zinc-500 font-mono">Logged in: shashank8808108802@gmail.com</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 rounded-lg text-xs font-semibold cursor-pointer transition-all border border-zinc-200/85"
          >
            <Power size={13} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow p-6 space-y-8 max-w-7xl mx-auto w-full z-10">
        
        {/* KPI Metrics row */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 select-none">
            <div className="bg-white/70 border border-zinc-200/85 rounded-2xl p-5 flex items-center justify-between shadow-sm backdrop-blur-xl">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total Scans</span>
                <h3 className="text-xl font-bold text-zinc-900">{metrics.totalScans.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 bg-zinc-100/80 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-200/30">
                <Database size={18} />
              </div>
            </div>

            <div className="bg-white/70 border border-zinc-200/85 rounded-2xl p-5 flex items-center justify-between shadow-sm backdrop-blur-xl">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Unique IPs</span>
                <h3 className="text-xl font-bold text-zinc-900">{metrics.uniqueUsers.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 bg-zinc-100/80 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-200/30">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-white/70 border border-zinc-200/85 rounded-2xl p-5 flex items-center justify-between shadow-sm backdrop-blur-xl">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Scans (24h)</span>
                <h3 className="text-xl font-bold text-zinc-900">{metrics.todayScans.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 bg-zinc-100/80 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-200/30">
                <Activity size={18} />
              </div>
            </div>

            <div className="bg-white/70 border border-zinc-200/85 rounded-2xl p-5 flex items-center justify-between shadow-sm backdrop-blur-xl">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Registered</span>
                <h3 className="text-xl font-bold text-zinc-900">{(metrics as any).totalUsers?.toLocaleString() || '0'}</h3>
              </div>
              <div className="h-10 w-10 bg-zinc-100/80 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-200/30">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-white/70 border border-zinc-200/85 rounded-2xl p-5 flex items-center justify-between shadow-sm backdrop-blur-xl">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">PRO Users</span>
                <h3 className="text-xl font-bold text-zinc-900">{(metrics as any).proUsers?.toLocaleString() || '0'}</h3>
              </div>
              <div className="h-10 w-10 bg-zinc-100/80 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-200/30">
                <ShieldCheck size={18} />
              </div>
            </div>

            <div className="bg-white/70 border border-zinc-200/85 rounded-2xl p-5 flex items-center justify-between shadow-sm backdrop-blur-xl">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">API Status</span>
                <h3 className="text-xl font-bold text-zinc-900">{metrics.configuredKeysCount} / {metrics.totalKeysCount}</h3>
              </div>
              <div className="h-10 w-10 bg-zinc-100/80 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-200/30">
                <Key size={18} />
              </div>
            </div>
          </div>
        )}

        {/* API Quota Table & Key Configs grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Configured Keys Card */}
          <div className="bg-white/70 border border-zinc-200/85 rounded-2xl p-6 lg:col-span-1 flex flex-col justify-between shadow-sm backdrop-blur-xl">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4 select-none">Credentials & Configs</h3>
              <div className="space-y-3">
                {apiKeysStatus && Object.entries(apiKeysStatus).map(([keyName, isActive]) => (
                  <div key={keyName} className="flex justify-between items-center bg-zinc-50/50 border border-zinc-200/50 p-3 rounded-xl">
                    <span className="text-xs font-mono font-medium text-zinc-600">{keyName} API Key</span>
                    {isActive ? (
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200/60 text-emerald-600 rounded-md text-[10px] font-bold flex items-center gap-1 font-mono uppercase tracking-wide">
                        <ShieldCheck size={10} /> Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-md text-[10px] font-bold flex items-center gap-1 font-mono uppercase tracking-wide">
                        <ShieldAlert size={10} /> Missing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200/60 text-[10px] text-zinc-400 font-light leading-relaxed select-none">
              * Keys configured in your Vercel deployment variables / .env.local file. Add keys to unlock deep features.
            </div>
          </div>

          {/* Daily Quota Counter Table */}
          <div className="bg-white/70 border border-zinc-200/85 rounded-2xl p-6 lg:col-span-2 shadow-sm backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 select-none">Active API Usage Tracker (Last 24h)</h3>
            <div className="space-y-5">
              {apiUsageStats && Object.entries(apiUsageStats).map(([apiName, stats]) => {
                const percentage = Math.min((stats.usage / stats.limit) * 100, 100);
                let progressColor = 'bg-violet-600';
                if (percentage > 85) progressColor = 'bg-red-500';
                else if (percentage > 50) progressColor = 'bg-amber-500';

                return (
                  <div key={apiName} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-700">{apiName} API</span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {stats.usage.toLocaleString()} / {stats.limit.toLocaleString()} {stats.label}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden shadow-inner border border-zinc-200/40">
                      <div 
                        className={`${progressColor} h-full rounded-full transition-all duration-350`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Activity Logger */}
        <div className="bg-white/70 border border-zinc-200/85 rounded-2xl overflow-hidden shadow-sm backdrop-blur-xl">
          {/* Logger Controls / Filter */}
          <div className="p-5 border-b border-zinc-200/80 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/20 select-none">
            <div className="flex flex-wrap items-center gap-4 self-start md:self-center">
              <button
                onClick={() => setActiveTab('logs')}
                className={`text-sm font-semibold tracking-wide cursor-pointer transition-all border-b-2 px-1 pb-1 ${activeTab === 'logs' ? 'text-zinc-900 border-violet-600 font-bold' : 'text-zinc-400 border-transparent hover:text-zinc-700'}`}
              >
                Recent Activity Logs
              </button>
              <button
                onClick={() => setActiveTab('feedbacks')}
                className={`text-sm font-semibold tracking-wide cursor-pointer transition-all border-b-2 px-1 pb-1 ${activeTab === 'feedbacks' ? 'text-zinc-900 border-violet-600 font-bold' : 'text-zinc-400 border-transparent hover:text-zinc-700'}`}
              >
                User Feedbacks ({feedbacks.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`text-sm font-semibold tracking-wide cursor-pointer transition-all border-b-2 px-1 pb-1 ${activeTab === 'users' ? 'text-zinc-900 border-violet-600 font-bold' : 'text-zinc-400 border-transparent hover:text-zinc-700'}`}
              >
                User Accounts ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`text-sm font-semibold tracking-wide cursor-pointer transition-all border-b-2 px-1 pb-1 ${activeTab === 'config' ? 'text-zinc-900 border-violet-600 font-bold' : 'text-zinc-400 border-transparent hover:text-zinc-700'}`}
              >
                API Access Settings
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              {activeTab === 'logs' && (
                <>
                  <div className="relative flex-grow md:flex-grow-0 md:w-60">
                    <input
                      type="text"
                      placeholder="Search by IP or URL..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                      className="w-full bg-white border border-zinc-200/80 rounded-xl text-xs py-2.5 pl-8 pr-3 outline-none focus:border-zinc-300 text-zinc-800 transition-all placeholder:text-zinc-400 shadow-sm"
                    />
                    <Search size={13} className="text-zinc-400 absolute left-2.5 top-3.5" />
                  </div>

                  <select
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value);
                      fetchStats(1, search, e.target.value);
                    }}
                    className="bg-white border border-zinc-200/80 text-zinc-700 rounded-xl text-xs py-2.5 px-3 outline-none cursor-pointer focus:border-zinc-300 shadow-sm"
                  >
                    <option value="">All Actions</option>
                    <option value="analyze-base">Analyze (Base)</option>
                    <option value="analyze-intel">Analyze (Intel)</option>
                    <option value="analyze-lighthouse">Analyze (Lighthouse)</option>
                    <option value="analyze-ai-research">Analyze (AI Research)</option>
                    <option value="analyze-ai-writer">Analyze (AI Writer)</option>
                    <option value="download-video">Download Video</option>
                    <option value="download-audio">Download Audio</option>
                    <option value="transcribe">Transcribe</option>
                    <option value="remove-bg">Remove Background</option>
                    <option value="screenshot">Screenshot</option>
                  </select>
                </>
              )}

              <button
                onClick={applyFilters}
                className="p-2.5 bg-white hover:bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer shadow-sm"
                title="Refresh Table"
              >
                <RefreshCw size={14} className={`${isLoadingStats ? 'animate-spin' : ''}`} />
              </button>

              {activeTab === 'logs' && (search || actionFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2.5 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 rounded-xl text-xs font-semibold cursor-pointer border border-zinc-200 shadow-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {activeTab === 'logs' ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100/85 border-b border-zinc-200/60 text-zinc-500 font-bold uppercase tracking-wider select-none">
                    <th className="p-4 w-44">Timestamp</th>
                    <th className="p-4 w-36">IP Address</th>
                    <th className="p-4 w-40">User Email</th>
                    <th className="p-4 w-36">Action</th>
                    <th className="p-4 w-28">Platform</th>
                    <th className="p-4 min-w-[200px]">URL / Resource</th>
                    <th className="p-4 w-28">APIs Called</th>
                    <th className="p-4 w-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/50 select-text">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-zinc-50/50 transition-colors text-zinc-700">
                        <td className="p-4 text-zinc-400 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })}
                        </td>
                        <td className="p-4 font-mono font-semibold text-zinc-800 whitespace-nowrap">{log.ip}</td>
                        <td className="p-4 font-mono text-zinc-500 whitespace-nowrap">{(log as any).userEmail || <span className="text-zinc-300 font-normal italic">guest</span>}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 border border-zinc-200/80 rounded-md font-medium text-[10px] font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4">
                          {log.platform ? (
                            <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-100/60 rounded font-bold text-[9px] font-sans uppercase">
                              {log.platform}
                            </span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="p-4 font-mono">
                          {log.url ? (
                            <div className="flex items-center gap-1 max-w-md">
                              <span className="truncate block select-all text-zinc-600" title={log.url}>{log.url}</span>
                              <a href={log.url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-600 shrink-0">
                                <ExternalLink size={10} />
                              </a>
                            </div>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-zinc-500 whitespace-nowrap">{log.apiUsed || <span className="text-zinc-400">—</span>}</td>
                        <td className="p-4">
                          {log.status === 'success' ? (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-bold text-[9px] font-sans uppercase flex items-center gap-0.5 w-fit border border-emerald-200/60">
                              <CheckCircle size={8} /> OK
                            </span>
                          ) : (
                            <span 
                              className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-md font-bold text-[9px] font-sans uppercase flex items-center gap-0.5 w-fit border border-rose-200/60 cursor-help"
                              title={log.errorMessage || 'Unknown extraction error'}
                            >
                              <XCircle size={8} /> Err
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400 italic">
                        {isLoadingStats ? 'Loading user activities...' : 'No activity logs match the search query.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeTab === 'feedbacks' ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100/85 border-b border-zinc-200/60 text-zinc-500 font-bold uppercase tracking-wider select-none">
                    <th className="p-4 w-44">Timestamp</th>
                    <th className="p-4 w-36">IP Address</th>
                    <th className="p-4 min-w-[200px]">URL / Resource</th>
                    <th className="p-4 min-w-[150px]">Error Message</th>
                    <th className="p-4 min-w-[250px]">User Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/50 select-text text-zinc-700">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((fb) => (
                      <tr key={fb._id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 text-zinc-400 font-mono whitespace-nowrap">
                          {new Date(fb.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })}
                        </td>
                        <td className="p-4 font-mono font-semibold text-zinc-800 whitespace-nowrap">{fb.ip}</td>
                        <td className="p-4 font-mono">
                          {fb.url ? (
                            <div className="flex items-center gap-1 max-w-sm">
                                <span className="truncate block select-all text-zinc-500 text-[10px]" title={fb.url}>{fb.url}</span>
                                <a href={fb.url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-600 shrink-0">
                                  <ExternalLink size={10} />
                                </a>
                            </div>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {fb.errorMessage ? (
                            <span className="text-rose-500 font-mono text-[10px] break-all line-clamp-2" title={fb.errorMessage}>
                              {fb.errorMessage}
                            </span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-zinc-800 select-text font-light whitespace-pre-wrap leading-relaxed">{fb.feedbackText}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-400 italic">
                        No feedbacks submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeTab === 'users' ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100/85 border-b border-zinc-200/60 text-zinc-500 font-bold uppercase tracking-wider select-none">
                    <th className="p-4">Registered Date</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Account Role</th>
                    <th className="p-4">Actions / Modify Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/50 select-text text-zinc-700">
                  {users.length > 0 ? (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 text-zinc-400 font-mono">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-mono font-semibold text-zinc-800">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                            u.role === 'admin' 
                              ? 'bg-rose-50 border-rose-200 text-rose-600' 
                              : u.role === 'pro' 
                                ? 'bg-violet-50 border-violet-200 text-violet-600' 
                                : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          {/* Protect standard admin email from self role modification */}
                          {u.email === 'shashank8808108802@gmail.com' ? (
                            <span className="text-[10px] text-zinc-400 italic font-medium">Root Owner</span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateUserRole(u.email, e.target.value)}
                              className="bg-white border border-zinc-200 text-zinc-700 rounded-xl text-xs py-1.5 px-3 outline-none cursor-pointer focus:border-zinc-300 shadow-sm"
                            >
                              <option value="standard">Standard</option>
                              <option value="pro">Pro (Paid Upgrade)</option>
                              <option value="admin">Administrator</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-400 italic">
                        {isLoadingUsers ? 'Loading user list...' : 'No users registered yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100/85 border-b border-zinc-200/60 text-zinc-500 font-bold uppercase tracking-wider select-none">
                    <th className="p-4">API Action Area / Feature</th>
                    <th className="p-4">Minimum Access Tier Required</th>
                    <th className="p-4">Current Protection Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/50 select-text text-zinc-700">
                  {configs.length > 0 ? (
                    configs.map((c) => (
                      <tr key={c.featureName} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 font-mono font-semibold text-zinc-800">
                          {c.featureName}
                        </td>
                        <td className="p-4">
                          <select
                            value={c.requiredLevel}
                            onChange={(e) => handleUpdateConfig(c.featureName, e.target.value)}
                            className="bg-white border border-zinc-200 text-zinc-700 rounded-xl text-xs py-1.5 px-3 outline-none cursor-pointer focus:border-zinc-300 shadow-sm"
                          >
                            <option value="free">Free (Anonymous)</option>
                            <option value="registered">Registered (Login Required)</option>
                            <option value="pro">Pro (Paid Upgrade Only)</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                            c.requiredLevel === 'pro' 
                              ? 'bg-rose-50 border-rose-200 text-rose-600' 
                              : c.requiredLevel === 'registered' 
                                ? 'bg-violet-50 border-violet-200 text-violet-600' 
                                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          }`}>
                            {c.requiredLevel}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-zinc-400 italic">
                        {isLoadingConfigs ? 'Loading dynamic settings...' : 'No configs loaded.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Pagination */}
          {activeTab === 'logs' && (
            <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex justify-between items-center text-xs select-none">
              <span className="text-zinc-500 font-medium">
                Showing page <strong className="text-zinc-800 font-bold">{page}</strong> of <strong className="text-zinc-800 font-bold">{totalPages}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  disabled={page <= 1 || isLoadingStats}
                  onClick={() => fetchStats(page - 1, search, actionFilter)}
                  className="px-3 py-2 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-zinc-200 text-zinc-700 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                >
                  <ArrowLeft size={13} />
                  <span>Prev</span>
                </button>
                <button
                  disabled={page >= totalPages || isLoadingStats}
                  onClick={() => fetchStats(page + 1, search, actionFilter)}
                  className="px-3 py-2 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-zinc-200 text-zinc-700 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                >
                  <span>Next</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 py-6 text-center text-[10px] text-zinc-500 bg-white/40 select-none">
        ENTERURL @2026
      </footer>

    </div>
  );
}
