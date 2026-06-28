'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { LogIn, UserPlus, Key, Mail, Eye, EyeOff, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();
  const keysConfigured = !!supabase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        // Sign Up flow
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        // If the user is automatically signed in (confirm email disabled in Supabase console)
        if (data.session) {
          setSuccess('Account created successfully! Redirecting...');
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          // If confirm email is enabled in Supabase console
          setSuccess('Sign up successful! Please check your email inbox for the verification link.');
          setEmail('');
          setPassword('');
        }
      } else {
        // Sign In flow
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        setSuccess('Successfully signed in! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_page_container" className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-neutral-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand logo */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <div id="logo_icon_login" className="grid grid-cols-2 gap-0.5 w-6 h-6 p-0.5 bg-zinc-800 rounded">
            <div className="bg-emerald-500 rounded-sm"></div>
            <div className="bg-sky-500 rounded-sm"></div>
            <div className="bg-orange-500 rounded-sm"></div>
            <div className="bg-zinc-700 rounded-sm"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-mono">everyday</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Build simple, daily consistency. One check at a time.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 border border-zinc-800/80 py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          {!keysConfigured ? (
            <div id="keys_warning_banner" className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Supabase Keys Missing</p>
                  <p className="leading-relaxed">Please configure your Supabase variables in the Settings panel of AI Studio.</p>
                </div>
              </div>
              <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
                <p>Required keys to add:</p>
                <ul className="list-disc pl-4 space-y-1 font-mono text-[10px]">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                </ul>
                <p className="pt-2">Once keys are set, the build will auto-refresh and the form will activate.</p>
              </div>
            </div>
          ) : (
            <form id="auth_form" className="space-y-5" onSubmit={handleSubmit}>
              {/* Notifications */}
              {error && (
                <div id="auth_error_alert" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2.5 items-start">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div id="auth_success_alert" className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex gap-2.5 items-start">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email_input" className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email_input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 bg-zinc-950 rounded-xl text-sm placeholder-zinc-500 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password_input" className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    id="password_input"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 border border-zinc-800 bg-zinc-950 rounded-xl text-sm placeholder-zinc-500 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  id="auth_submit_btn"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-zinc-950 bg-white hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-emerald-500 disabled:opacity-50 transition-all cursor-pointer font-sans shadow-md"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Sign Up
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </button>
              </div>

              {/* Toggle Login/Signup */}
              <div className="text-center pt-2 border-t border-zinc-800/50">
                <button
                  type="button"
                  id="toggle_auth_mode_btn"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition hover:underline"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
