import React from 'react';

function getMuscles(name = '') {
  const n = name.toLowerCase();
  if (n.includes('bicep') || n.includes('curl')) return ['Biceps'];
  if (n.includes('tricep') || n.includes('dip')) return ['Triceps'];
  if (n.includes('push') || n.includes('chest') || n.includes('bench')) return ['Chest', 'Triceps', 'Shoulders'];
  if (n.includes('pull') || n.includes('row') || n.includes('lat')) return ['Back', 'Biceps'];
  if (n.includes('squat') || n.includes('leg press')) return ['Quads', 'Glutes'];
  if (n.includes('deadlift')) return ['Hamstrings', 'Glutes', 'Back'];
  if (n.includes('lunge')) return ['Quads', 'Glutes'];
  if (n.includes('shoulder') || n.includes('overhead') || n.includes('lateral')) return ['Shoulders'];
  if (n.includes('plank') || n.includes('ab') || n.includes('crunch') || n.includes('twist')) return ['Core'];
  if (n.includes('calf')) return ['Calves'];
  if (n.includes('hip raise') || n.includes('bridge') || n.includes('glute')) return ['Glutes', 'Hamstrings'];
  if (n.includes('burpee')) return ['Full Body'];
  if (n.includes('jump') || n.includes('sprint') || n.includes('run')) return ['Quads', 'Calves', 'Glutes'];
  return ['Full Body'];
}

const MUSCLE_COLORS = {
  'Chest': '#ef4444', 'Back': '#ef4444', 'Shoulders': '#ef4444',
  'Biceps': '#f97316', 'Triceps': '#f97316', 'Core': '#ef4444',
  'Quads': '#ef4444', 'Hamstrings': '#ef4444', 'Glutes': '#ef4444',
  'Calves': '#f97316', 'Full Body': '#ef4444',
};

export default function MuscleMapModel({ exerciseName = '', showLabel = true }) {
  if (!exerciseName) return null;
  const muscles = getMuscles(exerciseName);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-4 items-start justify-center">
        {/* Front body */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Front</p>
          <svg width="80" height="150" viewBox="0 0 80 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Head */}
            <ellipse cx="40" cy="11" rx="9" ry="10" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1"/>
            {/* Shoulders */}
            <ellipse cx="20" cy="30" rx="10" ry="7" fill={muscles.includes('Shoulders') || muscles.includes('Full Body') ? MUSCLE_COLORS['Shoulders'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="60" cy="30" rx="10" ry="7" fill={muscles.includes('Shoulders') || muscles.includes('Full Body') ? MUSCLE_COLORS['Shoulders'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            {/* Chest */}
            <ellipse cx="33" cy="42" rx="12" ry="10" fill={muscles.includes('Chest') || muscles.includes('Full Body') ? MUSCLE_COLORS['Chest'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="47" cy="42" rx="12" ry="10" fill={muscles.includes('Chest') || muscles.includes('Full Body') ? MUSCLE_COLORS['Chest'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            {/* Biceps */}
            <ellipse cx="13" cy="52" rx="6" ry="12" fill={muscles.includes('Biceps') || muscles.includes('Full Body') ? MUSCLE_COLORS['Biceps'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="67" cy="52" rx="6" ry="12" fill={muscles.includes('Biceps') || muscles.includes('Full Body') ? MUSCLE_COLORS['Biceps'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            {/* Core/Abs */}
            <rect x="30" y="54" width="9" height="7" rx="2" fill={muscles.includes('Core') || muscles.includes('Full Body') ? MUSCLE_COLORS['Core'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <rect x="41" y="54" width="9" height="7" rx="2" fill={muscles.includes('Core') || muscles.includes('Full Body') ? MUSCLE_COLORS['Core'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <rect x="30" y="63" width="9" height="7" rx="2" fill={muscles.includes('Core') || muscles.includes('Full Body') ? MUSCLE_COLORS['Core'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <rect x="41" y="63" width="9" height="7" rx="2" fill={muscles.includes('Core') || muscles.includes('Full Body') ? MUSCLE_COLORS['Core'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            {/* Quads */}
            <ellipse cx="30" cy="105" rx="11" ry="18" fill={muscles.includes('Quads') || muscles.includes('Full Body') ? MUSCLE_COLORS['Quads'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="50" cy="105" rx="11" ry="18" fill={muscles.includes('Quads') || muscles.includes('Full Body') ? MUSCLE_COLORS['Quads'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            {/* Calves */}
            <ellipse cx="30" cy="135" rx="8" ry="11" fill={muscles.includes('Calves') || muscles.includes('Full Body') ? MUSCLE_COLORS['Calves'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="50" cy="135" rx="8" ry="11" fill={muscles.includes('Calves') || muscles.includes('Full Body') ? MUSCLE_COLORS['Calves'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
          </svg>
        </div>
        {/* Back body */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Back</p>
          <svg width="80" height="150" viewBox="0 0 80 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="40" cy="11" rx="9" ry="10" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1"/>
            {/* Shoulders back */}
            <ellipse cx="20" cy="30" rx="10" ry="7" fill={muscles.includes('Shoulders') || muscles.includes('Full Body') ? MUSCLE_COLORS['Shoulders'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="60" cy="30" rx="10" ry="7" fill={muscles.includes('Shoulders') || muscles.includes('Full Body') ? MUSCLE_COLORS['Shoulders'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            {/* Back/Lats */}
            <ellipse cx="27" cy="52" rx="11" ry="18" fill={muscles.includes('Back') || muscles.includes('Full Body') ? MUSCLE_COLORS['Back'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="53" cy="52" rx="11" ry="18" fill={muscles.includes('Back') || muscles.includes('Full Body') ? MUSCLE_COLORS['Back'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            {/* Triceps */}
            <ellipse cx="13" cy="52" rx="6" ry="12" fill={muscles.includes('Triceps') || muscles.includes('Full Body') ? MUSCLE_COLORS['Triceps'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="67" cy="52" rx="6" ry="12" fill={muscles.includes('Triceps') || muscles.includes('Full Body') ? MUSCLE_COLORS['Triceps'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            {/* Glutes */}
            <ellipse cx="30" cy="88" rx="13" ry="11" fill={muscles.includes('Glutes') || muscles.includes('Full Body') ? MUSCLE_COLORS['Glutes'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="50" cy="88" rx="13" ry="11" fill={muscles.includes('Glutes') || muscles.includes('Full Body') ? MUSCLE_COLORS['Glutes'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            {/* Hamstrings */}
            <ellipse cx="30" cy="112" rx="11" ry="16" fill={muscles.includes('Hamstrings') || muscles.includes('Full Body') ? MUSCLE_COLORS['Hamstrings'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="50" cy="112" rx="11" ry="16" fill={muscles.includes('Hamstrings') || muscles.includes('Full Body') ? MUSCLE_COLORS['Hamstrings'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            {/* Calves back */}
            <ellipse cx="30" cy="135" rx="8" ry="11" fill={muscles.includes('Calves') || muscles.includes('Full Body') ? MUSCLE_COLORS['Calves'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
            <ellipse cx="50" cy="135" rx="8" ry="11" fill={muscles.includes('Calves') || muscles.includes('Full Body') ? MUSCLE_COLORS['Calves'] : 'hsl(var(--secondary))'} stroke="hsl(var(--border))" strokeWidth="1" fillOpacity="0.8"/>
          </svg>
        </div>
      </div>
      {showLabel && muscles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {muscles.map((m, i) => (
            <span key={m} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 0 ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"}`}>
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
