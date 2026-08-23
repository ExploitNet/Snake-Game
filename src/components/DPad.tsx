import type { Dir } from "../game/types";
import { DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP } from "../game/types";

interface DPadProps {
  onDir: (d: Dir) => void;
  onCenter: () => void;
  paused: boolean;
}

function Chevron({ rot }: { rot: number }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rot}deg)` }}
      aria-hidden
    >
      <path d="m6 14 6-6 6 6" />
    </svg>
  );
}

function PadBtn({
  label,
  rot,
  onDir,
  className = "",
}: {
  label: string;
  rot: number;
  onDir: (d: Dir) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex h-14 items-center justify-center border border-pit-line border-b-4 rounded-md bg-pit-800 text-venom-300 transition-all duration-75 active:translate-y-[2px] active:border-b active:bg-venom-500/25 active:text-venom-200 ${className}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onDir(rot === 0 ? DIR_UP : rot === 90 ? DIR_RIGHT : rot === 180 ? DIR_DOWN : DIR_LEFT);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Chevron rot={rot} />
    </button>
  );
}

export default function DPad({ onDir, onCenter, paused }: DPadProps) {
  return (
    <div
      className="grid w-[230px] grid-cols-3 gap-1.5 select-none"
      style={{ touchAction: "manipulation" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div />
      <PadBtn label="Up" rot={0} onDir={onDir} />
      <div />
      <PadBtn label="Left" rot={270} onDir={onDir} />
      <button
        type="button"
        aria-label={paused ? "Resume" : "Pause"}
        className="flex h-14 items-center justify-center rounded-md border border-venom-600 border-b-4 bg-venom-500/15 text-venom-300 transition-all duration-75 active:translate-y-[2px] active:border-b active:bg-venom-500/35"
        onPointerDown={(e) => {
          e.preventDefault();
          onCenter();
        }}
      >
        {paused ? (
          <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
            <path d="M3.5 1.6 12 7l-8.5 5.4z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
            <rect x="2.5" y="1.5" width="3.4" height="11" rx="1" />
            <rect x="8.1" y="1.5" width="3.4" height="11" rx="1" />
          </svg>
        )}
      </button>
      <PadBtn label="Right" rot={90} onDir={onDir} />
      <div />
      <PadBtn label="Down" rot={180} onDir={onDir} />
      <div />
    </div>
  );
}
