import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Footprints, Utensils } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import Wallpaper from '@/components/layout/Wallpaper';
import BrandMark from '@/components/brand/BrandMark';
import GoogleIcon from '@/components/auth/GoogleIcon';
import { applyResolvedTheme } from '@/lib/theme';
import usePublicWallpaper from '@/hooks/usePublicWallpaper';
import { isNativeApp } from '@/lib/platform';

export default function Login() {
  const { signInWithGoogle, authError, clearAuthError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const native = isNativeApp();

  // Login is public: always alabaster. usePublicWallpaper restores the saved
  // wallpaper when this page unmounts, so the app still honours the preference.
  const activeTheme = usePublicWallpaper();
  const isDark = activeTheme === 'cosmic';

  // Apply the wallpaper class to <html> so Wallpaper picks it up.
  React.useEffect(() => {
    applyResolvedTheme(activeTheme);
  }, [activeTheme]);


  const handleLogin = async () => {
    setLoading(true); setError(''); clearAuthError();
    try { await signInWithGoogle(); }
    catch (err) {
      // Closing the web popup or cancelling the native account picker is a
      // choice, not a failure.
      const cancelled = err?.code === 'auth/popup-closed-by-user'
        || err?.code === 'auth/cancelled-popup-request'
        || /cancel(?:l)?ed/i.test(err?.message || '');
      if (cancelled) {
        setLoading(false);
        return;
      }
      setError('Could not sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen flex flex-col relative overflow-hidden theme-${activeTheme}`}>

      {/* Static, fixed-position wallpaper */}
      <Wallpaper />

      {!native && (
        <Link to="/" className="absolute left-4 top-4 z-20 inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          style={{ color: isDark ? '#94a3b8' : '#78716c' }}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      )}



      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 relative z-10">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="relative text-center space-y-6 max-w-xs w-full">

          <div className="flex justify-center">
            <BrandMark className="h-24 w-24 rounded-[2rem] shadow-2xl" emblemClassName="w-16" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight whitespace-nowrap" style={{ color: isDark ? '#f8fafc' : '#1c1917' }}>Uttar Fitness</h1>
            <p style={{ color: isDark ? '#94a3b8' : '#78716c' }}>Direct Your Greatness, Live Uttar</p>
          </div>

          <div className="flex justify-center gap-2.5 pt-1">
            {[[Dumbbell, 'Workouts'], [Footprints, 'Run tracking'], [Utensils, 'Nutrition']].map(([Icon, label]) => (
              <div
                key={label}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 shadow-sm"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.62)',
                }}
              >
                <Icon className="h-5 w-5" style={{ color: isDark ? '#cbd5e1' : '#57534e' }} />
                <span className="text-[10px] font-semibold leading-tight" style={{ color: isDark ? '#cbd5e1' : '#57534e' }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom sheet */}
      <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, delay:0.1 }}
        className="rounded-t-3xl px-6 pt-7 pb-10 space-y-5 relative z-10"
        style={{
          background: isDark ? 'rgba(10,10,25,0.92)' : 'rgba(255,255,255,0.88)',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))',
          backdropFilter: 'blur(24px)',
        }}>

        <div className="text-center">
          <h2 className="text-xl font-bold" style={{ color: isDark ? '#f8fafc' : '#1c1917' }}>Let's get started</h2>
          <p className="text-sm mt-1" style={{ color: isDark ? '#94a3b8' : '#78716c' }}>Sign in to track your journey</p>
        </div>

        {(error || authError) && <div role="alert" className="bg-destructive/10 text-destructive text-sm rounded-2xl px-4 py-3 text-center">{error || authError}</div>}

        <button onClick={handleLogin} disabled={loading}
          className="w-full h-14 rounded-2xl border border-black/10 bg-white text-gray-800 font-semibold text-base flex items-center justify-center gap-3 shadow-md hover:bg-gray-50 hover:shadow-lg active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60">
          {loading
            ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            : <GoogleIcon />}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {!native && (
          <Link to="/demo" className="flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold shadow-sm transition-colors hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)', color: isDark ? '#e2e8f0' : '#44403c', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)' }}>
            Explore the demo first
          </Link>
        )}

        <p className="text-center text-xs" style={{ color: isDark ? '#94a3b8' : '#78716c' }}>
          By continuing you agree to our{' '}
          <Link to="/terms" className="underline underline-offset-2 rounded hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">Terms</Link>
          {' & '}
          <Link to="/privacy" className="underline underline-offset-2 rounded hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">Privacy Policy</Link>
        </p>
      </motion.div>
    </main>
  );
}
