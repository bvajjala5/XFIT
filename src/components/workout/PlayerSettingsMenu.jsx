import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Eye, EyeOff, RotateCcw, ScanFace, Volume2, VolumeX, X } from 'lucide-react';
import useFocusTrap from '@/hooks/useFocusTrap';

function SettingRow({ icon: Icon, title, detail, onClick, pressed, trailing }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{detail}</span>
      </span>
      {trailing}
    </button>
  );
}

function StatePill({ active }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
      {active ? 'On' : 'Off'}
    </span>
  );
}

/** Compact gear menu for the guided player. Every top-bar control lives here. */
export default function PlayerSettingsMenu({
  open,
  onClose,
  onFormCheck,
  showMedia,
  onToggleMedia,
  voiceEnabled,
  onToggleVoice,
  voiceOptions,
  voiceName,
  onVoiceChange,
  onRestart,
}) {
  const contentRef = useRef(null);
  useFocusTrap(contentRef, open, onClose);

  const currentVoice = voiceOptions.find((voice) => voice.name === voiceName) || voiceOptions[0];

  return (
    <AnimatePresence>
      {open && [
        <motion.div
            key="player-settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
            aria-hidden="true"
          />,
          <motion.div
            key="player-settings-menu"
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-label="Workout settings"
            tabIndex={-1}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="glass-strong absolute right-4 top-[calc(100%+6px)] z-50 max-h-[calc(100dvh-5rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl p-2 shadow-2xl focus:outline-none"
          >
            <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Workout settings</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close workout settings"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <SettingRow
              icon={ScanFace}
              title="Check form"
              detail="Open the camera review"
              onClick={() => { onClose(); onFormCheck(); }}
              trailing={<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            />
            <SettingRow
              icon={showMedia ? Eye : EyeOff}
              title="Exercise demo"
              detail={showMedia ? 'Demo and body map visible' : 'Demo and body map hidden'}
              onClick={onToggleMedia}
              pressed={showMedia}
              trailing={<StatePill active={showMedia} />}
            />
            <SettingRow
              icon={voiceEnabled ? Volume2 : VolumeX}
              title="Voice cues"
              detail={voiceEnabled ? 'Coach is speaking' : 'Coach is muted'}
              onClick={onToggleVoice}
              pressed={voiceEnabled}
              trailing={<StatePill active={voiceEnabled} />}
            />

            {voiceOptions.length > 1 && (
              <div className="px-2.5 pb-2 pt-2">
                <label htmlFor="player-assistant-voice" className="text-[11px] font-semibold text-muted-foreground">
                  Assistant voice
                </label>
                <select
                  id="player-assistant-voice"
                  value={currentVoice?.name || ''}
                  onChange={(event) => onVoiceChange(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {voiceOptions.map((voice) => (
                    <option key={voice.name} value={voice.name}>{voice.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="my-1.5 border-t border-border/60" />
            <SettingRow
              icon={RotateCcw}
              title="Restart workout"
              detail="Start again from the first set"
              onClick={onRestart}
              trailing={<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            />
          </motion.div>,
      ]}
    </AnimatePresence>
  );
}
