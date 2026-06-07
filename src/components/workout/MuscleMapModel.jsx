import React from 'react';

function getMuscles(name = '') {
  const n = name.toLowerCase();
  if (n.includes('bicep') || n.includes('curl')) return { primary: ['biceps_l','biceps_r'], secondary: [] };
  if (n.includes('tricep') || n.includes('dip')) return { primary: ['triceps_l','triceps_r'], secondary: [] };
  if (n.includes('push-up')||n.includes('pushup')||n.includes('bench press')||n.includes('chest')||n.includes('fly')) return { primary: ['chest_l','chest_r'], secondary: ['triceps_l','triceps_r','front_delt_l','front_delt_r'] };
  if (n.includes('pull-up')||n.includes('pullup')||n.includes('lat pulldown')) return { primary: ['lat_l','lat_r'], secondary: ['biceps_l','biceps_r','upper_back'] };
  if (n.includes('row')||n.includes('cable row')) return { primary: ['upper_back','lat_l','lat_r'], secondary: ['biceps_l','biceps_r','rear_delt_l','rear_delt_r'] };
  if (n.includes('squat')) return { primary: ['quad_l','quad_r'], secondary: ['glute_l','glute_r','ham_l','ham_r'] };
  if (n.includes('deadlift')) return { primary: ['ham_l','ham_r','lower_back'], secondary: ['glute_l','glute_r','lat_l','lat_r'] };
  if (n.includes('lunge')) return { primary: ['quad_l','quad_r','glute_l','glute_r'], secondary: ['ham_l','ham_r'] };
  if (n.includes('lateral raise')) return { primary: ['side_delt_l','side_delt_r'], secondary: [] };
  if (n.includes('overhead press')||n.includes('ground to overhead')) return { primary: ['front_delt_l','front_delt_r','side_delt_l','side_delt_r'], secondary: ['triceps_l','triceps_r','upper_back'] };
  if (n.includes('shoulder')) return { primary: ['front_delt_l','front_delt_r','side_delt_l','side_delt_r'], secondary: ['triceps_l','triceps_r'] };
  if (n.includes('plank')) return { primary: ['abs','oblique_l','oblique_r'], secondary: ['lower_back','front_delt_l','front_delt_r'] };
  if (n.includes('crunch')||n.includes('ab rollout')||n.includes('dead bug')) return { primary: ['abs'], secondary: ['oblique_l','oblique_r'] };
  if (n.includes('russian twist')) return { primary: ['oblique_l','oblique_r'], secondary: ['abs'] };
  if (n.includes('hip raise')||n.includes('bridge')) return { primary: ['glute_l','glute_r'], secondary: ['ham_l','ham_r','lower_back'] };
  if (n.includes('calf')) return { primary: ['calf_l','calf_r'], secondary: [] };
  if (n.includes('burpee')) return { primary: ['chest_l','chest_r','quad_l','quad_r'], secondary: ['triceps_l','triceps_r','front_delt_l','front_delt_r','abs'] };
  if (n.includes('mountain climber')) return { primary: ['abs','quad_l','quad_r'], secondary: ['front_delt_l','front_delt_r','oblique_l','oblique_r'] };
  if (n.includes('jump')||n.includes('high knees')||n.includes('sprint')) return { primary: ['quad_l','quad_r','calf_l','calf_r'], secondary: ['glute_l','glute_r','ham_l','ham_r'] };
  if (n.includes('jumping jack')) return { primary: ['side_delt_l','side_delt_r','calf_l','calf_r'], secondary: ['quad_l','quad_r'] };
  return { primary: ['chest_l','chest_r','lat_l','lat_r','quad_l','quad_r','glute_l','glute_r'], secondary: [] };
}

const FORM_CUES = {
  'bicep curl': ['Elbows pinned to sides', 'Squeeze at the top', 'Slow on the way down'],
  'hammer curl': ['Neutral grip throughout', 'Control the descent', 'No swinging'],
  'tricep': ['Lock elbows at sides', 'Full extension at bottom', 'Squeeze at lockout'],
  'push-up': ['Chest to floor', 'Elbows at 45°', 'Core tight throughout'],
  'diamond push': ['Hands form a diamond', 'Elbows track back', 'Full range of motion'],
  'bench press': ['Bar to lower chest', 'Drive feet into floor', 'Arch naturally'],
  'chest': ['Squeeze at the top', 'Control the negative', 'Full stretch at bottom'],
  'pull-up': ['Dead hang to start', 'Drive elbows to hips', 'Chin over the bar'],
  'lat pulldown': ['Lean back slightly', 'Pull to upper chest', 'Squeeze shoulder blades'],
  'row': ['Chest up, back flat', 'Pull to lower chest', 'Squeeze shoulder blades'],
  'squat': ['Knees track over toes', 'Drive hips back first', 'Chest tall throughout'],
  'bulgarian': ['Front knee over ankle', 'Rear knee drops straight down', 'Drive through front heel'],
  'deadlift': ['Bar over mid-foot', 'Push the floor away', 'Hips and shoulders rise together'],
  'lunge': ['Step far enough forward', 'Back knee hovers floor', 'Drive through front heel'],
  'lateral raise': ['Slight bend in elbows', 'Raise to shoulder height only', 'Control the descent'],
  'overhead press': ['Brace your core', 'Press straight up', 'Full lockout at top'],
  'ground to overhead': ['Squat deep first', 'Drive through legs', 'Press at the top'],
  'plank': ['Hips level with shoulders', 'Squeeze glutes and abs', 'Breathe steadily'],
  'ab hold': ['Lower back pressed flat', 'Legs at 45°', 'Breathe through it'],
  'crunch': ['Lower back stays down', 'Exhale as you curl up', 'Slow and controlled'],
  'russian twist': ['Feet off the floor', 'Rotate from your core', 'Touch the floor each side'],
  'dead bug': ['Lower back flat always', 'Opposite arm and leg', 'Exhale on extension'],
  'ab rollout': ['Start from knees', 'Brace hard before moving', 'Use abs to pull back'],
  'bicycle crunch': ['Elbow to opposite knee', 'Extend other leg fully', 'Keep neck relaxed'],
  'hip raise': ['Squeeze glutes at top', 'Drive through heels', 'Hold 1 second at peak'],
  'bridge': ['Squeeze glutes at top', 'Drive through heels', 'Keep knees together'],
  'calf raise': ['Full range of motion', 'Pause at the top', 'Slow on the way down'],
  'burpee': ['Jump feet back together', 'Chest to floor', 'Explosive jump at top'],
  'mountain climber': ['Hips stay level', 'Drive knees to chest fast', 'Keep core tight'],
  'jump squat': ['Soft landing', 'Land with bent knees', 'Immediate next rep'],
  'jump lunge': ['Alternate legs each rep', 'Soft landing always', 'Stay low between reps'],
  'high knees': ['Drive knees to hip height', 'Pump arms with legs', 'Stay on balls of feet'],
  'jumping jack': ['Arms fully extend overhead', 'Land softly', 'Keep steady rhythm'],
  'sprint': ['Drive arms hard', 'High knee lift', 'Push off each step'],
  'box jump': ['Land softly with bent knees', 'Step down, do not jump', 'Full hip extension at top'],
  'foam rolling': ['Slow controlled rolls', 'Pause on tight spots', 'Breathe and relax'],
  'hip flexor stretch': ['Sink into the stretch', 'Keep torso upright', 'Hold and breathe'],
  'pigeon pose': ['Square your hips', 'Sink into the stretch', 'Breathe deeply'],
};

function getFormCues(name = '') {
  const n = name.toLowerCase();
  for (const [key, cues] of Object.entries(FORM_CUES)) {
    if (n.includes(key)) return cues;
  }
  return ['Focus on form over speed', 'Breathe steadily', 'Full range of motion'];
}

const PRIMARY = '#ef4444';
const SECONDARY = '#f97316';
const BASE = 'hsl(var(--secondary, #1e293b))';
const STROKE = 'hsl(var(--border, #334155))';

export default function MuscleMapModel({ exerciseName = '', showLabel = true }) {
  if (!exerciseName) return null;
  const { primary, secondary } = getMuscles(exerciseName);

  const fill = (id) => {
    if (primary.includes(id)) return PRIMARY;
    if (secondary.includes(id)) return SECONDARY;
    return BASE;
  };

  const opacity = (id) => {
    if (primary.includes(id)) return 0.9;
    if (secondary.includes(id)) return 0.7;
    return 0.6;
  };

  const muscleNames = {
    biceps_l: 'Biceps', biceps_r: 'Biceps',
    triceps_l: 'Triceps', triceps_r: 'Triceps',
    chest_l: 'Chest', chest_r: 'Chest',
    lat_l: 'Lats', lat_r: 'Lats',
    upper_back: 'Upper Back', lower_back: 'Lower Back',
    front_delt_l: 'Shoulders', front_delt_r: 'Shoulders',
    side_delt_l: 'Shoulders', side_delt_r: 'Shoulders',
    rear_delt_l: 'Rear Delts', rear_delt_r: 'Rear Delts',
    abs: 'Abs', oblique_l: 'Obliques', oblique_r: 'Obliques',
    quad_l: 'Quads', quad_r: 'Quads',
    ham_l: 'Hamstrings', ham_r: 'Hamstrings',
    glute_l: 'Glutes', glute_r: 'Glutes',
    calf_l: 'Calves', calf_r: 'Calves',
  };

  const allMuscleLabels = [...new Set([
    ...primary.map(id => muscleNames[id]),
    ...secondary.map(id => muscleNames[id]),
  ])].filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

        {/* FRONT VIEW */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <p style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground, #94a3b8))', margin: 0 }}>Front</p>
          <svg width="90" height="200" viewBox="0 0 90 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* HEAD */}
            <ellipse cx="45" cy="13" rx="10" ry="12" fill={BASE} stroke={STROKE} strokeWidth="0.8"/>
            {/* NECK */}
            <rect x="40" y="24" width="10" height="7" rx="2" fill={BASE} stroke={STROKE} strokeWidth="0.8"/>
            {/* TRAPS front */}
            <path d="M35 31 Q45 29 55 31 L57 38 Q45 35 33 38 Z" fill={fill('upper_back')} fillOpacity={opacity('upper_back')} stroke={STROKE} strokeWidth="0.6"/>
            {/* FRONT DELTS */}
            <ellipse cx="26" cy="38" rx="9" ry="8" fill={fill('front_delt_l')} fillOpacity={opacity('front_delt_l')} stroke={STROKE} strokeWidth="0.6"/>
            <ellipse cx="64" cy="38" rx="9" ry="8" fill={fill('front_delt_r')} fillOpacity={opacity('front_delt_r')} stroke={STROKE} strokeWidth="0.6"/>
            {/* SIDE DELTS */}
            <ellipse cx="20" cy="40" rx="6" ry="7" fill={fill('side_delt_l')} fillOpacity={opacity('side_delt_l')} stroke={STROKE} strokeWidth="0.6"/>
            <ellipse cx="70" cy="40" rx="6" ry="7" fill={fill('side_delt_r')} fillOpacity={opacity('side_delt_r')} stroke={STROKE} strokeWidth="0.6"/>
            {/* CHEST */}
            <path d="M33 37 Q37 35 45 37 L45 52 Q37 54 30 50 Z" fill={fill('chest_l')} fillOpacity={opacity('chest_l')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M57 37 Q53 35 45 37 L45 52 Q53 54 60 50 Z" fill={fill('chest_r')} fillOpacity={opacity('chest_r')} stroke={STROKE} strokeWidth="0.6"/>
            {/* BICEPS */}
            <path d="M15 45 Q10 48 11 62 Q13 68 17 66 Q19 60 18 46 Z" fill={fill('biceps_l')} fillOpacity={opacity('biceps_l')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M75 45 Q80 48 79 62 Q77 68 73 66 Q71 60 72 46 Z" fill={fill('biceps_r')} fillOpacity={opacity('biceps_r')} stroke={STROKE} strokeWidth="0.6"/>
            {/* FOREARMS */}
            <path d="M12 68 Q10 72 11 82 Q14 85 16 82 Q17 72 16 68 Z" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M78 68 Q80 72 79 82 Q76 85 74 82 Q73 72 74 68 Z" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            {/* ABS - 6 pack */}
            <rect x="38" y="53" width="8" height="7" rx="2" fill={fill('abs')} fillOpacity={opacity('abs')} stroke={STROKE} strokeWidth="0.6"/>
            <rect x="48" y="53" width="8" height="7" rx="2" fill={fill('abs')} fillOpacity={opacity('abs')} stroke={STROKE} strokeWidth="0.6"/>
            <rect x="38" y="62" width="8" height="7" rx="2" fill={fill('abs')} fillOpacity={opacity('abs')} stroke={STROKE} strokeWidth="0.6"/>
            <rect x="48" y="62" width="8" height="7" rx="2" fill={fill('abs')} fillOpacity={opacity('abs')} stroke={STROKE} strokeWidth="0.6"/>
            <rect x="38" y="71" width="8" height="6" rx="2" fill={fill('abs')} fillOpacity={opacity('abs')} stroke={STROKE} strokeWidth="0.6"/>
            <rect x="48" y="71" width="8" height="6" rx="2" fill={fill('abs')} fillOpacity={opacity('abs')} stroke={STROKE} strokeWidth="0.6"/>
            {/* OBLIQUES */}
            <path d="M30 52 Q26 58 27 75 Q31 78 34 72 Q34 60 33 52 Z" fill={fill('oblique_l')} fillOpacity={opacity('oblique_l')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M60 52 Q64 58 63 75 Q59 78 56 72 Q56 60 57 52 Z" fill={fill('oblique_r')} fillOpacity={opacity('oblique_r')} stroke={STROKE} strokeWidth="0.6"/>
            {/* HIP area */}
            <path d="M27 76 Q28 85 35 88 L45 89 L55 88 Q62 85 63 76 Q55 80 45 81 Q35 80 27 76 Z" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            {/* QUADS */}
            <path d="M30 89 Q24 95 25 118 Q28 125 33 123 Q37 116 36 96 Q34 91 30 89 Z" fill={fill('quad_l')} fillOpacity={opacity('quad_l')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M60 89 Q66 95 65 118 Q62 125 57 123 Q53 116 54 96 Q56 91 60 89 Z" fill={fill('quad_r')} fillOpacity={opacity('quad_r')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M36 89 Q40 91 45 91 Q50 91 54 89 Q52 98 50 120 Q47 125 45 125 Q43 125 40 120 Q38 98 36 89 Z" fill={fill('quad_l')} fillOpacity={opacity('quad_l') * 0.8} stroke={STROKE} strokeWidth="0.6"/>
            {/* KNEES */}
            <ellipse cx="33" cy="128" rx="7" ry="5" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            <ellipse cx="57" cy="128" rx="7" ry="5" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            {/* CALVES front */}
            <path d="M28 133 Q25 140 27 158 Q30 163 34 160 Q36 152 35 136 Q33 132 28 133 Z" fill={fill('calf_l')} fillOpacity={opacity('calf_l')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M62 133 Q65 140 63 158 Q60 163 56 160 Q54 152 55 136 Q57 132 62 133 Z" fill={fill('calf_r')} fillOpacity={opacity('calf_r')} stroke={STROKE} strokeWidth="0.6"/>
            {/* SHINS */}
            <path d="M34 133 Q37 136 38 156 Q36 162 33 161 Q34 152 35 136 Z" fill={BASE} stroke={STROKE} strokeWidth="0.5"/>
            <path d="M56 133 Q53 136 52 156 Q54 162 57 161 Q56 152 55 136 Z" fill={BASE} stroke={STROKE} strokeWidth="0.5"/>
            {/* FEET */}
            <ellipse cx="31" cy="165" rx="7" ry="4" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            <ellipse cx="59" cy="165" rx="7" ry="4" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
          </svg>
        </div>

        {/* BACK VIEW */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <p style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground, #94a3b8))', margin: 0 }}>Back</p>
          <svg width="90" height="200" viewBox="0 0 90 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* HEAD */}
            <ellipse cx="45" cy="13" rx="10" ry="12" fill={BASE} stroke={STROKE} strokeWidth="0.8"/>
            {/* NECK */}
            <rect x="40" y="24" width="10" height="7" rx="2" fill={BASE} stroke={STROKE} strokeWidth="0.8"/>
            {/* TRAPS */}
            <path d="M33 31 Q45 27 57 31 L59 40 Q52 37 45 36 Q38 37 31 40 Z" fill={fill('upper_back')} fillOpacity={opacity('upper_back')} stroke={STROKE} strokeWidth="0.6"/>
            {/* REAR DELTS */}
            <ellipse cx="25" cy="39" rx="9" ry="8" fill={fill('rear_delt_l')} fillOpacity={opacity('rear_delt_l')} stroke={STROKE} strokeWidth="0.6"/>
            <ellipse cx="65" cy="39" rx="9" ry="8" fill={fill('rear_delt_r')} fillOpacity={opacity('rear_delt_r')} stroke={STROKE} strokeWidth="0.6"/>
            {/* LATS */}
            <path d="M32 40 Q25 48 27 65 Q30 70 35 68 Q38 60 37 45 Z" fill={fill('lat_l')} fillOpacity={opacity('lat_l')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M58 40 Q65 48 63 65 Q60 70 55 68 Q52 60 53 45 Z" fill={fill('lat_r')} fillOpacity={opacity('lat_r')} stroke={STROKE} strokeWidth="0.6"/>
            {/* UPPER BACK rhomboids */}
            <path d="M34 42 Q39 40 45 41 Q51 40 56 42 L55 62 Q50 65 45 66 Q40 65 35 62 Z" fill={fill('upper_back')} fillOpacity={opacity('upper_back') * 0.8} stroke={STROKE} strokeWidth="0.6"/>
            {/* LOWER BACK */}
            <path d="M35 63 Q40 67 45 68 Q50 67 55 63 L56 78 Q50 82 45 83 Q40 82 34 78 Z" fill={fill('lower_back')} fillOpacity={opacity('lower_back')} stroke={STROKE} strokeWidth="0.6"/>
            {/* TRICEPS */}
            <path d="M17 44 Q12 50 13 64 Q15 70 19 68 Q21 62 20 47 Z" fill={fill('triceps_l')} fillOpacity={opacity('triceps_l')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M73 44 Q78 50 77 64 Q75 70 71 68 Q69 62 70 47 Z" fill={fill('triceps_r')} fillOpacity={opacity('triceps_r')} stroke={STROKE} strokeWidth="0.6"/>
            {/* FOREARMS back */}
            <path d="M14 70 Q12 74 13 84 Q16 87 18 84 Q19 74 18 70 Z" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M76 70 Q78 74 77 84 Q74 87 72 84 Q71 74 72 70 Z" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            {/* GLUTES */}
            <path d="M28 83 Q27 95 32 102 Q38 106 45 106 Q52 106 58 102 Q63 95 62 83 Q55 88 45 89 Q35 88 28 83 Z" fill={fill('glute_l')} fillOpacity={opacity('glute_l')} stroke={STROKE} strokeWidth="0.6"/>
            {/* Split glutes */}
            <line x1="45" y1="83" x2="45" y2="106" stroke={STROKE} strokeWidth="0.5"/>
            {/* HAMSTRINGS */}
            <path d="M29 106 Q24 114 26 130 Q29 136 34 134 Q37 126 36 110 Q33 106 29 106 Z" fill={fill('ham_l')} fillOpacity={opacity('ham_l')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M61 106 Q66 114 64 130 Q61 136 56 134 Q53 126 54 110 Q57 106 61 106 Z" fill={fill('ham_r')} fillOpacity={opacity('ham_r')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M36 106 Q40 108 45 109 Q50 108 54 106 Q52 118 50 132 Q47 136 45 136 Q43 136 40 132 Q38 118 36 106 Z" fill={fill('ham_l')} fillOpacity={opacity('ham_l') * 0.7} stroke={STROKE} strokeWidth="0.6"/>
            {/* KNEES */}
            <ellipse cx="33" cy="138" rx="7" ry="5" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            <ellipse cx="57" cy="138" rx="7" ry="5" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            {/* CALVES back */}
            <path d="M27 143 Q24 152 26 163 Q29 168 33 165 Q35 157 34 146 Q31 142 27 143 Z" fill={fill('calf_l')} fillOpacity={opacity('calf_l')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M63 143 Q66 152 64 163 Q61 168 57 165 Q55 157 56 146 Q59 142 63 143 Z" fill={fill('calf_r')} fillOpacity={opacity('calf_r')} stroke={STROKE} strokeWidth="0.6"/>
            <path d="M34 143 Q37 147 39 163 Q37 168 34 166 Q34 157 34 146 Z" fill={BASE} stroke={STROKE} strokeWidth="0.5"/>
            <path d="M56 143 Q53 147 51 163 Q53 168 56 166 Q56 157 56 146 Z" fill={BASE} stroke={STROKE} strokeWidth="0.5"/>
            {/* FEET */}
            <ellipse cx="31" cy="170" rx="7" ry="4" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
            <ellipse cx="59" cy="170" rx="7" ry="4" fill={BASE} stroke={STROKE} strokeWidth="0.6"/>
          </svg>
        </div>
      </div>

      {/* MUSCLE LABELS */}
      {showLabel && allMuscleLabels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
          {allMuscleLabels.map((label, i) => (
            <span key={label} style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: i < primary.filter((v,idx,a)=>a.indexOf(v)===idx).map(id=>muscleNames[id]).filter(Boolean).indexOf(label) !== -1 || allMuscleLabels.indexOf(label) < primary.filter((v,idx,a)=>a.indexOf(v)===idx).length ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
              color: i === 0 ? '#ef4444' : '#f97316',
            }}>
              {label}
            </span>
          ))}
        </div>
      )}
      {showLabel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', maxWidth: '220px' }}>
          {getFormCues(exerciseName).map((cue, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground, #94a3b8))', lineHeight: 1.4 }}>{cue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
