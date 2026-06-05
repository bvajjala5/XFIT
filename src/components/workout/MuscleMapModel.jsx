import React from 'react';

// Maps exercise names to muscle groups they target
function getMuscleGroups(exerciseName = '') {
  const n = exerciseName.toLowerCase();
  if (n.includes('bicep') || n.includes('curl') || n.includes('hammer curl')) return ['biceps'];
  if (n.includes('tricep') || n.includes('dip') || n.includes('skull crusher')) return ['triceps'];
  if (n.includes('push-up') || n.includes('pushup') || n.includes('bench press') || n.includes('chest')) return ['chest', 'triceps', 'shoulders'];
  if (n.includes('pull-up') || n.includes('pullup') || n.includes('lat pulldown') || n.includes('row')) return ['lats', 'biceps', 'upper_back'];
  if (n.includes('squat') || n.includes('leg press')) return ['quads', 'glutes', 'hamstrings'];
  if (n.includes('deadlift')) return ['hamstrings', 'glutes', 'lower_back', 'lats'];
  if (n.includes('lunge')) return ['quads', 'glutes', 'hamstrings'];
  if (n.includes('shoulder') || n.includes('overhead press') || n.includes('lateral raise')) return ['shoulders'];
  if (n.includes('plank') || n.includes('ab') || n.includes('crunch') || n.includes('russian twist') || n.includes('core')) return ['abs', 'obliques'];
  if (n.includes('calf') || n.includes('calf raise')) return ['calves'];
  if (n.includes('hip raise') || n.includes('bridge') || n.includes('glute')) return ['glutes', 'hamstrings'];
  if (n.includes('burpee')) return ['chest', 'quads', 'shoulders', 'abs'];
  if (n.includes('mountain climber')) return ['abs', 'shoulders', 'quads'];
  if (n.includes('jump') || n.includes('high knees') || n.includes('sprint')) return ['quads', 'calves', 'glutes'];
  if (n.includes('stretch') || n.includes('foam') || n.includes('yoga') || n.includes('pose')) return [];
  return ['full_body'];
}

const MUSCLE_COLORS = {
  active: '#ef4444',    // bright red for active muscles
  secondary: '#f97316', // orange for secondary
  inactive: 'transparent',
};

function getMuscleColor(muscle, activeMuscles) {
  if (!activeMuscles || activeMuscles.length === 0) return MUSCLE_COLORS.inactive;
  if (activeMuscles.includes('full_body')) return MUSCLE_COLORS.active;
  if (activeMuscles[0] === muscle || activeMuscles[1] === muscle) return MUSCLE_COLORS.active;
  if (activeMuscles.includes(muscle)) return MUSCLE_COLORS.secondary;
  return MUSCLE_COLORS.inactive;
}

export default function MuscleMapModel({ exerciseName = '', showLabel = true }) {
  const activeMuscles = getMuscleGroups(exerciseName);
  const c = (muscle) => getMuscleColor(muscle, activeMuscles);
  const hasActive = activeMuscles.length > 0;

  const muscleLabels = {
    chest: 'Chest', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps',
    abs: 'Core', obliques: 'Obliques', quads: 'Quads', hamstrings: 'Hamstrings',
    glutes: 'Glutes', calves: 'Calves', lats: 'Lats', upper_back: 'Upper Back',
    lower_back: 'Lower Back', full_body: 'Full Body',
  };

  const activeLabels = activeMuscles.map(m => muscleLabels[m]).filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-4 items-start">
        {/* Front view */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Front</p>
          <svg width="90" height="160" viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg">
            {/* Body outline */}
            <defs>
              <filter id="muscle-glow">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>

            {/* Head */}
            <ellipse cx="45" cy="12" rx="9" ry="11" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>
            {/* Neck */}
            <rect x="41" y="22" width="8" height="6" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>

            {/* Shoulders */}
            <ellipse cx="22" cy="36" rx="9" ry="7"
              fill={c('shoulders')} fillOpacity="0.7"
              stroke={c('shoulders') !== 'transparent' ? c('shoulders') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('shoulders') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>
            <ellipse cx="68" cy="36" rx="9" ry="7"
              fill={c('shoulders')} fillOpacity="0.7"
              stroke={c('shoulders') !== 'transparent' ? c('shoulders') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('shoulders') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>

            {/* Chest */}
            <ellipse cx="36" cy="46" rx="12" ry="10"
              fill={c('chest')} fillOpacity="0.7"
              stroke={c('chest') !== 'transparent' ? c('chest') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('chest') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>
            <ellipse cx="54" cy="46" rx="12" ry="10"
              fill={c('chest')} fillOpacity="0.7"
              stroke={c('chest') !== 'transparent' ? c('chest') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('chest') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>

            {/* Abs */}
            <rect x="34" y="58" width="10" height="8" rx="3"
              fill={c('abs')} fillOpacity="0.7"
              stroke={c('abs') !== 'transparent' ? c('abs') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
            <rect x="46" y="58" width="10" height="8" rx="3"
              fill={c('abs')} fillOpacity="0.7"
              stroke={c('abs') !== 'transparent' ? c('abs') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
            <rect x="34" y="68" width="10" height="8" rx="3"
              fill={c('abs')} fillOpacity="0.7"
              stroke={c('abs') !== 'transparent' ? c('abs') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
            <rect x="46" y="68" width="10" height="8" rx="3"
              fill={c('abs')} fillOpacity="0.7"
              stroke={c('abs') !== 'transparent' ? c('abs') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
            <rect x="34" y="78" width="10" height="8" rx="3"
              fill={c('abs')} fillOpacity="0.7"
              stroke={c('abs') !== 'transparent' ? c('abs') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
            <rect x="46" y="78" width="10" height="8" rx="3"
              fill={c('abs')} fillOpacity="0.7"
              stroke={c('abs') !== 'transparent' ? c('abs') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>

            {/* Obliques */}
            <ellipse cx="27" cy="70" rx="7" ry="12"
              fill={c('obliques')} fillOpacity="0.7"
              stroke={c('obliques') !== 'transparent' ? c('obliques') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
            <ellipse cx="63" cy="70" rx="7" ry="12"
              fill={c('obliques')} fillOpacity="0.7"
              stroke={c('obliques') !== 'transparent' ? c('obliques') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>

            {/* Biceps */}
            <ellipse cx="16" cy="55" rx="6" ry="12"
              fill={c('biceps')} fillOpacity="0.7"
              stroke={c('biceps') !== 'transparent' ? c('biceps') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('biceps') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>
            <ellipse cx="74" cy="55" rx="6" ry="12"
              fill={c('biceps')} fillOpacity="0.7"
              stroke={c('biceps') !== 'transparent' ? c('biceps') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('biceps') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>

            {/* Forearms */}
            <ellipse cx="13" cy="75" rx="4" ry="9" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>
            <ellipse cx="77" cy="75" rx="4" ry="9" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>

            {/* Quads */}
            <ellipse cx="34" cy="112" rx="12" ry="18"
              fill={c('quads')} fillOpacity="0.7"
              stroke={c('quads') !== 'transparent' ? c('quads') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('quads') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>
            <ellipse cx="56" cy="112" rx="12" ry="18"
              fill={c('quads')} fillOpacity="0.7"
              stroke={c('quads') !== 'transparent' ? c('quads') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('quads') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>

            {/* Calves front */}
            <ellipse cx="34" cy="143" rx="8" ry="12"
              fill={c('calves')} fillOpacity="0.7"
              stroke={c('calves') !== 'transparent' ? c('calves') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
            <ellipse cx="56" cy="143" rx="8" ry="12"
              fill={c('calves')} fillOpacity="0.7"
              stroke={c('calves') !== 'transparent' ? c('calves') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Back view */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Back</p>
          <svg width="90" height="160" viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg">
            {/* Head */}
            <ellipse cx="45" cy="12" rx="9" ry="11" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>
            {/* Neck */}
            <rect x="41" y="22" width="8" height="6" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>

            {/* Shoulders/Traps */}
            <ellipse cx="22" cy="35" rx="9" ry="7"
              fill={c('shoulders')} fillOpacity="0.7"
              stroke={c('shoulders') !== 'transparent' ? c('shoulders') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
            <ellipse cx="68" cy="35" rx="9" ry="7"
              fill={c('shoulders')} fillOpacity="0.7"
              stroke={c('shoulders') !== 'transparent' ? c('shoulders') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>

            {/* Upper back */}
            <ellipse cx="45" cy="38" rx="16" ry="10"
              fill={c('upper_back')} fillOpacity="0.7"
              stroke={c('upper_back') !== 'transparent' ? c('upper_back') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>

            {/* Lats */}
            <ellipse cx="28" cy="58" rx="11" ry="16"
              fill={c('lats')} fillOpacity="0.7"
              stroke={c('lats') !== 'transparent' ? c('lats') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('lats') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>
            <ellipse cx="62" cy="58" rx="11" ry="16"
              fill={c('lats')} fillOpacity="0.7"
              stroke={c('lats') !== 'transparent' ? c('lats') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('lats') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>

            {/* Lower back */}
            <ellipse cx="45" cy="78" rx="12" ry="8"
              fill={c('lower_back')} fillOpacity="0.7"
              stroke={c('lower_back') !== 'transparent' ? c('lower_back') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>

            {/* Triceps */}
            <ellipse cx="15" cy="55" rx="6" ry="12"
              fill={c('triceps')} fillOpacity="0.7"
              stroke={c('triceps') !== 'transparent' ? c('triceps') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('triceps') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>
            <ellipse cx="75" cy="55" rx="6" ry="12"
              fill={c('triceps')} fillOpacity="0.7"
              stroke={c('triceps') !== 'transparent' ? c('triceps') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('triceps') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>

            {/* Glutes */}
            <ellipse cx="34" cy="97" rx="14" ry="12"
              fill={c('glutes')} fillOpacity="0.7"
              stroke={c('glutes') !== 'transparent' ? c('glutes') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('glutes') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>
            <ellipse cx="56" cy="97" rx="14" ry="12"
              fill={c('glutes')} fillOpacity="0.7"
              stroke={c('glutes') !== 'transparent' ? c('glutes') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('glutes') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>

            {/* Hamstrings */}
            <ellipse cx="34" cy="118" rx="12" ry="16"
              fill={c('hamstrings')} fillOpacity="0.7"
              stroke={c('hamstrings') !== 'transparent' ? c('hamstrings') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('hamstrings') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>
            <ellipse cx="56" cy="118" rx="12" ry="16"
              fill={c('hamstrings')} fillOpacity="0.7"
              stroke={c('hamstrings') !== 'transparent' ? c('hamstrings') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" filter={c('hamstrings') !== 'transparent' ? 'url(#muscle-glow)' : ''}/>

            {/* Calves back */}
            <ellipse cx="34" cy="143" rx="8" ry="12"
              fill={c('calves')} fillOpacity="0.7"
              stroke={c('calves') !== 'transparent' ? c('calves') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
            <ellipse cx="56" cy="143" rx="8" ry="12"
              fill={c('calves')} fillOpacity="0.7"
              stroke={c('calves') !== 'transparent' ? c('calves') : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      {/* Active muscle labels */}
      {showLabel && activeLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {activeLabels.map((label, i) => (
            <span key={label}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
