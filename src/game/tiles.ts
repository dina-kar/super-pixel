/**
 * tiles.ts - procedural 16x16 pixel-art tileset for The Inventory Wastes, plus
 * taller prop sprites (server towers, crystals, terminals) drawn on top.
 */

import { makeCanvas, px, rng } from './art';

export const TILE = 16;

// tile ids
export const T_SOIL = 1;     // walkable dark data-soil
export const T_SAND = 2;     // walkable silicon path
export const T_CIRCUIT = 3;  // walkable glowing circuit field (encounter zone)
export const T_WALL = 4;     // solid server-base wall
export const T_STREAM = 5;   // solid data-stream

export interface TileMeta { solid: boolean; encounter: boolean }
export const TILE_META: Record<number, TileMeta> = {
  [T_SOIL]: { solid: false, encounter: false },
  [T_SAND]: { solid: false, encounter: false },
  [T_CIRCUIT]: { solid: false, encounter: true },
  [T_WALL]: { solid: true, encounter: false },
  [T_STREAM]: { solid: true, encounter: false },
};

const IDS = [T_SOIL, T_SAND, T_CIRCUIT, T_WALL, T_STREAM];

let tileset: { canvas: HTMLCanvasElement; index: Record<number, number> } | null = null;

function drawTile(ctx: CanvasRenderingContext2D, ox: number, id: number) {
  const r = rng(id * 97 + 13);
  const speckle = (n: number, colors: string[]) => {
    for (let i = 0; i < n; i++) {
      const x = Math.floor(r() * TILE), y = Math.floor(r() * TILE);
      px(ctx, ox + x, oy + y, 1, 1, colors[Math.floor(r() * colors.length)]);
    }
  };
  const oy = 0;
  if (id === T_SOIL) {
    px(ctx, ox, oy, TILE, TILE, '#1d2532');
    speckle(26, ['#27313f', '#161c27', '#21484f']);
    px(ctx, ox, oy, TILE, 1, '#161b24');
  } else if (id === T_SAND) {
    px(ctx, ox, oy, TILE, TILE, '#3b3528');
    speckle(30, ['#4a4233', '#2f2a20', '#564b38']);
    px(ctx, ox, oy, TILE, 1, '#2c2719');
  } else if (id === T_CIRCUIT) {
    px(ctx, ox, oy, TILE, TILE, '#06141c');
    for (let i = 3; i < TILE; i += 6) { px(ctx, ox + i, oy, 1, TILE, '#0c3a45'); px(ctx, ox, oy + i, TILE, 1, '#0c3a45'); }
    px(ctx, ox + 3, oy + 8, 10, 1, '#19d6ff'); px(ctx, ox + 8, oy + 3, 1, 10, '#19d6ff');
    px(ctx, ox + 7, oy + 7, 3, 3, '#7ff6ff');
    px(ctx, ox + 12, oy + 12, 2, 2, '#19d6ff');
  } else if (id === T_WALL) {
    px(ctx, ox, oy, TILE, TILE, '#15171f');
    px(ctx, ox, oy, TILE, 2, '#262a36');
    px(ctx, ox, oy + 7, TILE, 1, '#0a0b10');
    px(ctx, ox + 7, oy, 1, TILE, '#0a0b10');
    speckle(6, ['#2a2e3a']);
    px(ctx, ox + 2, oy + 3, 2, 1, '#21e6ff');
    px(ctx, ox + 11, oy + 10, 2, 1, '#ff5a6e');
  } else if (id === T_STREAM) {
    px(ctx, ox, oy, TILE, TILE, '#082230');
    for (let y = 1; y < TILE; y += 3) px(ctx, ox + (y % 2 ? 1 : 3), oy + y, TILE - 4, 1, '#1196b8');
    speckle(8, ['#7ff6ff']);
  }
}

export function getTileset() {
  if (tileset) return tileset;
  const { canvas, ctx } = makeCanvas(TILE * IDS.length, TILE);
  const index: Record<number, number> = {};
  IDS.forEach((id, i) => { index[id] = i; drawTile(ctx, i * TILE, id); });
  tileset = { canvas, index };
  return tileset;
}

// ---- Props (taller than a tile) -------------------------------------------

export interface PropSprite { canvas: HTMLCanvasElement; w: number; h: number; anchorY: number; solid: boolean }

const propCache = new Map<string, PropSprite>();

export function getProp(type: string): PropSprite {
  let p = propCache.get(type);
  if (p) return p;
  if (type === 'tower') {
    const { canvas, ctx } = makeCanvas(16, 36);
    px(ctx, 1, 4, 14, 32, '#0f1118');
    px(ctx, 1, 4, 14, 2, '#2a2f3c');
    for (let y = 8; y < 36; y += 5) px(ctx, 1, y, 14, 1, '#06070a');
    // blinking lights
    px(ctx, 3, 9, 2, 1, '#21e6ff'); px(ctx, 11, 14, 2, 1, '#ff5a6e'); px(ctx, 6, 22, 2, 1, '#21e6ff'); px(ctx, 9, 29, 2, 1, '#7dff9b');
    px(ctx, 0, 34, 16, 2, '#05060a');
    p = { canvas, w: 16, h: 36, anchorY: 20, solid: true };
  } else if (type === 'crystal') {
    const { canvas, ctx } = makeCanvas(14, 20);
    // glowing data crystal
    px(ctx, 5, 1, 4, 18, '#19d6ff');
    px(ctx, 4, 4, 6, 12, '#7ff6ff');
    px(ctx, 6, 6, 2, 8, '#ffffff');
    px(ctx, 3, 10, 8, 2, '#0a3a47');
    p = { canvas, w: 14, h: 20, anchorY: 6, solid: true };
  } else if (type === 'terminal') {
    const { canvas, ctx } = makeCanvas(16, 18);
    px(ctx, 2, 2, 12, 10, '#14161f');
    px(ctx, 3, 3, 10, 8, '#0a2a33');
    px(ctx, 4, 4, 8, 1, '#19d6ff'); px(ctx, 4, 6, 6, 1, '#19d6ff'); px(ctx, 4, 8, 7, 1, '#7ff6ff');
    px(ctx, 5, 12, 6, 4, '#22252f');
    p = { canvas, w: 16, h: 18, anchorY: 4, solid: true };
  } else if (type === 'portal') {
    const { canvas, ctx } = makeCanvas(20, 24);
    px(ctx, 3, 2, 14, 20, '#19d6ff');
    px(ctx, 5, 4, 10, 16, '#7ff6ff');
    px(ctx, 7, 6, 6, 12, '#dff8ff');
    px(ctx, 2, 1, 16, 1, '#0a3a47'); px(ctx, 2, 22, 16, 1, '#0a3a47');
    p = { canvas, w: 20, h: 24, anchorY: 8, solid: false };
  } else {
    // debris
    const { canvas, ctx } = makeCanvas(16, 12);
    px(ctx, 2, 6, 12, 5, '#22252f');
    px(ctx, 4, 3, 5, 4, '#171a22');
    px(ctx, 9, 4, 3, 3, '#2a2e3a');
    p = { canvas, w: 16, h: 12, anchorY: 0, solid: false };
  }
  propCache.set(type, p);
  return p;
}
