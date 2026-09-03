import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LifeBuoy,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Flame,
  ArrowRight,
  CheckCircle2,
  Radio,
  Zap,
  HardHat,
  HeartPulse,
  Users,
  ShieldAlert,
  ChevronRight,
  Check,
  Building2,
  Activity,
  Sparkles,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'admin',
    roleLabel: 'Operations Director',
    username: 'admin',
    password: 'Admin@123',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: ShieldCheck,
    description: 'Full disaster command, resource distribution, and audit analytics.',
  },
  {
    role: 'operator',
    roleLabel: 'Command Operator',
    username: 'operator',
    password: 'Operator@123',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Activity,
    description: 'Triage verification, real-time dispatch, and emergency broadcasts.',
  },
  {
    role: 'rescue_team',
    roleLabel: 'NDRF Rescue Lead',
    username: 'rescue_lead',
    password: 'Team@123',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: HardHat,
    description: 'Field rescue units, GPS navigation, and active assignments.',
  },
  {
    role: 'volunteer',
    roleLabel: 'Medical Volunteer',
    username: 'volunteer1',
    password: 'Volunteer@123',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: HeartPulse,
    description: 'Community first response, triage assistance, and shelter relief.',
  },
  {
    role: 'citizen',
    roleLabel: 'Public Citizen',
    username: 'citizen',
    password: 'Citizen@123',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Users,
    description: 'Public emergency SOS reporting and nearby assistance lookup.',
  },
];

const LoginPage = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState(() => {
    return localStorage.getItem('resq_remembered_username') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('resq_remembered_username');
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'demo'
  const [justCopied, setJustCopied] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLoginSubmit = async (e, customUsername = null, customPassword = null) => {
    if (e) e.preventDefault();

    const targetUser = (customUsername !== null ? customUsername : usernameOrEmail).trim();
    const targetPass = customPassword !== null ? customPassword : password;

    if (!targetUser || !targetPass) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(targetUser, targetPass);

      if (rememberMe && !customUsername) {
        localStorage.setItem('resq_remembered_username', targetUser);
      } else if (!rememberMe) {
        localStorage.removeItem('resq_remembered_username');
      }

      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const msg =
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server. Please verify the ResQ backend is running on http://127.0.0.1:8000'
          : 'Invalid username/email or password. Please check your credentials.');
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemo = (account, instantSignIn = false) => {
    setUsernameOrEmail(account.username);
    setPassword(account.password);
    setErrorMessage('');

    if (instantSignIn) {
      handleLoginSubmit(null, account.username, account.password);
    } else {
      setActiveTab('form');
      setJustCopied(account.role);
      setTimeout(() => setJustCopied(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Header */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">ResQ</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                v2.4 Live
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Disaster Command & Relief Network</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>GRID ONLINE</span>
          </div>

          <Link
            to="/sos"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-600/30 transition-all hover:scale-[1.02]"
          >
            <Flame className="w-4 h-4" />
            <span>Emergency SOS</span>
          </Link>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Command Showcase (Desktop) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Operational Triage & Incident Dispatch</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Disaster Response <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
                  Command Access
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Secure portal for incident directors, Kerala command operators, NDRF rescue teams, and field volunteers. Real-time telemetry, AI priority triage, and offline-resilient sync.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 text-blue-400 mb-1.5">
                  <Zap className="w-4 h-4" />
                  <h2 className="text-xs font-bold text-slate-200">Zero-Latency Triage</h2>
                </div>
                <p className="text-[11px] text-slate-400">
                  WebSocket real-time event pipeline for instantaneous emergency dispatching.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 text-emerald-400 mb-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <h2 className="text-xs font-bold text-slate-200">Role-Based Matrix</h2>
                </div>
                <p className="text-[11px] text-slate-400">
                  Granular clearance for Admins, Operators, First Responders, and Volunteers.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 text-cyan-400 mb-1.5">
                  <Building2 className="w-4 h-4" />
                  <h2 className="text-xs font-bold text-slate-200">Shelter & Resource Intel</h2>
                </div>
                <p className="text-[11px] text-slate-400">
                  Live occupancy tracking, medical supplies, and flood zone routing.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 text-amber-400 mb-1.5">
                  <Sparkles className="w-4 h-4" />
                  <h2 className="text-xs font-bold text-slate-200">AI Priority Scoring</h2>
                </div>
                <p className="text-[11px] text-slate-400">
                  Machine learning urgency classification of incoming distress signals.
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>TLS 1.3 / AES-256</span>
              </div>
              <div className="hidden sm:block">|</div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 font-bold">140+</span> Responders Active
              </div>
              <div className="hidden sm:block">|</div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-400 font-bold">18</span> Shelters Monitored
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 max-w-md w-full mx-auto">
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
              
              {/* Card Header & Tab Switcher */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Command Sign In
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enter your authorized operational credentials
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                {/* Tabs for Fast Demo Access vs Standard Input */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'form'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Credentials</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('demo')}
                    className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'demo'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>1-Click Demo</span>
                  </button>
                </div>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-red-300">Authentication Failed</p>
                    <p className="text-[11px] leading-relaxed text-red-200">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Just Filled Notification */}
              {justCopied && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Filled credentials for <strong>{justCopied.toUpperCase()}</strong>. Click Sign In below!</span>
                </div>
              )}

              {/* TAB 1: STANDARD CREDENTIALS FORM */}
              {activeTab === 'form' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Username or Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Username or Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        value={usernameOrEmail}
                        onChange={(e) => setUsernameOrEmail(e.target.value)}
                        placeholder="admin, operator, or email"
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password with Show/Hide Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTab('demo')}
                        className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Need demo credentials?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Security Policy */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="text-slate-300 text-[11px]">Remember username</span>
                    </label>

                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Encrypted Session
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.01]"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Security Clearance...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sign In to ResQ Grid</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* TAB 2: 1-CLICK DEMO PROFILES */
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400">
                    Select any operational profile below to test with pre-configured authority:
                  </p>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const Icon = acc.icon;
                      return (
                        <div
                          key={acc.role}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/70 hover:border-blue-500/60 transition-all flex flex-col gap-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700">
                                <Icon className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {acc.roleLabel}
                                  </span>
                                  <span className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded font-bold border ${acc.badgeColor}`}>
                                    {acc.role}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                  {acc.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                            <span className="font-mono text-slate-400 text-[10px]">
                              User: <span className="text-slate-200 font-semibold">{acc.username}</span> | Pass: <span className="text-slate-200 font-semibold">{acc.password}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSelectDemo(acc, false)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition-colors"
                                title="Load credentials into form"
                              >
                                Fill
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectDemo(acc, true)}
                                disabled={isSubmitting}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                                title="Instantly log in with this account"
                              >
                                <span>Sign In</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('form')}
                      className="text-xs text-slate-400 hover:text-slate-200 underline"
                    >
                      &larr; Return to custom credentials login
                    </button>
                  </div>
                </div>
              )}

              {/* Public SOS Banner */}
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <Flame className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-200 text-[11px]">
                    Need immediate emergency help?
                  </span>
                </div>
                <Link
                  to="/sos"
                  className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 shrink-0"
                >
                  <span>Public SOS</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Bottom Registration & Info Links */}
              <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-700/60 space-y-2">
                <div>
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Register New Account</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-[10px] text-slate-500">
                  ResQ Command is strictly monitored under Kerala State Disaster Management Authority guidelines.
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>ResQ Emergency Response Platform</span>
          <span>•</span>
          <span>Incident Command System v2.4</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <Link to="/" className="hover:text-slate-200">Home</Link>
          <Link to="/sos" className="hover:text-red-400 font-semibold">Public SOS</Link>
          <Link to="/register" className="hover:text-slate-200">Register</Link>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
