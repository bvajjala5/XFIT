import { useState } from 'react'
import { Activity, Camera, Dumbbell, Minus, Pause, Play, Plus, SkipForward, Timer, Zap } from 'lucide-react'
import { MODE_REPS, MODE_TIME, adjust, parseQuantity } from '@/lib/workoutTracking'
import { MOVEMENTS } from '@/lib/poseCounter'
import PoseRepCounter from './PoseRepCounter'

const formatClock = (seconds) => {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function SegmentedButton({ active, onClick, icon: Icon, disabled = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  )
}

/**
 * Presentational core of the active workout screen: one huge primary metric,
 * always-available manual controls, and optional on-device camera counting.
 */
export default function HybridTracker({
  exercise, phase, restLeft, transitionLeft, nextExerciseName, elapsed, actual, weight, paused,
  poseEnabled, movement,
  onPoseToggle, onAdjust, onQuickInput,
  onWeightChange, onModeChange, onCompleteSet, onSkipRest, onSkipBreak, onCameraReps,
  onRestAdjust, onRestInput, onPauseToggle, onSkip,
}) {
  const [quick, setQuick] = useState('')
  const [restDraft, setRestDraft] = useState('')
  const isReps = exercise?.mode === MODE_REPS
  const isRest = phase === 'rest'
  const isTransition = phase === 'transition'
  const isWork = phase === 'work'
  const target = exercise?.target || 1
  const remaining = Math.max(0, target - elapsed)
  const progress = Math.min(100, Math.round((elapsed / target) * 100))
  const cameraLabel = movement ? MOVEMENTS[movement]?.label : null

  const submitQuick = (event) => {
    event.preventDefault()
    const value = parseQuantity(quick, isReps ? actual : elapsed)
    if (value > 0) onQuickInput(value)
    setQuick('')
  }

  const submitRest = (event) => {
    event.preventDefault()
    const value = adjust(parseQuantity(restDraft, restLeft), 0, 0, 600)
    onRestInput(value)
    setRestDraft('')
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      <div className="flex gap-1.5 rounded-2xl bg-secondary/30 p-1">
        <SegmentedButton active={isReps} disabled={!isWork} onClick={() => onModeChange(MODE_REPS)} icon={Dumbbell}>Reps</SegmentedButton>
        <SegmentedButton active={!isReps} disabled={!isWork} onClick={() => onModeChange(MODE_TIME)} icon={Timer}>Time</SegmentedButton>
      </div>

      {isTransition ? (
        <div className="rounded-3xl border border-primary/30 bg-primary/5 px-4 py-7 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Up next</p>
          <p className="mt-1 text-lg font-bold">{nextExerciseName || 'Next exercise'}</p>
          <p aria-live="polite" className="mt-3 text-6xl font-black tabular-nums text-primary sm:text-7xl">{formatClock(transitionLeft)}</p>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Take a breath, reset your space, and get ready. The next timer starts when the break ends.
          </p>
        </div>
      ) : isRest ? (
        <div className="rounded-3xl border border-green-500/30 bg-green-500/5 px-4 py-6 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-green-500">Rest</p>
          <p className="mt-1 text-6xl font-black tabular-nums text-green-500 sm:text-7xl">{formatClock(restLeft)}</p>
          <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onRestAdjust(-15)}
              aria-label="Subtract fifteen seconds of rest"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/15 text-green-500 active:scale-95"
            >
              <Minus className="h-5 w-5" />
            </button>
            <form onSubmit={submitRest} className="flex min-w-0 flex-1 items-center gap-1">
              <input
                value={restDraft}
                onChange={(event) => setRestDraft(event.target.value)}
                inputMode="numeric"
                aria-label="Rest seconds"
                placeholder={formatClock(restLeft)}
                className="h-12 w-full min-w-0 rounded-2xl border border-green-500/30 bg-background/70 px-2 text-center text-base font-bold tabular-nums outline-none focus:border-green-500"
              />
              <button type="submit" aria-label="Apply rest time" className="h-12 shrink-0 rounded-2xl bg-green-500/15 px-3 text-xs font-bold text-green-500 active:scale-95">Apply</button>
            </form>
            <button
              type="button"
              onClick={() => onRestAdjust(15)}
              aria-label="Add fifteen seconds of rest"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-green-950 active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Adjustments apply to this exercise’s next rest too.</p>
          <p className="mt-3 text-xs text-muted-foreground">Next: {exercise?.name}</p>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 px-4 py-5 text-center backdrop-blur-md sm:py-7">
            {!isReps && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-muted">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            )}
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
              {isReps ? 'Reps done' : 'Seconds left'}
            </p>
            <div aria-live="polite" className="mt-1 flex items-baseline justify-center gap-2">
              <span className="text-7xl font-black leading-none tabular-nums text-foreground sm:text-8xl">
                {isReps ? actual : formatClock(remaining)}
              </span>
              <span className="text-lg font-bold text-muted-foreground">/ {isReps ? target : formatClock(target)}</span>
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{exercise?.name}</p>
            {!isReps && exercise?.holdSeconds > 0 && (
              <p className="mt-1 text-[11px] font-semibold text-primary">
                Hold {Math.floor(elapsed / exercise.holdSeconds) + 1} of {Math.ceil(target / exercise.holdSeconds)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onAdjust(isReps ? -1 : -5)}
              aria-label={isReps ? 'Decrease reps' : 'Subtract five seconds'}
              className="flex h-14 w-16 items-center justify-center rounded-2xl bg-secondary/60 active:scale-95"
            >
              <Minus className="h-6 w-6" />
            </button>
            <form onSubmit={submitQuick} className="flex min-w-0 flex-1 items-center gap-1">
              <input
                value={quick}
                onChange={(event) => setQuick(event.target.value)}
                inputMode="numeric"
                aria-label={isReps ? 'Enter reps' : 'Enter seconds'}
                placeholder={isReps ? 'Reps' : '0:30'}
                className="h-14 w-full min-w-0 rounded-2xl border border-border/60 bg-background/70 px-3 text-center text-lg font-bold tabular-nums outline-none focus:border-primary"
              />
              <button type="submit" aria-label={isReps ? 'Apply reps' : 'Apply seconds'} className="h-14 shrink-0 rounded-2xl bg-secondary/60 px-3 text-xs font-bold active:scale-95">Apply</button>
            </form>
            <button
              type="button"
              onClick={() => onAdjust(isReps ? 1 : 5)}
              aria-label={isReps ? 'Increase reps' : 'Add five seconds'}
              className="flex h-14 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {isReps && (
            <label className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/50 px-3 py-2">
              <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Weight</span>
              <input
                value={weight}
                onChange={(event) => onWeightChange(event.target.value)}
                placeholder="e.g. 135 lbs"
                aria-label="Weight used for this set"
                className="min-w-0 flex-1 bg-transparent text-right text-sm font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
              />
            </label>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            {cameraLabel && (
              <button
                type="button"
                onClick={onPoseToggle}
                aria-pressed={poseEnabled}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition-colors ${poseEnabled ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'}`}
              >
                <Camera className="h-3.5 w-3.5" /> {poseEnabled ? 'Camera on' : `Count ${cameraLabel.toLowerCase()}`}
              </button>
            )}
          </div>

          {poseEnabled && cameraLabel && (
            <PoseRepCounter
              active={poseEnabled && !paused}
              movement={movement}
              onRep={onCameraReps}
              onClose={onPoseToggle}
            />
          )}

        </>
      )}

      {/* One control row: Pause on the left, the main action in the middle,
          Next on the right. It stays put across work and rest so muscle memory
          never has to relearn where the buttons are. */}
      <div className="flex items-stretch justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={onPauseToggle}
          aria-label={paused ? 'Resume workout' : 'Pause workout'}
          title={paused ? 'Resume workout' : 'Pause workout'}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/60 active:scale-95 sm:h-14 sm:w-14"
        >
          {paused ? <Play className="h-5 w-5" fill="currentColor" /> : <Pause className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={isTransition ? onSkipBreak : isRest ? onSkipRest : onCompleteSet}
          disabled={isWork && paused}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl primary-gradient px-3 text-sm font-black text-primary-foreground active:scale-[0.98] disabled:opacity-50 sm:min-h-[56px]"
        >
          {isWork ? <Activity className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
          {isTransition ? 'Start next now' : isRest ? 'Skip Rest' : 'Complete set'}
        </button>

        <button
          type="button"
          onClick={onSkip}
          aria-label={isTransition ? 'Start next exercise now' : 'Skip to next exercise'}
          title={isTransition ? 'Start next exercise now' : 'Skip to next exercise'}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/60 active:scale-95 sm:h-14 sm:w-14"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
