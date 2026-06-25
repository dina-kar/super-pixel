import { useEffect } from 'react';
import { startGameFromTitle } from '../state/gameStore';

export function TitleScreen() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGameFromTitle(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <button
      onClick={startGameFromTitle}
      className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-gradient-to-b from-black/80 via-black/40 to-black/90 font-mono"
    >
      <div className="mb-2 text-[10px] uppercase tracking-[0.6em] text-cyan-300/80">The Open Web</div>
      <h1 className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-400 bg-clip-text text-6xl font-black tracking-tight text-transparent drop-shadow-[0_0_30px_rgba(34,224,255,0.45)]">
        ASCENDANCY
      </h1>
      <div className="mt-3 text-xs tracking-widest text-white/60">A pixel RPG of the AdTech galaxy</div>

      <div className="mt-10 max-w-md px-6 text-center text-sm leading-relaxed text-cyan-100/80">
        You are <span className="text-white">Pixel</span>, a Blank Slate adrift in the Inventory Wastes.
        The last Cookie waits to teach you the forgotten art of Contextual Targeting.
      </div>

      <div className="mt-10 animate-pulse text-sm tracking-widest text-cyan-200">▶ PRESS ENTER TO AWAKEN</div>
      <div className="mt-6 text-[10px] tracking-wider text-white/40">WASD / Arrows · E interact · M menu</div>
    </button>
  );
}
