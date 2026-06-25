/**
 * World1_InventoryValley - First Playable World
 * 
 * Introduction to AdTech concepts through platforming:
 * - Ad Slots: Fixed-width (128px) and flexible platforms
 * - CPM Counter: Every 1000 pixels traveled = 1 CPM unit
 * - Click Stream: Enemies require "click" (spacebar) to defeat
 * - Conversion Zone: Golden flagpole at end
 * 
 * This world teaches:
 * - Basic ad inventory concepts
 * - CPM/CPC/CPA pricing models
 * - Viewability basics
 */

import { BaseAdTechScene } from './BaseAdTechScene';
import { Player } from '../entities/Player';
import { HUD } from '../ui/HUD';
import { AdServerGate } from '../entities/AdServerGate';

/**
 * Level configuration
 */
const LEVEL_CONFIG = {
  width: 4000,
  height: 720,
  groundHeight: 620,
  platformCount: 15,
};

export class World1_InventoryValley extends BaseAdTechScene {
  // Entities
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private coins!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private powerups!: Phaser.Physics.Arcade.Group;
  private flagpole!: Phaser.Physics.Arcade.Sprite;
  private adServerGates: AdServerGate[] = [];
  
  // UI
  private hud!: HUD;
  
  // Level state
  private isLevelComplete: boolean = false;
  private lastPlayerX: number = 0;

  constructor() {
    super({ key: 'World1_InventoryValley' });
  }

  init(): void {
    super.init();
    console.log('[World1] Initializing Inventory Valley');
  }

  create(): void {
    super.create();
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Create background
    this.createBackground();
    
    // Create level geometry
    this.createGround();
    this.createPlatforms();
    
    // Create collectibles
    this.createCoins();
    this.createPowerups();
    
    // Create enemies
    this.createEnemies();
    
    // Create ad server gates (checkpoints)
    this.createAdServerGates();
    
    // Create goal
    this.createFlagpole();
    
    // Create player
    this.createPlayer();
    
    // Set up camera
    this.setupCamera();
    
    // Create HUD
    this.hud = new HUD(this, this.budgetSystem, this.viewabilityTracker, {
      worldNumber: 1,
      worldName: 'Inventory Valley',
      color: '#00ff88'
    });
    
    // Set up collisions
    this.setupCollisions();
    
    // Fade in
    this.cameras.main.fadeIn(500);
    
    // Show controls hint for first-time players
    this.time.delayedCall(1000, () => {
      this.showControlsHint(6000);
    });
    
    console.log('[World1] Scene created');
  }

  /**
   * Implement abstract method from BaseAdTechScene
   */
  protected setupAdTechMechanics(): void {
    // Configure budget for this level
    this.budgetSystem.reset({
      totalBudget: 1000,
      pricingModel: 'CPM',
      currentSpend: 0,
    });
    
    // Set competitive CPM rate for ad inventory
    this.budgetSystem.setRates({
      CPM: 3.50,
      CPC: 0.75,
      CPA: 15.00,
    });
  }

  /**
   * Create parallax background layers
   */
  private createBackground(): void {
    // Sky gradient
    const skyGraphics = this.add.graphics();
    skyGraphics.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a3e, 0x1a1a3e);
    skyGraphics.fillRect(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    skyGraphics.setScrollFactor(0);
    
    // Background data streams (parallax layer)
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, LEVEL_CONFIG.width);
      const y = Phaser.Math.Between(50, 400);
      const width = Phaser.Math.Between(100, 300);
      
      const streamGraphics = this.add.graphics();
      streamGraphics.lineStyle(1, 0x00ff88, 0.1);
      streamGraphics.lineBetween(0, 0, width, 0);
      streamGraphics.setPosition(x, y);
      streamGraphics.setScrollFactor(0.2);
    }
    
    // Billboard silhouettes in background
    for (let i = 0; i < 5; i++) {
      const x = 400 + i * 800;
      const y = 300;
      
      const billboard = this.add.graphics();
      billboard.fillStyle(0x1a1a2e, 0.8);
      billboard.fillRect(-60, -80, 120, 160);
      billboard.lineStyle(2, 0x00ff88, 0.2);
      billboard.strokeRect(-60, -80, 120, 160);
      billboard.setPosition(x, y);
      billboard.setScrollFactor(0.3);
    }
    
    // Grid pattern overlay
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x333333, 0.1);
    
    for (let x = 0; x < LEVEL_CONFIG.width; x += 64) {
      gridGraphics.lineBetween(x, 0, x, LEVEL_CONFIG.height);
    }
    for (let y = 0; y < LEVEL_CONFIG.height; y += 64) {
      gridGraphics.lineBetween(0, y, LEVEL_CONFIG.width, y);
    }
    gridGraphics.setScrollFactor(0.5);
  }

  /**
   * Create ground platforms
   */
  private createGround(): void {
    this.ground = this.physics.add.staticGroup();
    
    // Main ground sections with gaps
    const groundSections = [
      { start: 0, end: 800 },
      { start: 900, end: 1500 },
      { start: 1700, end: 2400 },
      { start: 2600, end: 3200 },
      { start: 3400, end: LEVEL_CONFIG.width },
    ];
    
    groundSections.forEach(section => {
      const width = section.end - section.start;
      const tilesNeeded = Math.ceil(width / 32);
      
      for (let i = 0; i < tilesNeeded; i++) {
        const tile = this.ground.create(
          section.start + i * 32 + 16,
          LEVEL_CONFIG.groundHeight + 16,
          'tile-ground'
        );
        tile.setImmovable(true);
        tile.refreshBody();
      }
    });
  }

  /**
   * Create floating platforms (ad slots)
   */
  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    // Platform definitions with AdTech context
    const platformDefs = [
      // Fixed-width ad slots (standard 128px)
      { x: 300, y: 500, type: 'billboard', width: 128 },
      { x: 600, y: 400, type: 'billboard', width: 128 },
      { x: 950, y: 450, type: 'premium', width: 128 },
      
      // Flexible platforms (responsive ad slots)
      { x: 1200, y: 350, type: 'billboard', width: 192 },
      { x: 1500, y: 480, type: 'remnant', width: 96 },
      { x: 1800, y: 400, type: 'premium', width: 160 },
      
      // Challenging section
      { x: 2100, y: 500, type: 'billboard', width: 96 },
      { x: 2300, y: 380, type: 'billboard', width: 96 },
      { x: 2500, y: 300, type: 'premium', width: 128 },
      
      // Final approach
      { x: 2800, y: 450, type: 'billboard', width: 160 },
      { x: 3100, y: 350, type: 'billboard', width: 128 },
      { x: 3400, y: 500, type: 'billboard', width: 192 },
      { x: 3650, y: 400, type: 'premium', width: 128 },
    ];
    
    platformDefs.forEach(def => {
      this.createPlatform(def.x, def.y, def.type, def.width);
    });
  }

  /**
   * Create a single platform with proper styling
   */
  private createPlatform(x: number, y: number, type: string, width: number): void {
    const tilesNeeded = Math.ceil(width / 32);
    
    let textureKey = 'tile-ground';
    if (type === 'premium') textureKey = 'tile-premium';
    if (type === 'remnant') textureKey = 'tile-remnant';
    
    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.platforms.create(
        x + i * 32 - (width / 2) + 16,
        y,
        textureKey
      );
      tile.setImmovable(true);
      tile.refreshBody();
      
      // Track for viewability
      this.viewabilityTracker.track(`platform-${x}-${i}`, tile);
    }
    
    // Add decorative border for premium platforms
    if (type === 'premium' || type === 'billboard') {
      const border = this.add.graphics();
      border.lineStyle(2, type === 'premium' ? 0xffd700 : 0x00ff88, 0.5);
      border.strokeRect(x - width / 2, y - 16, width, 32);
    }
  }

  /**
   * Create collectible coins (impressions/data)
   */
  private createCoins(): void {
    this.coins = this.physics.add.group({
      allowGravity: false,
    });
    
    // Place coins along the level
    const coinPositions = [
      // First section
      { x: 200, y: 550 }, { x: 250, y: 550 }, { x: 300, y: 550 },
      { x: 400, y: 450 }, { x: 450, y: 450 },
      { x: 600, y: 350 }, { x: 650, y: 350 },
      
      // Gap rewards
      { x: 850, y: 500 },
      
      // Mid section
      { x: 1000, y: 400 }, { x: 1050, y: 400 }, { x: 1100, y: 400 },
      { x: 1200, y: 300 }, { x: 1250, y: 300 },
      { x: 1400, y: 450 },
      
      // Challenge section
      { x: 1800, y: 350 }, { x: 1850, y: 350 },
      { x: 2100, y: 450 }, { x: 2150, y: 450 },
      { x: 2300, y: 330 }, { x: 2350, y: 330 },
      { x: 2500, y: 250 }, { x: 2550, y: 250 },
      
      // Final section
      { x: 2800, y: 400 }, { x: 2850, y: 400 },
      { x: 3100, y: 300 }, { x: 3150, y: 300 },
      { x: 3400, y: 450 },
      { x: 3650, y: 350 }, { x: 3700, y: 350 },
    ];
    
    coinPositions.forEach((pos, idx) => {
      // Alternate between 1st party and 3rd party data coins
      const isFirstParty = idx % 3 === 0;
      const textureKey = isFirstParty ? 'coin-1p-data' : 'coin-cpm';
      const value = isFirstParty ? 50 : 10;
      
      const coin = this.coins.create(pos.x, pos.y, textureKey);
      coin.setData('value', value);
      coin.setData('type', isFirstParty ? '1p' : 'cpm');
      
      // Floating animation
      this.tweens.add({
        targets: coin,
        y: pos.y - 5,
        duration: 800 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      
      // Track viewability
      this.viewabilityTracker.track(`coin-${idx}`, coin);
    });
  }

  /**
   * Create power-ups
   */
  private createPowerups(): void {
    this.powerups = this.physics.add.group({
      allowGravity: false,
    });
    
    const powerupDefs = [
      { x: 500, y: 350, type: 'text' },      // Text Mushroom
      { x: 1300, y: 300, type: 'image' },    // Image Flower
      { x: 2700, y: 250, type: 'video' },    // Video Star
    ];
    
    powerupDefs.forEach(def => {
      const textureKey = `powerup-${def.type}`;
      const powerup = this.powerups.create(def.x, def.y, textureKey);
      powerup.setData('type', def.type);
      
      // Pulsing animation
      this.tweens.add({
        targets: powerup,
        scale: { from: 1, to: 1.2 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      
      // Glow effect
      const glow = this.add.graphics();
      const glowColor = def.type === 'video' ? 0xffd700 : 
                        def.type === 'image' ? 0xff6b6b : 0x00ccff;
      glow.fillStyle(glowColor, 0.2);
      glow.fillCircle(def.x, def.y, 30);
    });
  }

  /**
   * Create enemies (click blockers)
   */
  private createEnemies(): void {
    this.enemies = this.physics.add.group();
    
    const enemyPositions = [
      { x: 700, y: LEVEL_CONFIG.groundHeight - 16 },
      { x: 1100, y: LEVEL_CONFIG.groundHeight - 16 },
      { x: 1600, y: LEVEL_CONFIG.groundHeight - 16 },
      { x: 2000, y: LEVEL_CONFIG.groundHeight - 16 },
      { x: 2900, y: LEVEL_CONFIG.groundHeight - 16 },
      { x: 3300, y: LEVEL_CONFIG.groundHeight - 16 },
    ];
    
    enemyPositions.forEach((pos) => {
      const enemy = this.enemies.create(pos.x, pos.y, 'enemy-basic');
      enemy.setCollideWorldBounds(true);
      enemy.setData('direction', 1);
      enemy.setData('speed', 60);
      enemy.setData('startX', pos.x);
      enemy.setData('range', 80);
      
      // Set up patrol
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(60);
      body.setAllowGravity(true);
    });
  }

  /**
   * Create Ad Server Gate checkpoints
   */
  private createAdServerGates(): void {
    // First checkpoint - mid-level (First-Party Server)
    const gate1 = new AdServerGate(this, 2000, LEVEL_CONFIG.groundHeight, {
      requiredImpressions: 150,
      serverType: 'first-party',
      height: 180,
    });
    
    gate1.on('gate-opened', () => {
      this.showFloatingText(2000, LEVEL_CONFIG.groundHeight - 100, 'DATA VALIDATED!', '#00ff88');
    });
    
    gate1.on('access-denied', () => {
      this.showFloatingText(2000, LEVEL_CONFIG.groundHeight - 100, 'Need more impressions!', '#ff4444');
    });
    
    this.adServerGates.push(gate1);
    
    // Second checkpoint - near end (Third-Party Server)
    const gate2 = new AdServerGate(this, 3200, LEVEL_CONFIG.groundHeight, {
      requiredImpressions: 300,
      serverType: 'third-party',
      height: 180,
    });
    
    gate2.on('gate-opened', () => {
      this.showFloatingText(3200, LEVEL_CONFIG.groundHeight - 100, 'SERVER SYNCED!', '#9966ff');
    });
    
    gate2.on('access-denied', () => {
      this.showFloatingText(3200, LEVEL_CONFIG.groundHeight - 100, 'Collect more data!', '#ff4444');
    });
    
    this.adServerGates.push(gate2);
  }

  /**
   * Create flagpole (conversion goal)
   */
  private createFlagpole(): void {
    const flagX = LEVEL_CONFIG.width - 150;
    const flagY = LEVEL_CONFIG.groundHeight - 64;
    
    this.flagpole = this.physics.add.sprite(flagX, flagY, 'flagpole');
    this.flagpole.setOrigin(0.5, 1);
    this.flagpole.setImmovable(true);
    (this.flagpole.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    
    // Victory glow effect
    const glow = this.add.graphics();
    glow.fillStyle(0xffd700, 0.2);
    glow.fillCircle(flagX, flagY - 64, 60);
    
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.2, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Create the player
   */
  private createPlayer(): void {
    this.player = new Player(this, 100, LEVEL_CONFIG.groundHeight - 50);
    this.player.setBudgetManager(this.budgetSystem);
    this.lastPlayerX = this.player.x;
    
    // Player events
    this.player.on('impression-collected', (item: any) => {
      // Visual feedback
      this.showFloatingText(this.player.x, this.player.y - 30, `+${item.value}`);
    });
    
    this.player.on('conversion-completed', () => {
      this.levelComplete();
    });
  }

  /**
   * Set up camera to follow player
   */
  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    this.cameras.main.setDeadzone(100, 50);
  }

  /**
   * Set up physics collisions
   */
  private setupCollisions(): void {
    // Player vs ground/platforms
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platforms);
    
    // Enemies vs ground/platforms
    this.physics.add.collider(this.enemies, this.ground);
    this.physics.add.collider(this.enemies, this.platforms);
    
    // Player vs coins
    this.physics.add.overlap(
      this.player, 
      this.coins, 
      this.collectCoin as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, 
      undefined, 
      this
    );
    
    // Player vs powerups
    this.physics.add.overlap(
      this.player, 
      this.powerups, 
      this.collectPowerup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, 
      undefined, 
      this
    );
    
    // Player vs enemies
    this.physics.add.overlap(
      this.player, 
      this.enemies, 
      this.handleEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, 
      undefined, 
      this
    );
    
    // Player vs flagpole
    this.physics.add.overlap(
      this.player, 
      this.flagpole, 
      this.reachGoal as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, 
      undefined, 
      this
    );
    
    // Player vs AdServer Gates
    this.adServerGates.forEach(gate => {
      this.physics.add.collider(
        this.player,
        gate.getBarrier(),
        () => this.handleGateCollision(gate),
        undefined,
        this
      );
    });
  }

  /**
   * Handle collision with AdServer Gate
   */
  private handleGateCollision(gate: AdServerGate): void {
    if (gate.getIsOpen()) return;
    
    // Get current impressions from player inventory
    const currentImpressions = this.player.getImpressionCount();
    
    // Try to validate and open gate
    const canPass = gate.validate(currentImpressions);
    
    if (!canPass) {
      // Provide feedback about what's needed
      const required = gate.getRequiredImpressions();
      const remaining = required - currentImpressions;
      
      if (remaining > 0) {
        // Only show denial message occasionally
        gate.denyAccess();
      }
    }
  }

  /**
   * Main update loop
   */
  update(time: number, delta: number): void {
    if (this.isLevelComplete) return;
    
    // Update player
    this.player.update(time, delta);
    
    // Update enemies (patrol)
    this.updateEnemies();
    
    // Update HUD
    this.hud.update();
    
    // Track horizontal distance for CPM
    const distanceMoved = this.player.x - this.lastPlayerX;
    if (distanceMoved > 0) {
      this.budgetSystem.trackDistance(distanceMoved);
    }
    this.lastPlayerX = this.player.x;
  }

  /**
   * Update enemy patrol behavior
   */
  private updateEnemies(): void {
    this.enemies.children.iterate((enemy: any) => {
      if (!enemy.active) return true;
      
      const startX = enemy.getData('startX');
      const range = enemy.getData('range');
      const speed = enemy.getData('speed');
      let direction = enemy.getData('direction');
      
      // Reverse at boundaries
      if (enemy.x > startX + range) {
        direction = -1;
        enemy.setData('direction', direction);
        enemy.setFlipX(true);
      } else if (enemy.x < startX - range) {
        direction = 1;
        enemy.setData('direction', direction);
        enemy.setFlipX(false);
      }
      
      enemy.setVelocityX(speed * direction);
      return true;
    });
  }

  // ============================================================================
  // COLLISION HANDLERS
  // ============================================================================

  /**
   * Collect a coin
   */
  private collectCoin(_player: Phaser.Types.Physics.Arcade.GameObjectWithBody, coinObj: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
    const coin = coinObj as Phaser.Physics.Arcade.Sprite;
    const value = coin.getData('value');
    const type = coin.getData('type');
    
    // Visual feedback
    this.showFloatingText(coin.x, coin.y, `+${value}`, 
      type === '1p' ? '#ffd700' : '#00ff88');
    
    // Update player inventory
    this.player.collectImpression(value);
    
    // Untrack from viewability
    this.viewabilityTracker.untrack(`coin-${coin.getData('index')}`);
    
    // Destroy coin with effect
    this.tweens.add({
      targets: coin,
      scale: 1.5,
      alpha: 0,
      duration: 150,
      onComplete: () => coin.destroy(),
    });
  }

  /**
   * Collect a power-up
   */
  private collectPowerup(_player: Phaser.Types.Physics.Arcade.GameObjectWithBody, powerupObj: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
    const powerup = powerupObj as Phaser.Physics.Arcade.Sprite;
    const type = powerup.getData('type');
    
    // Upgrade player format
    switch (type) {
      case 'text':
        if (this.player.getFormat() === 'small') {
          // Text mushroom just gives a bonus in small form
          this.showFloatingText(powerup.x, powerup.y, 'TEXT AD+', '#00ccff');
        }
        break;
      case 'image':
        this.player.setFormat('big');
        this.showFloatingText(powerup.x, powerup.y, 'IMAGE AD!', '#ff6b6b');
        break;
      case 'video':
        this.player.setFormat('powered');
        this.showFloatingText(powerup.x, powerup.y, 'VIDEO AD!', '#ffd700');
        break;
    }
    
    // Destroy with effect
    this.tweens.add({
      targets: powerup,
      scale: 2,
      alpha: 0,
      rotation: Math.PI,
      duration: 300,
      onComplete: () => powerup.destroy(),
    });
  }

  /**
   * Handle collision with enemy
   */
  private handleEnemyCollision(playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody, enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
    const player = playerObj as Phaser.Physics.Arcade.Sprite;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    
    // Check if player is falling on top of enemy
    if (playerBody.velocity.y > 0 && player.y < enemy.y - 10) {
      // Stomp enemy (costs CPC click)
      this.player.registerClick();
      this.player.bounce();
      
      // Destroy enemy
      this.showFloatingText(enemy.x, enemy.y, 'CLICK!', '#ff4444');
      this.tweens.add({
        targets: enemy,
        scaleY: 0.2,
        alpha: 0,
        duration: 200,
        onComplete: () => enemy.destroy(),
      });
    } else {
      // Player takes damage
      const died = this.player.powerDown();
      if (died) {
        this.gameOver();
      }
    }
  }

  /**
   * Reach the goal flagpole
   */
  private reachGoal(_playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody, _flagpoleObj: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
    if (this.isLevelComplete) return;
    
    this.isLevelComplete = true;
    
    // Trigger conversion
    this.player.convert();
    
    // Victory animation
    this.showFloatingText(this.player.x, this.player.y - 50, 'CONVERSION!', '#ffd700');
    
    this.time.delayedCall(1000, () => {
      this.levelComplete();
    });
  }

  // ============================================================================
  // LEVEL STATE
  // ============================================================================

  /**
   * Level complete handler
   */
  private levelComplete(): void {
    console.log('[World1] Level Complete!');
    
    // Get final stats
    const budgetState = this.budgetSystem.getState();
    const viewabilityRate = this.viewabilityTracker.getViewabilityRate();
    
    // Show victory overlay
    this.showVictoryOverlay(budgetState, viewabilityRate);
  }

  /**
   * Show victory overlay with stats
   */
  private showVictoryOverlay(budgetState: any, viewabilityRate: number): void {
    // Dim background
    const overlay = this.add.rectangle(
      this.cameras.main.scrollX + 640,
      360,
      1280,
      720,
      0x000000,
      0.8
    );
    overlay.setScrollFactor(0);
    
    // Victory text
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px',
      color: '#00ff88',
    };
    
    const title = this.add.text(
      this.cameras.main.scrollX + 640,
      200,
      'CAMPAIGN COMPLETE!',
      titleStyle
    );
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    
    // Stats
    const statsStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#ffffff',
      lineSpacing: 12,
    };
    
    const statsText = [
      `Budget Spent: $${budgetState.spent.toFixed(2)}`,
      `Impressions: ${budgetState.impressions.toLocaleString()}`,
      `Clicks: ${budgetState.clicks}`,
      `Conversions: ${budgetState.conversions}`,
      `Viewability: ${viewabilityRate.toFixed(1)}%`,
      `ROAS: ${budgetState.roas.toFixed(2)}x`,
    ].join('\n');
    
    const stats = this.add.text(
      this.cameras.main.scrollX + 640,
      380,
      statsText,
      statsStyle
    );
    stats.setOrigin(0.5);
    stats.setScrollFactor(0);
    
    // Auto-continue countdown
    let countdown = 5;
    const promptStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#00ff88',
    };
    
    const prompt = this.add.text(
      this.cameras.main.scrollX + 640,
      550,
      `Continuing in ${countdown}...`,
      promptStyle
    );
    prompt.setOrigin(0.5);
    prompt.setScrollFactor(0);
    
    // Skip hint
    const skipHint = this.add.text(
      this.cameras.main.scrollX + 640,
      580,
      'Press SPACE or ENTER to continue now',
      { ...promptStyle, fontSize: '11px', color: '#666666' }
    );
    skipHint.setOrigin(0.5);
    skipHint.setScrollFactor(0);
    
    // Countdown timer
    const countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: 4,
      callback: () => {
        countdown--;
        prompt.setText(`Continuing in ${countdown}...`);
        if (countdown <= 0) {
          this.transitionToNextLevel();
        }
      },
    });
    
    // Allow early skip with SPACE or ENTER
    if (this.input.keyboard) {
      const skipHandler = () => {
        countdownTimer.destroy();
        this.transitionToNextLevel();
      };
      this.input.keyboard.once('keydown-ENTER', skipHandler);
      this.input.keyboard.once('keydown-SPACE', skipHandler);
    }
  }

  /**
   * Transition to the next level
   */
  private transitionToNextLevel(): void {
    // Save progress
    import('../main').then(({ gameState }) => {
      gameState.setCurrentWorld(1); // World 2 index
      gameState.save();
    });
    
    // Clear HUD before transitioning
    this.hud?.destroy();
    
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Go through tutorial for the next world
      this.scene.start('AdTechTutorialScene', { levelKey: 'World2_TechStack' });
    });
  }

  /**
   * Game over handler
   */
  private gameOver(): void {
    console.log('[World1] Game Over');
    
    // Flash red
    this.cameras.main.flash(500, 255, 0, 0);
    
    // Disable player
    this.player.setActive(false);
    
    this.time.delayedCall(1000, () => {
      this.scene.restart();
    });
  }

  /**
   * Show floating text feedback
   */
  private showFloatingText(x: number, y: number, text: string, color: string = '#ffffff'): void {
    const floatText = this.add.text(x, y, text, {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    });
    floatText.setOrigin(0.5);
    
    this.tweens.add({
      targets: floatText,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => floatText.destroy(),
    });
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  shutdown(): void {
    super.shutdown();
    this.hud?.destroy();
    console.log('[World1] Shutdown');
  }
}
