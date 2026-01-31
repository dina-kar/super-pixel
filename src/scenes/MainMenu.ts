/**
 * MainMenuScene - Main Menu & Title Screen
 * 
 * Displays the game title and menu options:
 * - New Game
 * - Continue (if save exists)
 * - Settings
 * - Credits
 */

import Phaser from 'phaser';
import { gameState } from '../main';

export class MainMenuScene extends Phaser.Scene {
  private menuItems: Phaser.GameObjects.Text[] = [];
  private menuActions: Array<() => void> = [];
  private selectedIndex: number = 0;
  private canSelect: boolean = true;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    console.log('[MainMenuScene] Creating main menu');
    
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    
    // Background
    this.createBackground(width, height);
    
    // Title
    this.createTitle(centerX);
    
    // Menu options
    this.createMenu(centerX, height);
    
    // Instructions
    this.createInstructions(centerX, height);
    
    // Set up input
    this.setupInput();
    
    // Animate in
    this.animateIn();
  }

  /**
   * Create animated background
   */
  private createBackground(width: number, height: number): void {
    // Tiled background
    for (let x = 0; x < width; x += 64) {
      for (let y = 0; y < height; y += 64) {
        const tile = this.add.image(x + 32, y + 32, 'bg-tile');
        tile.setAlpha(0.3);
      }
    }
    
    // Floating particles effect
    const particleGraphics = this.make.graphics({ x: 0, y: 0 });
    particleGraphics.fillStyle(0x00ff88, 1);
    particleGraphics.fillCircle(4, 4, 2);
    particleGraphics.generateTexture('particle-glow', 8, 8);
    particleGraphics.destroy();
    
    this.add.particles(0, 0, 'particle-glow', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 4000,
      speed: { min: 20, max: 50 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      frequency: 200,
      blendMode: 'ADD',
    });
    
    // Data stream lines
    for (let i = 0; i < 5; i++) {
      const line = this.add.graphics();
      line.lineStyle(1, 0x00ff88, 0.1);
      
      const startY = Phaser.Math.Between(100, height - 100);
      line.lineBetween(0, startY, width, startY + Phaser.Math.Between(-100, 100));
      
      // Animate
      this.tweens.add({
        targets: line,
        alpha: { from: 0.1, to: 0.3 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Create title text
   */
  private createTitle(centerX: number): void {
    // Main title with gradient effect
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", "Courier New", monospace',
      fontSize: '48px',
      color: '#00ff88',
      stroke: '#003322',
      strokeThickness: 4,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#001100',
        blur: 8,
        fill: true,
      },
    };
    
    const title = this.add.text(centerX, 120, 'SUPER PIXEL', titleStyle);
    title.setOrigin(0.5);
    title.setAlpha(0);
    
    // Subtitle
    const subtitleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#00ccff',
      letterSpacing: 8,
    };
    
    const subtitle = this.add.text(centerX, 180, 'THE ADTECH ODYSSEY', subtitleStyle);
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    
    // Glow effect on title
    this.tweens.add({
      targets: title,
      scaleX: { from: 1, to: 1.02 },
      scaleY: { from: 1, to: 1.02 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Store for animation
    (this as any).titleText = title;
    (this as any).subtitleText = subtitle;
  }

  /**
   * Create menu options
   */
  private createMenu(centerX: number, height: number): void {
    const menuY = height / 2 - 20;
    const menuSpacing = 50;
    
    const options = [
      { text: 'NEW CAMPAIGN', action: () => this.startNewGame() },
      { text: 'CONTINUE', action: () => this.continueGame() },
      { text: 'SETTINGS', action: () => this.openSettings() },
      { text: 'CREDITS', action: () => this.showCredits() },
    ];
    
    const menuStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#666666',
    };
    
    options.forEach((option, index) => {
      const y = menuY + index * menuSpacing;
      const text = this.add.text(centerX, y, option.text, menuStyle);
      text.setOrigin(0.5);
      text.setAlpha(0);
      text.setInteractive({ useHandCursor: true });
      
      // Hover effects
      text.on('pointerover', () => {
        if (this.canSelect) {
          this.selectItem(index);
        }
      });
      
      text.on('pointerdown', () => {
        if (this.canSelect) {
          this.selectItem(index);
          this.confirmSelection();
        }
      });
      
      this.menuItems.push(text);
      this.menuActions.push(option.action);
    });
    
    // Initial selection - delay to ensure text objects are ready
    this.time.delayedCall(10, () => {
      this.updateSelection();
    });
  }

  /**
   * Create control instructions
   */
  private createInstructions(centerX: number, height: number): void {
    const instructionStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#444444',
    };
    
    const instructions = this.add.text(
      centerX,
      height - 40,
      '↑↓ SELECT   ENTER CONFIRM   F1 DEBUG',
      instructionStyle
    );
    instructions.setOrigin(0.5);
    instructions.setAlpha(0);
    
    // Version info
    const version = this.add.text(
      centerX,
      height - 20,
      'v0.1.0 - Development Build',
      { ...instructionStyle, fontSize: '10px' }
    );
    version.setOrigin(0.5);
    version.setAlpha(0);
    
    (this as any).instructionsText = instructions;
    (this as any).versionText = version;
  }

  /**
   * Set up keyboard input
   */
  private setupInput(): void {
    if (!this.input.keyboard) return;
    
    const cursors = this.input.keyboard.createCursorKeys();
    const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    cursors.up.on('down', () => {
      if (this.canSelect) {
        this.selectItem(this.selectedIndex - 1);
      }
    });
    
    cursors.down.on('down', () => {
      if (this.canSelect) {
        this.selectItem(this.selectedIndex + 1);
      }
    });
    
    enterKey.on('down', () => {
      if (this.canSelect) {
        this.confirmSelection();
      }
    });
    
    spaceKey.on('down', () => {
      if (this.canSelect) {
        this.confirmSelection();
      }
    });
  }

  /**
   * Select menu item
   */
  private selectItem(index: number): void {
    // Wrap around
    if (index < 0) index = this.menuItems.length - 1;
    if (index >= this.menuItems.length) index = 0;
    
    this.selectedIndex = index;
    this.updateSelection();
  }

  /**
   * Update visual selection state
   */
  private updateSelection(): void {
    if (!this.menuItems || this.menuItems.length === 0) return;
    
    this.menuItems.forEach((item, index) => {
      if (!item || !item.active) return;
      
      if (index === this.selectedIndex) {
        item.setColor('#00ff88');
        item.setFontSize(24);
        item.setShadow(0, 0, '#00ff88', 10, true, true);
        
        // Scale animation
        this.tweens.add({
          targets: item,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 200,
          ease: 'Back.out',
        });
      } else {
        item.setColor('#666666');
        item.setFontSize(20);
        item.setShadow(0, 0, '#000000', 0, false, false);
        item.setScale(1);
      }
    });
  }

  /**
   * Confirm current selection
   */
  private confirmSelection(): void {
    console.log('[MainMenuScene] Confirming selection:', this.selectedIndex);
    
    const selectedItem = this.menuItems[this.selectedIndex];
    if (!selectedItem) {
      console.error('[MainMenuScene] No selected item found');
      return;
    }
    
    const action = this.menuActions[this.selectedIndex];
    console.log('[MainMenuScene] Action:', action);
    
    if (action) {
      this.canSelect = false;
      
      // Flash effect
      this.tweens.add({
        targets: selectedItem,
        alpha: { from: 1, to: 0.3 },
        duration: 100,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          action();
        },
      });
    }
  }

  /**
   * Animate menu entrance
   */
  private animateIn(): void {
    const title = (this as any).titleText;
    const subtitle = (this as any).subtitleText;
    const instructions = (this as any).instructionsText;
    const version = (this as any).versionText;
    
    // Title fade in and drop
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: { from: 80, to: 120 },
      duration: 800,
      ease: 'Back.out',
    });
    
    // Subtitle fade in
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 600,
      delay: 300,
    });
    
    // Menu items staggered
    this.menuItems.forEach((item, index) => {
      this.tweens.add({
        targets: item,
        alpha: 1,
        x: { from: item.x - 50, to: item.x },
        duration: 400,
        delay: 500 + index * 100,
        ease: 'Power2',
      });
    });
    
    // Instructions fade in
    this.tweens.add({
      targets: [instructions, version],
      alpha: 0.6,
      duration: 400,
      delay: 1000,
    });
  }

  // ============================================================================
  // MENU ACTIONS
  // ============================================================================

  /**
   * Start a new game
   */
  private startNewGame(): void {
    console.log('[MainMenuScene] Starting new campaign');
    
    // Reset game state
    gameState.reset();
    
    // Clear any existing HUD
    this.clearUILayer();
    
    // Transition to tutorial first (then level intro)
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      console.log('[MainMenuScene] Fade complete, showing AdTech tutorial');
      this.scene.start('AdTechTutorialScene', { levelKey: 'World1_InventoryValley' });
    });
  }

  /**
   * Continue from saved progress
   */
  private continueGame(): void {
    const savedProgress = gameState.getState().savedProgress;
    
    if (savedProgress.worldIndex > 0 || savedProgress.timestamp > 0) {
      console.log('[MainMenuScene] Continuing from saved progress', savedProgress);
      
      // Clear any existing HUD
      this.clearUILayer();
      
      // Determine which level to load based on saved progress
      const levelKeys = [
        'World1_InventoryValley',
        'World2_TechStack',
        'World3_NativeNinja',
        'World3_VideoVolcano',
        'World3_AudioAlps',
        'World3_RichMediaRainbow',
        'World4_AuctionArena',
        'World5_PrivacyCitadel',
        'World6_AttributionCastle',
        'FinalWorld_WalledGarden',
      ];
      
      const levelKey = levelKeys[savedProgress.worldIndex] || 'World1_InventoryValley';
      
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        // Go to tutorial for the continued world
        this.scene.start('AdTechTutorialScene', { levelKey });
      });
    } else {
      console.log('[MainMenuScene] No saved progress found');
      // Show notification
      this.showNotification('No saved campaign found! Starting new game...');
      
      // Start new game after delay
      this.time.delayedCall(1500, () => {
        this.startNewGame();
      });
    }
  }

  /**
   * Open settings menu
   */
  private openSettings(): void {
    console.log('[MainMenuScene] Opening settings');
    
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('SettingsScene');
    });
  }

  /**
   * Show credits
   */
  private showCredits(): void {
    console.log('[MainMenuScene] Showing credits');
    // TODO: Implement credits scene
    this.showNotification('Credits coming soon!');
    this.canSelect = true;
  }

  /**
   * Clear the UI layer to prevent HUD bleed-through
   */
  private clearUILayer(): void {
    const uiLayer = document.getElementById('ui-layer');
    if (uiLayer) {
      uiLayer.innerHTML = '';
    }
  }

  /**
   * Show temporary notification
   */
  private showNotification(message: string): void {
    const { width, height } = this.cameras.main;
    
    const notification = this.add.text(width / 2, height - 100, message, {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#ffcc00',
      backgroundColor: '#1a1a2e',
      padding: { x: 16, y: 8 },
    });
    notification.setOrigin(0.5);
    notification.setAlpha(0);
    
    this.tweens.add({
      targets: notification,
      alpha: 1,
      y: height - 120,
      duration: 200,
      hold: 1500,
      yoyo: true,
      onComplete: () => {
        notification.destroy();
      },
    });
  }
}
