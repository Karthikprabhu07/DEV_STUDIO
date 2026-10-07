import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DevStudioLogo } from '../components/common/DevStudioLogo';
import { Shield, Sparkles, Terminal, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('••••••••');
  const { login, quickLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (res.success) {
      success('Logged in successfully!');
      navigate('/');
    } else {
      error(res.error || 'Authentication failed. Please use demo credentials.');
    }
  };

  const handleQuick = (role: 'ADMIN' | 'CAPTAIN' | 'DEV_MATE') => {
    quickLogin(role);
    success(`Signed in as ${role === 'ADMIN' ? 'Admin / Director' : role === 'CAPTAIN' ? 'Club Captain' : 'Dev Mate'}`);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl w-full mx-auto">
        <DevStudioLogo size="lg" className="[&_span]:text-white" />
        <div className="flex items-center gap-2">
          <Link
            to="/verify/8f72a9c1e4d29b0a76f53e81c0d512a8"
            className="text-xs font-mono text-neutral-400 hover:text-white transition-colors underline decoration-dotted"
          >
            Test ID Verification ↗
          </Link>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
              MITE Student Tech Portal
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Club Management & Digital ID
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              Empowering Dev Mates and Captains through high-vibe engineering.
            </p>
          </div>

          {/* Quick Demo Access Buttons */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                1-Click Demo Accounts:
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuick('ADMIN')}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all text-center"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Admin</span>
                <span className="text-[9px] font-mono text-amber-400/80">Director</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('CAPTAIN')}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-all text-center"
              >
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold">Captain</span>
                <span className="text-[9px] font-mono text-cyan-400/80">Track Lead</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('DEV_MATE')}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-all text-center"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Dev Mate</span>
                <span className="text-[9px] font-mono text-emerald-400/80">Student</span>
              </button>
            </div>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono">
              <span className="bg-neutral-900 px-2 text-neutral-500">
                Or Sign In With Email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleStandardLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                College Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. mate@devstudio.mite.ac.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-700 bg-neutral-950 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Password
                </label>
                <span className="text-[10px] text-neutral-500 font-mono">Any password for demo</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-700 bg-neutral-950 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
                <Lock className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs text-white shadow-lg shadow-indigo-600/20 transition-all duration-150"
            >
              <span>Sign In to DevStudio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Example emails quick fill */}
          <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 font-mono space-y-1">
            <span className="block text-[10px] uppercase text-neutral-500">Preset Demo Accounts:</span>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span
                onClick={() => setEmail('admin@devstudio.mite.ac.in')}
                className="cursor-pointer hover:text-indigo-400 underline decoration-dotted"
              >
                admin@devstudio.mite.ac.in
              </span>
              <span>·</span>
              <span
                onClick={() => setEmail('captain@devstudio.mite.ac.in')}
                className="cursor-pointer hover:text-indigo-400 underline decoration-dotted"
              >
                captain@devstudio.mite.ac.in
              </span>
              <span>·</span>
              <span
                onClick={() => setEmail('mate@devstudio.mite.ac.in')}
                className="cursor-pointer hover:text-indigo-400 underline decoration-dotted"
              >
                mate@devstudio.mite.ac.in
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-neutral-500 font-mono py-2">
        <p>DevStudio · Mangalore Institute of Technology & Engineering (MITE)</p>
      </footer>
    </div>
  );
};
