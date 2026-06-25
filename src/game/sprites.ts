/**
 * sprites.ts - procedural pixel-art character & enemy sprites.
 *
 *  - Overworld characters: 16x20, 4 directions (down/left/right/up) x 3 walk
 *    frames. Used for exploration AND (reused) for party battlers.
 *  - Enemy battlers: side-view creatures with idle/attack frames.
 */

import { makeCanvas, paintRects, px, shade, rng, type Rect } from './art';

export interface CharSheet {
  canvas: HTMLCanvasElement;
  fw: number;
  fh: number;
  frames: number;
  dirRow: Record<Dir, number>;
}
export type Dir = 'down' | 'left' | 'right' | 'up';

interface CharPalette {
  skin: string; body: string; bodyShade: string; legs: string; accent: string; hair: string; cloak?: string; visor?: boolean;
}

const PALETTES: Record<string, CharPalette> = {
  pixel: { skin: '#eef3fb', body: '#f4f7fc', bodyShade: '#aab6cc', legs: '#c4ccda', accent: '#2fd0ff', hair: '#cfe9ff', visor: true },
  ob3pc: { skin: '#b59a6e', body: '#6f5836', bodyShade: '#4a3a22', legs: '#3a2f1e', accent: '#e0902f', hair: '#caa15a', cloak: '#5a4a2e' },
};

const FW = 16;
const FH = 20;
const FRAMES = 3;
const DIRS: Dir[] = ['down', 'left', 'right', 'up'];

function legRects(frame: number, p: CharPalette, cx: number): Rect[] {
  const a = frame === 1 ? 6 : 4;
  const b = frame === 2 ? 6 : 4;
  return [
    { x: cx - 3, y: 14, w: 3, h: a, c: p.legs },
    { x: cx + 1, y: 14, w: 3, h: b, c: p.legs },
  ];
}

function buildChar(dir: Dir, frame: number, p: CharPalette): Rect[] {
  const cx = 8;
  const r: Rect[] = [];
  const bob = frame === 0 ? 0 : 0; // keep feet planted; legs animate length

  // cloak behind everything (mentor)
  if (p.cloak) r.push({ x: cx - 6, y: 9, w: 12, h: 10, c: dir === 'up' ? p.cloak : shade(p.cloak, 0.85) });

  r.push(...legRects(frame, p, cx));

  if (dir === 'down' || dir === 'up') {
    // torso
    r.push({ x: cx - 5, y: 8 + bob, w: 10, h: 7, c: p.body });
    r.push({ x: cx + 1, y: 8 + bob, w: 4, h: 7, c: p.bodyShade });
    r.push({ x: cx - 5, y: 8 + bob, w: 10, h: 2, c: p.accent });
    // arms
    r.push({ x: cx - 7, y: 9 + bob, w: 2, h: 6, c: p.bodyShade });
    r.push({ x: cx + 5, y: 9 + bob, w: 2, h: 6, c: p.body });
    // head
    r.push({ x: cx - 5, y: 1, w: 10, h: 8, c: p.skin });
    r.push({ x: cx - 5, y: 1, w: 10, h: 3, c: p.hair }); // crown/helmet
    if (dir === 'down') {
      if (p.visor) r.push({ x: cx - 4, y: 4, w: 8, h: 2, c: p.accent });
      else { r.push({ x: cx - 3, y: 5, w: 1, h: 2, c: '#1a1a22' }); r.push({ x: cx + 2, y: 5, w: 1, h: 2, c: '#1a1a22' }); }
    } else {
      // back of head: full hair
      r.push({ x: cx - 5, y: 1, w: 10, h: 7, c: p.hair });
    }
  } else {
    const faceLeft = dir === 'left';
    const fx = faceLeft ? -1 : 1;
    // torso (narrower)
    r.push({ x: cx - 4, y: 8 + bob, w: 8, h: 7, c: p.body });
    r.push({ x: cx - 4 + (faceLeft ? 0 : 4), y: 8 + bob, w: 4, h: 7, c: p.bodyShade });
    // front arm
    r.push({ x: cx + (faceLeft ? -5 : 3), y: 9 + bob, w: 2, h: 6, c: p.body });
    // head profile
    r.push({ x: cx - 4, y: 1, w: 8, h: 8, c: p.skin });
    r.push({ x: cx - 4, y: 1, w: 8, h: 3, c: p.hair });
    r.push({ x: cx - 4 + (faceLeft ? 4 : 0), y: 1, w: 4, h: 8, c: p.hair }); // hair at back
    // eye toward facing side
    if (p.visor) r.push({ x: cx + (faceLeft ? -3 : 1), y: 4, w: 3, h: 2, c: p.accent });
    else r.push({ x: cx + fx * 2, y: 5, w: 1, h: 2, c: '#1a1a22' });
  }
  return r;
}

const charCache = new Map<string, CharSheet>();
export function getCharSheet(key: string): CharSheet {
  let sheet = charCache.get(key);
  if (sheet) return sheet;
  const p = PALETTES[key] ?? PALETTES.pixel;
  const { canvas, ctx } = makeCanvas(FW * FRAMES, FH * DIRS.length);
  DIRS.forEach((dir, row) => {
    for (let f = 0; f < FRAMES; f++) paintRects(ctx, f * FW, row * FH, buildChar(dir, f, p));
  });
  sheet = { canvas, fw: FW, fh: FH, frames: FRAMES, dirRow: { down: 0, left: 1, right: 2, up: 3 } };
  charCache.set(key, sheet);
  return sheet;
}

// ---- Enemy battlers --------------------------------------------------------

export interface EnemySheet { canvas: HTMLCanvasElement; fw: number; fh: number; frames: number }

function drawSpider(ctx: CanvasRenderingContext2D, ox: number, oy: number, frame: number, neon: string, scale: number) {
  // frame 0 idle, 1 attack(lunge left), 2 hit(recoil)
  const cx = 24, cy = 22;
  const lunge = frame === 1 ? -4 : frame === 2 ? 4 : 0;
  const s = scale;
  // aura
  ctx.fillStyle = neon; ctx.globalAlpha = 0.16;
  ctx.fillRect(ox + cx - 16 * s + lunge, oy + cy - 12 * s, 32 * s, 24 * s);
  ctx.globalAlpha = 1;
  // legs
  const drawLeg = (x1: number, y1: number, x2: number, y2: number, color: string, w: number) => {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ox + x1, oy + y1); ctx.lineTo(ox + x2, oy + y2); ctx.stroke();
  };
  const len = 14 * s;
  for (let i = 0; i < 4; i++) {
    const dy = cy - 8 + i * 4;
    const splay = frame === 1 ? 3 : 0;
    const lx = cx - 6 + lunge, rx = cx + 6 + lunge;
    const lex = lx - len - splay, rex = rx + len + splay;
    const lkx = (lx + lex) / 2, rkx = (rx + rex) / 2, ky = dy - 5;
    drawLeg(lx, dy, lkx, ky, '#0b0b14', 4); drawLeg(lkx, ky, lex, dy - 2, '#0b0b14', 4);
    drawLeg(rx, dy, rkx, ky, '#0b0b14', 4); drawLeg(rkx, ky, rex, dy - 2, '#0b0b14', 4);
    drawLeg(lx, dy, lkx, ky, neon, 2); drawLeg(lkx, ky, lex, dy - 2, neon, 2);
    drawLeg(rx, dy, rkx, ky, neon, 2); drawLeg(rkx, ky, rex, dy - 2, neon, 2);
  }
  // body
  const bw = 18 * s, bh = 14 * s, bx = cx - bw / 2 + lunge, by = cy - bh / 2;
  paintRects(ctx, ox, oy, [
    { x: bx, y: by, w: bw, h: bh, c: '#1a0608' },
    { x: bx, y: by, w: bw, h: 3, c: shade(neon, 0.7) },
    { x: bx, y: by, w: 4, h: bh, c: shade(neon, 0.5) },
  ]);
  ctx.strokeStyle = neon; ctx.lineWidth = 1.5;
  ctx.strokeRect(ox + bx + 1, oy + by + 1, bw - 2, bh - 2);
  // eyes (cluster, facing left)
  const ex = ox + bx + 3, ey = oy + cy - 2;
  ctx.fillStyle = neon;
  ctx.fillRect(ex, ey, 3, 3); ctx.fillRect(ex + 4, ey - 2, 2, 2); ctx.fillRect(ex + 4, ey + 3, 2, 2);
  ctx.fillStyle = '#fff'; ctx.fillRect(ex + 1, ey + 1, 1, 1);
}

const enemyCache = new Map<string, EnemySheet>();
export function getEnemySheet(key: string): EnemySheet {
  let sheet = enemyCache.get(key);
  if (sheet) return sheet;
  const big = key === 'weaver';
  const fw = 48, fh = 44;
  const { canvas, ctx } = makeCanvas(fw * 3, fh);
  const neon = big ? '#ff2b4d' : '#ff4040';
  const scale = big ? 1.25 : 0.9;
  for (let f = 0; f < 3; f++) drawSpider(ctx, f * fw, 0, f, neon, scale);
  sheet = { canvas, fw, fh, frames: 3 };
  enemyCache.set(key, sheet);
  return sheet;
}

// ---- Small portrait for dialogue/menu -------------------------------------

const portraitCache = new Map<string, HTMLCanvasElement>();
export function getPortrait(key: string): HTMLCanvasElement {
  let c = portraitCache.get(key);
  if (c) return c;
  const { canvas, ctx } = makeCanvas(32, 32);
  if (key === 'pixel' || key === 'ob3pc') {
    const p = PALETTES[key];
    px(ctx, 0, 0, 32, 32, '#10131c');
    paintRects(ctx, 0, 6, [
      { x: 8, y: 2, w: 16, h: 14, c: p.skin },
      { x: 8, y: 2, w: 16, h: 5, c: p.hair },
      ...(p.visor ? [{ x: 9, y: 9, w: 14, h: 3, c: p.accent }] : [{ x: 11, y: 9, w: 2, h: 3, c: '#1a1a22' }, { x: 19, y: 9, w: 2, h: 3, c: '#1a1a22' }]),
      { x: 6, y: 16, w: 20, h: 10, c: p.body },
      { x: 6, y: 16, w: 20, h: 2, c: p.accent },
    ]);
  } else {
    const neon = key === 'weaver' ? '#ff2b4d' : '#ff4040';
    px(ctx, 0, 0, 32, 32, '#1a0608');
    drawSpider(ctx, -8, -2, 0, neon, 0.7);
  }
  portraitCache.set(key, canvas);
  return canvas;
}
