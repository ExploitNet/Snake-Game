import type { DifficultyDef } from "../game/types";

interface HUDProps {
  score: number;
  best: number;
  diff: DifficultyDef;
  speedPct: number;
  paused: boolean;
  muted: boolean;
  onPause: () => void;
  onMute: () => void;
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <rect x="2.5" y="1.5" width="3.4" height="11" rx="1" />
      <rect x="8.1" y="1.5" width="3.4" height="11" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <path d="M3.5 1.6 12 7l-8.5 5.4z" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M2 6h2.5L8 3v10L4.5 10H2z" fill="currentColor" stroke="none" />
      {muted ? (
        <path d="M10.5 5.5 14 11M14 5.5 10.5 11" strokeLinecap="round" />
      ) : (
        <>
          <path d="M10.5 5.5a3.4 3.4 0 0 1 0 5" strokeLinecap="round" />
          <path d="M12.3 3.6a6.2 6.2 0 0 1 0 8.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 1h8v2h3v2c0 2.2-1.6 3.7-3.5 4-.6 1.4-1.7 2.3-2.5 2.5V13h3v2H4v-2h3v-3.5C6.2 9.3 5.1 8.4 4.5 7 2.6 6.7 1 5.2 1 3V1h3zm-1 2v1c0 1 .6 1.8 1.4 2A6 6 0 0 1 4 3zm10 0h-2a6 6 0 0 1-.4 3c.8-.2 1.4-1 1.4-2z" />
    </svg>
  );
}

export default function HUD({ score, best, diff, speedPct, paused, muted, onPause, onMute }: HUDProps) {
  const pips = Math.round(Math.max(0, Math.min(1, speedPct)) * 5);
  return (
    <div className="flex w-full items-stretch justify-between gap-2 border-2 border-pit-line bg-pit-900/90 px-3 py-2 panel-notch">
      {/* score */}
      <div className="flex min-w-0 flex-col justify-center">
        <span className="text-[9px] font-semibold tracking-[0.22em] text-venom-400/70">SCORE</span>
        <span
          key={score}
          className="anim-pop font-display text-base leading-tight text-venom-300 text-glow-lime sm:text-xl"
        >
          {String(score).padStart(5, "0")}
        </span>
      </div>

      {/* difficulty + speed */}
      <div className="flex flex-col items-center justify-center gap-1">
        <span
          className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-display text-[8px] tracking-wider"
          style={{ color: diff.color, borderColor: `${diff.color}66`, background: `${diff.color}14` }}
        >
          <span className="inline-block h-1.5 w-1.5" style={{ background: diff.color }} />
          {diff.label}
        </span>
        <span className="flex items-center gap-1" title="Speed">
          <span className="mr-0.5 text-[8px] font-bold tracking-[0.18em] text-emerald-200/50">SPD</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="h-2.5 w-1.5 skew-x-[-12deg] transition-colors duration-200"
              style={{ background: i < pips ? diff.color : "rgba(163,230,53,0.14)" }}
            />
          ))}
        </span>
      </div>

      {/* best + controls */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end justify-center">
          <span className="flex items-center gap-1 text-[9px] font-semibold tracking-[0.22em] text-gold-400/80">
            <TrophyIcon /> BEST
          </span>
          <span className="font-display text-[11px] leading-tight text-gold-300 sm:text-sm">
            {String(best).padStart(5, "0")}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <button type="button" className="btn-chip" onClick={onPause} aria-label={paused ? "Resume" : "Pause"}>
            {paused ? <PlayIcon /> : <PauseIcon />}
          </button>
          <button type="button" className="btn-chip" onClick={onMute} aria-label={muted ? "Unmute" : "Mute"}>
            <SpeakerIcon muted={muted} />
          </button>
        </div>
      </div>
    </div>
  );
}
