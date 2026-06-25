/**
 * art.ts - shared helpers for procedurally painting crisp pixel-art onto
 * offscreen canvases. Everything renders at native pixel resolution and is
 * later blitted with image smoothing disabled, so pixels stay razor sharp.
 */

export interface Rect { x: number; y: number; w: number; h: number; c: string }

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { canvas: c, ctx };
}

export function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

const OUTLINE = '#0b0b14';

/** Draw rects with a 1px dark silhouette outline for that clean pixel-art read. */
export function paintRects(ctx: CanvasRenderingContext2D, ox: number, oy: number, rects: Rect[], outline = OUTLINE) {
  const offs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [1, 1], [1, -1], [-1, 1],
  ];
  ctx.fillStyle = outline;
  for (const r of rects) for (const [dx, dy] of offs) ctx.fillRect(ox + r.x + dx, oy + r.y + dy, r.w, r.h);
  for (const r of rects) { ctx.fillStyle = r.c; ctx.fillRect(ox + r.x, oy + r.y, r.w, r.h); }
}

/** Multiply a hex colour toward black (shading). */
export function shade(hex: string, k = 0.65): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Deterministic pseudo-random generator for stable speckle patterns. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
