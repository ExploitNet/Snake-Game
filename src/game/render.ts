import {
  BOARD_PX,
  CELL,
  COLS,
  ROWS,
  type BonusState,
  type Dir,
  type Floater,
  type Particle,
  type Pt,
} from "./types";

export interface ViewState {
  cells: Pt[];
  prev: Pt[];
  dir: Dir;
  food: Pt;
  bonus: BonusState | null;
  particles: Particle[];
  floaters: Floater[];
  shake: number;
}

export interface ViewOpts {
  /** 0..1 interpolation between the last two ticks */
  progress: number;
  phase: string;
  time: number;
  wrap: boolean;
}

const L = BOARD_PX;

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

const HEAD_RGB: [number, number, number] = [190, 242, 100]; // #bef264
const TAIL_RGB: [number, number, number] = [21, 128, 61]; // #15803d

function pixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.fill();
}

export function drawGame(ctx: CanvasRenderingContext2D, s: ViewState, o: ViewOpts): void {
  const scale = ctx.canvas.width / L;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, L, L);

  if (s.shake > 0.15) {
    ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
  }

  drawBoard(ctx);
  drawFood(ctx, s.food, o.time);
  if (s.bonus) drawBonus(ctx, s.bonus, o.time);
  drawSnake(ctx, s, o);
  drawParticles(ctx, s.particles);
  drawFloaters(ctx, s.floaters);
  drawVignette(ctx);
}

/* ------------------------------------------------ board */

function drawBoard(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#0b2416";
  ctx.fillRect(0, 0, L, L);

  // faint checker for depth
  ctx.fillStyle = "rgba(255,255,255,0.014)";
  for (let y = 0; y < ROWS; y++) {
    for (let x = (y % 2); x < COLS; x += 2) {
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }

  ctx.strokeStyle = "rgba(163,230,53,0.055)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < COLS; i++) {
    ctx.moveTo(i * CELL + 0.5, 0);
    ctx.lineTo(i * CELL + 0.5, L);
  }
  for (let i = 1; i < ROWS; i++) {
    ctx.moveTo(0, i * CELL + 0.5);
    ctx.lineTo(L, i * CELL + 0.5);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(163,230,53,0.07)";
  ctx.strokeRect(6.5, 6.5, L - 13, L - 13);
  ctx.strokeStyle = "#2a6b41";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, L - 3, L - 3);
}

/* ------------------------------------------------ food + bonus */

function drawFood(ctx: CanvasRenderingContext2D, f: Pt, time: number): void {
  const cx = (f.x + 0.5) * CELL;
  const cy = (f.y + 0.5) * CELL;
  const pulse = 1 + Math.sin(time / 190) * 0.07;
  const r = CELL * 0.33 * pulse;

  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, CELL * 1.05);
  glow.addColorStop(0, "rgba(244,63,94,0.30)");
  glow.addColorStop(1, "rgba(244,63,94,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - CELL * 1.1, cy - CELL * 1.1, CELL * 2.2, CELL * 2.2);

  // stem + leaf
  ctx.strokeStyle = "#854d0e";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r + 2);
  ctx.quadraticCurveTo(cx + 2, cy - r - 5, cx + 5, cy - r - 7);
  ctx.stroke();
  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  ctx.ellipse(cx + 8, cy - r - 4, 5.5, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r * 1.15);
  body.addColorStop(0, "#fda4af");
  body.addColorStop(0.45, "#f43f5e");
  body.addColorStop(1, "#9f1239");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.35, cy - r * 0.38, r * 0.24, r * 0.16, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawBonus(ctx: CanvasRenderingContext2D, b: BonusState, time: number): void {
  const cx = (b.pos.x + 0.5) * CELL;
  const cy = (b.pos.y + 0.5) * CELL;
  const frac = Math.max(0, b.ticksLeft / b.total);
  const pulse = 1 + Math.sin(time / 130) * 0.09;
  const R = CELL * 0.4 * pulse;

  // countdown ring
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(251,191,36,0.18)";
  ctx.beginPath();
  ctx.arc(cx, cy, CELL * 0.58, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = frac < 0.3 ? "#fb7185" : "#fbbf24";
  ctx.beginPath();
  ctx.arc(cx, cy, CELL * 0.58, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time / 550);
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = 15;
  const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, R);
  grad.addColorStop(0, "#fef3c7");
  grad.addColorStop(0.55, "#fbbf24");
  grad.addColorStop(1, "#d97706");
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? R : R * 0.42;
    const a = (i * Math.PI) / 4;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------ snake */

function drawSnake(ctx: CanvasRenderingContext2D, s: ViewState, o: ViewOpts): void {
  const n = s.cells.length;
  const dying = o.phase === "dying";
  const flashOn = dying && Math.floor(o.time / 85) % 2 === 0;
  const t = o.progress;

  // head glow
  if (n > 0) {
    const h = s.cells[0];
    const hx = (h.x + 0.5) * CELL;
    const hy = (h.y + 0.5) * CELL;
    const glow = ctx.createRadialGradient(hx, hy, 2, hx, hy, CELL * 1.5);
    glow.addColorStop(0, "rgba(163,230,53,0.20)");
    glow.addColorStop(1, "rgba(163,230,53,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(hx - CELL * 1.5, hy - CELL * 1.5, CELL * 3, CELL * 3);
  }

  for (let i = n - 1; i >= 0; i--) {
    const to = s.cells[i];
    const from = s.prev.length > 0 ? s.prev[Math.min(i, s.prev.length - 1)] : to;
    let fx = from.x;
    let fy = from.y;
    if (o.wrap) {
      if (to.x - fx > COLS / 2) fx += COLS;
      else if (to.x - fx < -COLS / 2) fx -= COLS;
      if (to.y - fy > ROWS / 2) fy += ROWS;
      else if (to.y - fy < -ROWS / 2) fy -= ROWS;
    } else if (Math.abs(to.x - fx) > 1 || Math.abs(to.y - fy) > 1) {
      fx = to.x;
      fy = to.y;
    }
    const x = fx + (to.x - fx) * t;
    const y = fy + (to.y - fy) * t;

    const spots: Array<[number, number]> = [[x, y]];
    if (o.wrap) {
      if (x < 0) spots.push([x + COLS, y]);
      else if (x >= COLS) spots.push([x - COLS, y]);
      if (y < 0) spots.push([x, y + ROWS]);
      else if (y >= ROWS) spots.push([x, y - ROWS]);
    }

    const isHead = i === 0;
    const frac = n > 1 ? i / (n - 1) : 0;
    const sizeFrac = isHead ? 0.94 : 0.84 - frac * 0.24;
    const size = CELL * sizeFrac;
    let color = lerpColor(HEAD_RGB, TAIL_RGB, frac);
    if (dying) color = flashOn ? "#fecdd3" : "#f43f5e";

    for (const [px, py] of spots) {
      const cx = (px + 0.5) * CELL;
      const cy = (py + 0.5) * CELL;
      ctx.fillStyle = color;
      pixelRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.34);
      if (!isHead && i % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.09)";
        pixelRect(ctx, cx - size * 0.24, cy - size * 0.24, size * 0.48, size * 0.48, size * 0.2);
      }
      if (isHead) drawHead(ctx, cx, cy, s, o, dying);
    }
  }
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: ViewState,
  o: ViewOpts,
  dying: boolean,
): void {
  const d = s.dir;
  const px = -d.y;
  const py = d.x;

  // tongue flick
  if (!dying && o.phase === "playing" && o.time % 2200 < 240) {
    const mx = cx + d.x * CELL * 0.46;
    const my = cy + d.y * CELL * 0.46;
    const tx = cx + d.x * CELL * 0.8;
    const ty = cy + d.y * CELL * 0.8;
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(tx, ty);
    ctx.lineTo(tx + (px + d.x * 0.6) * 4, ty + (py + d.y * 0.6) * 4);
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + (-px + d.x * 0.6) * 4, ty + (-py + d.y * 0.6) * 4);
    ctx.stroke();
  }

  const blink = o.time % 3200 < 130;
  const eo = CELL * 0.19;
  const fo = CELL * 0.13;
  for (const side of [1, -1]) {
    const ex = cx + d.x * fo + px * eo * side;
    const ey = cy + d.y * fo + py * eo * side;
    ctx.fillStyle = dying ? "#0b2416" : "#f8fafc";
    ctx.beginPath();
    if (blink && !dying) ctx.ellipse(ex, ey, CELL * 0.1, CELL * 0.028, 0, 0, Math.PI * 2);
    else ctx.arc(ex, ey, CELL * 0.1, 0, Math.PI * 2);
    ctx.fill();
    if (!blink && !dying) {
      ctx.fillStyle = "#052e16";
      ctx.beginPath();
      ctx.arc(ex + d.x * 2.2, ey + d.y * 2.2, CELL * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ------------------------------------------------ fx */

function drawParticles(ctx: CanvasRenderingContext2D, ps: Particle[]): void {
  for (const p of ps) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    const sz = p.size * (0.5 + a * 0.5);
    ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;
}

function drawFloaters(ctx: CanvasRenderingContext2D, fs: Floater[]): void {
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const f of fs) {
    const a = Math.max(0, f.life / f.maxLife);
    ctx.globalAlpha = a;
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(4,16,10,0.85)";
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawVignette(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createRadialGradient(L / 2, L / 2, L * 0.32, L / 2, L / 2, L * 0.78);
  g.addColorStop(0, "rgba(3,12,7,0)");
  g.addColorStop(1, "rgba(3,12,7,0.4)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L, L);
}
