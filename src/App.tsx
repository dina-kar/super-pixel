/**
 * App - root of "The Open Web: Ascendancy" (2D pixel RPG).
 * Hosts the pixel-perfect game canvas (driven by the Game engine) and overlays
 * the React HUD: title, exploration HUD, dialogue, menu, and battle UI.
 */

import { useEffect, useRef } from 'react';
import { Game } from './engine/Game';
import { useGame } from './state/gameStore';
import { TitleScreen } from './ui/TitleScreen';
import { ExploreHUD } from './ui/ExploreHUD';
import { DialogueBox } from './ui/DialogueBox';
import { MenuOverlay } from './ui/MenuOverlay';
import { BattleUI } from './ui/BattleUI';
import { Banner } from './ui/Banner';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useGame();

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Game(canvasRef.current);
    engine.start();
    return () => engine.stop();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      {game.mode === 'title' && <TitleScreen />}
      {game.mode === 'explore' && <ExploreHUD />}
      {game.mode === 'combat' && <BattleUI />}

      {game.dialogue && <DialogueBox />}
      {game.menuTab && <MenuOverlay />}
      {game.banner && game.mode !== 'title' && <Banner text={game.banner} />}
    </div>
  );
}
