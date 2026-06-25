/**
 * input.ts - keyboard state for the overworld engine. Movement + interact +
 * menu are polled by the engine each frame. Modal UI (dialogue, menu, battle)
 * is handled separately in React, so this only needs held-state + edge presses.
 */

const MOVE_KEYS = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd']);
const GAME_KEYS = new Set([...MOVE_KEYS, ' ', 'e', 'enter', 'm']);

export class Input {
  private down = new Set<string>();
  private justPressedSet = new Set<string>();

  attach() {
    window.addEventListener('keydown', this.onDown);
    window.addEventListener('keyup', this.onUp);
  }
  detach() {
    window.removeEventListener('keydown', this.onDown);
    window.removeEventListener('keyup', this.onUp);
  }

  private onDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (GAME_KEYS.has(k)) e.preventDefault();
    if (!e.repeat && GAME_KEYS.has(k)) this.justPressedSet.add(k);
    this.down.add(k);
  };
  private onUp = (e: KeyboardEvent) => {
    this.down.delete(e.key.toLowerCase());
  };

  dir(): { dx: number; dy: number } {
    let dx = 0, dy = 0;
    if (this.down.has('arrowleft') || this.down.has('a')) dx -= 1;
    if (this.down.has('arrowright') || this.down.has('d')) dx += 1;
    if (this.down.has('arrowup') || this.down.has('w')) dy -= 1;
    if (this.down.has('arrowdown') || this.down.has('s')) dy += 1;
    return { dx, dy };
  }

  pressedInteract() { return this.justPressedSet.has('e') || this.justPressedSet.has(' ') || this.justPressedSet.has('enter'); }
  pressedMenu() { return this.justPressedSet.has('m'); }

  /** Clear edge presses; call at end of each engine frame. */
  endFrame() { this.justPressedSet.clear(); }
}
