import type { ReactNode } from "react";
import {
  DIFFICULTIES,
  DIFF_ORDER,
  type DifficultyKey,
} from "../game/types";

function Shell({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <div
      className="absolute inset-0 z-20 flex overflow-y-auto bg-[#04120a]/85 backdrop-blur-[2px]"
      onClick={onClick}
    >
      <div className="m-auto w-full max-w-[400px] p-3">{children}</div>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="panel-notch w-full border border-pit-line bg-pit-900/95 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
      {children}
    </div>
  );
}

/* ------------------------------------------------ menu */

interface MenuProps {
  difficulty: DifficultyKey;
  best: number;
  onSelect: (d: DifficultyKey) => void;
  onStart: () => void;
}

export function MenuOverlay({ difficulty, best, onSelect, onStart }: MenuProps) {
  return (
    <Shell onClick={onStart}>
      <Panel>
        <div className="text-center">
          <h1 className="font-display text-[26px] leading-none text-venom-400 text-glow-lime sm:text-3xl">
            {"SNAKE".split("").map((ch, i) => (
              <span key={i} className="anim-letter inline-block" style={{ animationDelay: `${i * 70}ms` }}>
                {ch}
              </span>
            ))}
          </h1>
          <svg viewBox="0 0 200 22" className="mx-auto mt-2 h-4 w-44" aria-hidden>
            <path
              d="M8 14 H60 V6 H120 V14 H176"
              fill="none"
              stroke="#84cc16"
              strokeWidth="5"
              strokeLinecap="square"
            />
            <path
              className="anim-dash"
              d="M8 14 H60 V6 H120 V14 H176"
              fill="none"
              stroke="#d9f99d"
              strokeWidth="2"
            />
            <rect x="176" y="8" width="12" height="12" fill="#bef264" />
            <circle cx="184" cy="12" r="1.8" fill="#052e16" />
          </svg>
          <p className="mt-2 text-[10px] font-semibold tracking-[0.34em] text-ice-400/80">
            NEON ARCADE EDITION
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          {DIFF_ORDER.map((k, idx) => {
            const d = DIFFICULTIES[k];
            const active = k === difficulty;
            return (
              <button
                key={k}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(k);
                }}
                className={`anim-rise flex w-full items-center gap-3 border px-3 py-1.5 text-left transition-all duration-150 ${
                  active
                    ? "translate-x-1 bg-pit-800"
                    : "border-pit-line/60 bg-pit-850/60 hover:bg-pit-800/70"
                }`}
                style={{
                  borderColor: active ? `${d.color}88` : undefined,
                  boxShadow: active ? `0 0 18px ${d.color}22` : undefined,
                  animationDelay: `${200 + idx * 90}ms`,
                }}
              >
                <span
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center border"
                  style={{ borderColor: d.color }}
                >
                  {active && <span className="h-1.5 w-1.5" style={{ background: d.color }} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[9px]" style={{ color: d.color }}>
                    {d.label}
                  </span>
                  <span className="block truncate text-[11px] text-emerald-200/60">{d.tagline}</span>
                </span>
                <span
                  className="shrink-0 border px-1.5 py-0.5 text-[9px] font-bold tracking-wider"
                  style={{ color: d.color, borderColor: `${d.color}55` }}
                >
                  ×{d.mult} PTS
                </span>
                <span className="keycap shrink-0">{idx + 1}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="btn-arcade anim-pulse-glow mt-3 w-full" onClick={onStart}>
          ▶ START GAME
        </button>
        <p className="anim-blink mt-2 text-center font-display text-[8px] text-venom-300/80">
          PRESS SPACE OR TAP
        </p>
        <p className="mt-2.5 text-center text-[10px] tracking-wider text-gold-300/80">
          BEST ON {DIFFICULTIES[difficulty].label} — <span className="font-bold">{best}</span>
        </p>
      </Panel>
    </Shell>
  );
}

/* ------------------------------------------------ pause */

interface PauseProps {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export function PauseOverlay({ onResume, onRestart, onMenu }: PauseProps) {
  return (
    <Shell onClick={onResume}>
      <Panel>
        <h2 className="text-center font-display text-xl text-ice-400" style={{ textShadow: "0 0 18px rgba(103,232,249,0.5)" }}>
          PAUSED
        </h2>
        <p className="mt-1 text-center text-[11px] tracking-wider text-emerald-200/55">
          THE SERPENT WAITS…
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" className="btn-arcade" onClick={(e) => { e.stopPropagation(); onResume(); }}>
            RESUME
          </button>
          <button type="button" className="btn-ghost" onClick={(e) => { e.stopPropagation(); onRestart(); }}>
            RESTART
          </button>
          <button type="button" className="btn-ghost" onClick={(e) => { e.stopPropagation(); onMenu(); }}>
            QUIT TO MENU
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-emerald-200/45">
          <span className="keycap mr-1">SPACE</span> to resume
        </p>
      </Panel>
    </Shell>
  );
}

/* ------------------------------------------------ game over */

interface OverProps {
  score: number;
  best: number;
  newBest: boolean;
  won: boolean;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOverOverlay({ score, best, newBest, won, onRestart, onMenu }: OverProps) {
  return (
    <Shell onClick={onRestart}>
      <Panel>
        <h2
          className={`anim-rise text-center font-display text-xl ${
            won ? "text-gold-400 text-glow-gold" : "text-apple-500 text-glow-red"
          }`}
        >
          {won ? "PERFECT!" : "GAME OVER"}
        </h2>
        <p className="mt-1 text-center text-[11px] tracking-wider text-emerald-200/55">
          {won ? "THE BOARD IS CLEARED. LEGEND." : "THE SERPENT HAS FALLEN"}
        </p>

        {newBest && (
          <div className="anim-wiggle mx-auto mt-3 w-fit -rotate-2 border-2 border-gold-400 bg-gold-400/15 px-3 py-1 font-display text-[9px] text-gold-300">
            ★ NEW BEST ★
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="border border-pit-line bg-pit-850 px-2 py-3">
            <div className="text-[9px] font-semibold tracking-[0.22em] text-venom-400/70">SCORE</div>
            <div className="mt-1 font-display text-lg text-venom-300">{score}</div>
          </div>
          <div className="border border-pit-line bg-pit-850 px-2 py-3">
            <div className="text-[9px] font-semibold tracking-[0.22em] text-gold-400/80">BEST</div>
            <div className="mt-1 font-display text-lg text-gold-300">{best}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button type="button" className="btn-arcade" onClick={(e) => { e.stopPropagation(); onRestart(); }}>
            ▶ PLAY AGAIN
          </button>
          <button type="button" className="btn-ghost" onClick={(e) => { e.stopPropagation(); onMenu(); }}>
            CHANGE DIFFICULTY
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-emerald-200/45">
          <span className="keycap mr-1">SPACE</span> to run it back
        </p>
      </Panel>
    </Shell>
  );
}

/* ------------------------------------------------ countdown */

export function CountdownOverlay({ n }: { n: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#04120a]/45">
      <div
        key={n}
        className={`anim-count font-display text-6xl ${
          n === 0 ? "text-venom-400 text-glow-lime" : "text-ice-300"
        }`}
        style={n > 0 ? { textShadow: "0 0 24px rgba(165,243,252,0.55)" } : undefined}
      >
        {n === 0 ? "GO!" : n}
      </div>
    </div>
  );
}
