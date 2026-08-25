/* Tiny WebAudio synth for arcade blips — no assets, all procedural. */

type ToneOpts = {
  f: number;
  f2?: number;
  d: number;
  type?: OscillatorType;
  v?: number;
  delay?: number;
};

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem("snake:muted") === "1";
    } catch {
      /* ignore */
    }
  }

  /** Must be called from a user gesture at least once. */
  ensure(): void {
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.32;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    try {
      localStorage.setItem("snake:muted", m ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.32, this.ctx.currentTime, 0.02);
    }
  }

  private tone(o: ToneOpts): void {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + (o.delay ?? 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = o.type ?? "square";
    osc.frequency.setValueAtTime(Math.max(1, o.f), t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t0 + o.d);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(o.v ?? 0.5, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + o.d + 0.03);
  }

  eat(): void {
    this.tone({ f: 470, f2: 780, d: 0.09, type: "square", v: 0.42 });
  }

  bonus(): void {
    [660, 880, 1175, 1568].forEach((f, i) =>
      this.tone({ f, d: 0.09, type: "square", v: 0.34, delay: i * 0.06 }),
    );
  }

  die(): void {
    this.tone({ f: 320, f2: 50, d: 0.5, type: "sawtooth", v: 0.5 });
    this.tone({ f: 180, f2: 38, d: 0.6, type: "square", v: 0.28, delay: 0.06 });
  }

  over(): void {
    [392, 311, 262, 196].forEach((f, i) =>
      this.tone({ f, d: 0.17, type: "triangle", v: 0.4, delay: i * 0.14 }),
    );
  }

  win(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      this.tone({ f, d: 0.14, type: "square", v: 0.34, delay: i * 0.1 }),
    );
  }

  count(go: boolean): void {
    if (go) this.tone({ f: 880, d: 0.2, type: "square", v: 0.45 });
    else this.tone({ f: 440, d: 0.1, type: "square", v: 0.32 });
  }

  click(): void {
    this.tone({ f: 280, f2: 210, d: 0.06, type: "triangle", v: 0.34 });
  }

  pause(): void {
    this.tone({ f: 520, f2: 300, d: 0.12, type: "triangle", v: 0.34 });
  }

  resume(): void {
    this.tone({ f: 300, f2: 540, d: 0.12, type: "triangle", v: 0.34 });
  }
}

export const sfx = new Sfx();
