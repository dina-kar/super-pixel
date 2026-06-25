/**
 * maps.ts - Act I: The Inventory Wastes. The map is generated programmatically
 * (guaranteed connectivity) then dressed with props, the mentor NPC, encounter
 * fields, a boss trigger and an exit portal.
 */

import { TILE_META, T_SOIL, T_SAND, T_CIRCUIT, T_WALL, T_STREAM } from './tiles';
import {
  startDialogue, startCombat, gainXp, addGold, setBanner, setLocation,
  type DialogueLine,
} from '../state/gameStore';

export interface NPC { id: string; x: number; y: number; sprite: string; name: string; dir?: 'down' | 'up' | 'left' | 'right'; onInteract: () => void }
export interface PropInst { type: string; x: number; y: number }
export interface Trigger { id: string; x: number; y: number; w: number; h: number; kind: 'boss' | 'exit'; done?: boolean }

export interface GameMap {
  w: number; h: number;
  ground: number[][];
  solid: boolean[][];
  encounter: boolean[][];
  props: PropInst[];
  npcs: NPC[];
  triggers: Trigger[];
  spawn: { x: number; y: number };
  name: string;
}

function line(speaker: string, portrait: string, text: string): DialogueLine {
  return { speaker, portrait, text };
}

export function buildInventoryWastes(): GameMap {
  const w = 44, h = 28;
  const ground: number[][] = [];
  for (let y = 0; y < h; y++) {
    ground[y] = [];
    for (let x = 0; x < w; x++) {
      const border = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      ground[y][x] = border ? T_WALL : T_SOIL;
    }
  }
  const set = (x: number, y: number, id: number) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 1) ground[y][x] = id; };
  const fill = (x0: number, y0: number, x1: number, y1: number, id: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, id);
  };
  const room = (x0: number, y0: number, x1: number, y1: number, door: [number, number]) => {
    for (let x = x0; x <= x1; x++) { set(x, y0, T_WALL); set(x, y1, T_WALL); }
    for (let y = y0; y <= y1; y++) { set(x0, y, T_WALL); set(x1, y, T_WALL); }
    set(door[0], door[1], T_SOIL);
  };

  // roads
  const roadX = 21;
  fill(2, 14, w - 3, 14, T_SAND);          // main horizontal road
  fill(roadX, 2, roadX, h - 3, T_SAND);    // vertical road (aligns with bridge)

  // circuit encounter field (north-centre)
  fill(17, 4, 27, 10, T_CIRCUIT);

  // data-stream band with a sand bridge over the vertical road
  fill(4, 18, w - 5, 19, T_STREAM);
  fill(roadX - 1, 18, roadX + 1, 19, T_SAND); // bridge

  // server structures (hollow rooms with a door)
  room(4, 3, 9, 8, [6, 8]);
  room(31, 4, 37, 10, [34, 10]);

  // rebuild solid / encounter from final ground
  const solid: boolean[][] = [];
  const encounter: boolean[][] = [];
  for (let y = 0; y < h; y++) {
    solid[y] = []; encounter[y] = [];
    for (let x = 0; x < w; x++) {
      const meta = TILE_META[ground[y][x]] ?? { solid: false, encounter: false };
      solid[y][x] = meta.solid;
      encounter[y][x] = meta.encounter;
    }
  }

  const props: PropInst[] = [
    { type: 'tower', x: 13, y: 3 }, { type: 'tower', x: 38, y: 13 }, { type: 'tower', x: 3, y: 24 },
    { type: 'tower', x: 40, y: 23 }, { type: 'crystal', x: 12, y: 22 }, { type: 'crystal', x: 28, y: 23 },
    { type: 'crystal', x: 24, y: 12 }, { type: 'terminal', x: 34, y: 9 }, { type: 'debris', x: 16, y: 16 },
    { type: 'debris', x: 30, y: 16 }, { type: 'crystal', x: 6, y: 6 },
  ];
  // mark solid props as solid tiles so the player can't walk through them
  for (const p of props) {
    if (p.type === 'tower' || p.type === 'crystal' || p.type === 'terminal') solid[p.y][p.x] = true;
  }

  const npcs: NPC[] = [
    {
      id: 'ob', x: 18, y: 14, sprite: 'ob3pc', name: 'O.B.-3PC', dir: 'down',
      onInteract: () => obDialogue(),
    },
  ];

  const triggers: Trigger[] = [
    { id: 'boss', x: roadX - 1, y: 23, w: 3, h: 2, kind: 'boss' },
    { id: 'exit', x: roadX - 1, y: h - 3, w: 3, h: 1, kind: 'exit' },
  ];
  // boss area kept open soil
  fill(roadX - 2, 22, roadX + 2, h - 2, T_SOIL);
  for (let y = 22; y < h - 1; y++) for (let x = roadX - 2; x <= roadX + 2; x++) { solid[y][x] = false; encounter[y][x] = false; }
  props.push({ type: 'portal', x: roadX, y: h - 3 });

  setLocation('The Inventory Wastes');

  return { w, h, ground, solid, encounter, props, npcs, triggers, spawn: { x: roadX, y: 3 }, name: 'The Inventory Wastes' };
}

let metMentor = false;

function obDialogue() {
  if (!metMentor) {
    metMentor = true;
    startDialogue([
      line('O.B.-3PC', 'ob3pc', 'So. The silicon dust spat out a Blank Slate. No identity, no history... and yet The Signal hums around you.'),
      line('O.B.-3PC', 'ob3pc', 'I am O.B.-3PC. The last of the Third-Party Cookies. The Empire is purging my kind, but I have one lesson left to give.'),
      line('O.B.-3PC', 'ob3pc', 'Out here in the Wastes there is no data to target. You must read the CONTENT of the world itself — Contextual Targeting.'),
      line('O.B.-3PC', 'ob3pc', 'The glowing circuit fields are raw ad inventory. Walk them and feral Spam Bots will swarm — but your contextual strikes hit harder there.'),
      line('O.B.-3PC', 'ob3pc', 'Will you take up the Covenant of Consent, and earn trust the honest way?'),
    ], [
      {
        label: 'I accept the Covenant.',
        onPick: () => {
          startDialogue([line('O.B.-3PC', 'ob3pc', 'Then the Open Web still has a champion. Take this — first-party trust, freely given.')]);
          gainXp(20); addGold(30);
          setBanner('+20 XP, +30 credits — First-Party Trust earned.');
          window.setTimeout(() => setBanner(null), 2600);
        },
      },
      {
        label: 'I take what I want.',
        onPick: () => {
          startDialogue([line('O.B.-3PC', 'ob3pc', 'Spoken like the Empire. Consent is not weakness, Pixel. Return when you understand that.')]);
        },
      },
    ]);
  } else {
    startDialogue([
      line('O.B.-3PC', 'ob3pc', 'Cross the data-stream to the south. The Neon Weaver guards the path to the Metropolis.'),
      line('O.B.-3PC', 'ob3pc', 'Grind the circuit fields first if your Campaign Budget feels thin.'),
    ]);
  }
}

export function triggerBoss() { startCombat(true); }

export function triggerExit() {
  startDialogue([
    line('Pixel', 'pixel', 'The portal hums with foreign Signal... the SSP & DSP Metropolis lies beyond.'),
    line('O.B.-3PC', 'ob3pc', "That is the edge of the Wastes. Act II awaits — but that is a tale for another build, Blank Slate."),
  ]);
}
