import React from 'react';
export const RANKS = {
  rookie:   { label: 'Rookie',   color: '#94a3b8', bg: 'bg-[#94a3b8]/20',  text: 'text-slate-400',  emoji: '🌱' },
  bronze:   { label: 'Bronze',   color: '#CD7F32', bg: 'bg-[#CD7F32]/20',  text: 'text-[#CD7F32]', emoji: '🥉' },
  silver:   { label: 'Silver',   color: '#C0C0C0', bg: 'bg-[#C0C0C0]/20',  text: 'text-[#C0C0C0]', emoji: '🥈' },
  gold:     { label: 'Gold',     color: '#FFD700', bg: 'bg-[#FFD700]/20',  text: 'text-[#FFD700]', emoji: '🥇' },
  platinum: { label: 'Platinum', color: '#e2e8f0', bg: 'bg-[#e2e8f0]/15',  text: 'text-slate-200', emoji: '⚡' },
  diamond:  { label: 'Diamond',  color: '#B9F2FF', bg: 'bg-[#B9F2FF]/20',  text: 'text-[#B9F2FF]', emoji: '💎' },
  elite:    { label: 'Elite',    color: '#a855f7', bg: 'bg-[#a855f7]/20',  text: 'text-purple-400', emoji: '👑' },
  legend:   { label: 'Legend',   color: '#FFD700', bg: 'bg-yellow-500/20', text: 'text-yellow-400', emoji: '🏆' },
};

// Rank is based on total workout count
export function getRank(totalWorkouts) {
  if (totalWorkouts >= 100) return 'legend';
  if (totalWorkouts >= 75)  return 'elite';
  if (totalWorkouts >= 50)  return 'diamond';
  if (totalWorkouts >= 30)  return 'platinum';
  if (totalWorkouts >= 15)  return 'gold';
  if (totalWorkouts >= 8)   return 'silver';
  if (totalWorkouts >= 3)   return 'bronze';
  return 'rookie';
}

export default function RankBadge({ rank = 'rookie' }) {
  const r = RANKS[rank] || RANKS.rookie;
  const isLegend = rank === 'legend';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${r.bg} ${isLegend ? 'border-yellow-400/40 text-yellow-400 animate-pulse' : r.text}`}
      style={isLegend ? { background: 'linear-gradient(90deg,rgba(255,215,0,0.2),rgba(168,85,247,0.2))' } : {}}
    >
      {r.emoji} {r.label}
    </span>
  );
}
