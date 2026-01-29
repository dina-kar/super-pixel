/**
 * BootScene - Initial Boot & Configuration
 * 
 * First scene to load - handles:
 * - System configuration
 * - Loading screen initialization
 * - Transition to PreloadScene
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Minimal assets needed for loading screen
    // Most assets loaded in PreloadScene
  }

  create(): void {
    console.log('[BootScene] Booting Super Pixel: The AdTech Odyssey');
    
    // Configure game settings
    this.configureGame();
    
    // Update loading text
    this.updateLoadingText('Configuring ad servers...');
    
    // Brief delay before transitioning to preload
    this.time.delayedCall(500, () => {
      this.scene.start('PreloadScene');
    });
  }

  /**
   * Configure game-wide settings
   */
  private configureGame(): void {
    // Enable smooth pixel scaling
    this.game.canvas.style.imageRendering = 'pixelated';
    
    // Set up input configuration
    if (this.input.keyboard) {
      // Prevent browser scrolling on arrow keys
      this.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      ]);
    }
  }

  /**
   * Update loading screen text
   */
  private updateLoadingText(text: string): void {
    const loadingText = document.getElementById('loading-text');
    if (loadingText) {
      loadingText.textContent = text;
    }
  }
}
