export const COLS = 21;
export const ROWS = 21;
export const CELL = 32;
export const BOARD_PX = COLS * CELL;

export const APPLE_POINTS = 10;
export const BONUS_POINTS = 50;
export const BONUS_EVERY = 5;

export interface Pt {
  x: number;
  y: number;
}

export type Dir = Pt;

export const DIR_UP: Dir = { x: 0, y: -1 };
export const DIR_DOWN: Dir = { x: 0, y: 1 };
export const DIR_LEFT: Dir = { x: -1, y: 0 };
export const DIR_RIGHT: Dir = { x: 1, y: 0 };

export type DifficultyKey = "chill" | "classic" | "insane";

export interface DifficultyDef {
  key: DifficultyKey;
  label: string;
  tagline: string;
  /** ms per tick at start */
  interval: number;
  /** fastest allowed tick */
  minInterval: number;
  /** multiplier applied to interval on every apple */
  ramp: number;
  /** walls wrap around instead of killing */
  wrap: boolean;
  /** score multiplier */
  mult: number;
  color: string;
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyDef> = {
  chill: {
    key: "chill",
    label: "CHILL",
    tagline: "Gentle pace · walls wrap around",
    interval: 150,
    minInterval: 96,
    ramp: 0.988,
    wrap: true,
    mult: 1,
    color: "#34d399",
  },
  classic: {
    key: "classic",
    label: "CLASSIC",
    tagline: "Arcade rules · walls are lethal",
    interval: 112,
    minInterval: 62,
    ramp: 0.977,
    wrap: false,
    mult: 2,
    color: "#fbbf24",
  },
  insane: {
    key: "insane",
    label: "INSANE",
    tagline: "Blistering speed · legends only",
    interval: 82,
    minInterval: 44,
    ramp: 0.966,
    wrap: false,
    mult: 3,
    color: "#fb7185",
  },
};

export const DIFF_ORDER: DifficultyKey[] = ["chill", "classic", "insane"];

export interface BonusState {
  pos: Pt;
  ticksLeft: number;
  total: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
}

/* ---------------- persistence ---------------- */

const bestKey = (d: DifficultyKey) => `snake:best:${d}`;

export function loadBest(d: DifficultyKey): number {
  try {
    return Number(localStorage.getItem(bestKey(d))) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(d: DifficultyKey, v: number): void {
  try {
    localStorage.setItem(bestKey(d), String(v));
  } catch {
    /* storage unavailable */
  }
}

export function overallBest(): number {
  return DIFF_ORDER.reduce((m, k) => Math.max(m, loadBest(k)), 0);
}
