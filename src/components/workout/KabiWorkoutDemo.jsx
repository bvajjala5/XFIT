import React, { useEffect, useRef, useState } from 'react';
import { Alignment, Fit, Layout, Rive } from '@rive-app/canvas';
import ExerciseDemo from '@/components/workout/ExerciseDemo';

const KABI_LICENSE = 'https://github.com/bryllim/kabi-mascot#license';

function getPose(exerciseName = '') {
  const name = exerciseName.toLowerCase();
  if (/jumping jack/.test(name)) return { index: 4, label: 'Jumping jacks' };
  if (/jump rope|skip(ping)? rope/.test(name)) return { index: 17, label: 'Jump rope' };
  if (/high knee|sprint/.test(name)) return { index: 18, label: 'High knees' };
  if (/burpee/.test(name)) return { index: 15, label: 'Burpee' };
  if (/push[\s-]?ups?/.test(name)) return { index: 12, label: 'Push-up' };
  if (/plank/.test(name)) return { index: 13, label: 'Plank' };
  if (/lunge|split squat/.test(name)) return { index: 14, label: 'Lunge' };
  if (/squat/.test(name)) return { index: 3, label: 'Squat' };
  if (/curl/.test(name)) return { index: 6, label: 'Curl' };
  if (/box(ing)?|jab|cross punch/.test(name)) return { index: 16, label: 'Boxing' };
  if (/run|jog/.test(name)) return { index: 5, label: 'Run' };
  if (/stretch|mobility|warm.?up/.test(name)) return { index: 10, label: 'Stretch' };
  return { index: 11, label: 'Ready' };
}

function updatePose(instance, pose) {
  const inputs = instance?.stateMachineInputs('Kabi') || [];
  const poseInput = inputs.find((input) => input.name === 'pose');
  const moodInput = inputs.find((input) => input.name === 'mood');
  const glassesInput = inputs.find((input) => input.name === 'glasses');
  if (poseInput) poseInput.value = pose.index;
  if (moodInput) moodInput.value = 2; // determined
  if (glassesInput) glassesInput.value = false;
}

export default function KabiWorkoutDemo({ exerciseName = '' }) {
  const canvasRef = useRef(null);
  const riveRef = useRef(null);
  const pose = getPose(exerciseName);
  const poseRef = useRef(pose);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    poseRef.current = pose;
    if (riveRef.current) updatePose(riveRef.current, pose);
  }, [pose.index]);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    let instance;
    let observer;

    try {
      instance = new Rive({
        src: '/kabi.riv',
        canvas: canvasRef.current,
        stateMachines: 'Kabi',
        autoplay: true,
        layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
        onLoad: () => {
          instance.resizeDrawingSurfaceToCanvas();
          updatePose(instance, poseRef.current);
          observer = new ResizeObserver(() => instance.resizeDrawingSurfaceToCanvas());
          observer.observe(canvasRef.current);
        },
        onLoadError: () => setFailed(true),
      });
      riveRef.current = instance;
    } catch {
      setFailed(true);
    }

    return () => {
      observer?.disconnect();
      instance?.cleanup();
      riveRef.current = null;
    };
  }, []);

  if (failed) return <ExerciseDemo exerciseName={exerciseName} />;

  return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      <div className="w-full aspect-[3/2] overflow-hidden rounded-2xl bg-black/30">
        <canvas ref={canvasRef} className="h-full w-full" aria-label={`Kabi mascot demonstrating ${pose.label}`} />
      </div>
      <p className="text-[10px] text-center text-muted-foreground">
        {pose.label === 'Ready' ? 'Kabi is cheering you on' : `Kabi: ${pose.label}`}
        {' · '}
        <a href={KABI_LICENSE} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Kabi mascot by Bryl Lim · CC BY 4.0
        </a>
      </p>
    </div>
  );
}
