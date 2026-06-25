/**
 * World3_RichMediaRainbow - Rich Media Advertising Level
 * 
 * A colorful rainbow-themed level teaching rich media ad concepts:
 * - Expandable Platforms: Grow when player approaches (like expandable ads)
 * - Interstitial Doors: Full-screen minigames to unlock doors
 * - Breakout Blocks: Brick-breaker style puzzle segments
 * 
 * This world teaches:
 * - Rich media ad formats and interactivity
 * - Expandable/collapsible ad states
 * - Engagement metrics and dwell time
 */

import Phaser from 'phaser';
import { BaseAdTechScene } from './BaseAdTechScene';
import { Player } from '../entities/Player';
import { HUD } from '../ui/HUD';

/**
 * Level configuration
 */
const LEVEL_CONFIG = {
  width: 4500,
  height: 1000,
  groundHeight: 900,
  
  // Rainbow colors (ROYGBIV)
  rainbowColors: [
    0xff4444, // Red
    0xff8844, // Orange
    0xffff44, // Yellow
    0x44ff44, // Green
    0x4444ff, // Blue
    0x8844ff, // Indigo
    0xff44ff, // Violet
  ],
};

/**
 * Expandable platform state
 */
interface ExpandablePlatform {
  container: Phaser.GameObjects.Container;
  body: Phaser.Physics.Arcade.Sprite;
  collapsedWidth: number;
  expandedWidth: number;
  isExpanded: boolean;
  color: number;
}

/**
 * Interstitial door state
 */
interface InterstitialDoor {
  container: Phaser.GameObjects.Container;
  isOpen: boolean;
  minigameType: 'match' | 'sequence' | 'timer';
  x: number;
  y: number;
}

/**
 * Breakout block
 */
interface BreakoutBlock {
  sprite: Phaser.GameObjects.Rectangle;
  health: number;
  color: number;
  x: number;
  y: number;
}

export class World3_RichMediaRainbow extends BaseAdTechScene {
  // Entities
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  
  // Rich media mechanics
  private expandablePlatforms: ExpandablePlatform[] = [];
  private interstitialDoors: InterstitialDoor[] = [];
  private breakoutBlocks: BreakoutBlock[] = [];
  private breakoutBall: Phaser.Physics.Arcade.Sprite | null = null;
  private isInBreakout: boolean = false;
  private breakoutPaddle: Phaser.GameObjects.Rectangle | null = null;
  
  // Minigame state
  private isMinigameActive: boolean = false;
  private minigameUI: Phaser.GameObjects.Container | null = null;
  private currentDoor: InterstitialDoor | null = null;
  
  // UI
  private hud!: HUD;
  private engagementMeter!: Phaser.GameObjects.Container;
  private engagementValue: number = 0;
  
  // Level state
  private isLevelComplete: boolean = false;

  constructor() {
    super({ key: 'World3_RichMediaRainbow' });
  }

  init(): void {
    super.init();
    console.log('[World3] Initializing Rich Media Rainbow');
  }

  create(): void {
    super.create();
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Create rainbow background
    this.createBackground();
    
    // Create level geometry
    this.createGround();
    this.createPlatforms();
    
    // Create rich media mechanics
    this.createExpandablePlatforms();
    this.createInterstitialDoors();
    this.createBreakoutZone();
    
    // Create player
    this.createPlayer();
    
    // Create engagement UI
    this.createEngagementUI();
    
    // Set up camera
    this.setupCamera();
    
    // Create HUD
    this.hud = new HUD(this, this.budgetSystem, this.viewabilityTracker, {
      worldNumber: 3,
      worldName: 'Rich Media Rainbow',
      color: '#ff6b9d'
    });
    
    // Set up collisions
    this.setupCollisions();
    
    // Create exit portal
    this.createExitPortal();
    
    // Fade in
    this.cameras.main.fadeIn(500);
    
    console.log('[World3] Rich Media Rainbow created');
  }

  /**
   * Implement abstract method from BaseAdTechScene
   */
  protected setupAdTechMechanics(): void {
    this.budgetSystem.reset({
      totalBudget: 2500,
      pricingModel: 'CPM',
      currentSpend: 0,
    });
    
    this.budgetSystem.setRates({
      CPM: 12.00, // Rich media commands premium
      CPC: 1.50,
      CPA: 30.00,
    });
  }

  // ============================================================================
  // BACKGROUND & VISUALS
  // ============================================================================

  /**
   * Create rainbow gradient background
   */
  private createBackground(): void {
    // Multi-band rainbow gradient
    const bgGraphics = this.add.graphics();
    const bandHeight = LEVEL_CONFIG.height / LEVEL_CONFIG.rainbowColors.length;
    
    LEVEL_CONFIG.rainbowColors.forEach((color, i) => {
      bgGraphics.fillStyle(color, 0.15);
      bgGraphics.fillRect(0, i * bandHeight, LEVEL_CONFIG.width, bandHeight + 2);
    });
    
    // Sparkle particles
    if (this.textures.exists('particle-glow')) {
      const emitter = this.add.particles(0, 0, 'particle-glow', {
        x: { min: 0, max: 1280 },
        y: { min: 0, max: 720 },
        lifespan: 2000,
        speed: { min: 10, max: 30 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.5, end: 0 },
        frequency: 200,
        tint: LEVEL_CONFIG.rainbowColors,
        blendMode: 'ADD',
      });
      emitter.setScrollFactor(0);
    }
    
    // "RICH MEDIA ZONE" signage
    const sign = this.add.text(200, 100, '🌈 RICH MEDIA RAINBOW', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    sign.setScrollFactor(0);
    sign.setDepth(100);
    
    // Animated rainbow effect on sign
    this.tweens.addCounter({
      from: 0,
      to: LEVEL_CONFIG.rainbowColors.length - 1,
      duration: 2000,
      repeat: -1,
      onUpdate: (tween) => {
        const colorIdx = Math.floor(tween.getValue() ?? 0);
        sign.setColor(`#${LEVEL_CONFIG.rainbowColors[colorIdx].toString(16).padStart(6, '0')}`);
      },
    });
  }

  // ============================================================================
  // LEVEL GEOMETRY
  // ============================================================================

  /**
   * Create ground
   */
  private createGround(): void {
    this.ground = this.physics.add.staticGroup();
    
    // Ground sections with gaps
    const sections = [
      { start: 0, end: 400 },
      { start: 600, end: 1200 },
      { start: 1400, end: 2000 },
      { start: 2200, end: 2800 },
      { start: 3000, end: 3600 },
      { start: 3800, end: LEVEL_CONFIG.width },
    ];
    
    sections.forEach((section, sectionIdx) => {
      const width = section.end - section.start;
      const tilesNeeded = Math.ceil(width / 32);
      const color = LEVEL_CONFIG.rainbowColors[sectionIdx % LEVEL_CONFIG.rainbowColors.length];
      
      for (let i = 0; i < tilesNeeded; i++) {
        const tile = this.ground.create(
          section.start + i * 32 + 16,
          LEVEL_CONFIG.groundHeight + 16,
          'tile-ground'
        );
        tile.setImmovable(true);
        tile.setTint(color);
        tile.refreshBody();
      }
    });
  }

  /**
   * Create static platforms
   */
  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    const platformDefs = [
      { x: 200, y: 750, width: 128, colorIdx: 0 },
      { x: 800, y: 700, width: 160, colorIdx: 1 },
      { x: 1600, y: 750, width: 128, colorIdx: 3 },
      { x: 2400, y: 700, width: 160, colorIdx: 4 },
      { x: 3200, y: 750, width: 128, colorIdx: 5 },
      { x: 4000, y: 700, width: 192, colorIdx: 6 },
    ];
    
    platformDefs.forEach(def => {
      const color = LEVEL_CONFIG.rainbowColors[def.colorIdx];
      const tilesNeeded = Math.ceil(def.width / 32);
      
      for (let i = 0; i < tilesNeeded; i++) {
        const tile = this.platforms.create(
          def.x + i * 32 - (def.width / 2) + 16,
          def.y,
          'tile-platform'
        );
        tile.setImmovable(true);
        tile.setTint(color);
        tile.refreshBody();
      }
    });
  }

  // ============================================================================
  // EXPANDABLE PLATFORMS
  // ============================================================================

  /**
   * Create expandable platforms (like expandable ads)
   */
  private createExpandablePlatforms(): void {
    const expandDefs = [
      { x: 500, y: 800, collapsedWidth: 60, expandedWidth: 180, colorIdx: 0 },
      { x: 1000, y: 650, collapsedWidth: 50, expandedWidth: 150, colorIdx: 1 },
      { x: 1800, y: 750, collapsedWidth: 60, expandedWidth: 200, colorIdx: 2 },
      { x: 2600, y: 650, collapsedWidth: 50, expandedWidth: 160, colorIdx: 3 },
      { x: 3400, y: 800, collapsedWidth: 60, expandedWidth: 180, colorIdx: 5 },
    ];
    
    expandDefs.forEach((def, idx) => {
      const color = LEVEL_CONFIG.rainbowColors[def.colorIdx];
      
      const container = this.add.container(def.x, def.y);
      container.setData('expandedWidth', def.expandedWidth);
      container.setData('collapsedWidth', def.collapsedWidth);
      
      // Collapsed visual (small platform with expand icon)
      const visual = this.add.graphics();
      visual.fillStyle(color, 0.9);
      visual.fillRoundedRect(-def.collapsedWidth / 2, -12, def.collapsedWidth, 24, 6);
      visual.lineStyle(2, 0xffffff, 0.8);
      visual.strokeRoundedRect(-def.collapsedWidth / 2, -12, def.collapsedWidth, 24, 6);
      container.add(visual);
      container.setData('visual', visual);
      
      // Expand icon
      const expandIcon = this.add.text(0, 0, '↔', {
        fontSize: '14px',
        color: '#ffffff',
      });
      expandIcon.setOrigin(0.5);
      container.add(expandIcon);
      container.setData('icon', expandIcon);
      
      // Label
      const label = this.add.text(0, 20, 'EXPANDABLE', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: '#ffffff',
      });
      label.setOrigin(0.5);
      container.add(label);
      
      // Physics body (starts at collapsed size)
      const body = this.platforms.create(def.x, def.y, 'tile-platform');
      body.setImmovable(true);
      body.setScale(def.collapsedWidth / 32, 0.75);
      body.setAlpha(0);
      body.refreshBody();
      container.setData('body', body);
      
      // Trigger zone for expansion
      const triggerZone = this.add.zone(def.x, def.y, def.expandedWidth + 100, 150);
      this.physics.world.enable(triggerZone, Phaser.Physics.Arcade.STATIC_BODY);
      triggerZone.setData('platformIndex', idx);
      
      this.expandablePlatforms.push({
        container,
        body,
        collapsedWidth: def.collapsedWidth,
        expandedWidth: def.expandedWidth,
        isExpanded: false,
        color,
      });
    });
  }

  /**
   * Expand a platform
   */
  private expandPlatform(index: number): void {
    const platform = this.expandablePlatforms[index];
    if (platform.isExpanded) return;
    
    platform.isExpanded = true;
    
    // Animate expansion
    const icon = platform.container.getData('icon') as Phaser.GameObjects.Text;
    
    // Tween the container width (visual effect)
    this.tweens.add({
      targets: platform.container,
      scaleX: platform.expandedWidth / platform.collapsedWidth,
      duration: 300,
      ease: 'Back.easeOut',
    });
    
    // Update physics body
    platform.body.setScale(platform.expandedWidth / 32, 0.75);
    platform.body.refreshBody();
    
    // Change icon
    icon.setText('✓');
    
    // Track engagement
    this.engagementValue += 10;
    this.updateEngagementUI();
    
    console.log(`[World3] Platform ${index} expanded`);
  }

  /**
   * Collapse a platform when player moves away
   */
  private collapsePlatform(index: number): void {
    const platform = this.expandablePlatforms[index];
    if (!platform.isExpanded) return;
    
    platform.isExpanded = false;
    
    const icon = platform.container.getData('icon') as Phaser.GameObjects.Text;
    
    // Tween collapse
    this.tweens.add({
      targets: platform.container,
      scaleX: 1,
      duration: 200,
      ease: 'Cubic.easeIn',
    });
    
    // Update physics
    platform.body.setScale(platform.collapsedWidth / 32, 0.75);
    platform.body.refreshBody();
    
    // Change icon back
    icon.setText('↔');
  }

  // ============================================================================
  // INTERSTITIAL DOORS
  // ============================================================================

  /**
   * Create interstitial door minigames
   */
  private createInterstitialDoors(): void {
    const doorDefs = [
      { x: 1300, y: LEVEL_CONFIG.groundHeight - 100, type: 'match' as const },
      { x: 2100, y: LEVEL_CONFIG.groundHeight - 100, type: 'sequence' as const },
      { x: 2900, y: LEVEL_CONFIG.groundHeight - 100, type: 'timer' as const },
    ];
    
    doorDefs.forEach((def, idx) => {
      const container = this.add.container(def.x, def.y);
      
      // Door frame
      const frame = this.add.graphics();
      frame.fillStyle(0x333333, 1);
      frame.fillRect(-50, -80, 100, 160);
      frame.lineStyle(4, 0xffd700, 1);
      frame.strokeRect(-50, -80, 100, 160);
      container.add(frame);
      
      // Door surface
      const door = this.add.graphics();
      door.fillStyle(0x666666, 1);
      door.fillRect(-45, -75, 90, 150);
      container.add(door);
      container.setData('doorGraphics', door);
      
      // Lock icon
      const lock = this.add.text(0, 0, '🔒', {
        fontSize: '32px',
      });
      lock.setOrigin(0.5);
      container.add(lock);
      container.setData('lock', lock);
      
      // Type label
      const typeLabels: Record<string, string> = {
        match: 'MATCH GAME',
        sequence: 'SEQUENCE',
        timer: 'QUICK TAP',
      };
      
      const label = this.add.text(0, 60, typeLabels[def.type], {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#ffd700',
      });
      label.setOrigin(0.5);
      container.add(label);
      
      // Trigger zone
      const zone = this.add.zone(def.x, def.y, 120, 200);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      zone.setData('doorIndex', idx);
      
      // Physical barrier
      const barrier = this.platforms.create(def.x, def.y, 'tile-platform');
      barrier.setImmovable(true);
      barrier.setScale(3, 5);
      barrier.setAlpha(0);
      barrier.refreshBody();
      container.setData('barrier', barrier);
      
      this.interstitialDoors.push({
        container,
        isOpen: false,
        minigameType: def.type,
        x: def.x,
        y: def.y,
      });
    });
  }

  /**
   * Start interstitial minigame
   */
  private startMinigame(door: InterstitialDoor): void {
    if (this.isMinigameActive || door.isOpen) return;
    
    this.isMinigameActive = true;
    this.currentDoor = door;
    
    // Pause physics
    this.physics.pause();
    
    // Create minigame UI
    this.minigameUI = this.add.container(640, 360);
    this.minigameUI.setDepth(2000);
    this.minigameUI.setScrollFactor(0);
    
    // Background overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(-640, -360, 1280, 720);
    this.minigameUI.add(overlay);
    
    // Minigame panel
    const panel = this.add.graphics();
    panel.fillStyle(0x222244, 1);
    panel.fillRoundedRect(-250, -180, 500, 360, 16);
    panel.lineStyle(4, 0xffd700, 1);
    panel.strokeRoundedRect(-250, -180, 500, 360, 16);
    this.minigameUI.add(panel);
    
    // Title
    const title = this.add.text(0, -140, 'INTERSTITIAL AD', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ffd700',
    });
    title.setOrigin(0.5);
    this.minigameUI.add(title);
    
    // Launch specific minigame
    switch (door.minigameType) {
      case 'match':
        this.createMatchGame();
        break;
      case 'sequence':
        this.createSequenceGame();
        break;
      case 'timer':
        this.createTimerGame();
        break;
    }
  }

  /**
   * Create match game (find matching pairs)
   */
  private createMatchGame(): void {
    const colors = Phaser.Utils.Array.Shuffle([
      0xff4444, 0xff4444,
      0x44ff44, 0x44ff44,
      0x4444ff, 0x4444ff,
    ]);
    
    const cards: Phaser.GameObjects.Container[] = [];
    let flippedCards: Phaser.GameObjects.Container[] = [];
    let matchedPairs = 0;
    
    colors.forEach((color, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = -100 + col * 100;
      const y = -40 + row * 80;
      
      const card = this.add.container(x, y);
      
      // Card back
      const back = this.add.graphics();
      back.fillStyle(0x444466, 1);
      back.fillRoundedRect(-35, -30, 70, 60, 8);
      back.lineStyle(2, 0xffd700, 1);
      back.strokeRoundedRect(-35, -30, 70, 60, 8);
      card.add(back);
      card.setData('back', back);
      
      // Card front (hidden)
      const front = this.add.graphics();
      front.fillStyle(color, 1);
      front.fillRoundedRect(-35, -30, 70, 60, 8);
      front.setVisible(false);
      card.add(front);
      card.setData('front', front);
      card.setData('color', color);
      card.setData('matched', false);
      
      // Make interactive
      const hitArea = this.add.zone(0, 0, 70, 60);
      hitArea.setInteractive({ useHandCursor: true });
      card.add(hitArea);
      
      hitArea.on('pointerdown', () => {
        if (card.getData('matched') || flippedCards.length >= 2) return;
        if (flippedCards.includes(card)) return;
        
        // Flip card
        (card.getData('back') as Phaser.GameObjects.Graphics).setVisible(false);
        (card.getData('front') as Phaser.GameObjects.Graphics).setVisible(true);
        flippedCards.push(card);
        
        if (flippedCards.length === 2) {
          // Check match
          this.time.delayedCall(500, () => {
            if (flippedCards[0].getData('color') === flippedCards[1].getData('color')) {
              // Match!
              flippedCards.forEach(c => c.setData('matched', true));
              matchedPairs++;
              
              if (matchedPairs === 3) {
                this.completeMinigame();
              }
            } else {
              // No match, flip back
              flippedCards.forEach(c => {
                (c.getData('back') as Phaser.GameObjects.Graphics).setVisible(true);
                (c.getData('front') as Phaser.GameObjects.Graphics).setVisible(false);
              });
            }
            flippedCards = [];
          });
        }
      });
      
      cards.push(card);
      this.minigameUI!.add(card);
    });
    
    // Instructions
    const instructions = this.add.text(0, 130, 'Match the pairs!', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    instructions.setOrigin(0.5);
    this.minigameUI!.add(instructions);
  }

  /**
   * Create sequence game (repeat pattern)
   */
  private createSequenceGame(): void {
    const buttons = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];
    const sequence = [
      Phaser.Math.Between(0, 3),
      Phaser.Math.Between(0, 3),
      Phaser.Math.Between(0, 3),
      Phaser.Math.Between(0, 3),
    ];
    let playerSequence: number[] = [];
    let isShowingSequence = true;
    
    const buttonContainers: Phaser.GameObjects.Container[] = [];
    
    buttons.forEach((color, idx) => {
      const x = -120 + (idx % 2) * 160;
      const y = -20 + Math.floor(idx / 2) * 80;
      
      const btn = this.add.container(x, y);
      
      const bg = this.add.graphics();
      bg.fillStyle(color, 0.6);
      bg.fillRoundedRect(-50, -30, 100, 60, 10);
      btn.add(bg);
      btn.setData('bg', bg);
      btn.setData('color', color);
      btn.setData('idx', idx);
      
      const hitArea = this.add.zone(0, 0, 100, 60);
      hitArea.setInteractive({ useHandCursor: true });
      btn.add(hitArea);
      
      hitArea.on('pointerdown', () => {
        if (isShowingSequence) return;
        
        // Flash button
        bg.clear();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-50, -30, 100, 60, 10);
        this.time.delayedCall(200, () => {
          bg.clear();
          bg.fillStyle(color, 0.6);
          bg.fillRoundedRect(-50, -30, 100, 60, 10);
        });
        
        playerSequence.push(idx);
        
        // Check sequence
        const currentPos = playerSequence.length - 1;
        if (playerSequence[currentPos] !== sequence[currentPos]) {
          // Wrong!
          playerSequence = [];
          this.cameras.main.flash(200, 255, 0, 0);
          return;
        }
        
        if (playerSequence.length === sequence.length) {
          this.completeMinigame();
        }
      });
      
      buttonContainers.push(btn);
      this.minigameUI!.add(btn);
    });
    
    // Show sequence
    const instructions = this.add.text(0, 130, 'Watch the sequence...', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    instructions.setOrigin(0.5);
    this.minigameUI!.add(instructions);
    
    // Play sequence
    sequence.forEach((btnIdx, i) => {
      this.time.delayedCall(500 + i * 600, () => {
        const btn = buttonContainers[btnIdx];
        const bg = btn.getData('bg') as Phaser.GameObjects.Graphics;
        const color = btn.getData('color') as number;
        
        bg.clear();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-50, -30, 100, 60, 10);
        
        this.time.delayedCall(400, () => {
          bg.clear();
          bg.fillStyle(color, 0.6);
          bg.fillRoundedRect(-50, -30, 100, 60, 10);
        });
      });
    });
    
    // Enable input after sequence
    this.time.delayedCall(500 + sequence.length * 600 + 300, () => {
      isShowingSequence = false;
      instructions.setText('Repeat the sequence!');
    });
  }

  /**
   * Create timer game (tap before time runs out)
   */
  private createTimerGame(): void {
    const tapsRequired = 10;
    let tapsComplete = 0;
    const timeLimit = 5000;
    const startTime = this.time.now;
    
    // Tap target
    const target = this.add.container(0, 0);
    
    const targetBg = this.add.graphics();
    targetBg.fillStyle(0xffaa00, 1);
    targetBg.fillCircle(0, 0, 60);
    target.add(targetBg);
    
    const tapText = this.add.text(0, 0, `${tapsRequired}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffffff',
    });
    tapText.setOrigin(0.5);
    target.add(tapText);
    
    const hitArea = this.add.zone(0, 0, 120, 120);
    hitArea.setInteractive({ useHandCursor: true });
    target.add(hitArea);
    
    hitArea.on('pointerdown', () => {
      tapsComplete++;
      const remaining = tapsRequired - tapsComplete;
      tapText.setText(`${remaining}`);
      
      // Pulse effect
      this.tweens.add({
        targets: target,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 50,
        yoyo: true,
      });
      
      if (remaining <= 0) {
        this.completeMinigame();
      }
    });
    
    this.minigameUI!.add(target);
    
    // Timer bar
    const timerBar = this.add.graphics();
    this.minigameUI!.add(timerBar);
    
    // Instructions
    const instructions = this.add.text(0, 130, 'TAP FAST!', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffaa00',
    });
    instructions.setOrigin(0.5);
    this.minigameUI!.add(instructions);
    
    // Update timer
    const timerEvent = this.time.addEvent({
      delay: 50,
      callback: () => {
        const elapsed = this.time.now - startTime;
        const progress = 1 - (elapsed / timeLimit);
        
        timerBar.clear();
        timerBar.fillStyle(0x444444, 1);
        timerBar.fillRoundedRect(-150, 100, 300, 20, 5);
        timerBar.fillStyle(progress > 0.3 ? 0x44ff44 : 0xff4444, 1);
        timerBar.fillRoundedRect(-148, 102, 296 * progress, 16, 4);
        
        if (elapsed >= timeLimit && tapsComplete < tapsRequired) {
          timerEvent.destroy();
          // Failed - reset
          tapsComplete = 0;
          tapText.setText(`${tapsRequired}`);
          this.cameras.main.flash(200, 255, 0, 0);
        }
      },
      loop: true,
    });
  }

  /**
   * Complete minigame and open door
   */
  private completeMinigame(): void {
    if (!this.currentDoor || !this.minigameUI) return;
    
    // Close minigame
    this.tweens.add({
      targets: this.minigameUI,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.minigameUI?.destroy();
        this.minigameUI = null;
      },
    });
    
    // Open door
    this.currentDoor.isOpen = true;
    
    const lock = this.currentDoor.container.getData('lock') as Phaser.GameObjects.Text;
    lock.setText('✓');
    lock.setColor('#44ff44');
    
    const doorGraphics = this.currentDoor.container.getData('doorGraphics') as Phaser.GameObjects.Graphics;
    doorGraphics.clear();
    doorGraphics.fillStyle(0x44ff44, 0.3);
    doorGraphics.fillRect(-45, -75, 90, 150);
    
    // Remove barrier
    const barrier = this.currentDoor.container.getData('barrier') as Phaser.Physics.Arcade.Sprite;
    barrier.destroy();
    
    // Resume physics
    this.physics.resume();
    this.isMinigameActive = false;
    this.currentDoor = null;
    
    // Track engagement
    this.engagementValue += 25;
    this.updateEngagementUI();
    
    console.log('[World3] Door opened!');
  }

  // ============================================================================
  // BREAKOUT ZONE
  // ============================================================================

  /**
   * Create breakout-style puzzle zone
   */
  private createBreakoutZone(): void {
    const breakoutX = 3600;
    const breakoutY = 500;
    
    // Zone marker
    const marker = this.add.container(breakoutX, breakoutY - 150);
    
    const markerBg = this.add.graphics();
    markerBg.fillStyle(0x332255, 0.9);
    markerBg.fillRoundedRect(-80, -20, 160, 40, 8);
    marker.add(markerBg);
    
    const markerText = this.add.text(0, 0, '🧱 BREAKOUT ZONE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ff88ff',
    });
    markerText.setOrigin(0.5);
    marker.add(markerText);
    
    // Create blocks
    const blockWidth = 50;
    const blockHeight = 20;
    const cols = 5;
    const rows = 4;
    
    for (let row = 0; row < rows; row++) {
      const color = LEVEL_CONFIG.rainbowColors[row % LEVEL_CONFIG.rainbowColors.length];
      
      for (let col = 0; col < cols; col++) {
        const x = breakoutX - ((cols - 1) * blockWidth) / 2 + col * blockWidth;
        const y = breakoutY + row * blockHeight;
        
        const block = this.add.rectangle(x, y, blockWidth - 4, blockHeight - 4, color, 0.9);
        block.setStrokeStyle(2, 0xffffff, 0.5);
        
        this.breakoutBlocks.push({
          sprite: block,
          health: 1,
          color,
          x,
          y,
        });
      }
    }
    
    // Trigger zone for breakout
    const triggerZone = this.add.zone(breakoutX, breakoutY + 150, 300, 100);
    this.physics.world.enable(triggerZone, Phaser.Physics.Arcade.STATIC_BODY);
    triggerZone.setData('isBreakoutTrigger', true);
    
    // Create paddle (hidden initially)
    this.breakoutPaddle = this.add.rectangle(breakoutX, breakoutY + 200, 80, 15, 0xffffff);
    this.breakoutPaddle.setAlpha(0);
  }

  /**
   * Start breakout minigame
   */
  private startBreakout(): void {
    if (this.isInBreakout || this.breakoutBlocks.length === 0) return;
    
    this.isInBreakout = true;
    
    // Show paddle
    if (this.breakoutPaddle) {
      this.breakoutPaddle.setAlpha(1);
    }
    
    // Create ball
    const ballX = this.breakoutPaddle?.x || 3600;
    const ballY = (this.breakoutPaddle?.y || 700) - 30;
    
    this.breakoutBall = this.physics.add.sprite(ballX, ballY, 'tile-platform');
    this.breakoutBall.setCircle(8);
    this.breakoutBall.setTint(0xffffff);
    this.breakoutBall.setScale(0.5);
    this.breakoutBall.setVelocity(
      Phaser.Math.Between(-200, 200),
      -300
    );
    this.breakoutBall.setBounce(1, 1);
    this.breakoutBall.setCollideWorldBounds(true);
    
    console.log('[World3] Breakout started!');
  }

  /**
   * Update breakout game
   */
  private updateBreakout(): void {
    if (!this.isInBreakout || !this.breakoutBall || !this.breakoutPaddle) return;
    
    // Move paddle with player
    this.breakoutPaddle.x = this.player.x;
    
    // Ball-block collisions
    this.breakoutBlocks.forEach(block => {
      if (block.health <= 0) return;
      
      const ballBounds = this.breakoutBall!.getBounds();
      const blockBounds = block.sprite.getBounds();
      
      if (Phaser.Geom.Intersects.RectangleToRectangle(ballBounds, blockBounds)) {
        block.health--;
        
        if (block.health <= 0) {
          block.sprite.destroy();
          this.engagementValue += 5;
          this.updateEngagementUI();
        }
        
        // Bounce ball
        const ballBody = this.breakoutBall!.body as Phaser.Physics.Arcade.Body;
        ballBody.velocity.y *= -1;
      }
    });
    
    // Ball-paddle collision
    const ballBounds = this.breakoutBall.getBounds();
    const paddleBounds = this.breakoutPaddle.getBounds();
    
    if (Phaser.Geom.Intersects.RectangleToRectangle(ballBounds, paddleBounds)) {
      const ballBody = this.breakoutBall.body as Phaser.Physics.Arcade.Body;
      ballBody.velocity.y = -Math.abs(ballBody.velocity.y);
      
      // Angle based on hit position
      const hitOffset = (this.breakoutBall.x - this.breakoutPaddle.x) / 40;
      ballBody.velocity.x += hitOffset * 100;
    }
    
    // Check if ball fell
    if (this.breakoutBall.y > 900) {
      this.breakoutBall.destroy();
      this.breakoutBall = null;
      this.isInBreakout = false;
      
      if (this.breakoutPaddle) {
        this.breakoutPaddle.setAlpha(0);
      }
    }
    
    // Check if all blocks destroyed
    const remainingBlocks = this.breakoutBlocks.filter(b => b.health > 0);
    if (remainingBlocks.length === 0) {
      this.breakoutBall?.destroy();
      this.breakoutBall = null;
      this.isInBreakout = false;
      
      if (this.breakoutPaddle) {
        this.breakoutPaddle.setAlpha(0);
      }
      
      console.log('[World3] Breakout complete!');
    }
  }

  // ============================================================================
  // ENGAGEMENT UI
  // ============================================================================

  /**
   * Create engagement meter
   */
  private createEngagementUI(): void {
    this.engagementMeter = this.add.container(640, 100);
    this.engagementMeter.setDepth(1000);
    this.engagementMeter.setScrollFactor(0);
    
    // Frame
    const frame = this.add.graphics();
    frame.fillStyle(0x222244, 0.9);
    frame.fillRoundedRect(-150, -25, 300, 50, 8);
    frame.lineStyle(2, 0xffd700, 0.8);
    frame.strokeRoundedRect(-150, -25, 300, 50, 8);
    this.engagementMeter.add(frame);
    
    // Label
    const label = this.add.text(-130, 0, 'ENGAGEMENT:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ffd700',
    });
    label.setOrigin(0, 0.5);
    this.engagementMeter.add(label);
    
    // Value bar
    const barBg = this.add.graphics();
    barBg.fillStyle(0x333355, 1);
    barBg.fillRoundedRect(20, -10, 120, 20, 4);
    this.engagementMeter.add(barBg);
    
    const bar = this.add.graphics();
    bar.fillStyle(0xffd700, 1);
    bar.fillRoundedRect(22, -8, 0, 16, 3);
    this.engagementMeter.add(bar);
    this.engagementMeter.setData('bar', bar);
  }

  /**
   * Update engagement UI
   */
  private updateEngagementUI(): void {
    const bar = this.engagementMeter.getData('bar') as Phaser.GameObjects.Graphics;
    const fillWidth = Math.min(116, (this.engagementValue / 100) * 116);
    
    bar.clear();
    bar.fillStyle(0xffd700, 1);
    bar.fillRoundedRect(22, -8, fillWidth, 16, 3);
  }

  // ============================================================================
  // PLAYER & CAMERA
  // ============================================================================

  /**
   * Create player
   */
  private createPlayer(): void {
    this.player = new Player(this, 100, LEVEL_CONFIG.groundHeight - 50);
    this.player.setBudgetManager(this.budgetSystem);
  }

  /**
   * Set up camera
   */
  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    this.cameras.main.setDeadzone(200, 100);
  }

  // ============================================================================
  // COLLISIONS
  // ============================================================================

  /**
   * Set up collisions
   */
  private setupCollisions(): void {
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platforms);
    
    // Expandable platform triggers
    // Expandable platforms use distance-based detection in update loop
    // No explicit collision setup needed here
    
    // Interstitial door triggers
    this.interstitialDoors.forEach(door => {
      const zone = this.add.zone(door.x, door.y, 120, 200);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      
      this.physics.add.overlap(
        this.player,
        zone,
        () => {
          if (!door.isOpen && !this.isMinigameActive) {
            this.startMinigame(door);
          }
        },
        undefined,
        this
      );
    });
  }

  // ============================================================================
  // EXIT PORTAL
  // ============================================================================

  /**
   * Create exit portal
   */
  private createExitPortal(): void {
    const portal = this.add.container(LEVEL_CONFIG.width - 100, LEVEL_CONFIG.groundHeight - 100);
    portal.setDepth(100);
    
    // Rainbow glow
    const glow = this.add.graphics();
    LEVEL_CONFIG.rainbowColors.forEach((color, i) => {
      glow.lineStyle(3, color, 0.5);
      glow.strokeCircle(0, 0, 60 - i * 5);
    });
    portal.add(glow);
    
    const ring = this.add.graphics();
    ring.lineStyle(4, 0xffffff, 1);
    ring.strokeCircle(0, 0, 50);
    portal.add(ring);
    
    const label = this.add.text(0, 80, 'EXIT', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    label.setOrigin(0.5);
    portal.add(label);
    
    this.tweens.add({
      targets: ring,
      angle: 360,
      duration: 3000,
      repeat: -1,
    });
    
    const exitZone = this.add.zone(LEVEL_CONFIG.width - 100, LEVEL_CONFIG.groundHeight - 100, 80, 80);
    this.physics.world.enable(exitZone, Phaser.Physics.Arcade.STATIC_BODY);
    
    this.physics.add.overlap(
      this.player,
      exitZone,
      this.handleLevelComplete as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  /**
   * Handle level completion
   */
  private handleLevelComplete(): void {
    if (this.isLevelComplete) return;
    this.isLevelComplete = true;
    
    console.log('[World3] Rich Media Rainbow complete!');
    console.log(`Final engagement: ${this.engagementValue}%`);
    
    this.cameras.main.fadeOut(1000);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenuScene');
    });
  }

  // ============================================================================
  // UPDATE LOOP
  // ============================================================================

  update(time: number, delta: number): void {
    if (this.isLevelComplete || this.isMinigameActive) return;
    
    this.player.update(time, delta);
    
    // Check expandable platform proximity
    this.expandablePlatforms.forEach((platform, idx) => {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        platform.container.x,
        platform.container.y
      );
      
      if (dist < 100 && !platform.isExpanded) {
        this.expandPlatform(idx);
      } else if (dist > 200 && platform.isExpanded) {
        this.collapsePlatform(idx);
      }
    });
    
    // Check breakout trigger
    if (this.player.x > 3500 && this.player.x < 3700 && !this.isInBreakout) {
      this.startBreakout();
    }
    
    // Update breakout
    if (this.isInBreakout) {
      this.updateBreakout();
    }
  }

  /**
   * Clean up
   */
  shutdown(): void {
    this.hud?.destroy();
  }
}
