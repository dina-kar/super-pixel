/**
 * Game.ts - the 2D pixel-art engine. Renders to a fixed 384x216 internal buffer
 * (crisp nearest-neighbour upscale, no blur), runs the overworld simulation
 * (free 4-directional movement, tile collision, depth-sorted props, random +
 * boss encounters) and draws the turn-based battle scene. All UI-relevant state
 * lives in gameStore; modal UI (dialogue/menu/battle commands) is React.
 */

import { Input } from './input';
import { getCharSheet, getEnemySheet, type Dir } from '../game/sprites';
import { getTileset, getProp, TILE } from '../game/tiles';
import { buildInventoryWastes, triggerBoss, triggerExit, type GameMap } from '../game/maps';
import { getState, startCombat, openMenu } from '../state/gameStore';

const VW = 384;
const VH = 216;
const SPEED = 64; // px/s

interface Player { x: number; y: number; dir: Dir; moving: boolean; animT: number }

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private buf: HTMLCanvasElement;
  private bx: CanvasRenderingContext2D;
  private input = new Input();
  private map: GameMap;
  private player: Player;
  private cam = { x: 0, y: 0 };
  private raf = 0;
  private last = 0;
  private time = 0;
  private encAccum = 0;
  private encCooldown = 0;
  private bossFired = false;
  private triggerInside = new Map<string, boolean>();
  private interactHint = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    const b = document.createElement('canvas');
    b.width = VW; b.height = VH;
    this.buf = b;
    this.bx = b.getContext('2d')!;
    this.bx.imageSmoothingEnabled = false;
    this.map = buildInventoryWastes();
    this.player = { x: this.map.spawn.x * TILE, y: this.map.spawn.y * TILE - 4, dir: 'down', moving: false, animT: 0 };
    this.centerCamera(true);
  }

  start() {
    this.input.attach();
    window.addEventListener('resize', this.resize);
    this.resize();
    this.last = performance.now();
    this.loop(this.last);
  }
  stop() {
    cancelAnimationFrame(this.raf);
    this.input.detach();
    window.removeEventListener('resize', this.resize);
  }

  private resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.imageSmoothingEnabled = false;
  };

  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.render();
    this.input.endFrame();
    this.raf = requestAnimationFrame(this.loop);
  };

  // ------------------------------------------------------------------ update

  private update(dt: number) {
    const s = getState();
    if (this.encCooldown > 0) this.encCooldown -= dt;

    if (s.mode !== 'explore' || s.dialogue || s.menuTab) {
      this.player.moving = false;
      return;
    }

    // movement
    const { dx, dy } = this.input.dir();
    let mx = dx, my = dy;
    if (mx && my) { const inv = 1 / Math.sqrt(2); mx *= inv; my *= inv; }
    const moving = dx !== 0 || dy !== 0;
    this.player.moving = moving;
    if (moving) {
      if (dx < 0) this.player.dir = 'left';
      else if (dx > 0) this.player.dir = 'right';
      else if (dy < 0) this.player.dir = 'up';
      else if (dy > 0) this.player.dir = 'down';
      this.player.animT += dt;
      this.moveAxis(mx * SPEED * dt, 0);
      this.moveAxis(0, my * SPEED * dt);
      this.checkEncounter(Math.abs(mx) + Math.abs(my), dt);
      this.checkTriggers();
    } else {
      this.player.animT = 0;
    }

    // interact prompt + action
    this.interactHint = this.facingInteractable() !== null;
    if (this.input.pressedInteract()) {
      const target = this.facingInteractable();
      if (target) target();
    }
    if (this.input.pressedMenu()) openMenu('status');

    this.centerCamera(false);
  }

  private collides(boxX: number, boxY: number, w: number, h: number): boolean {
    const x0 = Math.floor(boxX / TILE), x1 = Math.floor((boxX + w - 1) / TILE);
    const y0 = Math.floor(boxY / TILE), y1 = Math.floor((boxY + h - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (ty < 0 || tx < 0 || ty >= this.map.h || tx >= this.map.w) return true;
      if (this.map.solid[ty][tx]) return true;
    }
    return false;
  }

  // collision box at the feet of the 16x20 sprite
  private box(px: number, py: number) { return { x: px + 3, y: py + 13, w: 10, h: 6 }; }

  private moveAxis(ax: number, ay: number) {
    if (ax === 0 && ay === 0) return;
    const nx = this.player.x + ax;
    const ny = this.player.y + ay;
    const b = this.box(nx, ny);
    if (!this.collides(b.x, b.y, b.w, b.h)) { this.player.x = nx; this.player.y = ny; }
  }

  private feetTile() {
    return { tx: Math.floor((this.player.x + 8) / TILE), ty: Math.floor((this.player.y + 16) / TILE) };
  }

  private checkEncounter(intensity: number, dt: number) {
    if (this.encCooldown > 0) return;
    const { tx, ty } = this.feetTile();
    if (ty < 0 || tx < 0 || ty >= this.map.h || tx >= this.map.w) return;
    if (!this.map.encounter[ty][tx]) return;
    this.encAccum += intensity * SPEED * dt;
    if (this.encAccum > 48 && Math.random() < 0.012 + this.encAccum * 0.0002) {
      this.encAccum = 0;
      this.encCooldown = 1.5;
      startCombat(false);
    }
  }

  private checkTriggers() {
    const { tx, ty } = this.feetTile();
    for (const t of this.map.triggers) {
      const inside = tx >= t.x && tx < t.x + t.w && ty >= t.y && ty < t.y + t.h;
      const was = this.triggerInside.get(t.id) ?? false;
      if (inside && !was) {
        if (t.kind === 'boss' && !this.bossFired) { this.bossFired = true; triggerBoss(); }
        else if (t.kind === 'exit') triggerExit();
      }
      this.triggerInside.set(t.id, inside);
    }
  }

  /** Returns the onInteract callback of whatever the player faces, or null. */
  private facingInteractable(): (() => void) | null {
    const { tx, ty } = this.feetTile();
    const d = this.player.dir;
    const fx = tx + (d === 'left' ? -1 : d === 'right' ? 1 : 0);
    const fy = ty + (d === 'up' ? -1 : d === 'down' ? 1 : 0);
    for (const npc of this.map.npcs) {
      if ((npc.x === fx && npc.y === fy) || (npc.x === tx && npc.y === ty)) return npc.onInteract;
    }
    for (const p of this.map.props) {
      if (p.type === 'terminal' && p.x === fx && p.y === fy) return () => openMenu('codex');
    }
    return null;
  }

  private centerCamera(snap: boolean) {
    const mapW = this.map.w * TILE, mapH = this.map.h * TILE;
    let tx = this.player.x + 8 - VW / 2;
    let ty = this.player.y + 10 - VH / 2;
    tx = mapW <= VW ? (mapW - VW) / 2 : Math.max(0, Math.min(mapW - VW, tx));
    ty = mapH <= VH ? (mapH - VH) / 2 : Math.max(0, Math.min(mapH - VH, ty));
    if (snap) { this.cam.x = tx; this.cam.y = ty; }
    else { this.cam.x += (tx - this.cam.x) * 0.18; this.cam.y += (ty - this.cam.y) * 0.18; }
  }

  // ------------------------------------------------------------------ render

  private render() {
    const s = getState();
    if (s.mode === 'combat') this.renderBattle(s);
    else this.renderWorld();
    this.blit();
  }

  private blit() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const scale = Math.min(W / VW, H / VH);
    const dw = VW * scale, dh = VH * scale;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.buf, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  private renderWorld() {
    const ctx = this.bx;
    const ts = getTileset();
    ctx.fillStyle = '#05060c';
    ctx.fillRect(0, 0, VW, VH);
    const camX = Math.round(this.cam.x), camY = Math.round(this.cam.y);

    // tiles
    const x0 = Math.floor(camX / TILE), x1 = Math.ceil((camX + VW) / TILE);
    const y0 = Math.floor(camY / TILE), y1 = Math.ceil((camY + VH) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (ty < 0 || tx < 0 || ty >= this.map.h || tx >= this.map.w) continue;
        const id = this.map.ground[ty][tx];
        const idx = ts.index[id];
        if (idx === undefined) continue;
        ctx.drawImage(ts.canvas, idx * TILE, 0, TILE, TILE, tx * TILE - camX, ty * TILE - camY, TILE, TILE);
      }
    }

    // depth-sorted entities (props + npcs + player)
    interface Drawable { baseY: number; draw: () => void }
    const items: Drawable[] = [];

    for (const p of this.map.props) {
      const sp = getProp(p.type);
      const baseY = p.y * TILE + TILE;
      const dx = p.x * TILE + (TILE - sp.w) / 2 - camX;
      const dy = baseY - sp.h - camY;
      items.push({ baseY, draw: () => {
        if (p.type === 'crystal' || p.type === 'portal') this.glow(dx + sp.w / 2, baseY - camY - sp.h / 2, sp.w, '#19d6ff', 0.25);
        ctx.drawImage(sp.canvas, Math.round(dx), Math.round(dy));
      } });
    }

    for (const npc of this.map.npcs) {
      const sheet = getCharSheet(npc.sprite);
      const baseY = npc.y * TILE + TILE;
      const dx = npc.x * TILE - camX, dy = npc.y * TILE - 4 - camY;
      items.push({ baseY, draw: () => {
        this.shadow(dx + 8, npc.y * TILE + TILE - camY - 2);
        const row = sheet.dirRow[npc.dir ?? 'down'];
        ctx.drawImage(sheet.canvas, 0, row * sheet.fh, sheet.fw, sheet.fh, Math.round(dx), Math.round(dy), sheet.fw, sheet.fh);
      } });
    }

    // player
    {
      const sheet = getCharSheet('pixel');
      const baseY = this.player.y + TILE + 4;
      const seq = [1, 0, 2, 0];
      const frame = this.player.moving ? seq[Math.floor(this.player.animT * 8) % 4] : 0;
      const dx = this.player.x - camX, dy = this.player.y - camY;
      items.push({ baseY, draw: () => {
        this.shadow(dx + 8, this.player.y + 18 - camY);
        ctx.drawImage(sheet.canvas, frame * sheet.fw, sheet.dirRow[this.player.dir] * sheet.fh, sheet.fw, sheet.fh, Math.round(dx), Math.round(dy), sheet.fw, sheet.fh);
      } });
    }

    items.sort((a, b) => a.baseY - b.baseY);
    for (const it of items) it.draw();

    // interaction prompt bubble
    if (this.interactHint) {
      const bx = this.player.x + 8 - camX, by = this.player.y - 8 - camY;
      ctx.fillStyle = '#0b0b14';
      ctx.fillRect(bx - 6, by - 9, 12, 11);
      ctx.fillStyle = '#ffe24a';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('E', bx, by - 1);
    }

    // soft vignette
    this.vignette();
    this.minimap();
  }

  private minimap() {
    const ctx = this.bx;
    const scale = 1;
    const mw = this.map.w * scale, mh = this.map.h * scale;
    const ox = VW - mw - 6, oy = 6;
    ctx.fillStyle = 'rgba(5,8,14,0.78)';
    ctx.fillRect(ox - 2, oy - 2, mw + 4, mh + 4);
    ctx.strokeStyle = 'rgba(25,214,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox - 1.5, oy - 1.5, mw + 3, mh + 3);
    for (let ty = 0; ty < this.map.h; ty++) {
      for (let tx = 0; tx < this.map.w; tx++) {
        const id = this.map.ground[ty][tx];
        let c = '';
        if (this.map.solid[ty][tx]) c = '#2a2f3c';
        else if (this.map.encounter[ty][tx]) c = '#0e6b80';
        else if (id === 2) c = '#3b3528';
        else if (id === 5) c = '#0a2230';
        if (c) { ctx.fillStyle = c; ctx.fillRect(ox + tx * scale, oy + ty * scale, scale, scale); }
      }
    }
    // markers
    for (const t of this.map.triggers) {
      ctx.fillStyle = t.kind === 'boss' ? '#ff2b4d' : '#7dff9b';
      ctx.fillRect(ox + t.x * scale, oy + t.y * scale, 2, 2);
    }
    for (const npc of this.map.npcs) { ctx.fillStyle = '#ffba55'; ctx.fillRect(ox + npc.x * scale, oy + npc.y * scale, 2, 2); }
    // player (blink)
    if (Math.floor(this.time * 3) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      const ptx = Math.floor((this.player.x + 8) / TILE), pty = Math.floor((this.player.y + 16) / TILE);
      ctx.fillRect(ox + ptx * scale - 1, oy + pty * scale - 1, 2, 2);
    }
  }

  private shadow(cx: number, cy: number) {
    const ctx = this.bx;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  private glow(cx: number, cy: number, r: number, color: string, a: number) {
    const ctx = this.bx;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a;
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  }
  private vignette() {
    const ctx = this.bx;
    const g = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VH * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
  }

  // ------------------------------------------------------------------ battle

  private partySlot(i: number): [number, number] {
    const slots: [number, number][] = [[70, 150], [104, 116]];
    return slots[i] ?? [70, 150];
  }
  private enemySlot(i: number, count: number): [number, number] {
    const xs = count === 1 ? [296] : count === 2 ? [288, 320] : [280, 312, 296];
    const ys = count === 1 ? [118] : count === 2 ? [104, 146] : [96, 150, 122];
    return [xs[i] ?? 300, ys[i] ?? 120];
  }

  private renderBattle(s: ReturnType<typeof getState>) {
    const ctx = this.bx;
    // background
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#0a0e18');
    g.addColorStop(1, '#05060c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    // ground band
    ctx.fillStyle = '#0c1622';
    ctx.fillRect(0, 130, VW, VH - 130);
    ctx.strokeStyle = 'rgba(25,214,255,0.12)';
    ctx.lineWidth = 1;
    for (let i = -6; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(VW / 2 + i * 40, 130);
      ctx.lineTo(VW / 2 + i * 90, VH);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, 130); ctx.lineTo(VW, 130); ctx.strokeStyle = 'rgba(25,214,255,0.25)'; ctx.stroke();

    const now = performance.now();

    // enemies (right, facing left)
    const live = s.enemies;
    live.forEach((u, i) => {
      const [ex, ey] = this.enemySlot(i, live.length);
      const sheet = getEnemySheet(u.spriteKey);
      const frame = u.anim === 'attack' ? 1 : u.anim === 'hit' ? 2 : 0;
      const dead = u.hp <= 0;
      this.shadow(ex, ey + sheet.fh * 0.42);
      ctx.save();
      if (dead) ctx.globalAlpha = Math.max(0, 0.5 - (now % 1000) / 1000);
      if (now < u.flashUntil) { ctx.globalCompositeOperation = 'lighter'; }
      ctx.drawImage(sheet.canvas, frame * sheet.fw, 0, sheet.fw, sheet.fh, Math.round(ex - sheet.fw / 2), Math.round(ey - sheet.fh / 2), sheet.fw, sheet.fh);
      ctx.restore();
      if (!dead) this.battleBar(ex - 20, ey - sheet.fh / 2 - 8, 40, u.hp / u.maxHp, '#ff2b4d');
      this.popText(u, ex, ey - sheet.fh / 2 - 14);
    });

    // party (left, back view; turn to strike on attack)
    s.party.forEach((u, i) => {
      const [pxn, pyn] = this.partySlot(i);
      const sheet = getCharSheet(u.spriteKey);
      const dead = u.hp <= 0;
      const row = u.anim === 'attack' ? sheet.dirRow.right : sheet.dirRow.up;
      const frame = u.anim === 'attack' ? 1 : 0;
      const scale = 2;
      const w = sheet.fw * scale, hh = sheet.fh * scale;
      this.shadow(pxn, pyn + hh * 0.4);
      ctx.save();
      if (dead) ctx.globalAlpha = 0.35;
      if (now < u.flashUntil) ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(sheet.canvas, frame * sheet.fw, row * sheet.fh, sheet.fw, sheet.fh, Math.round(pxn - w / 2), Math.round(pyn - hh / 2), w, hh);
      ctx.restore();
      // active actor arrow
      if (u.id === s.activeId && (s.phase === 'select' || s.phase === 'target')) {
        ctx.fillStyle = '#ffe24a';
        const ay = pyn - hh / 2 - 10 + Math.sin(now / 200) * 2;
        ctx.beginPath();
        ctx.moveTo(pxn - 4, ay); ctx.lineTo(pxn + 4, ay); ctx.lineTo(pxn, ay + 5); ctx.fill();
      }
      this.popText(u, pxn, pyn - hh / 2 - 6);
    });

    this.vignette();
  }

  private battleBar(x: number, y: number, w: number, pct: number, color: string) {
    const ctx = this.bx;
    ctx.fillStyle = '#0b0b14';
    ctx.fillRect(x - 1, y - 1, w + 2, 5);
    ctx.fillStyle = '#2a0a0f';
    ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, w * pct), 3);
  }

  private popText(u: { popText: string | null; popKind: string }, x: number, y: number) {
    if (!u.popText) return;
    const ctx = this.bx;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const yo = y - (Math.sin(Math.min(1, (performance.now() % 850) / 850) * Math.PI) * 8);
    ctx.fillStyle = '#0b0b14';
    ctx.fillText(u.popText, x + 1, yo + 1);
    ctx.fillStyle = u.popKind === 'heal' ? '#7dff9b' : '#fff36b';
    ctx.fillText(u.popText, x, yo);
  }
}
