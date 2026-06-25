/**
 * FinalWorld_WalledGarden - The Walled Garden Showdown
 * 
 * The climactic final level featuring Emperor GAMA (Google, Apple, Meta, Amazon)
 * A walled garden fortress representing the major platform ecosystems.
 * 
 * This world teaches:
 * - Walled gardens and closed ecosystems
 * - First-party data importance
 * - Open web vs. closed platforms
 * - Cross-platform identity challenges
 * - The future of advertising
 * 
 * Boss: Emperor GAMA - A multi-phase boss with 4 forms (G, A, M, A)
 */

import Phaser from 'phaser';
import { BaseAdTechScene } from './BaseAdTechScene';
import { Player } from '../entities/Player';
import { HUD } from '../ui/HUD';

/**
 * Level configuration
 */
const LEVEL_CONFIG = {
  width: 4000,
  height: 1200,
  groundHeight: 1100,
  
  // Boss arena
  arenaStart: 1500,
  arenaEnd: 3500,
};

/**
 * Boss phase configuration
 */
interface BossPhase {
  name: string;
  emoji: string;
  color: number;
  health: number;
  attacks: string[];
  weakness: string;
}

const BOSS_PHASES: BossPhase[] = [
  {
    name: 'GOOGLE',
    emoji: '🔍',
    color: 0x4285f4,
    health: 100,
    attacks: ['search-laser', 'cookie-deprecation'],
    weakness: 'First-party data',
  },
  {
    name: 'APPLE',
    emoji: '🍎',
    color: 0xa3aaae,
    health: 100,
    attacks: ['att-shield', 'mail-privacy'],
    weakness: 'Direct relationships',
  },
  {
    name: 'META',
    emoji: '👤',
    color: 0x1877f2,
    health: 100,
    attacks: ['social-vortex', 'pixel-block'],
    weakness: 'Contextual targeting',
  },
  {
    name: 'AMAZON',
    emoji: '📦',
    color: 0xff9900,
    health: 100,
    attacks: ['commerce-crush', 'data-silo'],
    weakness: 'Open web unity',
  },
];

export class FinalWorld_WalledGarden extends BaseAdTechScene {
  // Entities
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  
  // Boss
  private boss!: Phaser.GameObjects.Container;
  private bossPhase: number = 0;
  private bossHealth: number = 100;
  private bossMaxHealth: number = 100;
  private isBossFight: boolean = false;
  private bossDefeated: boolean = false;
  
  // Boss components
  private bossBody!: Phaser.GameObjects.Graphics;
  private bossEye!: Phaser.GameObjects.Container;
  private bossHealthBar!: Phaser.GameObjects.Container;
  private bossAttackZones: Phaser.GameObjects.Zone[] = [];
  
  // Walled garden walls
  private walls: Phaser.GameObjects.Graphics[] = [];
  private wallBreached: boolean[] = [false, false, false, false];
  
  // Power-ups (first-party data tokens)
  private dataTokens!: Phaser.Physics.Arcade.Group;
  private collectedTokens: number = 0;
  
  // UI
  private hud!: HUD;
  private phaseIndicator!: Phaser.GameObjects.Container;
  private tokenCounter!: Phaser.GameObjects.Container;
  
  // Level state
  private isLevelComplete: boolean = false;

  constructor() {
    super({ key: 'FinalWorld_WalledGarden' });
  }

  init(): void {
    super.init();
    console.log('[FinalWorld] Initializing Walled Garden');
  }

  create(): void {
    super.create();
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Create visuals
    this.createBackground();
    
    // Create level geometry
    this.createGround();
    this.createPlatforms();
    
    // Create walled garden structure
    this.createWalledGarden();
    
    // Create data tokens
    this.createDataTokens();
    
    // Create player
    this.createPlayer();
    
    // Create boss (but don't activate yet)
    this.createBoss();
    
    // Create UI elements
    this.createPhaseIndicator();
    this.createTokenCounter();
    
    // Set up camera
    this.setupCamera();
    
    // Create HUD
    this.hud = new HUD(this, this.budgetSystem, this.viewabilityTracker, {
      worldNumber: 7,
      worldName: 'Walled Garden',
      color: '#f472b6'
    });
    
    // Set up collisions
    this.setupCollisions();
    
    // Play intro sequence
    this.playIntroSequence();
    
    console.log('[FinalWorld] Walled Garden created');
  }

  /**
   * Implement abstract method from BaseAdTechScene
   */
  protected setupAdTechMechanics(): void {
    this.budgetSystem.reset({
      totalBudget: 5000,
      pricingModel: 'CPA',
      currentSpend: 0,
    });
    
    this.budgetSystem.setRates({
      CPM: 10.00,
      CPC: 2.00,
      CPA: 50.00,
    });
  }

  // ============================================================================
  // BACKGROUND & VISUALS
  // ============================================================================

  /**
   * Create epic final battle background
   */
  private createBackground(): void {
    // Dark ominous sky with gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a0a2e, 0x1a0a2e);
    sky.fillRect(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Ominous clouds
    for (let i = 0; i < 10; i++) {
      const cloud = this.add.graphics();
      const x = i * 400;
      const y = Phaser.Math.Between(50, 200);
      
      cloud.fillStyle(0x2a1a3e, 0.6);
      cloud.fillEllipse(x, y, 200, 60);
      cloud.fillStyle(0x1a0a2e, 0.4);
      cloud.fillEllipse(x + 50, y + 20, 150, 50);
      
      cloud.setScrollFactor(0.2);
      
      // Slow movement
      this.tweens.add({
        targets: cloud,
        x: cloud.x + 100,
        duration: 20000,
        yoyo: true,
        repeat: -1,
      });
    }
    
    // Lightning effects
    this.time.addEvent({
      delay: 5000,
      callback: () => this.createLightning(),
      loop: true,
    });
    
    // Walled garden fortress silhouette
    this.createFortressSilhouette();
  }

  /**
   * Create fortress silhouette
   */
  private createFortressSilhouette(): void {
    const fortress = this.add.graphics();
    fortress.setScrollFactor(0.3);
    
    // Main fortress shape
    fortress.fillStyle(0x1a0a2e, 0.8);
    
    // Left tower
    fortress.fillRect(1800, 200, 200, 800);
    fortress.beginPath();
    fortress.moveTo(1800, 200);
    fortress.lineTo(1900, 50);
    fortress.lineTo(2000, 200);
    fortress.closePath();
    fortress.fillPath();
    
    // Right tower
    fortress.fillRect(2800, 200, 200, 800);
    fortress.beginPath();
    fortress.moveTo(2800, 200);
    fortress.lineTo(2900, 50);
    fortress.lineTo(3000, 200);
    fortress.closePath();
    fortress.fillPath();
    
    // Central tower (tallest)
    fortress.fillRect(2300, 100, 300, 900);
    fortress.beginPath();
    fortress.moveTo(2300, 100);
    fortress.lineTo(2450, -100);
    fortress.lineTo(2600, 100);
    fortress.closePath();
    fortress.fillPath();
    
    // "GAMA" letters on towers
    const letters = ['G', 'A', 'M', 'A'];
    const positions = [1900, 2350, 2550, 2900];
    
    letters.forEach((letter, i) => {
      const text = this.add.text(positions[i], 300, letter, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '60px',
        color: '#' + BOSS_PHASES[i].color.toString(16).padStart(6, '0'),
      });
      text.setOrigin(0.5);
      text.setAlpha(0.3);
      text.setScrollFactor(0.3);
    });
  }

  /**
   * Create lightning effect
   */
  private createLightning(): void {
    const lightning = this.add.graphics();
    lightning.setScrollFactor(0);
    lightning.setDepth(999);
    
    const startX = Phaser.Math.Between(100, 1180);
    const startY = 0;
    let currentX = startX;
    let currentY = startY;
    
    lightning.lineStyle(3, 0xffffff, 1);
    lightning.beginPath();
    lightning.moveTo(currentX, currentY);
    
    // Create jagged lightning bolt
    while (currentY < 400) {
      currentX += Phaser.Math.Between(-30, 30);
      currentY += Phaser.Math.Between(20, 50);
      lightning.lineTo(currentX, currentY);
    }
    
    lightning.strokePath();
    
    // Flash effect
    this.cameras.main.flash(100, 255, 255, 255);
    
    // Fade out lightning
    this.tweens.add({
      targets: lightning,
      alpha: 0,
      duration: 200,
      onComplete: () => lightning.destroy(),
    });
  }

  // ============================================================================
  // LEVEL GEOMETRY
  // ============================================================================

  /**
   * Create ground platforms
   */
  private createGround(): void {
    this.ground = this.physics.add.staticGroup();
    
    const tilesNeeded = Math.ceil(LEVEL_CONFIG.width / 32);
    
    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.ground.create(
        i * 32 + 16,
        LEVEL_CONFIG.groundHeight + 16,
        'tile-ground'
      );
      tile.setImmovable(true);
      tile.setTint(0x2a1a3e);
      tile.refreshBody();
    }
    
    // Dark arena floor
    const floor = this.add.graphics();
    floor.fillStyle(0x1a0a2e, 1);
    floor.fillRect(0, LEVEL_CONFIG.groundHeight, LEVEL_CONFIG.width, 100);
    
    // Runes on floor in arena
    for (let i = 0; i < 20; i++) {
      const runeX = LEVEL_CONFIG.arenaStart + 100 + i * 100;
      floor.fillStyle(BOSS_PHASES[i % 4].color, 0.3);
      floor.fillCircle(runeX, LEVEL_CONFIG.groundHeight + 20, 15);
    }
  }

  /**
   * Create platforms
   */
  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    // Platforms leading to arena
    const leadInPlatforms = [
      { x: 300, y: 950, w: 150 },
      { x: 600, y: 800, w: 150 },
      { x: 900, y: 650, w: 150 },
      { x: 1200, y: 800, w: 150 },
    ];
    
    leadInPlatforms.forEach(def => {
      this.createArenaPlatform(def.x, def.y, def.w);
    });
    
    // Arena platforms
    const arenaPlatforms = [
      { x: 1800, y: 850, w: 200 },
      { x: 2200, y: 700, w: 200 },
      { x: 2600, y: 850, w: 200 },
      { x: 3000, y: 700, w: 200 },
    ];
    
    arenaPlatforms.forEach(def => {
      this.createArenaPlatform(def.x, def.y, def.w);
    });
  }

  /**
   * Create arena platform
   */
  private createArenaPlatform(x: number, y: number, width: number): void {
    const tilesNeeded = Math.ceil(width / 32);
    
    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.platforms.create(
        x - width / 2 + i * 32 + 16,
        y,
        'tile-ground'
      );
      tile.setImmovable(true);
      tile.setTint(0x4a2a6e);
      tile.refreshBody();
    }
  }

  /**
   * Create walled garden structure
   */
  private createWalledGarden(): void {
    const wallPositions = [
      { x: 1600, label: 'GOOGLE WALL', color: BOSS_PHASES[0].color },
      { x: 2100, label: 'APPLE WALL', color: BOSS_PHASES[1].color },
      { x: 2700, label: 'META WALL', color: BOSS_PHASES[2].color },
      { x: 3300, label: 'AMAZON WALL', color: BOSS_PHASES[3].color },
    ];
    
    wallPositions.forEach((wall) => {
      const wallGraphics = this.add.graphics();
      
      // Wall structure
      wallGraphics.fillStyle(wall.color, 0.8);
      wallGraphics.fillRect(wall.x - 20, 300, 40, 800);
      
      // Wall glow
      wallGraphics.fillStyle(wall.color, 0.2);
      wallGraphics.fillRect(wall.x - 60, 300, 120, 800);
      
      // Bricks pattern
      for (let i = 0; i < 20; i++) {
        wallGraphics.fillStyle(0x000000, 0.3);
        wallGraphics.fillRect(wall.x - 18, 310 + i * 40, 36, 2);
      }
      
      this.walls.push(wallGraphics);
      
      // Wall label
      const label = this.add.text(wall.x, 280, wall.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#' + wall.color.toString(16).padStart(6, '0'),
      });
      label.setOrigin(0.5);
    });
  }

  /**
   * Create data tokens (power-ups)
   */
  private createDataTokens(): void {
    this.dataTokens = this.physics.add.group();
    
    // Token positions
    const tokenPositions = [
      { x: 400, y: 900 },
      { x: 700, y: 750 },
      { x: 1000, y: 600 },
      { x: 1900, y: 800 },
      { x: 2300, y: 650 },
      { x: 2700, y: 800 },
      { x: 3100, y: 650 },
    ];
    
    tokenPositions.forEach(pos => {
      const token = this.add.container(pos.x, pos.y);
      
      // Token visual
      const glow = this.add.graphics();
      glow.fillStyle(0x00ff88, 0.3);
      glow.fillCircle(0, 0, 25);
      glow.fillStyle(0x00ff88, 0.6);
      glow.fillCircle(0, 0, 15);
      token.add(glow);
      
      const icon = this.add.text(0, 0, '💾', {
        fontSize: '24px',
      });
      icon.setOrigin(0.5);
      token.add(icon);
      
      const label = this.add.text(0, 25, '1P DATA', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#00ff88',
      });
      label.setOrigin(0.5);
      token.add(label);
      
      // Floating animation
      this.tweens.add({
        targets: token,
        y: pos.y - 10,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      
      // Add physics body
      this.physics.add.existing(token);
      const body = token.body as Phaser.Physics.Arcade.Body;
      body.setCircle(20);
      body.setOffset(-20, -20);
      body.setAllowGravity(false);
      
      this.dataTokens.add(token);
    });
  }

  // ============================================================================
  // BOSS CREATION
  // ============================================================================

  /**
   * Create the Emperor GAMA boss
   */
  private createBoss(): void {
    const bossX = 2500;
    const bossY = 500;
    
    this.boss = this.add.container(bossX, bossY);
    this.boss.setDepth(300);
    this.boss.setAlpha(0); // Hidden until fight starts
    
    // Boss body (changes color with phases)
    this.bossBody = this.add.graphics();
    this.drawBossBody(BOSS_PHASES[0].color);
    this.boss.add(this.bossBody);
    
    // Boss eye (all-seeing)
    this.bossEye = this.add.container(0, 0);
    
    const eyeOuter = this.add.graphics();
    eyeOuter.fillStyle(0xffffff, 1);
    eyeOuter.fillCircle(0, 0, 40);
    this.bossEye.add(eyeOuter);
    
    const eyeInner = this.add.graphics();
    eyeInner.fillStyle(0x000000, 1);
    eyeInner.fillCircle(0, 0, 20);
    eyeInner.setName('pupil');
    this.bossEye.add(eyeInner);
    
    const eyeGlow = this.add.graphics();
    eyeGlow.fillStyle(BOSS_PHASES[0].color, 0.5);
    eyeGlow.fillCircle(0, 0, 50);
    eyeGlow.setName('glow');
    this.bossEye.add(eyeGlow);
    
    this.boss.add(this.bossEye);
    
    // Boss name label
    const nameLabel = this.add.text(0, -120, 'EMPEROR GAMA', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ff0000',
    });
    nameLabel.setOrigin(0.5);
    this.boss.add(nameLabel);
    
    // Current phase label
    const phaseLabel = this.add.text(0, -100, BOSS_PHASES[0].emoji + ' ' + BOSS_PHASES[0].name, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#' + BOSS_PHASES[0].color.toString(16).padStart(6, '0'),
    });
    phaseLabel.setOrigin(0.5);
    phaseLabel.setName('phaseLabel');
    this.boss.add(phaseLabel);
    
    // Boss health bar
    this.createBossHealthBar();
    
    // Boss idle animation
    this.tweens.add({
      targets: this.boss,
      y: bossY - 20,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Draw boss body with current phase color
   */
  private drawBossBody(color: number): void {
    this.bossBody.clear();
    
    // Main body (hexagonal shape)
    this.bossBody.fillStyle(0x1a0a2e, 1);
    this.bossBody.fillCircle(0, 0, 80);
    
    // Armor plates
    this.bossBody.fillStyle(color, 0.8);
    this.bossBody.lineStyle(4, color, 1);
    
    // Draw hexagonal armor
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180;
      points.push({
        x: Math.cos(angle) * 70,
        y: Math.sin(angle) * 70,
      });
    }
    
    this.bossBody.beginPath();
    this.bossBody.moveTo(points[0].x, points[0].y);
    points.forEach(p => this.bossBody.lineTo(p.x, p.y));
    this.bossBody.closePath();
    this.bossBody.strokePath();
    
    // Inner glow
    this.bossBody.fillStyle(color, 0.3);
    this.bossBody.fillCircle(0, 0, 50);
  }

  /**
   * Create boss health bar
   */
  private createBossHealthBar(): void {
    this.bossHealthBar = this.add.container(640, 100);
    this.bossHealthBar.setDepth(900);
    this.bossHealthBar.setScrollFactor(0);
    this.bossHealthBar.setVisible(false);
    
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(-250, -20, 500, 40, 8);
    bg.lineStyle(2, 0xff0000, 1);
    bg.strokeRoundedRect(-250, -20, 500, 40, 8);
    this.bossHealthBar.add(bg);
    
    // Health fill
    const healthFill = this.add.graphics();
    healthFill.setName('healthFill');
    this.bossHealthBar.add(healthFill);
    this.updateBossHealthBar();
    
    // Boss name
    const name = this.add.text(0, -35, '👑 EMPEROR GAMA', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ff0000',
    });
    name.setOrigin(0.5);
    this.bossHealthBar.add(name);
    
    // Phase indicator
    const phase = this.add.text(0, 0, BOSS_PHASES[0].emoji + ' PHASE 1: ' + BOSS_PHASES[0].name, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ffffff',
    });
    phase.setOrigin(0.5);
    phase.setName('phaseText');
    this.bossHealthBar.add(phase);
  }

  /**
   * Update boss health bar visual
   */
  private updateBossHealthBar(): void {
    const healthFill = this.bossHealthBar.getByName('healthFill') as Phaser.GameObjects.Graphics;
    if (!healthFill) return;
    
    healthFill.clear();
    
    const healthPercent = this.bossHealth / this.bossMaxHealth;
    const width = 480 * healthPercent;
    
    // Color based on current phase
    const color = BOSS_PHASES[this.bossPhase].color;
    
    healthFill.fillStyle(color, 1);
    healthFill.fillRoundedRect(-240, -10, width, 20, 4);
    
    // Update phase text
    const phaseText = this.bossHealthBar.getByName('phaseText') as Phaser.GameObjects.Text;
    if (phaseText) {
      const phase = BOSS_PHASES[this.bossPhase];
      phaseText.setText(`${phase.emoji} PHASE ${this.bossPhase + 1}: ${phase.name}`);
    }
  }

  // ============================================================================
  // UI ELEMENTS
  // ============================================================================

  /**
   * Create phase indicator
   */
  private createPhaseIndicator(): void {
    this.phaseIndicator = this.add.container(640, 680);
    this.phaseIndicator.setDepth(800);
    this.phaseIndicator.setScrollFactor(0);
    this.phaseIndicator.setVisible(false);
    
    // Phase indicators
    BOSS_PHASES.forEach((phase, index) => {
      const x = (index - 1.5) * 80;
      
      const indicator = this.add.graphics();
      indicator.fillStyle(phase.color, 0.3);
      indicator.fillCircle(x, 0, 25);
      indicator.lineStyle(2, phase.color, 0.8);
      indicator.strokeCircle(x, 0, 25);
      indicator.setName(`indicator_${index}`);
      this.phaseIndicator.add(indicator);
      
      const emoji = this.add.text(x, 0, phase.emoji, {
        fontSize: '20px',
      });
      emoji.setOrigin(0.5);
      this.phaseIndicator.add(emoji);
    });
  }

  /**
   * Create token counter
   */
  private createTokenCounter(): void {
    this.tokenCounter = this.add.container(100, 180);
    this.tokenCounter.setDepth(800);
    this.tokenCounter.setScrollFactor(0);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-80, -30, 160, 60, 8);
    bg.lineStyle(1, 0x00ff88, 0.5);
    bg.strokeRoundedRect(-80, -30, 160, 60, 8);
    this.tokenCounter.add(bg);
    
    const icon = this.add.text(-50, 0, '💾', {
      fontSize: '24px',
    });
    icon.setOrigin(0.5);
    this.tokenCounter.add(icon);
    
    const count = this.add.text(20, 0, '0 / 7', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#00ff88',
    });
    count.setOrigin(0.5);
    count.setName('count');
    this.tokenCounter.add(count);
    
    const label = this.add.text(0, 18, '1ST PARTY DATA', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#888888',
    });
    label.setOrigin(0.5);
    this.tokenCounter.add(label);
  }

  // ============================================================================
  // INTRO SEQUENCE
  // ============================================================================

  /**
   * Play intro sequence
   */
  private playIntroSequence(): void {
    this.cameras.main.fadeIn(1000);
    
    // Dramatic text sequence
    const messages = [
      { text: 'THE WALLED GARDEN', delay: 500, duration: 2000 },
      { text: 'EMPEROR GAMA AWAITS', delay: 3000, duration: 2000 },
      { text: 'COLLECT 1ST PARTY DATA TO BREACH THE WALLS', delay: 5500, duration: 2500 },
    ];
    
    messages.forEach(msg => {
      this.time.delayedCall(msg.delay, () => {
        const text = this.add.text(640, 360, msg.text, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '16px',
          color: '#ff0000',
          stroke: '#000000',
          strokeThickness: 4,
        });
        text.setOrigin(0.5);
        text.setScrollFactor(0);
        text.setDepth(999);
        
        this.tweens.add({
          targets: text,
          alpha: 0,
          y: 340,
          duration: msg.duration,
          onComplete: () => text.destroy(),
        });
      });
    });
    
    // Enable gameplay after intro
    this.time.delayedCall(8000, () => {
      // Intro complete, gameplay enabled
    });
  }

  // ============================================================================
  // PLAYER & COLLISIONS
  // ============================================================================

  /**
   * Create player
   */
  private createPlayer(): void {
    this.player = new Player(this, 100, LEVEL_CONFIG.groundHeight - 50);
    this.player.setBudgetManager(this.budgetSystem);
    this.add.existing(this.player);
  }

  /**
   * Set up camera
   */
  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 50);
  }

  /**
   * Set up collisions
   */
  private setupCollisions(): void {
    // Player vs ground
    this.physics.add.collider(this.player, this.ground);
    
    // Player vs platforms
    this.physics.add.collider(this.player, this.platforms);
    
    // Player vs data tokens
    this.physics.add.overlap(this.player, this.dataTokens, (_player, token) => {
      this.collectToken(token as Phaser.GameObjects.Container);
    });
  }

  /**
   * Collect a data token
   */
  private collectToken(token: Phaser.GameObjects.Container): void {
    if (!token.active) return;
    
    this.collectedTokens++;
    
    // Update counter
    const count = this.tokenCounter.getByName('count') as Phaser.GameObjects.Text;
    if (count) {
      count.setText(`${this.collectedTokens} / 7`);
    }
    
    // Visual feedback
    this.tweens.add({
      targets: token,
      y: token.y - 50,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => token.destroy(),
    });
    
    // Sound
    try { this.sound.play('bid_win', { volume: 0.5 }); } catch { /* Audio may not be loaded */ }
    
    // Check if enough tokens to start boss fight
    if (this.collectedTokens >= 5 && !this.isBossFight) {
      this.startBossFight();
    }
  }

  // ============================================================================
  // BOSS FIGHT
  // ============================================================================

  /**
   * Start the boss fight
   */
  private startBossFight(): void {
    this.isBossFight = true;
    
    console.log('[FinalWorld] Boss fight starting!');
    
    // Camera focus on arena
    this.cameras.main.pan(2500, 600, 2000, 'Power2');
    
    // Show boss
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: this.boss,
        alpha: 1,
        duration: 1000,
      });
      
      // Show UI
      this.bossHealthBar.setVisible(true);
      this.phaseIndicator.setVisible(true);
      
      // Boss entrance
      this.cameras.main.shake(500, 0.02);
      
      // Start boss behavior
      this.startBossPhase(0);
      
      // Resume following player
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    });
  }

  /**
   * Start a boss phase
   */
  private startBossPhase(phase: number): void {
    if (phase >= BOSS_PHASES.length) {
      this.defeatBoss();
      return;
    }
    
    this.bossPhase = phase;
    const phaseConfig = BOSS_PHASES[phase];
    
    // Update visuals
    this.drawBossBody(phaseConfig.color);
    
    // Update eye glow
    const glow = this.bossEye.getByName('glow') as Phaser.GameObjects.Graphics;
    if (glow) {
      glow.clear();
      glow.fillStyle(phaseConfig.color, 0.5);
      glow.fillCircle(0, 0, 50);
    }
    
    // Update phase label
    const phaseLabel = this.boss.getByName('phaseLabel') as Phaser.GameObjects.Text;
    if (phaseLabel) {
      phaseLabel.setText(phaseConfig.emoji + ' ' + phaseConfig.name);
      phaseLabel.setColor('#' + phaseConfig.color.toString(16).padStart(6, '0'));
    }
    
    // Reset health for this phase
    this.bossHealth = phaseConfig.health;
    this.bossMaxHealth = phaseConfig.health;
    this.updateBossHealthBar();
    
    // Update phase indicator
    this.updatePhaseIndicator(phase);
    
    // Show phase transition message
    this.showPhaseMessage(phaseConfig);
    
    // Start attack patterns for this phase
    this.startBossAttacks(phase);
  }

  /**
   * Update phase indicator
   */
  private updatePhaseIndicator(currentPhase: number): void {
    BOSS_PHASES.forEach((phase, index) => {
      const indicator = this.phaseIndicator.getByName(`indicator_${index}`) as Phaser.GameObjects.Graphics;
      if (indicator) {
        indicator.clear();
        
        if (index < currentPhase) {
          // Defeated phase
          indicator.fillStyle(0x444444, 0.5);
          indicator.fillCircle((index - 1.5) * 80, 0, 25);
          indicator.lineStyle(2, 0x444444, 0.8);
          indicator.strokeCircle((index - 1.5) * 80, 0, 25);
        } else if (index === currentPhase) {
          // Current phase
          indicator.fillStyle(phase.color, 0.8);
          indicator.fillCircle((index - 1.5) * 80, 0, 25);
          indicator.lineStyle(3, 0xffffff, 1);
          indicator.strokeCircle((index - 1.5) * 80, 0, 25);
        } else {
          // Future phase
          indicator.fillStyle(phase.color, 0.3);
          indicator.fillCircle((index - 1.5) * 80, 0, 25);
          indicator.lineStyle(2, phase.color, 0.8);
          indicator.strokeCircle((index - 1.5) * 80, 0, 25);
        }
      }
    });
  }

  /**
   * Show phase transition message
   */
  private showPhaseMessage(phase: BossPhase): void {
    const container = this.add.container(640, 360);
    container.setScrollFactor(0);
    container.setDepth(999);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(-200, -60, 400, 120, 16);
    bg.lineStyle(3, phase.color, 1);
    bg.strokeRoundedRect(-200, -60, 400, 120, 16);
    container.add(bg);
    
    const emoji = this.add.text(0, -30, phase.emoji, {
      fontSize: '40px',
    });
    emoji.setOrigin(0.5);
    container.add(emoji);
    
    const name = this.add.text(0, 20, phase.name + ' PHASE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#' + phase.color.toString(16).padStart(6, '0'),
    });
    name.setOrigin(0.5);
    container.add(name);
    
    const weakness = this.add.text(0, 45, 'Weakness: ' + phase.weakness, {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#00ff88',
    });
    weakness.setOrigin(0.5);
    container.add(weakness);
    
    // Animate out
    this.tweens.add({
      targets: container,
      alpha: 0,
      y: 300,
      duration: 2000,
      delay: 1500,
      onComplete: () => container.destroy(),
    });
  }

  /**
   * Start boss attack patterns
   */
  private startBossAttacks(phase: number): void {
    // Clear existing attacks
    this.bossAttackZones.forEach(zone => zone.destroy());
    this.bossAttackZones = [];
    
    // Phase-specific attack timer
    this.time.addEvent({
      delay: 3000,
      callback: () => this.executeBossAttack(phase),
      loop: true,
    });
  }

  /**
   * Execute a boss attack
   */
  private executeBossAttack(phase: number): void {
    if (this.bossDefeated || !this.isBossFight) return;
    
    const phaseConfig = BOSS_PHASES[phase];
    
    // Create attack visual (simple projectile for now)
    const projectile = this.add.graphics();
    projectile.fillStyle(phaseConfig.color, 0.8);
    projectile.fillCircle(0, 0, 15);
    projectile.setPosition(this.boss.x, this.boss.y);
    
    // Calculate direction to player
    const angle = Phaser.Math.Angle.Between(
      this.boss.x,
      this.boss.y,
      this.player.x,
      this.player.y
    );
    
    const speed = 300;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    // Animate projectile
    this.tweens.add({
      targets: projectile,
      x: projectile.x + vx * 3,
      y: projectile.y + vy * 3,
      duration: 2000,
      onComplete: () => projectile.destroy(),
    });
    
    // Create collision zone (simplified)
    const zone = this.add.zone(this.boss.x, this.boss.y, 30, 30);
    this.physics.world.enable(zone);
    const body = zone.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);
    body.setAllowGravity(false);
    
    this.bossAttackZones.push(zone);
    
    this.physics.add.overlap(this.player, zone, () => {
      this.playerHitByBoss();
      zone.destroy();
    });
    
    // Destroy after 2 seconds
    this.time.delayedCall(2000, () => {
      if (zone.active) zone.destroy();
    });
  }

  /**
   * Player hit by boss
   */
  private playerHitByBoss(): void {
    // Screen shake
    this.cameras.main.shake(200, 0.02);
    
    // Drain budget - using registerClick for damage events
    this.budgetSystem.registerClick();
    
    // Flash red
    this.cameras.main.flash(200, 255, 0, 0);
  }

  /**
   * Damage the boss
   */
  damageBoss(amount: number): void {
    if (this.bossDefeated || !this.isBossFight) return;
    
    this.bossHealth -= amount;
    
    // Flash effect
    this.tweens.add({
      targets: this.boss,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });
    
    this.updateBossHealthBar();
    
    if (this.bossHealth <= 0) {
      // Phase complete
      this.breachWall(this.bossPhase);
      
      // Move to next phase
      this.time.delayedCall(1500, () => {
        this.startBossPhase(this.bossPhase + 1);
      });
    }
  }

  /**
   * Breach a walled garden wall
   */
  private breachWall(index: number): void {
    if (index >= this.walls.length) return;
    
    this.wallBreached[index] = true;
    
    const wall = this.walls[index];
    
    // Wall crumble animation
    this.tweens.add({
      targets: wall,
      alpha: 0,
      duration: 1000,
    });
    
    // Particle effect
    if (this.textures.exists('particle-glow')) {
      const emitter = this.add.particles(1600 + index * 500, 600, 'particle-glow', {
        speed: { min: 100, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 1000,
        quantity: 30,
        tint: BOSS_PHASES[index].color,
        blendMode: 'ADD',
      });
      
      this.time.delayedCall(1000, () => emitter.destroy());
    }
    
    // Screen shake
    this.cameras.main.shake(500, 0.03);
    
    // Sound
    try { this.sound.play('conversion_chime', { volume: 0.7 }); } catch { /* Audio may not be loaded */ }
  }

  /**
   * Defeat the boss
   */
  private defeatBoss(): void {
    this.bossDefeated = true;
    
    console.log('[FinalWorld] Emperor GAMA defeated!');
    
    // Epic defeat animation
    this.tweens.add({
      targets: this.boss,
      scale: 2,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
    });
    
    // Hide boss UI
    this.bossHealthBar.setVisible(false);
    this.phaseIndicator.setVisible(false);
    
    // Victory sequence
    this.time.delayedCall(2500, () => {
      this.showVictoryScreen();
    });
  }

  /**
   * Show victory screen
   */
  private showVictoryScreen(): void {
    const victory = this.add.container(640, 360);
    victory.setDepth(999);
    victory.setScrollFactor(0);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.95);
    bg.fillRoundedRect(-300, -200, 600, 400, 24);
    bg.lineStyle(4, 0xffd700, 1);
    bg.strokeRoundedRect(-300, -200, 600, 400, 24);
    victory.add(bg);
    
    const title = this.add.text(0, -150, '🏆 VICTORY! 🏆', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffd700',
    });
    title.setOrigin(0.5);
    victory.add(title);
    
    const subtitle = this.add.text(0, -100, 'THE WALLED GARDENS HAVE FALLEN', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#00ff88',
    });
    subtitle.setOrigin(0.5);
    victory.add(subtitle);
    
    // Stats
    const stats = [
      `Budget Remaining: $${this.budgetSystem.getRemainingBudget().toFixed(2)}`,
      `1st Party Data: ${this.collectedTokens} / 7`,
      `Walls Breached: ${this.wallBreached.filter(b => b).length} / 4`,
      `Emperor GAMA: DEFEATED`,
    ];
    
    stats.forEach((stat, i) => {
      const text = this.add.text(0, -40 + i * 30, stat, {
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
      victory.add(text);
    });
    
    const message = this.add.text(0, 120, 'THE OPEN WEB PREVAILS!\nFirst-party data triumphs over walled gardens.', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#00ff88',
      align: 'center',
    });
    message.setOrigin(0.5);
    victory.add(message);
    
    // Animate in
    victory.setScale(0);
    this.tweens.add({
      targets: victory,
      scale: 1,
      duration: 500,
      ease: 'Back.out',
    });
    
    // Complete level after delay
    this.time.delayedCall(5000, () => {
      this.completeLevel();
    });
  }

  /**
   * Complete the level
   */
  private completeLevel(): void {
    this.isLevelComplete = true;
    
    console.log('[FinalWorld] Game complete!');
    
    this.cameras.main.fadeOut(2000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Return to main menu or show credits
      this.scene.start('MainMenu');
    });
  }

  // ============================================================================
  // UPDATE LOOP
  // ============================================================================

  update(time: number, delta: number): void {
    if (!this.player || this.isLevelComplete) return;
    
    // Update player
    this.player.update(time, delta);
    
    // Update HUD
    if (this.hud) {
      this.hud.update();
    }
    
    // Boss eye tracking
    if (this.isBossFight && this.bossEye && !this.bossDefeated) {
      const pupil = this.bossEye.getByName('pupil') as Phaser.GameObjects.Graphics;
      if (pupil) {
        const angle = Phaser.Math.Angle.Between(
          this.boss.x,
          this.boss.y,
          this.player.x,
          this.player.y
        );
        pupil.setPosition(
          Math.cos(angle) * 10,
          Math.sin(angle) * 10
        );
      }
    }
    
    // Check if player is near boss for damage (jumping on boss)
    if (this.isBossFight && !this.bossDefeated) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.boss.x,
        this.boss.y
      );
      
      if (dist < 100 && this.player.body && (this.player.body as Phaser.Physics.Arcade.Body).velocity.y > 0) {
        // Player jumping on boss
        this.damageBoss(25);
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(-400); // Bounce
      }
    }
  }

  /**
   * Clean up resources
   */
  shutdown(): void {
    // Clean up any event listeners or timers
  }
}
