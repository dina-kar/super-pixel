/** Dialogue box with typewriter reveal, speaker portrait, and branching choices. */

import { useEffect, useState } from 'react';
import { useGame, advanceDialogue, pickDialogueChoice, isDialogueOnChoices } from '../state/gameStore';
import { Portrait } from './Portrait';

export function DialogueBox() {
  const g = useGame();
  const d = g.dialogue;
  const line = d?.lines[d.index];
  const [shown, setShown] = useState(0);

  // typewriter
  useEffect(() => {
    setShown(0);
    if (!line) return;
    const id = window.setInterval(() => {
      setShown((s) => {
        if (s >= line.text.length) { window.clearInterval(id); return s; }
        return s + 1;
      });
    }, 18);
    return () => window.clearInterval(id);
  }, [line?.text]);

  const done = !!line && shown >= line.text.length;
  const onChoices = isDialogueOnChoices() && done;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!d) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (!done) { setShown(line?.text.length ?? 0); return; } // skip typewriter
        if (!onChoices) advanceDialogue();
      }
      if (onChoices && d.choices) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= d.choices.length) pickDialogueChoice(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d, done, onChoices, line]);

  if (!d || !line) return null;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex justify-center p-3 font-mono">
      <div className="w-full max-w-3xl rounded-lg border border-cyan-400/40 bg-[#070b14]/95 p-3 shadow-[0_0_30px_rgba(0,0,0,0.7)] backdrop-blur">
        <div className="flex gap-3">
          <div className="shrink-0">
            <Portrait sprite={line.portrait} size={64} />
            <div className="mt-1 text-center text-[10px] tracking-wide text-cyan-200">{line.speaker}</div>
          </div>
          <div className="flex-1">
            <p className="min-h-[3.5rem] text-sm leading-relaxed text-white/90">
              {line.text.slice(0, shown)}
              {!done && <span className="animate-pulse">▌</span>}
            </p>

            {onChoices && d.choices ? (
              <div className="mt-2 space-y-1">
                {d.choices.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => pickDialogueChoice(i)}
                    className="block w-full rounded border border-cyan-400/20 bg-black/40 px-3 py-1.5 text-left text-sm text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/15"
                  >
                    <span className="mr-2 text-cyan-400/70">{i + 1}.</span>{c.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-1 text-right text-[10px] tracking-widest text-cyan-300/60">
                {done ? '▼ SPACE' : '...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
