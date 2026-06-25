/** Turn-based battle UI: turn/wave, enemy bars, command menu, target select,
 *  party panels, combat log, and victory/defeat screens. The 3D-less battle
 *  sprites are drawn by the engine on the canvas; this is the HUD on top. */

import { useEffect, useState } from 'react';
import {
  useGame, chooseAttack, chooseSkill, chooseDefend, cancelTarget, combatUseItem, flee,
  selectTarget, validTargets, returnToExplore, reviveAndRetry, type Skill,
} from '../state/gameStore';

function Bar({ value, max, from, to }: { value: number; max: number; from: string; to: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-sm border border-white/10 bg-black/60">
      <div className="h-full rounded-sm transition-all duration-300" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
    </div>
  );
}

export function BattleUI() {
  const g = useGame();
  const [menu, setMenu] = useState<'root' | 'skill'>('root');
  const actor = g.party.find((u) => u.id === g.activeId) ?? null;
  const isPlayerTurn = !!actor && (g.phase === 'select' || g.phase === 'target');

  useEffect(() => { setMenu('root'); }, [g.activeId, g.phase === 'select']);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none font-mono text-white/90">
      {/* turn / wave */}
      <div className="absolute left-3 top-3 rounded bg-black/55 px-3 py-1.5 text-xs tracking-widest backdrop-blur border border-white/10">
        <span className="text-cyan-300">TURN {g.turn}</span>
        <span className="mx-2 text-white/30">/</span>
        <span className="text-fuchsia-300">WAVE {g.wave}</span>
      </div>

      {/* enemies list */}
      <div className="absolute right-3 top-3 w-52 space-y-1">
        {g.enemies.filter((e) => e.hp > 0).map((e) => (
          <div key={e.id} className="rounded bg-black/55 px-2.5 py-1 backdrop-blur border border-rose-500/30">
            <div className="mb-0.5 flex items-center justify-between text-[10px] tracking-widest">
              <span className="text-rose-300">{e.name.toUpperCase()}</span>
              <span className="text-white/40">Lv {e.level}</span>
            </div>
            <Bar value={e.hp} max={e.maxHp} from="#ff2b4d" to="#ff7a3a" />
          </div>
        ))}
      </div>

      {/* log */}
      <div className="absolute left-1/2 top-3 w-[40%] -translate-x-1/2 text-center text-[11px] leading-tight text-white/70">
        {g.log.slice(-2).map((l, i) => <div key={i} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{l}</div>)}
      </div>

      {/* contextual lesson hint */}
      {g.contextHint && (g.phase === 'intro' || g.phase === 'victory') && (
        <div className="absolute left-1/2 top-1/4 w-[58%] -translate-x-1/2 rounded-lg border border-cyan-400/30 bg-black/70 px-4 py-3 text-center text-sm text-cyan-200 backdrop-blur">
          {g.contextHint}
        </div>
      )}

      {/* command menu */}
      {isPlayerTurn && actor && (
        <div className="pointer-events-auto absolute bottom-3 left-3 w-48 rounded-lg border border-cyan-400/30 bg-black/80 p-2 backdrop-blur">
          <div className="mb-1 px-1 text-[11px] text-cyan-300">{actor.name}</div>
          {g.phase === 'target' ? (
            <div className="space-y-1">
              <div className="px-1 text-[10px] text-yellow-200">▶ Choose target</div>
              {validTargets().map((t) => (
                <Item key={t.id} label={t.name} hint={`${t.hp}/${t.maxHp}`} onClick={() => selectTarget(t.id)} />
              ))}
              <Item label="◀ Cancel" onClick={cancelTarget} />
            </div>
          ) : menu === 'skill' ? (
            <div className="space-y-0.5">
              {actor.skills.map((s) => (
                <SkillItem key={s.id} skill={s} disabled={actor.mp < s.mpCost} onClick={() => chooseSkill(s)} />
              ))}
              <Item label="◀ Back" onClick={() => setMenu('root')} />
            </div>
          ) : (
            <div className="space-y-0.5">
              <Item label="ATTACK" onClick={chooseAttack} />
              <Item label="SKILL" onClick={() => setMenu('skill')} />
              <Item label="ITEM" hint="Battery" onClick={combatUseItem} />
              <Item label="DEFEND" onClick={chooseDefend} />
              <Item label="ESCAPE" onClick={flee} />
            </div>
          )}
        </div>
      )}

      {/* party panels */}
      <div className="absolute bottom-3 right-3 grid w-[300px] grid-cols-2 gap-2">
        {g.party.map((u) => {
          const active = u.id === g.activeId && isPlayerTurn;
          return (
            <div key={u.id} className={`rounded-md border bg-black/75 px-2.5 py-1.5 backdrop-blur transition ${active ? 'border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.45)]' : 'border-white/10'} ${u.hp <= 0 ? 'opacity-40' : ''}`}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-white/90">{u.name}</span>
                <span className="text-[9px] text-white/40">Lv {u.level}</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-emerald-300">
                <span className="w-4">HP</span><Bar value={u.hp} max={u.maxHp} from="#1fd17a" to="#22e0ff" />
                <span className="w-12 text-right tabular-nums text-white/70">{u.hp}/{u.maxHp}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[9px] text-sky-300">
                <span className="w-4">MP</span><Bar value={u.mp} max={u.maxMp} from="#3b82f6" to="#a855f7" />
                <span className="w-12 text-right tabular-nums text-white/70">{u.mp}/{u.maxMp}</span>
              </div>
            </div>
          );
        })}
      </div>

      {g.phase === 'victory' && (
        <Overlay title="AUCTION WON" tint="text-cyan-300">
          <button className="menu-cta" onClick={() => returnToExplore(true)}>Continue ▶</button>
        </Overlay>
      )}
      {g.phase === 'defeat' && (
        <Overlay title="BUDGET DEPLETED" tint="text-rose-400">
          <button className="menu-cta" onClick={reviveAndRetry}>Recover &amp; Retry ▶</button>
        </Overlay>
      )}
    </div>
  );
}

function Item({ label, onClick, hint }: { label: string; onClick: () => void; hint?: string }) {
  return (
    <button onClick={onClick} className="group flex w-full items-center justify-between rounded px-2 py-1 text-left text-[12px] text-white/85 transition hover:bg-cyan-400/15 hover:text-cyan-200">
      <span className="flex items-center gap-1"><span className="opacity-0 group-hover:opacity-100">▶</span>{label}</span>
      {hint && <span className="text-[8px] text-white/35">{hint}</span>}
    </button>
  );
}

function SkillItem({ skill, disabled, onClick }: { skill: Skill; disabled: boolean; onClick: () => void }) {
  return (
    <button disabled={disabled} onClick={onClick} title={skill.desc}
      className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[12px] transition ${disabled ? 'cursor-not-allowed text-white/25' : 'text-white/85 hover:bg-cyan-400/15 hover:text-cyan-200'}`}>
      <span>{skill.name}</span><span className="text-[9px] text-sky-300">{skill.mpCost} MP</span>
    </button>
  );
}

function Overlay({ title, tint, children }: { title: string; tint: string; children: React.ReactNode }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`mb-4 text-4xl font-black tracking-[0.3em] ${tint} drop-shadow-[0_0_18px_rgba(0,0,0,0.8)]`}>{title}</div>
      {children}
    </div>
  );
}
