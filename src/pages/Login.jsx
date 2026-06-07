import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';

function getTheme() {
  // Check saved preference first
  const saved = localStorage.getItem('xfit-theme');
  if (saved === 'sunrise') return 'sunrise';
  if (saved === 'midnight') return 'midnight';
  // Auto detect by hour
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 19) ? 'sunrise' : 'midnight';
}

const THEMES = {
  sunrise: {
    bg: 'linear-gradient(160deg, #fff7ed 0%, #fed7aa 40%, #fde68a 100%)',
    blob1: 'rgba(251,146,60,0.25)',
    blob2: 'rgba(252,211,77,0.2)',
    cardBg: 'rgba(255,255,255,0.85)',
    cardBorder: 'rgba(251,146,60,0.2)',
    textPrimary: '#1c1917',
    textMuted: '#78716c',
    scene: 'sunrise',
  },
  midnight: {
    bg: 'linear-gradient(160deg, #0f0f1a 0%, #1a1a2e 50%, #0d1117 100%)',
    blob1: 'rgba(99,102,241,0.2)',
    blob2: 'rgba(139,92,246,0.15)',
    cardBg: 'rgba(15,15,26,0.9)',
    cardBorder: 'rgba(99,102,241,0.2)',
    textPrimary: '#f8fafc',
    textMuted: '#94a3b8',
    scene: 'midnight',
  },
};

function SunriseScene() {
  return (
    <svg width="100%" height="120" viewBox="0 0 390 120" fill="none" style={{position:'absolute',bottom:0,left:0,right:0}}>
      <ellipse cx="195" cy="130" rx="260" ry="60" fill="rgba(251,146,60,0.08)"/>
      {/* Sun */}
      <circle cx="195" cy="60" r="32" fill="rgba(251,191,36,0.9)"/>
      <circle cx="195" cy="60" r="24" fill="rgba(252,211,77,1)"/>
      {/* Sun rays */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => (
        <line key={deg}
          x1={195 + Math.cos(deg*Math.PI/180)*38}
          y1={60 + Math.sin(deg*Math.PI/180)*38}
          x2={195 + Math.cos(deg*Math.PI/180)*48}
          y2={60 + Math.sin(deg*Math.PI/180)*48}
          stroke="rgba(252,211,77,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
      ))}
      {/* Horizon hills */}
      <path d="M0 100 Q60 70 120 90 Q180 110 240 80 Q300 50 390 85 L390 120 L0 120 Z" fill="rgba(251,146,60,0.12)"/>
      <path d="M0 110 Q80 90 160 105 Q240 120 320 95 Q355 85 390 100 L390 120 L0 120 Z" fill="rgba(251,146,60,0.08)"/>
    </svg>
  );
}

function MidnightScene() {
  const stars = Array.from({length: 28}, (_, i) => ({
    x: (i * 137.5) % 390,
    y: (i * 73.1) % 90,
    r: i % 3 === 0 ? 1.5 : 1,
    opacity: 0.4 + (i % 5) * 0.12,
  }));
  return (
    <svg width="100%" height="120" viewBox="0 0 390 120" fill="none" style={{position:'absolute',top:0,left:0,right:0}}>
      {stars.map((s,i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity}/>
      ))}
      {/* Moon */}
      <circle cx="310" cy="35" r="18" fill="rgba(226,232,240,0.9)"/>
      <circle cx="320" cy="28" r="14" fill="rgba(30,30,60,0.95)"/>
      {/* Subtle glow */}
      <circle cx="310" cy="35" r="26" fill="rgba(226,232,240,0.05)"/>
    </svg>
  );
}

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(getTheme);
  const t = THEMES[theme];

  const handleLogin = async () => {
    setLoading(true); setError('');
    try { await signInWithGoogle(); }
    catch { setError('Could not sign in. Please try again.'); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{background: t.bg}}>

      {/* Scene */}
      {theme === 'sunrise' ? <SunriseScene /> : <MidnightScene />}

      {/* Blobs */}
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{background: t.blob1, opacity: 0.6}}/>
      <div className="absolute bottom-40 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{background: t.blob2, opacity: 0.5}}/>

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-10">
        <button onClick={() => setTheme(t => t === 'sunrise' ? 'midnight' : 'sunrise')}
          style={{
            background: theme === 'midnight' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            border: `1px solid ${theme === 'midnight' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            color: t.textMuted,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}>
          {theme === 'sunrise' ? '🌙 Night' : '☀️ Day'}
        </button>
      </div>

      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 relative z-10">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="relative text-center space-y-6 max-w-xs w-full">

          {/* Logo */}
          <div className="mx-auto w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl"
            style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}>
            <span className="text-white font-black text-4xl tracking-tight">X</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tight" style={{color: t.textPrimary}}>XFit</h1>
            <p className="text-base" style={{color: t.textMuted}}>Stay consistent. Stay strong.</p>
          </div>

          <div className="flex justify-center gap-6 pt-2">
            {[['🏋️', 'Workouts'], ['🏃', 'Run tracking'], ['🥗', 'Nutrition']].map(([emoji, label]) => (
              <div key={label} className="text-center">
                <div className="text-xl">{emoji}</div>
                <div className="text-[10px] mt-1 font-medium" style={{color: t.textMuted}}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom sheet */}
      <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, delay:0.1 }}
        className="rounded-t-3xl px-6 pt-7 pb-10 space-y-4 relative z-10"
        style={{
          background: t.cardBg,
          borderTop: `1px solid ${t.cardBorder}`,
          paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))',
          backdropFilter: 'blur(20px)',
        }}>

        <div className="text-center">
          <h2 className="text-xl font-bold" style={{color: t.textPrimary}}>Let's get started</h2>
          <p className="text-sm mt-1" style={{color: t.textMuted}}>Sign in to track your journey</p>
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

        <p className="text-center text-xs" style={{color: t.textMuted}}>
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
