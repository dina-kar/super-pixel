/**
 * gameStore - single source of truth shared between the canvas game engine and
 * the React HUD. A tiny external store (subscribe + getSnapshot) consumed via
 * `useGame()`. The engine mutates fast per-frame data (player pixel position,
 * camera) internally; only UI-relevant state lives here so React re-renders
 * stay infrequent.
 */

import { useSyncExternalStore } from 'react';

export type AnimState = 'idle' | 'walk' | 'attack' | 'hit' | 'dead';
export type Mode = 'title' | 'explore' | 'combat';
export type CombatPhase = 'intro' | 'select' | 'target' | 'animating' | 'enemy' | 'victory' | 'defeat';

export interface Skill {
  id: string;
  name: string;
  mpCost: number;
  power: number;
  kind: 'attack' | 'heal';
  desc: string;
}

export interface Unit {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  speed: number;
  spriteKey: string;
  isEnemy: boolean;
  skills: Skill[];
  anim: AnimState;
  flashUntil: number;
  popText: string | null;
  popKind: 'dmg' | 'heal' | 'miss';
  defending: boolean;
  xpReward?: number;
}

export interface DialogueLine {
  speaker: string;
  portrait: string;
  text: string;
}

export interface DialogueChoice {
  label: string;
  onPick: () => void;
}

export interface Dialogue {
  lines: DialogueLine[];
  index: number;
  choices?: DialogueChoice[];
}

export interface PendingAction {
  type: 'attack' | 'skill';
  skill?: Skill;
}

export type MenuTab = 'status' | 'skills' | 'items' | 'codex';

export interface CodexEntry { title: string; body: string }

export interface GameSnapshot {
  mode: Mode;
  party: Unit[];
  enemies: Unit[];
  // combat
  turnOrder: string[];
  turnIndex: number;
  turn: number;
  wave: number;
  phase: CombatPhase;
  activeId: string | null;
  pending: PendingAction | null;
  log: string[];
  // progression
  gold: number;
  xp: number;
  xpNext: number;
  level: number;
  location: string;
  // overlays
  dialogue: Dialogue | null;
  menuTab: MenuTab | null;
  banner: string | null;
  contextHint: string | null;
  codex: CodexEntry[];
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const PIXEL_SKILLS: Skill[] = [
  { id: 'text-strike', name: 'Text Strike', mpCost: 0, power: 16, kind: 'attack', desc: 'Basic contextual jab. No cost.' },
  { id: 'display-cleave', name: 'Display Cleave', mpCost: 8, power: 30, kind: 'attack', desc: 'Neon banner slash. Heavy damage.' },
  { id: 'video-summon', name: 'Video Summon', mpCost: 20, power: 52, kind: 'attack', desc: 'High-cost rich-media barrage.' },
];

const OB_SKILLS: Skill[] = [
  { id: 'context-read', name: 'Contextual Resonance', mpCost: 6, power: 22, kind: 'attack', desc: 'Reads page content to strike a weakness.' },
  { id: 'refresh', name: 'Cache Refresh', mpCost: 10, power: 34, kind: 'heal', desc: "Restores an ally's Campaign Budget." },
];

function makeUnit(p: Partial<Unit> & Pick<Unit, 'id' | 'name' | 'maxHp' | 'maxMp' | 'atk' | 'def' | 'speed' | 'spriteKey' | 'isEnemy'>): Unit {
  return {
    level: 1,
    hp: p.maxHp,
    mp: p.maxMp,
    skills: [],
    anim: 'idle',
    flashUntil: 0,
    popText: null,
    popKind: 'dmg',
    defending: false,
    ...p,
  };
}

function freshParty(): Unit[] {
  return [
    makeUnit({ id: 'pixel', name: 'Pixel', level: 1, maxHp: 120, maxMp: 40, atk: 22, def: 10, speed: 14, spriteKey: 'pixel', isEnemy: false, skills: PIXEL_SKILLS }),
    makeUnit({ id: 'ob3pc', name: 'O.B.-3PC', level: 3, maxHp: 90, maxMp: 60, atk: 16, def: 12, speed: 10, spriteKey: 'ob3pc', isEnemy: false, skills: OB_SKILLS }),
  ];
}

const CODEX: CodexEntry[] = [
  { title: 'Contextual Targeting', body: 'Reading the content of a page (its context) to serve relevant ads — no personal identity required. Pixel\'s core strength in the Wastes.' },
  { title: 'The Signal', body: 'User intent and data. He who controls The Signal controls the galaxy\'s commerce.' },
  { title: 'Third-Party Cookies', body: 'Ancient magic of free travel across the Open Web, now decaying under the Empire\'s privacy edicts.' },
  { title: 'Campaign Budget (HP)', body: 'Your lifeforce in the Auction. Runs out, and your campaign ends.' },
  { title: 'Bid Strategy (MP)', body: 'Powers your creative skills. Spend wisely to win impressions at the lowest cost.' },
];

// ---------------------------------------------------------------------------
// Store internals
// ---------------------------------------------------------------------------

let state: GameSnapshot = {
  mode: 'title',
  party: freshParty(),
  enemies: [],
  turnOrder: [],
  turnIndex: 0,
  turn: 0,
  wave: 0,
  phase: 'intro',
  activeId: null,
  pending: null,
  log: [],
  gold: 0,
  xp: 0,
  xpNext: 30,
  level: 1,
  location: 'The Inventory Wastes',
  dialogue: null,
  menuTab: null,
  banner: null,
  contextHint: null,
  codex: CODEX,
};

const listeners = new Set<() => void>();
function emit() {
  state = { ...state };
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return state;
}
export function useGame(): GameSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
/** Read current state without subscribing (for the engine). */
export function getState() {
  return state;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOTAL_WAVES = 2;

function allUnits() { return [...state.party, ...state.enemies]; }
function unitById(id: string | null): Unit | undefined { return id ? allUnits().find((u) => u.id === id) : undefined; }
function aliveEnemies() { return state.enemies.filter((u) => u.hp > 0); }
function aliveParty() { return state.party.filter((u) => u.hp > 0); }
function pushLog(line: string) { state.log = [...state.log, line].slice(-6); }

function buildTurnOrder() {
  state.turnOrder = allUnits().filter((u) => u.hp > 0).sort((a, b) => b.speed - a.speed).map((u) => u.id);
  state.turnIndex = 0;
}

function setAnim(id: string, anim: AnimState, ms = 0) {
  const u = unitById(id);
  if (!u) return;
  u.anim = anim;
  if (ms > 0) {
    window.setTimeout(() => {
      const cur = unitById(id);
      if (cur && cur.hp > 0 && cur.anim === anim) cur.anim = 'idle';
      emit();
    }, ms);
  }
}

function popFor(target: Unit, text: string, kind: Unit['popKind']) {
  target.popText = text;
  target.popKind = kind;
  window.setTimeout(() => {
    const cur = unitById(target.id);
    if (cur && cur.popText === text) cur.popText = null;
    emit();
  }, 850);
}

function damage(target: Unit, amount: number) {
  const dealt = Math.max(1, Math.round(amount * (target.defending ? 0.5 : 1)));
  target.hp = Math.max(0, target.hp - dealt);
  target.flashUntil = performance.now() + 240;
  popFor(target, `${dealt}`, 'dmg');
  target.anim = target.hp <= 0 ? 'dead' : 'hit';
  if (target.hp > 0) {
    window.setTimeout(() => {
      const cur = unitById(target.id);
      if (cur && cur.hp > 0 && cur.anim === 'hit') cur.anim = 'idle';
      emit();
    }, 300);
  }
  return dealt;
}

function healUnit(target: Unit, amount: number) {
  const healed = Math.min(target.maxHp - target.hp, amount);
  target.hp += healed;
  popFor(target, `+${healed}`, 'heal');
  return healed;
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

export function gainXp(amount: number) {
  state.xp += amount;
  while (state.xp >= state.xpNext) {
    state.xp -= state.xpNext;
    state.level += 1;
    state.xpNext = Math.round(state.xpNext * 1.6);
    state.party.forEach((u) => {
      u.level += 1;
      u.maxHp += 14;
      u.maxMp += 5;
      u.atk += 3;
      u.def += 2;
      u.hp = u.maxHp;
      u.mp = u.maxMp;
    });
    pushLog(`LEVEL UP! The party reaches Lv ${state.level}.`);
  }
}

export function addGold(n: number) { state.gold += n; emit(); }

// ---------------------------------------------------------------------------
// Title / banners
// ---------------------------------------------------------------------------

export function startGameFromTitle() {
  state.mode = 'explore';
  state.banner = null;
  state.contextHint = 'WASD / Arrows to move • E or Space to interact • M for menu';
  emit();
}
export function setBanner(text: string | null) { state.banner = text; emit(); }
export function setLocation(name: string) { if (state.location !== name) { state.location = name; emit(); } }

// ---------------------------------------------------------------------------
// Dialogue
// ---------------------------------------------------------------------------

export function startDialogue(lines: DialogueLine[], choices?: DialogueChoice[]) {
  state.dialogue = { lines, index: 0, choices };
  emit();
}
export function advanceDialogue() {
  const d = state.dialogue;
  if (!d) return;
  if (d.index < d.lines.length - 1) {
    d.index += 1;
    emit();
  } else if (!d.choices) {
    state.dialogue = null;
    emit();
  }
  // if on last line with choices, wait for choice
}
export function pickDialogueChoice(i: number) {
  const d = state.dialogue;
  if (!d || !d.choices) return;
  const choice = d.choices[i];
  state.dialogue = null;
  emit();
  choice?.onPick();
}
export function isDialogueOnChoices(): boolean {
  const d = state.dialogue;
  return !!d && !!d.choices && d.index >= d.lines.length - 1;
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export function openMenu(tab: MenuTab = 'status') { state.menuTab = tab; emit(); }
export function setMenuTab(tab: MenuTab) { state.menuTab = tab; emit(); }
export function closeMenu() { state.menuTab = null; emit(); }
export function useItemFromMenu(targetId: string) {
  const u = unitById(targetId);
  if (!u) return;
  if (state.gold < 20) { pushLog('Not enough credits for a Budget Battery.'); emit(); return; }
  state.gold -= 20;
  healUnit(u, 60);
  emit();
}

// ---------------------------------------------------------------------------
// Combat
// ---------------------------------------------------------------------------

function spawnWave(wave: number, boss: boolean): Unit[] {
  if (boss) {
    return [
      makeUnit({ id: `weaver`, name: 'Neon Weaver', level: 5, maxHp: 160, maxMp: 30, atk: 18, def: 8, speed: 12, spriteKey: 'weaver', isEnemy: true, skills: [], xpReward: 40 }),
      makeUnit({ id: `spam-b`, name: 'Spam Bot', level: 3, maxHp: 55, maxMp: 10, atk: 12, def: 5, speed: 9, spriteKey: 'spambot', isEnemy: true, skills: [], xpReward: 10 }),
    ];
  }
  const count = 1 + (wave % 2) + Math.floor(Math.random() * 2);
  const out: Unit[] = [];
  for (let i = 0; i < count; i++) {
    out.push(makeUnit({ id: `spam-${wave}-${i}`, name: 'Spam Bot', level: 2, maxHp: 48, maxMp: 10, atk: 11, def: 4, speed: 8 + i, spriteKey: 'spambot', isEnemy: true, skills: [], xpReward: 8 }));
  }
  return out;
}

let combatIsBoss = false;

export function startCombat(boss = false) {
  combatIsBoss = boss;
  state.mode = 'combat';
  state.wave = 1;
  state.turn = 1;
  state.enemies = spawnWave(1, boss);
  state.party.forEach((u) => { u.anim = 'idle'; u.defending = false; u.popText = null; });
  state.phase = 'intro';
  state.log = [boss ? 'A massive signal spikes — the Neon Weaver descends!' : 'Feral Spam Bots swarm out of the silicon dust!'];
  state.contextHint = "CONTEXTUAL ADVANTAGE: pure ad inventory here — Pixel's strikes hit harder.";
  buildTurnOrder();
  emit();
  window.setTimeout(beginTurn, 1000);
}

function beginTurn() {
  let guard = 0;
  while (guard++ < 64) {
    if (state.turnIndex >= state.turnOrder.length) {
      state.turn += 1;
      allUnits().forEach((u) => (u.defending = false));
      buildTurnOrder();
    }
    const u = unitById(state.turnOrder[state.turnIndex]);
    if (u && u.hp > 0) break;
    state.turnIndex += 1;
  }
  if (checkEnd()) return;
  state.activeId = state.turnOrder[state.turnIndex];
  const actor = unitById(state.activeId);
  if (!actor) return;
  if (actor.isEnemy) {
    state.phase = 'enemy';
    emit();
    window.setTimeout(() => enemyAct(actor), 600);
  } else {
    state.phase = 'select';
    state.pending = null;
    emit();
  }
}

function endTurn() {
  state.turnIndex += 1;
  state.pending = null;
  if (checkEnd()) return;
  state.phase = 'animating';
  emit();
  window.setTimeout(beginTurn, 420);
}

function checkEnd(): boolean {
  if (aliveParty().length === 0) {
    state.phase = 'defeat';
    state.activeId = null;
    pushLog("Pixel's Campaign Budget is depleted...");
    emit();
    return true;
  }
  if (aliveEnemies().length === 0) {
    if (!combatIsBoss && state.wave < TOTAL_WAVES) {
      state.wave += 1;
      state.enemies = spawnWave(state.wave, false);
      pushLog(`Wave ${state.wave}! More inventory floods the auction.`);
      buildTurnOrder();
      state.phase = 'animating';
      emit();
      window.setTimeout(beginTurn, 850);
      return true;
    }
    state.phase = 'victory';
    state.activeId = null;
    const xp = combatIsBoss ? 50 : 24;
    const gold = combatIsBoss ? 60 : 18 + Math.floor(Math.random() * 10);
    pushLog(`Auction won! +${xp} XP, +${gold} credits.`);
    gainXp(xp);
    state.gold += gold;
    emit();
    return true;
  }
  return false;
}

export function chooseAttack() { state.pending = { type: 'attack' }; state.phase = 'target'; emit(); }
export function chooseSkill(skill: Skill) {
  const actor = unitById(state.activeId);
  if (!actor || actor.mp < skill.mpCost) return;
  state.pending = { type: 'skill', skill };
  state.phase = 'target';
  emit();
}
export function cancelTarget() { state.pending = null; state.phase = 'select'; emit(); }
export function chooseDefend() {
  const actor = unitById(state.activeId);
  if (!actor) return;
  actor.defending = true;
  pushLog(`${actor.name} braces (Defend). Incoming damage halved.`);
  emit();
  endTurn();
}
export function validTargets(): Unit[] {
  if (!state.pending) return [];
  if (state.pending.type === 'skill' && state.pending.skill?.kind === 'heal') return aliveParty();
  return aliveEnemies();
}
export function selectTarget(targetId: string) {
  const actor = unitById(state.activeId);
  const target = unitById(targetId);
  const pending = state.pending;
  if (!actor || !target || !pending) return;
  state.phase = 'animating';
  setAnim(actor.id, 'attack', 360);
  if (pending.type === 'skill' && pending.skill) {
    actor.mp = Math.max(0, actor.mp - pending.skill.mpCost);
    if (pending.skill.kind === 'heal') {
      pushLog(`${actor.name} casts ${pending.skill.name}.`);
      window.setTimeout(() => { const h = healUnit(target, pending.skill!.power + actor.atk); pushLog(`${target.name} recovers ${h} budget.`); emit(); endTurn(); }, 320);
      state.pending = null; emit(); return;
    }
    pushLog(`${actor.name} unleashes ${pending.skill.name}!`);
    window.setTimeout(() => { const d = damage(target, pending.skill!.power + Math.round(actor.atk * 0.5) - target.def); pushLog(`${target.name} takes ${d} damage.`); emit(); endTurn(); }, 320);
  } else {
    pushLog(`${actor.name} attacks ${target.name}.`);
    window.setTimeout(() => { const d = damage(target, actor.atk - target.def + Math.round(Math.random() * 5)); pushLog(`${target.name} takes ${d} damage.`); emit(); endTurn(); }, 320);
  }
  state.pending = null;
  emit();
}
export function combatUseItem() {
  const actor = unitById(state.activeId);
  if (!actor || actor.isEnemy) return;
  pushLog(`${actor.name} drains a Budget Battery.`);
  healUnit(actor, 70);
  emit();
  endTurn();
}
export function flee() {
  if (combatIsBoss) { pushLog('There is no escape from the Weaver!'); emit(); return; }
  if (Math.random() < 0.6) { pushLog('Pixel disengages from the auction.'); returnToExplore(false); }
  else { pushLog('Escape failed!'); emit(); endTurn(); }
}
function enemyAct(actor: Unit) {
  const targets = aliveParty();
  if (targets.length === 0) { checkEnd(); return; }
  const target = targets[Math.floor(Math.random() * targets.length)];
  setAnim(actor.id, 'attack', 360);
  pushLog(`${actor.name} lunges at ${target.name}.`);
  emit();
  window.setTimeout(() => { const d = damage(target, actor.atk - target.def + Math.round(Math.random() * 3)); pushLog(`${target.name} loses ${d} budget.`); emit(); endTurn(); }, 340);
}

/** Called by the victory/defeat buttons. */
export function returnToExplore(restoreOnly: boolean) {
  state.mode = 'explore';
  state.enemies = [];
  state.phase = 'intro';
  state.activeId = null;
  state.pending = null;
  if (restoreOnly) {
    state.party.forEach((u) => { u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.3)); u.defending = false; u.anim = 'idle'; u.popText = null; });
  } else {
    state.party.forEach((u) => { u.defending = false; u.anim = 'idle'; u.popText = null; });
  }
  emit();
}

export function reviveAndRetry() {
  state.party.forEach((u) => { u.hp = u.maxHp; u.mp = u.maxMp; u.anim = 'idle'; u.defending = false; u.popText = null; });
  returnToExplore(false);
}
