/**
 * PreloadScene - Asset Loading
 * 
 * Loads all game assets with progress tracking:
 * - Sprites and spritesheets
 * - Tilemaps and tilesets
 * - Audio files
 * - JSON data
 */

import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  private loadingBar: HTMLElement | null = null;
  private loadingText: HTMLElement | null = null;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  init(): void {
    // Get loading UI elements
    this.loadingBar = document.getElementById('loading-bar');
    this.loadingText = document.getElementById('loading-text');
  }

  preload(): void {
    console.log('[PreloadScene] Loading assets...');
    
    // Set up loading progress handler
    this.load.on('progress', this.onProgress, this);
    this.load.on('fileprogress', this.onFileProgress, this);
    this.load.on('complete', this.onComplete, this);
    
    // Generate placeholder sprites programmatically
    this.createPlaceholderAssets();
    
    // Load any actual assets here when available
    // this.load.image('tileset', 'assets/tilemaps/tileset.png');
    // this.load.tilemapTiledJSON('world1', 'assets/tilemaps/world1.json');
  }

  /**
   * Create placeholder graphics for development
   * These will be replaced with real assets later
   */
  private createPlaceholderAssets(): void {
    this.updateLoadingText('Generating placeholder sprites...');
    
    // Player placeholder (32x32 white square with glow effect)
    const playerGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Small form (text ad)
    playerGraphics.fillStyle(0xffffff, 1);
    playerGraphics.fillRect(0, 0, 24, 24);
    playerGraphics.generateTexture('player-small', 24, 24);
    
    // Big form (image ad)
    playerGraphics.clear();
    playerGraphics.fillStyle(0x00ff88, 1);
    playerGraphics.fillRect(0, 0, 32, 32);
    playerGraphics.generateTexture('player-big', 32, 32);
    
    // Powered form (video ad)
    playerGraphics.clear();
    playerGraphics.fillStyle(0xff00ff, 1);
    playerGraphics.fillRect(0, 0, 40, 40);
    playerGraphics.lineStyle(2, 0x00ffff, 1);
    playerGraphics.strokeRect(0, 0, 40, 40);
    playerGraphics.generateTexture('player-powered', 40, 40);
    
    playerGraphics.destroy();
    
    // Ground/Platform tiles
    const tileGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Standard ground tile
    tileGraphics.fillStyle(0x4a5568, 1);
    tileGraphics.fillRect(0, 0, 32, 32);
    tileGraphics.lineStyle(1, 0x2d3748, 1);
    tileGraphics.strokeRect(0, 0, 32, 32);
    tileGraphics.generateTexture('tile-ground', 32, 32);
    
    // Premium inventory block (gold)
    tileGraphics.clear();
    tileGraphics.fillStyle(0xffd700, 1);
    tileGraphics.fillRect(0, 0, 32, 32);
    tileGraphics.lineStyle(2, 0xb8860b, 1);
    tileGraphics.strokeRect(2, 2, 28, 28);
    tileGraphics.fillStyle(0xffec8b, 1);
    tileGraphics.fillRect(6, 6, 8, 8);
    tileGraphics.generateTexture('tile-premium', 32, 32);
    
    // Remnant inventory block (brown)
    tileGraphics.clear();
    tileGraphics.fillStyle(0x8b4513, 1);
    tileGraphics.fillRect(0, 0, 32, 32);
    tileGraphics.lineStyle(1, 0x5c3010, 1);
    tileGraphics.strokeRect(0, 0, 32, 32);
    tileGraphics.generateTexture('tile-remnant', 32, 32);
    
    // Billboard platform
    tileGraphics.clear();
    tileGraphics.fillStyle(0x1a1a2e, 1);
    tileGraphics.fillRect(0, 0, 128, 32);
    tileGraphics.lineStyle(2, 0x00ff88, 1);
    tileGraphics.strokeRect(0, 0, 128, 32);
    tileGraphics.generateTexture('platform-billboard', 128, 32);
    
    tileGraphics.destroy();
    
    // Power-up sprites
    const powerupGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Text Mushroom (basic form)
    powerupGraphics.fillStyle(0x00ccff, 1);
    powerupGraphics.fillCircle(12, 16, 10);
    powerupGraphics.fillStyle(0x0088cc, 1);
    powerupGraphics.fillRect(8, 20, 8, 8);
    powerupGraphics.generateTexture('powerup-text', 24, 28);
    
    // Image Flower (medium form)
    powerupGraphics.clear();
    powerupGraphics.fillStyle(0xff6b6b, 1);
    // Petals
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      powerupGraphics.fillCircle(14 + Math.cos(angle) * 8, 14 + Math.sin(angle) * 8, 5);
    }
    powerupGraphics.fillStyle(0xffd93d, 1);
    powerupGraphics.fillCircle(14, 14, 6);
    powerupGraphics.generateTexture('powerup-image', 28, 28);
    
    // Video Star (powered form)
    powerupGraphics.clear();
    powerupGraphics.fillStyle(0xffd700, 1);
    powerupGraphics.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 72 - 90) * Math.PI / 180;
      const innerAngle = (i * 72 + 36 - 90) * Math.PI / 180;
      const outerRadius = 14;
      const innerRadius = 6;
      
      if (i === 0) {
        powerupGraphics.moveTo(16 + Math.cos(outerAngle) * outerRadius, 16 + Math.sin(outerAngle) * outerRadius);
      } else {
        powerupGraphics.lineTo(16 + Math.cos(outerAngle) * outerRadius, 16 + Math.sin(outerAngle) * outerRadius);
      }
      powerupGraphics.lineTo(16 + Math.cos(innerAngle) * innerRadius, 16 + Math.sin(innerAngle) * innerRadius);
    }
    powerupGraphics.closePath();
    powerupGraphics.fillPath();
    powerupGraphics.generateTexture('powerup-video', 32, 32);
    
    powerupGraphics.destroy();
    
    // Collectible coins
    const coinGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // CPM coin (impression)
    coinGraphics.fillStyle(0x00ff88, 1);
    coinGraphics.fillCircle(10, 10, 8);
    coinGraphics.fillStyle(0x00cc66, 1);
    coinGraphics.fillCircle(10, 10, 5);
    coinGraphics.generateTexture('coin-cpm', 20, 20);
    
    // 1st party data coin (gold)
    coinGraphics.clear();
    coinGraphics.fillStyle(0xffd700, 1);
    coinGraphics.fillCircle(10, 10, 8);
    coinGraphics.fillStyle(0xffec8b, 1);
    coinGraphics.fillCircle(8, 8, 3);
    coinGraphics.generateTexture('coin-1p-data', 20, 20);
    
    // 3rd party data coin (silver)
    coinGraphics.clear();
    coinGraphics.fillStyle(0xc0c0c0, 1);
    coinGraphics.fillCircle(10, 10, 8);
    coinGraphics.fillStyle(0xe8e8e8, 1);
    coinGraphics.fillCircle(8, 8, 3);
    coinGraphics.generateTexture('coin-3p-data', 20, 20);
    
    coinGraphics.destroy();
    
    // Enemy sprites
    const enemyGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Basic enemy (click blocker)
    enemyGraphics.fillStyle(0xff4444, 1);
    enemyGraphics.fillRect(4, 4, 24, 24);
    enemyGraphics.fillStyle(0xcc0000, 1);
    enemyGraphics.fillRect(8, 10, 6, 6);
    enemyGraphics.fillRect(18, 10, 6, 6);
    enemyGraphics.generateTexture('enemy-basic', 32, 32);
    
    // IVT Bot (fake platform indicator)
    enemyGraphics.clear();
    enemyGraphics.fillStyle(0x8844ff, 1);
    enemyGraphics.fillRect(0, 0, 32, 32);
    enemyGraphics.lineStyle(2, 0xff00ff, 1);
    enemyGraphics.lineBetween(4, 4, 28, 28);
    enemyGraphics.lineBetween(28, 4, 4, 28);
    enemyGraphics.generateTexture('enemy-ivt', 32, 32);
    
    enemyGraphics.destroy();
    
    // Flagpole (conversion goal)
    const flagGraphics = this.make.graphics({ x: 0, y: 0 });
    flagGraphics.fillStyle(0x888888, 1);
    flagGraphics.fillRect(14, 0, 4, 128);
    flagGraphics.fillStyle(0xffd700, 1);
    flagGraphics.fillTriangle(18, 8, 48, 24, 18, 40);
    flagGraphics.fillStyle(0xffffff, 1);
    flagGraphics.fillCircle(16, 4, 6);
    flagGraphics.generateTexture('flagpole', 48, 128);
    flagGraphics.destroy();
    
    // Background elements
    const bgGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Background gradient tile
    bgGraphics.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a3e, 0x1a1a3e, 1);
    bgGraphics.fillRect(0, 0, 64, 64);
    bgGraphics.generateTexture('bg-tile', 64, 64);
    
    bgGraphics.destroy();
  }

  /**
   * Loading progress callback
   */
  private onProgress(progress: number): void {
    const percent = Math.floor(progress * 100);
    
    if (this.loadingBar) {
      this.loadingBar.style.width = `${percent}%`;
    }
  }

  /**
   * Individual file progress callback
   */
  private onFileProgress(file: Phaser.Loader.File): void {
    this.updateLoadingText(`Loading: ${file.key}...`);
  }

  /**
   * Loading complete callback
   */
  private onComplete(): void {
    console.log('[PreloadScene] All assets loaded');
    this.updateLoadingText('Ready!');
    
    // Short delay before transitioning
    this.time.delayedCall(300, () => {
      this.hideLoadingScreen();
      this.scene.start('MainMenuScene');
    });
  }

  create(): void {
    // If no assets to load, trigger completion manually
    if (this.load.totalToLoad === 0) {
      this.onProgress(1);
      this.onComplete();
    }
  }

  /**
   * Update loading text
   */
  private updateLoadingText(text: string): void {
    if (this.loadingText) {
      this.loadingText.textContent = text;
    }
  }

  /**
   * Hide the loading screen with fade animation
   */
  private hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      
      // Remove from DOM after animation
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }
}
