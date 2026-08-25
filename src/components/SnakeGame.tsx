import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import {
  APPLE_POINTS,
  BONUS_EVERY,
  BONUS_POINTS,
  CELL,
  COLS,
  DIFFICULTIES,
  DIFF_ORDER,
  DIR_DOWN,
  DIR_LEFT,
  DIR_RIGHT,
  DIR_UP,
  ROWS,
  loadBest,
  saveBest,
  type BonusState,
  type DifficultyKey,
  type Dir,
  type Floater,
  type Particle,
  type Pt,
} from "../game/types";
import { sfx } from "../game/audio";
import { drawGame } from "../game/render";
import HUD from "./HUD";
import DPad from "./DPad";
import { CountdownOverlay, GameOverOverlay, MenuOverlay, PauseOverlay } from "./Overlays";

type Phase = "menu" | "countdown" | "playing" | "paused" | "dying" | "gameover";

interface GameState {
  cells: Pt[];
  prev: Pt[];
  dir: Dir;
  queue: Dir[];
  food: Pt;
  bonus: BonusState | null;
  apples: number;
  score: number;
  interval: number;
  elapsed: number;
  particles: Particle[];
  floaters: Floater[];
  shake: number;
  deathAt: number;
  won: boolean;
}

function freeCells(s: Pick<GameState, "cells" | "bonus">, excludeFood?: Pt): Pt[] {
  const taken = new Set<number>();
  for (const c of s.cells) taken.add(c.y * COLS + c.x);
  if (s.bonus) taken.add(s.bonus.pos.y * COLS + s.bonus.pos.x);
  if (excludeFood && excludeFood.x >= 0) taken.add(excludeFood.y * COLS + excludeFood.x);
  const out: Pt[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!taken.has(y * COLS + x)) out.push({ x, y });
    }
  }
  return out;
}

function pickFree(s: Pick<GameState, "cells" | "bonus">, excludeFood?: Pt): Pt {
  const free = freeCells(s, excludeFood);
  if (free.length === 0) return { x: -1, y: -1 };
  return free[Math.floor(Math.random() * free.length)];
}

function makeInitial(diff: DifficultyKey): GameState {
  const cells: Pt[] = [
    { x: 6, y: 10 },
    { x: 5, y: 10 },
    { x: 4, y: 10 },
  ];
  const s: GameState = {
    cells,
    prev: cells.map((p) => ({ ...p })),
    dir: DIR_RIGHT,
    queue: [],
    food: { x: -1, y: -1 },
    bonus: null,
    apples: 0,
    score: 0,
    interval: DIFFICULTIES[diff].interval,
    elapsed: 0,
    particles: [],
    floaters: [],
    shake: 0,
    deathAt: 0,
    won: false,
  };
  s.food = pickFree(s);
  return s;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const g = useRef<GameState>(makeInitial("classic"));
  const phaseRef = useRef<Phase>("menu");
  const diffRef = useRef<DifficultyKey>("classic");
  const lastT = useRef(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficulty] = useState<DifficultyKey>("classic");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => loadBest("classic"));
  const [muted, setMuted] = useState(sfx.muted);
  const [countdown, setCountdown] = useState(3);
  const [newBest, setNewBest] = useState(false);
  const [speedPct, setSpeedPct] = useState(0);
  const [isCoarse, setIsCoarse] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
  );

  const changePhase = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  /* ---------------- fx helpers ---------------- */

  const burst = (cx: number, cy: number, color: string, count: number) => {
    const s = g.current;
    const px = (cx + 0.5) * CELL;
    const py = (cy + 0.5) * CELL;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.2 + Math.random() * 3.6;
      const life = 380 + Math.random() * 320;
      s.particles.push({
        x: px,
        y: py,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.8,
        life,
        maxLife: life,
        size: 3 + Math.random() * 4,
        color,
      });
    }
  };

  const floater = (cx: number, cy: number, text: string, color: string) => {
    g.current.floaters.push({
      x: (cx + 0.5) * CELL,
      y: cy * CELL + 4,
      text,
      life: 900,
      maxLife: 900,
      color,
    });
  };

  /* ---------------- core rules ---------------- */

  const endRun = (won: boolean) => {
    const s = g.current;
    s.won = won;
    s.shake = won ? 7 : 14;
    const h = s.cells[0];
    burst(h.x, h.y, won ? "#fbbf24" : "#f43f5e", won ? 26 : 20);
    burst(h.x, h.y, won ? "#fde68a" : "#a3e635", 12);
    if (won) sfx.win();
    else sfx.die();
    s.deathAt = performance.now() + 750;
    changePhase("dying");
  };

  const finalize = () => {
    const s = g.current;
    const key = diffRef.current;
    const prevBest = loadBest(key);
    const nb = s.score > prevBest && s.score > 0;
    if (nb) {
      saveBest(key, s.score);
      setBest(s.score);
      window.dispatchEvent(new CustomEvent("snake:best"));
    }
    setNewBest(nb);
    sfx.over();
    changePhase("gameover");
  };

  const tick = () => {
    const s = g.current;
    const cfg = DIFFICULTIES[diffRef.current];
    s.prev = s.cells.map((p) => ({ ...p }));

    while (s.queue.length > 0) {
      const d = s.queue.shift()!;
      const rev = d.x === -s.dir.x && d.y === -s.dir.y;
      const same = d.x === s.dir.x && d.y === s.dir.y;
      if (!rev && !same) {
        s.dir = d;
        break;
      }
    }

    const head = s.cells[0];
    let nx = head.x + s.dir.x;
    let ny = head.y + s.dir.y;

    if (cfg.wrap) {
      nx = (nx + COLS) % COLS;
      ny = (ny + ROWS) % ROWS;
    } else if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
      endRun(false);
      return;
    }

    const eating = s.food.x === nx && s.food.y === ny;
    const limit = eating ? s.cells.length : s.cells.length - 1;
    for (let i = 0; i < limit; i++) {
      if (s.cells[i].x === nx && s.cells[i].y === ny) {
        endRun(false);
        return;
      }
    }

    s.cells.unshift({ x: nx, y: ny });
    if (!eating) s.cells.pop();

    if (eating) {
      const pts = APPLE_POINTS * cfg.mult;
      s.score += pts;
      s.apples += 1;
      setScore(s.score);
      burst(nx, ny, "#fb7185", 12);
      burst(nx, ny, "#a3e635", 6);
      floater(nx, ny, `+${pts}`, "#d9f99d");
      sfx.eat();
      s.interval = Math.max(cfg.minInterval, s.interval * cfg.ramp);
      setSpeedPct((cfg.interval - s.interval) / (cfg.interval - cfg.minInterval));
      s.food = pickFree(s);
      if (s.food.x < 0) {
        endRun(true);
        return;
      }
      if (s.apples % BONUS_EVERY === 0 && !s.bonus) {
        const pos = pickFree(s, s.food);
        if (pos.x >= 0) {
          const total = Math.max(20, Math.min(80, Math.round(5200 / s.interval)));
          s.bonus = { pos, ticksLeft: total, total };
        }
      }
    }

    if (s.bonus) {
      if (s.bonus.pos.x === nx && s.bonus.pos.y === ny) {
        const pts = BONUS_POINTS * cfg.mult;
        s.score += pts;
        setScore(s.score);
        burst(nx, ny, "#fbbf24", 22);
        burst(nx, ny, "#fde68a", 10);
        floater(nx, ny, `+${pts}`, "#fde68a");
        s.shake = Math.max(s.shake, 5);
        sfx.bonus();
        s.bonus = null;
      } else {
        s.bonus.ticksLeft -= 1;
        if (s.bonus.ticksLeft <= 0) s.bonus = null;
      }
    }
  };

  /* ---------------- flow control ---------------- */

  const startGame = () => {
    sfx.ensure();
    sfx.click();
    g.current = makeInitial(diffRef.current);
    setScore(0);
    setSpeedPct(0);
    setNewBest(false);
    setBest(loadBest(diffRef.current));
    setCountdown(3);
    changePhase("countdown");
    sfx.count(false);
  };

  const toMenu = () => {
    sfx.click();
    g.current = makeInitial(diffRef.current);
    setScore(0);
    setSpeedPct(0);
    setBest(loadBest(diffRef.current));
    changePhase("menu");
  };

  const togglePause = () => {
    const ph = phaseRef.current;
    if (ph === "playing") {
      sfx.pause();
      changePhase("paused");
    } else if (ph === "paused") {
      sfx.ensure();
      sfx.resume();
      changePhase("playing");
    }
  };

  const toggleMute = () => {
    sfx.ensure();
    const next = !sfx.muted;
    sfx.setMuted(next);
    setMuted(next);
    if (!next) sfx.click();
  };

  const selectDifficulty = (k: DifficultyKey) => {
    diffRef.current = k;
    setDifficulty(k);
    setBest(loadBest(k));
    sfx.ensure();
    sfx.click();
  };

  const steer = (d: Dir) => {
    sfx.ensure();
    const ph = phaseRef.current;
    if (ph !== "playing" && ph !== "countdown") return;
    const s = g.current;
    const last = s.queue.length > 0 ? s.queue[s.queue.length - 1] : s.dir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (s.queue.length < 3) s.queue.push(d);
  };

  /* ---------------- countdown ticker ---------------- */

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown < 0) {
      changePhase("playing");
      return;
    }
    const id = window.setTimeout(
      () => {
        sfx.count(countdown === 1);
        setCountdown((c) => c - 1);
      },
      countdown === 0 ? 550 : 640,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown]);

  /* ---------------- main loop + listeners ---------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrapper.clientWidth;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = canvas.width;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    let raf = 0;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(100, lastT.current === 0 ? 16 : t - lastT.current);
      lastT.current = t;
      const s = g.current;
      const ph = phaseRef.current;

      if (ph === "playing") {
        s.elapsed += dt;
        let guard = 0;
        while (s.elapsed >= s.interval && guard < 4 && phaseRef.current === "playing") {
          s.elapsed -= s.interval;
          guard += 1;
          tick();
        }
      }
      if (ph === "dying" && t >= s.deathAt) finalize();

      const u = dt / 16.7;
      for (const p of s.particles) {
        p.x += p.vx * u;
        p.y += p.vy * u;
        p.vy += 0.055 * u;
        p.life -= dt;
      }
      s.particles = s.particles.filter((p) => p.life > 0);
      for (const f of s.floaters) {
        f.y -= 0.5 * u;
        f.life -= dt;
      }
      s.floaters = s.floaters.filter((f) => f.life > 0);
      s.shake = Math.max(0, s.shake - dt * 0.02);

      const progress =
        ph === "playing" || ph === "paused" ? Math.min(1, s.elapsed / s.interval) : 1;
      drawGame(ctx, s, {
        progress,
        phase: ph,
        time: t,
        wrap: DIFFICULTIES[diffRef.current].wrap,
      });
    };
    raf = requestAnimationFrame(frame);

    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      sfx.ensure();
      const dirMap: Record<string, Dir> = {
        ArrowUp: DIR_UP,
        ArrowDown: DIR_DOWN,
        ArrowLeft: DIR_LEFT,
        ArrowRight: DIR_RIGHT,
        w: DIR_UP,
        W: DIR_UP,
        s: DIR_DOWN,
        S: DIR_DOWN,
        a: DIR_LEFT,
        A: DIR_LEFT,
        d: DIR_RIGHT,
        D: DIR_RIGHT,
      };
      if (dirMap[k]) {
        e.preventDefault();
        const ph = phaseRef.current;
        if (ph === "menu") {
          // cycle difficulty with arrows on the menu
          if (k === "ArrowUp" || k === "ArrowLeft") {
            const i = DIFF_ORDER.indexOf(diffRef.current);
            selectDifficulty(DIFF_ORDER[(i + DIFF_ORDER.length - 1) % DIFF_ORDER.length]);
          } else if (k === "ArrowDown" || k === "ArrowRight") {
            const i = DIFF_ORDER.indexOf(diffRef.current);
            selectDifficulty(DIFF_ORDER[(i + 1) % DIFF_ORDER.length]);
          }
          return;
        }
        steer(dirMap[k]);
        return;
      }
      switch (k) {
        case " ":
          e.preventDefault();
          if (e.repeat) return;
          {
            const ph = phaseRef.current;
            if (ph === "menu" || ph === "gameover") startGame();
            else togglePause();
          }
          break;
        case "Enter":
          if (e.repeat) return;
          {
            const ph = phaseRef.current;
            if (ph === "menu" || ph === "gameover") startGame();
          }
          break;
        case "p":
        case "P":
        case "Escape":
          if (!e.repeat) togglePause();
          break;
        case "r":
        case "R":
          if (!e.repeat && phaseRef.current !== "menu") startGame();
          break;
        case "m":
        case "M":
          if (!e.repeat) toggleMute();
          break;
        case "1":
        case "2":
        case "3":
          if (phaseRef.current === "menu") selectDifficulty(DIFF_ORDER[Number(k) - 1]);
          break;
        default:
          break;
      }
    };

    const autoPause = () => {
      if (phaseRef.current === "playing") togglePause();
    };
    const onVis = () => {
      if (document.hidden) autoPause();
    };
    const wake = () => sfx.ensure();

    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", autoPause);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointerdown", wake);

    const mq = window.matchMedia("(pointer: coarse)");
    const onMq = () => setIsCoarse(mq.matches);
    mq.addEventListener("change", onMq);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", autoPause);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointerdown", wake);
      mq.removeEventListener("change", onMq);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- touch swipe ---------------- */

  const onTouchStart = (e: ReactTouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: ReactTouchEvent) => {
    const start = touchRef.current;
    if (!start) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
    if (Math.abs(dx) > Math.abs(dy)) steer(dx > 0 ? DIR_RIGHT : DIR_LEFT);
    else steer(dy > 0 ? DIR_DOWN : DIR_UP);
    touchRef.current = { x: t.clientX, y: t.clientY };
  };

  const cfg = DIFFICULTIES[difficulty];
  const showPad = isCoarse && phase !== "menu";

  return (
    <div className="flex w-full flex-col items-center gap-2.5">
      <div className="board-size">
        <HUD
          score={score}
          best={best}
          diff={cfg}
          speedPct={speedPct}
          paused={phase === "paused"}
          muted={muted}
          onPause={togglePause}
          onMute={toggleMute}
        />
      </div>

      <div
        ref={wrapRef}
        className="board-size crt-frame relative aspect-square select-none bg-pit-850"
        style={{ touchAction: "none" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
        <div className="fx-vignette pointer-events-none absolute inset-0 z-10" />
        {phase === "menu" && (
          <MenuOverlay difficulty={difficulty} best={best} onSelect={selectDifficulty} onStart={startGame} />
        )}
        {phase === "paused" && (
          <PauseOverlay onResume={togglePause} onRestart={startGame} onMenu={toMenu} />
        )}
        {phase === "gameover" && (
          <GameOverOverlay
            score={score}
            best={best}
            newBest={newBest}
            won={g.current.won}
            onRestart={startGame}
            onMenu={toMenu}
          />
        )}
        {phase === "countdown" && <CountdownOverlay n={countdown} />}
      </div>

      {showPad ? (
        <DPad onDir={steer} onCenter={togglePause} paused={phase === "paused"} />
      ) : (
        <div className="hidden flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] tracking-wider text-emerald-200/50 md:flex">
          <span className="flex items-center gap-1">
            <span className="keycap">←</span>
            <span className="keycap">↑</span>
            <span className="keycap">↓</span>
            <span className="keycap">→</span>
            <span className="ml-1">/</span>
            <span className="keycap ml-1">WASD</span>
            <span className="ml-1">STEER</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="keycap">SPACE</span> PAUSE
          </span>
          <span className="flex items-center gap-1">
            <span className="keycap">R</span> RESTART
          </span>
          <span className="flex items-center gap-1">
            <span className="keycap">M</span> SOUND
          </span>
        </div>
      )}
      {showPad && (
        <p className="text-[10px] font-semibold tracking-[0.3em] text-emerald-200/40">
          SWIPE THE BOARD OR USE THE PAD
        </p>
      )}
    </div>
  );
}
