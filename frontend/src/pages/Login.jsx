import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HardDrive, Cloud, Lock, Mail, ArrowRight, ShieldCheck, Database, Server } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex h-screen bg-[#070913] text-white overflow-hidden font-sans">
      {/* Left Panel: Dribbble-inspired Deep Purple Glowing Hero */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#120a2a] via-[#1a0f3e] to-[#0a0518] p-12 flex-col justify-between overflow-hidden border-r border-purple-900/20">
        
        {/* Glow Effects & Floating Background Icons */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Ambient Animated Icons */}
        <Cloud className="absolute top-16 right-20 text-purple-400/10 w-32 h-32 animate-pulse" />
        <Database className="absolute bottom-32 left-16 text-indigo-400/10 w-24 h-24" />
        <Server className="absolute top-1/2 right-12 text-purple-300/10 w-20 h-20" />
        <ShieldCheck className="absolute bottom-20 right-28 text-indigo-300/10 w-28 h-28" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3 text-purple-400 font-extrabold text-2xl tracking-tight">
          <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 backdrop-blur-md">
            <HardDrive className="w-7 h-7 text-purple-400" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400">
            CloudDrive
          </span>
        </div>

        {/* Hero Title with Dribbble Large Sans Font */}
        <div className="relative z-10 max-w-xl my-auto">
          <h1 className="text-5xl font-black tracking-tight text-white leading-[1.15] mb-6">
            All in one <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-indigo-500">
              cloud storage.
            </span>
          </h1>
          <p className="text-purple-200/70 text-base font-normal leading-relaxed max-w-md">
            Organize, share, and access your digital assets seamlessly with enterprise-grade security and role-based access control.
          </p>
        </div>

        {/* Bottom Horizon Arc Element */}
        <div className="relative z-10 text-xs text-purple-300/40 font-medium">
          © 2026 CloudDrive SaaS Platform. All rights reserved.
        </div>

        {/* Decorative Space Curve Overlay */}
        <div className="absolute -bottom-24 -left-24 w-[600px] h-[300px] border-t-2 border-purple-500/30 rounded-full bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none blur-[1px]" />
      </div>

      {/* Right Panel: Clean Minimalist Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#090b16]">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome back</h2>
            <p className="text-sm text-gray-400">Sign in to manage your digital assets</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-gray-500 w-4 h-4" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121526] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-gray-500 w-4 h-4" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121526] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all duration-200"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-400 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}