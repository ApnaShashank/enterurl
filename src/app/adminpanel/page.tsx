'use client';

import React, { useState, useEffect } from 'react';
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
  
  // Pagination & Filters states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Initial authentication check
  useEffect(() => {
    fetchStats();
  }, []);

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
      const res = await fetch('/api/admin/logout', { method: 'POST' });
      if (res.ok) {
        setIsAuthenticated(false);
        setMetrics(null);
        setLogs([]);
      }
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
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center gap-3 text-zinc-400">
        <Loader2 className="animate-spin text-violet-500" size={36} />
        <p className="text-sm font-medium tracking-wide">Validating session...</p>
      </div>
    );
  }

  // 1. LOGIN INTERFACE (Unauthenticated state)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative z-10 animate-slide-up-in">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
            <p className="text-xs text-zinc-400 mt-1.5">Sign in to monitor usage logs and API statuses</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 text-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-zinc-500"
                />
                <User size={16} className="text-zinc-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 text-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-zinc-500"
                />
                <Lock size={16} className="text-zinc-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition-all shadow-md shadow-violet-600/10 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-zinc-800/60 pt-4">
            <a href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-all">← Back to Homepage</a>
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD VIEW (Authenticated state)
  return (
    <div className="min-h-screen bg-[#070708] text-zinc-300 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow shadow-violet-600/25">EU</div>
          <div>
            <h2 className="text-sm font-semibold text-white">EnterURL Admin</h2>
            <p className="text-[10px] text-zinc-500">Live Traffic & System Metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-xs text-zinc-500 font-mono">Logged in: shashank8808108802@gmail.com</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-medium cursor-pointer transition-all border border-zinc-800/40"
          >
            <Power size={13} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow p-6 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* KPI Metrics row */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Scans</span>
                <h3 className="text-xl font-bold text-white">{metrics.totalScans.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-400">
                <Database size={18} />
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Unique Users</span>
                <h3 className="text-xl font-bold text-white">{metrics.uniqueUsers.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-400">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Scans (Last 24h)</span>
                <h3 className="text-xl font-bold text-white">{metrics.todayScans.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-400">
                <Activity size={18} />
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">API Keys Status</span>
                <h3 className="text-xl font-bold text-white">{metrics.configuredKeysCount} / {metrics.totalKeysCount}</h3>
              </div>
              <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-400">
                <Key size={18} />
              </div>
            </div>
          </div>
        )}

        {/* API Quota Table & Key Configs grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Configured Keys Card */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 lg:col-span-1 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Credentials & Configs</h3>
              <div className="space-y-3">
                {apiKeysStatus && Object.entries(apiKeysStatus).map(([keyName, isActive]) => (
                  <div key={keyName} className="flex justify-between items-center bg-zinc-900/35 border border-zinc-900/60 p-3 rounded-xl">
                    <span className="text-xs font-mono font-medium text-zinc-300">{keyName} API Key</span>
                    {isActive ? (
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-900/50 text-emerald-400 rounded-md text-[10px] font-semibold flex items-center gap-1 font-mono uppercase tracking-wide">
                        <ShieldCheck size={10} /> Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-950 border border-red-900/50 text-red-400 rounded-md text-[10px] font-semibold flex items-center gap-1 font-mono uppercase tracking-wide">
                        <ShieldAlert size={10} /> Missing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-900/60 text-[10px] text-zinc-500">
              * Keys configured in your Vercel deployment variables / .env.local file. Add keys to unlock deep features.
            </div>
          </div>

          {/* Daily Quota Counter Table */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4">Active API Usage Tracker (Last 24h)</h3>
            <div className="space-y-5">
              {apiUsageStats && Object.entries(apiUsageStats).map(([apiName, stats]) => {
                const percentage = Math.min((stats.usage / stats.limit) * 100, 100);
                let progressColor = 'bg-violet-600';
                if (percentage > 85) progressColor = 'bg-red-500';
                else if (percentage > 50) progressColor = 'bg-amber-500';

                return (
                  <div key={apiName} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-200">{apiName} API</span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {stats.usage.toLocaleString()} / {stats.limit.toLocaleString()} {stats.label}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden shadow-inner border border-zinc-900">
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
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Logger Controls / Filter */}
          <div className="p-5 border-b border-zinc-900 flex flex-col md:flex-row gap-4 items-center justify-between">
            <h3 className="text-sm font-semibold text-white self-start md:self-center">Recent Activity Logs</h3>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <div className="relative flex-grow md:flex-grow-0 md:w-60">
                <input
                  type="text"
                  placeholder="Search by IP or URL..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs py-2.5 pl-8 pr-3 outline-none focus:border-zinc-700 text-white transition-all placeholder:text-zinc-500"
                />
                <Search size={13} className="text-zinc-500 absolute left-2.5 top-3.5" />
              </div>

              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  fetchStats(1, search, e.target.value);
                }}
                className="bg-zinc-900/60 border border-zinc-800/80 text-zinc-300 rounded-xl text-xs py-2.5 px-3 outline-none cursor-pointer focus:border-zinc-700"
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

              <button
                onClick={applyFilters}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800/40 text-zinc-400 hover:text-white transition-all cursor-pointer shadow-sm"
                title="Refresh Table"
              >
                <RefreshCw size={14} className={`${isLoadingStats ? 'animate-spin' : ''}`} />
              </button>

              {(search || actionFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer border border-zinc-800/40"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-900 text-zinc-500 font-semibold tracking-wider">
                  <th className="p-4 w-44">Timestamp</th>
                  <th className="p-4 w-36">IP Address</th>
                  <th className="p-4 w-36">Action</th>
                  <th className="p-4 w-28">Platform</th>
                  <th className="p-4 min-w-[200px]">URL / Resource</th>
                  <th className="p-4 w-28">APIs Called</th>
                  <th className="p-4 w-20">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="p-4 text-zinc-500 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </td>
                      <td className="p-4 font-mono font-medium text-zinc-300 whitespace-nowrap">{log.ip}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-zinc-900/80 text-zinc-300 border border-zinc-800 rounded-md font-medium text-[10px] font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        {log.platform ? (
                          <span className="px-1.5 py-0.5 bg-violet-950/30 text-violet-400 border border-violet-900/20 rounded font-medium text-[10px] font-sans">
                            {log.platform}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="p-4 font-mono">
                        {log.url ? (
                          <div className="flex items-center gap-1 max-w-md">
                            <span className="truncate block select-all" title={log.url}>{log.url}</span>
                            <a href={log.url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400 shrink-0">
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-zinc-400 whitespace-nowrap">{log.apiUsed || <span className="text-zinc-600">—</span>}</td>
                      <td className="p-4">
                        {log.status === 'success' ? (
                          <span className="px-1.5 py-0.5 bg-emerald-950/50 text-emerald-400 rounded-md font-semibold text-[9px] font-sans uppercase flex items-center gap-0.5 w-fit border border-emerald-900/35">
                            <CheckCircle size={8} /> OK
                          </span>
                        ) : (
                          <span 
                            className="px-1.5 py-0.5 bg-red-950/50 text-red-400 rounded-md font-semibold text-[9px] font-sans uppercase flex items-center gap-0.5 w-fit border border-red-900/35 cursor-help"
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
                    <td colSpan={7} className="p-8 text-center text-zinc-500 italic">
                      {isLoadingStats ? 'Loading user activities...' : 'No activity logs match the search query.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-xs">
            <span className="text-zinc-500">
              Showing page <strong className="text-zinc-300 font-semibold">{page}</strong> of <strong className="text-zinc-300 font-semibold">{totalPages}</strong>
            </span>

            <div className="flex gap-2">
              <button
                disabled={page <= 1 || isLoadingStats}
                onClick={() => fetchStats(page - 1, search, actionFilter)}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-zinc-800/40 text-zinc-300 flex items-center gap-1 cursor-pointer transition-all"
              >
                <ArrowLeft size={13} />
                <span>Prev</span>
              </button>
              <button
                disabled={page >= totalPages || isLoadingStats}
                onClick={() => fetchStats(page + 1, search, actionFilter)}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-zinc-800/40 text-zinc-300 flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>Next</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-[10px] text-zinc-600 bg-zinc-950/20">
        Design Resource & System Analytics © 2026 EnterURL Portal
      </footer>

    </div>
  );
}
