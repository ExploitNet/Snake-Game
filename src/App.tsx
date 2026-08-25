import { useEffect, useState } from "react";
import SnakeGame from "./components/SnakeGame";
import { overallBest } from "./game/types";

const MOTES: Array<{ left: string; top: string; delay: string; dur: string; color: string }> = [
  { left: "8%", top: "72%", delay: "0s", dur: "9s", color: "#a3e635" },
  { left: "16%", top: "30%", delay: "2.2s", dur: "11s", color: "#67e8f9" },
  { left: "86%", top: "24%", delay: "1.1s", dur: "10s", color: "#a3e635" },
  { left: "78%", top: "76%", delay: "3.4s", dur: "12s", color: "#fbbf24" },
  { left: "50%", top: "88%", delay: "5s", dur: "9.5s", color: "#a3e635" },
  { left: "93%", top: "58%", delay: "6.3s", dur: "11s", color: "#67e8f9" },
];

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h12v5H8v5h9"
        stroke="#84cc16"
        strokeWidth="3.4"
        strokeLinecap="square"
      />
      <rect x="17" y="14.5" width="5" height="5" fill="#bef264" />
      <circle cx="20.4" cy="16.4" r="0.9" fill="#052e16" />
      <rect x="2.5" y="5.5" width="3" height="3" fill="#4ade80" opacity="0.7" />
    </svg>
  );
}

function Trophy() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 1h8v2h3v2c0 2.2-1.6 3.7-3.5 4-.6 1.4-1.7 2.3-2.5 2.5V13h3v2H4v-2h3v-3.5C6.2 9.3 5.1 8.4 4.5 7 2.6 6.7 1 5.2 1 3V1h3zm-1 2v1c0 1 .6 1.8 1.4 2A6 6 0 0 1 4 3zm10 0h-2a6 6 0 0 1-.4 3c.8-.2 1.4-1 1.4-2z" />
    </svg>
  );
}

export default function App() {
  const [hiScore, setHiScore] = useState(() => overallBest());

  useEffect(() => {
    const update = () => setHiScore(overallBest());
    window.addEventListener("snake:best", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("snake:best", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <div className="app-bg relative flex min-h-dvh flex-col overflow-hidden font-body">
      {/* ambient layers */}
      <div className="bg-pit-grid pointer-events-none absolute inset-0" aria-hidden />
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={{ left: m.left, top: m.top, animationDelay: m.delay, animationDuration: m.dur, background: m.color, boxShadow: `0 0 9px ${m.color}` }}
          aria-hidden
        />
      ))}
      <div className="fx-vignette pointer-events-none fixed inset-0 z-40" aria-hidden />
      <div className="fx-scanlines pointer-events-none fixed inset-0 z-50 opacity-15" aria-hidden />

      {/* header */}
      <header className="relative z-30 flex items-center justify-between border-b border-pit-line/70 bg-pit-900/70 px-4 py-2.5 backdrop-blur-[2px] sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-sm text-venom-400 text-glow-lime">SNAKE</span>
          <span className="ml-1 hidden border border-ice-400/40 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.28em] text-ice-400/90 sm:inline-block">
            ARCADE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="anim-blink hidden font-display text-[8px] text-apple-400 md:inline">● REC</span>
          <span className="flex items-center gap-1.5 border border-gold-400/40 bg-gold-400/10 px-2.5 py-1 text-gold-300">
            <Trophy />
            <span className="text-[9px] font-bold tracking-[0.2em]">HI-SCORE</span>
            <span className="font-display text-[10px]">{hiScore}</span>
          </span>
        </div>
      </header>

      {/* game */}
      <main className="relative z-20 flex flex-1 flex-col items-center justify-center gap-3 px-3 py-3">
        <SnakeGame />
      </main>

      <footer className="relative z-20 pb-3 text-center text-[10px] font-semibold tracking-[0.32em] text-emerald-200/35">
        EAT · GROW · SURVIVE
      </footer>
    </div>
  );
}
