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
import { StoryIntroScene } from './scenes/StoryIntroScene';
import { MainMenuScene } from './scenes/MainMenu';
import { SettingsScene } from './scenes/SettingsScene';
import { AdTechTutorialScene } from './scenes/AdTechTutorialScene';
import { LevelIntroScene } from './scenes/LevelIntroScene';
import { World1_InventoryValley } from './scenes/World1_InventoryValley';
import { World2_TechStack } from './scenes/World2_TechStack';
import { World3_NativeNinja } from './scenes/World3_NativeNinja';
import { World3_VideoVolcano } from './scenes/World3_VideoVolcano';
import { World3_AudioAlps } from './scenes/World3_AudioAlps';
import { World3_RichMediaRainbow } from './scenes/World3_RichMediaRainbow';
import { World4_AuctionArena } from './scenes/World4_AuctionArena';
import { World5_PrivacyCitadel } from './scenes/World5_PrivacyCitadel';
import { World6_AttributionCastle } from './scenes/World6_AttributionCastle';
import { FinalWorld_WalledGarden } from './scenes/FinalWorld_WalledGarden';
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
    StoryIntroScene,
    MainMenuScene,
    SettingsScene,
    AdTechTutorialScene,
    LevelIntroScene,
    World1_InventoryValley,
    World2_TechStack,
    World3_NativeNinja,
    World3_VideoVolcano,
    World3_AudioAlps,
    World3_RichMediaRainbow,
    World4_AuctionArena,
    World5_PrivacyCitadel,
    World6_AttributionCastle,
    FinalWorld_WalledGarden,
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
