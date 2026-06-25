/** Pause menu: Status, Skills, Items (Budget Battery), and the Codex. */

import { useEffect } from 'react';
import { useGame, setMenuTab, closeMenu, useItemFromMenu, type MenuTab } from '../state/gameStore';
import { Portrait } from './Portrait';

const TABS: { id: MenuTab; label: string }[] = [
  { id: 'status', label: 'STATUS' },
  { id: 'skills', label: 'SKILLS' },
  { id: 'items', label: 'ITEMS' },
  { id: 'codex', label: 'CODEX' },
];

export function MenuOverlay() {
  const g = useGame();
  const tab = g.menuTab ?? 'status';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'm' || k === 'escape') { e.preventDefault(); closeMenu(); }
      if (k === 'arrowright' || k === 'arrowleft') {
        const i = TABS.findIndex((t) => t.id === tab);
        const ni = (i + (k === 'arrowright' ? 1 : TABS.length - 1)) % TABS.length;
        setMenuTab(TABS[ni].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 font-mono backdrop-blur-sm">
      <div className="flex h-[78%] w-full max-w-3xl flex-col rounded-lg border border-cyan-400/30 bg-[#070b14]/95 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        {/* tabs */}
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setMenuTab(t.id)}
                className={`rounded px-3 py-1 text-[11px] tracking-widest transition ${tab === t.id ? 'bg-cyan-400/20 text-cyan-200' : 'text-white/50 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={closeMenu} className="rounded px-2 py-1 text-[11px] tracking-widest text-white/50 hover:text-rose-300">CLOSE (M)</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'status' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {g.party.map((u) => (
                <div key={u.id} className="flex gap-3 rounded-md border border-white/10 bg-black/40 p-3">
                  <div className="text-center">
                    <Portrait sprite={u.spriteKey} size={56} />
                    <div className="mt-1 text-[10px] text-cyan-200">{u.name}</div>
                    <div className="text-[9px] text-white/40">Lv {u.level}</div>
                  </div>
                  <div className="flex-1 space-y-1 text-[11px]">
                    <Row k="Budget (HP)" v={`${u.hp}/${u.maxHp}`} />
                    <Row k="Bid (MP)" v={`${u.mp}/${u.maxMp}`} />
                    <Row k="Attack" v={u.atk} />
                    <Row k="Defense" v={u.def} />
                    <Row k="Speed" v={u.speed} />
                  </div>
                </div>
              ))}
              <div className="col-span-full text-center text-[11px] text-amber-200/80">Credits: ◈ {g.gold} · Party Lv {g.level} · XP {g.xp}/{g.xpNext}</div>
            </div>
          )}

          {tab === 'skills' && (
            <div className="space-y-4">
              {g.party.map((u) => (
                <div key={u.id}>
                  <div className="mb-1 text-[11px] tracking-widest text-cyan-300">{u.name}</div>
                  <div className="space-y-1">
                    {u.skills.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded border border-white/10 bg-black/40 px-3 py-1.5 text-[11px]">
                        <div>
                          <span className="text-white/90">{s.name}</span>
                          <span className="ml-2 text-white/40">{s.desc}</span>
                        </div>
                        <span className="ml-3 shrink-0 text-sky-300">{s.mpCost} MP</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'items' && (
            <div className="space-y-3">
              <div className="rounded border border-white/10 bg-black/40 p-3 text-[11px]">
                <div className="text-emerald-300">Budget Battery</div>
                <div className="text-white/50">Restores 60 Campaign Budget. Costs ◈ 20.</div>
              </div>
              <div className="text-[11px] text-white/60">Use on:</div>
              <div className="flex gap-2">
                {g.party.map((u) => (
                  <button
                    key={u.id}
                    disabled={g.gold < 20 || u.hp >= u.maxHp}
                    onClick={() => useItemFromMenu(u.id)}
                    className="rounded border border-emerald-400/30 bg-black/40 px-3 py-2 text-[11px] text-emerald-200 transition enabled:hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {u.name}<br /><span className="text-[9px] text-white/40">{u.hp}/{u.maxHp}</span>
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-amber-200/70">Credits: ◈ {g.gold}</div>
            </div>
          )}

          {tab === 'codex' && (
            <div className="space-y-2">
              {g.codex.map((c) => (
                <div key={c.title} className="rounded border border-white/10 bg-black/40 p-3">
                  <div className="text-[11px] tracking-wide text-cyan-300">{c.title}</div>
                  <div className="mt-0.5 text-[11px] leading-relaxed text-white/70">{c.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-0.5">
      <span className="text-white/50">{k}</span>
      <span className="tabular-nums text-white/90">{v}</span>
    </div>
  );
}
