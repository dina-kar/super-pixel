/** Renders a procedurally-generated sprite canvas as a crisp pixel-art image. */
import { useMemo } from 'react';
import { getPortrait } from '../game/sprites';

export function Portrait({ sprite, size = 56 }: { sprite: string; size?: number }) {
  const url = useMemo(() => getPortrait(sprite).toDataURL(), [sprite]);
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt={sprite}
      style={{ imageRendering: 'pixelated' }}
      className="rounded border border-cyan-400/30 bg-black/40"
    />
  );
}
