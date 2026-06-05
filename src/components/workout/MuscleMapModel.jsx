import React from 'react';
import Model from 'react-body-highlighter';

function getMuscles(exerciseName = '') {
  const n = exerciseName.toLowerCase();
  if (n.includes('bicep') || n.includes('curl') || n.includes('hammer')) 
    return { front: ['biceps'], back: [] };
  if (n.includes('tricep') || n.includes('dip')) 
    return { front: [], back: ['triceps'] };
  if (n.includes('push-up') || n.includes('pushup') || n.includes('bench press') || n.includes('chest')) 
    return { front: ['chest', 'triceps', 'deltoids'], back: [] };
  if (n.includes('pull-up') || n.includes('pullup') || n.includes('row') || n.includes('lat')) 
    return { front: [], back: ['upper-back', 'biceps', 'trapezius'] };
  if (n.includes('squat') || n.includes('leg press')) 
    return { front: ['quadriceps'], back: ['gluteal', 'hamstring'] };
  if (n.includes('deadlift')) 
    return { front: [], back: ['hamstring', 'gluteal', 'lower-back', 'upper-back'] };
  if (n.includes('lunge')) 
    return { front: ['quadriceps'], back: ['gluteal', 'hamstring'] };
  if (n.includes('shoulder') || n.includes('overhead') || n.includes('lateral raise')) 
    return { front: ['deltoids'], back: ['trapezius'] };
  if (n.includes('plank') || n.includes('ab') || n.includes('crunch') || n.includes('russian twist')) 
    return { front: ['abs', 'obliques'], back: [] };
  if (n.includes('calf')) 
    return { front: ['calves'], back: ['calves'] };
  if (n.includes('hip raise') || n.includes('bridge') || n.includes('glute')) 
    return { front: [], back: ['gluteal', 'hamstring'] };
  if (n.includes('burpee')) 
    return { front: ['chest', 'quadriceps', 'abs', 'deltoids'], back: ['gluteal'] };
  if (n.includes('mountain climber')) 
    return { front: ['abs', 'quadriceps', 'deltoids'], back: [] };
  if (n.includes('jump') || n.includes('high knees') || n.includes('sprint')) 
    return { front: ['quadriceps', 'calves'], back: ['gluteal', 'hamstring'] };
  if (n.includes('stretch') || n.includes('foam') || n.includes('yoga') || n.includes('pose') || n.includes('meditation'))
    return { front: [], back: [] };
  return { front: ['chest', 'abs', 'quadriceps', 'deltoids'], back: ['upper-back', 'gluteal', 'hamstring'] };
}

export default function MuscleMapModel({ exerciseName = '', showLabel = true }) {
  const { front, back } = getMuscles(exerciseName);

  const frontData = front.map(muscle => ({
    slug: muscle,
    intensity: 2,
  }));

  const backData = back.map(muscle => ({
    slug: muscle,
    intensity: 2,
  }));

  const allMuscles = [...front, ...back];
  const muscleLabels = {
    chest: "Chest", biceps: "Biceps", triceps: "Triceps",
    deltoids: "Shoulders", abs: "Abs", obliques: "Obliques",
    quadriceps: "Quads", hamstring: "Hamstrings", gluteal: "Glutes",
    calves: "Calves", "upper-back": "Upper Back", trapezius: "Traps",
    "lower-back": "Lower Back",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2 items-start justify-center">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Front</p>
          <Model
            data={frontData}
            style={{ width: "120px", padding: "0" }}
            highlightedColors={["#f97316", "#ef4444"]}
            type="anterior"
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Back</p>
          <Model
            data={backData}
            style={{ width: "120px", padding: "0" }}
            highlightedColors={["#f97316", "#ef4444"]}
            type="posterior"
          />
        </div>
      </div>
      {showLabel && allMuscles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {allMuscles.map((muscle, i) => (
            <span key={muscle}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 0 ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"}`}>
              {muscleLabels[muscle] || muscle}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
