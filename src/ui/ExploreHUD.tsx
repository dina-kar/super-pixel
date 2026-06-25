/** Exploration HUD: location, party budget/MP, gold, level/XP, controls hint.
 *  (The minimap is drawn inside the game canvas, top-right.) */

import { useGame, openMenu } from '../state/gameStore';

function StatBar({ label, value, max, from, to }: { label: string; value: number; max: number; from: string; to: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-1.5 text-[9px]">
      <span className="w-4 text-white/50">{label}</span>
      <div className="h-1.5 w-24 overflow-hidden rounded-sm border border-white/10 bg-black/60">
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
      </div>
      <span className="w-12 text-right tabular-nums text-white/70">{value}/{max}</span>
    </div>
  );
}

export function ExploreHUD() {
  const g = useGame();
  return (
    <div className="pointer-events-none absolute inset-0 select-none font-mono text-white/90">
      {/* location */}
      <div className="absolute left-3 top-3 rounded-md border border-cyan-400/30 bg-black/65 px-3 py-1.5 backdrop-blur">
        <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-300/70">Now Entering</div>
        <div className="text-sm tracking-wide text-cyan-100">{g.location}</div>
      </div>

      {/* party status */}
      <div className="absolute bottom-3 left-3 space-y-2">
        {g.party.map((u) => (
          <div key={u.id} className="rounded-md border border-white/10 bg-black/65 px-2.5 py-1.5 backdrop-blur">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-xs text-white">{u.name}</span>
              <span className="text-[9px] text-white/40">Lv {u.level}</span>
            </div>
            <StatBar label="HP" value={u.hp} max={u.maxHp} from="#1fd17a" to="#22e0ff" />
            <StatBar label="MP" value={u.mp} max={u.maxMp} from="#3b82f6" to="#a855f7" />
          </div>
        ))}
      </div>

      {/* progression + menu */}
      <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
        <div className="rounded-md border border-amber-300/30 bg-black/65 px-3 py-1.5 text-right backdrop-blur">
          <div className="text-[9px] uppercase tracking-wider text-amber-300/70">Credits</div>
          <div className="text-sm tabular-nums text-amber-200">◈ {g.gold}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-black/65 px-3 py-1.5 text-right backdrop-blur">
          <div className="text-[9px] uppercase tracking-wider text-white/50">Party Lv {g.level}</div>
          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-sm border border-white/10 bg-black/60">
            <div className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-300" style={{ width: `${(g.xp / g.xpNext) * 100}%` }} />
          </div>
          <div className="mt-0.5 text-[8px] tabular-nums text-white/40">XP {g.xp}/{g.xpNext}</div>
        </div>
        <button onClick={() => openMenu('status')} className="pointer-events-auto rounded border border-cyan-400/30 bg-black/65 px-3 py-1 text-[10px] tracking-widest text-cyan-200 transition hover:bg-cyan-400/15">
          MENU (M)
        </button>
      </div>
    </div>
  );
}
