/**
 * Super Pixel: The AdTech Odyssey
 * Main Game Entry Point
 * 
 * This file initializes the Phaser game engine with proper configuration
 * for the AdTech educational platformer.
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/Boot';
import { PreloadScene } from './scenes/Preload';
import { MainMenuScene } from './scenes/MainMenu';
import { LevelIntroScene } from './scenes/LevelIntroScene';
import { World1_InventoryValley } from './scenes/World1_InventoryValley';
import { GameState } from './components/GameState';

// Initialize global game state singleton
export const gameState = new GameState();

/**
 * Phaser Game Configuration
 * Resolution: 1280x720 (16:9), responsive scaling
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-canvas',
  width: 1280,
  height: 720,
  backgroundColor: '#0a0a0f',
  pixelArt: true,
  roundPixels: true,
  
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1000 },
      debug: false, // Toggle with F1 in-game
      tileBias: 16,
    },
  },
  
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 640,
      height: 360,
    },
    max: {
      width: 1920,
      height: 1080,
    },
  },
  
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
  
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    LevelIntroScene,
    World1_InventoryValley,
  ],
};

// Create and export the game instance
const game = new Phaser.Game(config);

// Handle window resize for responsive scaling
window.addEventListener('resize', () => {
  game.scale.refresh();
});

// Export for potential hot module replacement
export default game;
