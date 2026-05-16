import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true); setError('');
    try { await signInWithGoogle(); }
    catch { setError('Could not sign in. Please try again.'); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Top section — visual */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{background:'hsl(var(--primary))'}} />
        <div className="absolute bottom-10 right-0 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{background:'hsl(var(--primary))'}} />

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="relative text-center space-y-6 max-w-xs w-full">

          {/* Logo */}
          <div className="mx-auto w-24 h-24 rounded-[2rem] primary-gradient flex items-center justify-center shadow-2xl">
            <span className="text-white font-black text-4xl tracking-tight">X</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tight">XFit</h1>
            <p className="text-muted-foreground text-base">Stay consistent. Stay strong.</p>
          </div>

          {/* Stats row — social proof feel */}
          <div className="flex justify-center gap-6 pt-2">
            {[['🏋️', 'Workouts'], ['🏃', 'Run tracking'], ['🥗', 'Nutrition']].map(([emoji, label]) => (
              <div key={label} className="text-center">
                <div className="text-xl">{emoji}</div>
                <div className="text-[10px] text-muted-foreground mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom sheet */}
      <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, delay:0.1 }}
        className="bg-card border-t border-border/50 rounded-t-3xl px-6 pt-7 pb-10 space-y-4"
        style={{ paddingBottom:'max(2.5rem, env(safe-area-inset-bottom))' }}>

        <div className="text-center">
          <h2 className="text-xl font-bold">Let's get started</h2>
          <p className="text-muted-foreground text-sm mt-1">Sign in to track your journey</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-2xl px-4 py-3 text-center">{error}</div>
        )}

        <button onClick={handleLogin} disabled={loading}
          className="w-full h-14 rounded-2xl bg-white text-gray-800 font-semibold text-base flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-60">
          {loading
            ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            : <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
          }
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
