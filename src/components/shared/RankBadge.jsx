import React from 'react';
export const RANKS = {
  bronze:   { label:'Bronze',   color:'#CD7F32', bg:'bg-[#CD7F32]/20', text:'text-[#CD7F32]', emoji:'🥉' },
  silver:   { label:'Silver',   color:'#C0C0C0', bg:'bg-[#C0C0C0]/20', text:'text-[#C0C0C0]', emoji:'🥈' },
  gold:     { label:'Gold',     color:'#FFD700', bg:'bg-[#FFD700]/20', text:'text-[#FFD700]', emoji:'🥇' },
  diamond:  { label:'Diamond',  color:'#B9F2FF', bg:'bg-[#B9F2FF]/20', text:'text-[#B9F2FF]', emoji:'💎' },
  champion: { label:'Champion', color:'#FFD700', bg:'bg-gradient-to-r from-yellow-500/20 to-purple-500/20', text:'text-yellow-400', emoji:'🏆' },
};
export function getRank(streak) {
  if (streak >= 100) return 'champion';
  if (streak >= 75) return 'diamond';
  if (streak >= 50) return 'gold';
  if (streak >= 25) return 'silver';
  return 'bronze';
}
export default function RankBadge({ rank = 'bronze' }) {
  const r = RANKS[rank] || RANKS.bronze;
  const isChampion = rank === 'champion';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${r.bg} ${isChampion ? 'border-yellow-400/40 text-yellow-400 animate-pulse' : `${r.text}`}`}
      style={isChampion ? {background:'linear-gradient(90deg,rgba(255,215,0,0.2),rgba(168,85,247,0.2))'} : {}}>
      {r.emoji} {r.label}
    </span>
  );
}
