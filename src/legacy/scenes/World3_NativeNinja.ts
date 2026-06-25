/**
 * World3_NativeNinja - Native Advertising Stealth Level
 * 
 * A stealth-based platformer teaching native advertising concepts:
 * - Camouflage Mechanic: Player must match background to pass editorial zones
 * - Disclosure Badge: Must maintain minimum ad disclosure visibility
 * - Blend Modes: Visual representation of native ad integration
 * 
 * This world teaches:
 * - Native advertising formats and best practices
 * - Transparency and disclosure requirements
 * - Content integration without disruption
 */

import Phaser from 'phaser';
import { BaseAdTechScene } from './BaseAdTechScene';
import { Player } from '../entities/Player';
import { HUD } from '../ui/HUD';

/**
 * Level configuration
 */
const LEVEL_CONFIG = {
  width: 5000,
  height: 720,
  groundHeight: 620,
  
  // Editorial content zones where player must blend in
  editorialZones: [
    { x: 600, y: 0, width: 400, height: 720, color: 0x1a3a5a },    // News blue
    { x: 1400, y: 0, width: 400, height: 720, color: 0x3a5a1a },   // Lifestyle green
    { x: 2200, y: 0, width: 400, height: 720, color: 0x5a1a3a },   // Entertainment magenta
    { x: 3000, y: 0, width: 500, height: 720, color: 0x4a4a1a },   // Finance gold
    { x: 3800, y: 0, width: 400, height: 720, color: 0x2a2a4a },   // Tech purple
  ],
};

/**
 * Disclosure compliance states
 */
// Disclosure states: hidden, partial, visible, prominent

export class World3_NativeNinja extends BaseAdTechScene {
  // Entities
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private editorialZones!: Phaser.GameObjects.Group;
  
  // UI
  private hud!: HUD;
  private disclosureBadge!: Phaser.GameObjects.Container;
  private disclosureMeter!: Phaser.GameObjects.Graphics;
  private blendIndicator!: Phaser.GameObjects.Container;
  
  // Stealth mechanics
  private currentZoneColor: number = 0x0a0a1e;
  private playerColor: number = 0xffffff;
  private isBlended: boolean = false;
  private disclosureLevel: number = 100; // 0-100, must stay above 30
  private minDisclosureLevel: number = 30;
  
  // Level state
  private isLevelComplete: boolean = false;
  private isDetected: boolean = false;

  constructor() {
    super({ key: 'World3_NativeNinja' });
  }

  init(): void {
    super.init();
    console.log('[World3] Initializing Native Ninja');
  }

  create(): void {
    super.create();
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Create background and editorial zones
    this.createBackground();
    this.createEditorialZones();
    
    // Create level geometry
    this.createGround();
    this.createPlatforms();
    
    // Create player
    this.createPlayer();
    
    // Create UI elements
    this.createDisclosureBadge();
    this.createBlendIndicator();
    
    // Set up camera
    this.setupCamera();
    
    // Create HUD
    this.hud = new HUD(this, this.budgetSystem, this.viewabilityTracker, {
      worldNumber: 3,
      worldName: 'Native Ninja',
      color: '#4ade80'
    });
    
    // Set up collisions
    this.setupCollisions();
    
    // Create exit portal
    this.createExitPortal();
    
    // Fade in
    this.cameras.main.fadeIn(500);
    
    console.log('[World3] Scene created');
  }

  /**
   * Implement abstract method from BaseAdTechScene
   */
  protected setupAdTechMechanics(): void {
    this.budgetSystem.reset({
      totalBudget: 1500,
      pricingModel: 'CPM',
      currentSpend: 0,
    });
    
    this.budgetSystem.setRates({
      CPM: 5.00, // Native ads have higher CPM
      CPC: 1.25,
      CPA: 25.00,
    });
  }

  // ============================================================================
  // BACKGROUND & EDITORIAL ZONES
  // ============================================================================

  /**
   * Create background with content feed aesthetic
   */
  private createBackground(): void {
    // Base dark background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1e, 1);
    bg.fillRect(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Content card silhouettes in background
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(50, LEVEL_CONFIG.width - 50);
      const y = Phaser.Math.Between(50, 400);
      const width = Phaser.Math.Between(100, 200);
      const height = Phaser.Math.Between(80, 150);
      
      const card = this.add.graphics();
      card.fillStyle(0x1a1a2e, 0.5);
      card.fillRoundedRect(x, y, width, height, 8);
      card.setScrollFactor(0.3);
    }
    
    // "Feed" scroll lines
    const feedLines = this.add.graphics();
    feedLines.lineStyle(1, 0x333333, 0.3);
    for (let y = 100; y < LEVEL_CONFIG.height; y += 150) {
      feedLines.lineBetween(0, y, LEVEL_CONFIG.width, y);
    }
    feedLines.setScrollFactor(0.5);
  }

  /**
   * Create editorial content zones where player must blend in
   */
  private createEditorialZones(): void {
    this.editorialZones = this.add.group();
    
    LEVEL_CONFIG.editorialZones.forEach((zone, idx) => {
      // Zone background
      const zoneBg = this.add.graphics();
      zoneBg.fillStyle(zone.color, 0.4);
      zoneBg.fillRect(zone.x, zone.y, zone.width, zone.height);
      
      // Zone border
      zoneBg.lineStyle(3, zone.color, 0.8);
      zoneBg.strokeRect(zone.x, zone.y, zone.width, zone.height);
      
      // Zone label
      const labels = ['NEWS', 'LIFESTYLE', 'ENTERTAINMENT', 'FINANCE', 'TECH'];
      const label = this.add.text(zone.x + zone.width / 2, 50, labels[idx], {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: this.colorToString(zone.color),
        padding: { x: 8, y: 4 },
      });
      label.setOrigin(0.5);
      label.setDepth(50);
      
      // "Editorial Content" warning
      const warning = this.add.text(zone.x + zone.width / 2, 80, '⚠ EDITORIAL ZONE', {
        fontFamily: '"Courier New", monospace',
        fontSize: '8px',
        color: '#ffcc00',
      });
      warning.setOrigin(0.5);
      warning.setDepth(50);
      
      // Detection zone (invisible physics body)
      const detectionZone = this.add.zone(
        zone.x + zone.width / 2,
        zone.height / 2,
        zone.width,
        zone.height
      );
      this.physics.world.enable(detectionZone, Phaser.Physics.Arcade.STATIC_BODY);
      detectionZone.setData('zoneColor', zone.color);
      detectionZone.setData('zoneIndex', idx);
      
      this.editorialZones.add(detectionZone);
      
      // Color-change pickups within the zone
      this.createColorPickups(zone.x, zone.width, zone.color);
    });
  }

  /**
   * Create color change power-ups within zones
   */
  private createColorPickups(zoneX: number, zoneWidth: number, zoneColor: number): void {
    // Place 2-3 color pickups in each zone
    const pickupCount = Phaser.Math.Between(2, 3);
    
    for (let i = 0; i < pickupCount; i++) {
      const x = zoneX + 50 + (zoneWidth - 100) * (i / pickupCount);
      const y = Phaser.Math.Between(350, 550);
      
      const pickup = this.add.container(x, y);
      pickup.setDepth(60);
      
      // Glow
      const glow = this.add.graphics();
      glow.fillStyle(zoneColor, 0.4);
      glow.fillCircle(0, 0, 25);
      pickup.add(glow);
      
      // Core
      const core = this.add.graphics();
      core.fillStyle(zoneColor, 1);
      core.fillCircle(0, 0, 12);
      core.lineStyle(2, 0xffffff, 0.8);
      core.strokeCircle(0, 0, 12);
      pickup.add(core);
      
      // Icon
      const icon = this.add.text(0, 0, '🎨', { fontSize: '14px' });
      icon.setOrigin(0.5);
      pickup.add(icon);
      
      // Physics
      const hitZone = this.add.zone(x, y, 40, 40);
      this.physics.world.enable(hitZone, Phaser.Physics.Arcade.STATIC_BODY);
      hitZone.setData('pickupColor', zoneColor);
      hitZone.setData('pickup', pickup);
      
      // Floating animation
      this.tweens.add({
        targets: pickup,
        y: y - 8,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      
      // Rotation
      this.tweens.add({
        targets: glow,
        angle: 360,
        duration: 3000,
        repeat: -1,
        ease: 'Linear',
      });
      
      // Store reference for collision
      if (!this.data.get('colorPickups')) {
        this.data.set('colorPickups', []);
      }
      this.data.get('colorPickups').push(hitZone);
    }
  }

  /**
   * Convert hex color to string
   */
  private colorToString(color: number): string {
    return '#' + color.toString(16).padStart(6, '0');
  }

  // ============================================================================
  // LEVEL GEOMETRY
  // ============================================================================

  /**
   * Create ground platforms
   */
  private createGround(): void {
    this.ground = this.physics.add.staticGroup();
    
    // Ground with gaps for challenge
    const groundSections = [
      { start: 0, end: 500 },
      { start: 650, end: 950 },
      { start: 1100, end: 1350 },
      { start: 1500, end: 1750 },
      { start: 1900, end: 2150 },
      { start: 2300, end: 2650 },
      { start: 2800, end: 3100 },
      { start: 3250, end: 3450 },
      { start: 3600, end: 3900 },
      { start: 4050, end: 4350 },
      { start: 4500, end: LEVEL_CONFIG.width },
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
   * Create floating platforms
   */
  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    const platformDefs = [
      // Lead-up to zones
      { x: 400, y: 500, width: 128 },
      { x: 550, y: 400, width: 96 },
      
      // Within and between zones
      { x: 750, y: 450, width: 160 },
      { x: 1000, y: 380, width: 128 },
      { x: 1250, y: 480, width: 128 },
      { x: 1600, y: 400, width: 160 },
      { x: 1850, y: 350, width: 96 },
      { x: 2100, y: 450, width: 128 },
      { x: 2400, y: 380, width: 160 },
      { x: 2700, y: 480, width: 128 },
      { x: 2950, y: 400, width: 128 },
      { x: 3150, y: 350, width: 96 },
      { x: 3400, y: 450, width: 128 },
      { x: 3700, y: 380, width: 160 },
      { x: 3950, y: 480, width: 128 },
      { x: 4200, y: 400, width: 128 },
      { x: 4450, y: 350, width: 160 },
    ];
    
    platformDefs.forEach(def => {
      this.createPlatform(def.x, def.y, def.width);
    });
  }

  /**
   * Create a single platform
   */
  private createPlatform(x: number, y: number, width: number): void {
    const tilesNeeded = Math.ceil(width / 32);
    
    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.platforms.create(
        x + i * 32 - (width / 2) + 16,
        y,
        'tile-platform'
      );
      tile.setImmovable(true);
      tile.refreshBody();
    }
  }

  // ============================================================================
  // DISCLOSURE BADGE UI
  // ============================================================================

  /**
   * Create the disclosure badge that must stay visible
   */
  private createDisclosureBadge(): void {
    this.disclosureBadge = this.add.container(100, 100);
    this.disclosureBadge.setDepth(1000);
    this.disclosureBadge.setScrollFactor(0);
    
    // Badge background
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0x1a1a1a, 0.95);
    badgeBg.fillRoundedRect(-80, -40, 160, 80, 8);
    badgeBg.lineStyle(2, 0xffcc00, 1);
    badgeBg.strokeRoundedRect(-80, -40, 160, 80, 8);
    this.disclosureBadge.add(badgeBg);
    
    // "AD" label
    const adLabel = this.add.text(0, -20, 'AD', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ffcc00',
    });
    adLabel.setOrigin(0.5);
    this.disclosureBadge.add(adLabel);
    
    // "Sponsored" text
    const sponsoredText = this.add.text(0, 5, 'SPONSORED', {
      fontFamily: '"Courier New", monospace',
      fontSize: '9px',
      color: '#ffffff',
    });
    sponsoredText.setOrigin(0.5);
    this.disclosureBadge.add(sponsoredText);
    
    // Disclosure meter background
    const meterBg = this.add.graphics();
    meterBg.fillStyle(0x333333, 1);
    meterBg.fillRoundedRect(-60, 22, 120, 10, 3);
    this.disclosureBadge.add(meterBg);
    
    // Disclosure meter fill
    this.disclosureMeter = this.add.graphics();
    this.disclosureBadge.add(this.disclosureMeter);
    this.updateDisclosureMeter();
    
    // Warning threshold line
    const thresholdLine = this.add.graphics();
    thresholdLine.lineStyle(2, 0xff4444, 1);
    const thresholdX = -60 + (120 * (this.minDisclosureLevel / 100));
    thresholdLine.lineBetween(thresholdX, 20, thresholdX, 34);
    this.disclosureBadge.add(thresholdLine);
  }

  /**
   * Update the disclosure meter display
   */
  private updateDisclosureMeter(): void {
    this.disclosureMeter.clear();
    
    const width = 116 * (this.disclosureLevel / 100);
    let color = 0x00ff88; // Green
    
    if (this.disclosureLevel < 50) color = 0xffcc00; // Yellow
    if (this.disclosureLevel < this.minDisclosureLevel) color = 0xff4444; // Red
    
    this.disclosureMeter.fillStyle(color, 1);
    this.disclosureMeter.fillRoundedRect(-58, 24, width, 6, 2);
    
    // Pulse when low
    if (this.disclosureLevel < 50) {
      this.disclosureBadge.setAlpha(0.8 + Math.sin(this.time.now / 100) * 0.2);
    } else {
      this.disclosureBadge.setAlpha(1);
    }
  }

  // ============================================================================
  // BLEND INDICATOR
  // ============================================================================

  /**
   * Create the blend status indicator
   */
  private createBlendIndicator(): void {
    this.blendIndicator = this.add.container(640, 680);
    this.blendIndicator.setDepth(1000);
    this.blendIndicator.setScrollFactor(0);
    
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1e, 0.9);
    bg.fillRoundedRect(-100, -20, 200, 40, 6);
    this.blendIndicator.add(bg);
    
    // Status text
    const statusText = this.add.text(0, 0, '🔴 NOT BLENDED', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ff4444',
    });
    statusText.setOrigin(0.5);
    statusText.setName('statusText');
    this.blendIndicator.add(statusText);
    
    // Hide initially (shown in editorial zones)
    this.blendIndicator.setVisible(false);
  }

  /**
   * Update blend indicator status
   */
  private updateBlendIndicator(): void {
    const statusText = this.blendIndicator.getByName('statusText') as Phaser.GameObjects.Text;
    
    if (this.isBlended) {
      statusText.setText('🟢 BLENDED');
      statusText.setColor('#00ff88');
    } else {
      statusText.setText('🔴 NOT BLENDED');
      statusText.setColor('#ff4444');
    }
  }

  // ============================================================================
  // PLAYER & CAMERA
  // ============================================================================

  /**
   * Create player entity
   */
  private createPlayer(): void {
    this.player = new Player(this, 100, LEVEL_CONFIG.groundHeight - 50);
    this.player.setBudgetManager(this.budgetSystem);
    
    // Add color tint capability
    this.player.setData('currentColor', 0xffffff);
  }

  /**
   * Set up camera to follow player
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
   * Set up collision handlers
   */
  private setupCollisions(): void {
    // Platform collisions
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platforms);
    
    // Editorial zone detection
    this.physics.add.overlap(
      this.player,
      this.editorialZones,
      this.handleZoneEnter as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    
    // Color pickup collection
    const colorPickups = this.data.get('colorPickups') as Phaser.GameObjects.Zone[];
    if (colorPickups) {
      colorPickups.forEach(pickup => {
        this.physics.add.overlap(
          this.player,
          pickup,
          this.handleColorPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
          undefined,
          this
        );
      });
    }
  }

  /**
   * Handle entering an editorial zone
   */
  private handleZoneEnter(
    _player: Phaser.GameObjects.GameObject,
    zone: Phaser.GameObjects.GameObject
  ): void {
    const zoneColor = (zone as Phaser.GameObjects.Zone).getData('zoneColor') as number;
    this.currentZoneColor = zoneColor;
    
    // Show blend indicator
    this.blendIndicator.setVisible(true);
    
    // Check if player color matches zone
    this.checkBlendStatus();
    
    // If not blended, drain disclosure
    if (!this.isBlended) {
      this.disclosureLevel = Math.max(0, this.disclosureLevel - 0.5);
      this.updateDisclosureMeter();
      
      // Check for failure
      if (this.disclosureLevel < this.minDisclosureLevel) {
        this.triggerDetection();
      }
    }
  }

  /**
   * Handle collecting a color pickup
   */
  private handleColorPickup(
    _player: Phaser.GameObjects.GameObject,
    pickupZone: Phaser.GameObjects.GameObject
  ): void {
    const pickup = (pickupZone as Phaser.GameObjects.Zone).getData('pickup') as Phaser.GameObjects.Container;
    const pickupColor = (pickupZone as Phaser.GameObjects.Zone).getData('pickupColor') as number;
    
    if (!pickup || pickup.getData('collected')) return;
    
    pickup.setData('collected', true);
    
    // Apply color to player
    this.playerColor = pickupColor;
    this.player.setTint(pickupColor);
    this.player.setData('currentColor', pickupColor);
    
    // Collection animation
    this.tweens.add({
      targets: pickup,
      scale: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => pickup.destroy(),
    });
    
    // Flash effect
    this.cameras.main.flash(200, 
      (pickupColor >> 16) & 0xff,
      (pickupColor >> 8) & 0xff,
      pickupColor & 0xff,
      false,
      undefined,
      this
    );
    
    // Restore some disclosure
    this.disclosureLevel = Math.min(100, this.disclosureLevel + 20);
    this.updateDisclosureMeter();
    
    // Check blend status
    this.checkBlendStatus();
    
    console.log('[World3] Color pickup collected:', pickupColor.toString(16));
  }

  /**
   * Check if player is blended with current zone
   */
  private checkBlendStatus(): void {
    // Colors match if they're the same or very close
    const colorMatch = this.playerColor === this.currentZoneColor;
    
    this.isBlended = colorMatch;
    this.updateBlendIndicator();
    
    if (this.isBlended) {
      // Blend mode visual effect
      this.player.setBlendMode(Phaser.BlendModes.MULTIPLY);
      this.player.setAlpha(0.85);
    } else {
      this.player.setBlendMode(Phaser.BlendModes.NORMAL);
      this.player.setAlpha(1);
    }
  }

  /**
   * Trigger detection (player failed to blend)
   */
  private triggerDetection(): void {
    if (this.isDetected) return;
    this.isDetected = true;
    
    console.log('[World3] Detected! Disclosure too low.');
    
    // Warning flash
    this.cameras.main.flash(500, 255, 0, 0);
    this.cameras.main.shake(300, 0.02);
    
    // Show warning message
    const warning = this.add.text(640, 360, '⚠ DISCLOSURE VIOLATION!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ff4444',
      backgroundColor: '#000000',
      padding: { x: 16, y: 8 },
    });
    warning.setOrigin(0.5);
    warning.setScrollFactor(0);
    warning.setDepth(2000);
    
    // Reset after delay
    this.time.delayedCall(2000, () => {
      warning.destroy();
      this.isDetected = false;
      this.disclosureLevel = 60; // Restore to safe level
      this.updateDisclosureMeter();
    });
    
    // Emit event for budget penalty
    this.budgetSystem.calculateSpend({
      type: 'click', // Penalty as CPC
      timestamp: Date.now(),
      value: 10,
    });
  }

  // ============================================================================
  // EXIT PORTAL
  // ============================================================================

  /**
   * Create exit portal at end of level
   */
  private createExitPortal(): void {
    const portal = this.add.container(LEVEL_CONFIG.width - 100, LEVEL_CONFIG.groundHeight - 100);
    portal.setDepth(100);
    
    // Glow
    const glow = this.add.graphics();
    glow.fillStyle(0x00ff88, 0.3);
    glow.fillCircle(0, 0, 60);
    portal.add(glow);
    
    // Ring
    const ring = this.add.graphics();
    ring.lineStyle(4, 0x00ff88, 1);
    ring.strokeCircle(0, 0, 50);
    portal.add(ring);
    
    // Label
    const label = this.add.text(0, 80, 'EXIT', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#00ff88',
    });
    label.setOrigin(0.5);
    portal.add(label);
    
    // Animations
    this.tweens.add({
      targets: ring,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear',
    });
    
    this.tweens.add({
      targets: glow,
      scale: 1.2,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
    
    // Trigger zone
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
    
    console.log('[World3] Native Ninja complete!');
    
    // Clear HUD before transition
    this.hud?.destroy();
    
    this.cameras.main.fadeOut(1000);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Go through tutorial for Video Volcano
      this.scene.start('AdTechTutorialScene', { levelKey: 'World3_VideoVolcano' });
    });
  }

  // ============================================================================
  // UPDATE LOOP
  // ============================================================================

  update(time: number, delta: number): void {
    if (this.isLevelComplete) return;
    
    // Update player
    this.player.update(time, delta);
    
    // Check if player left editorial zone
    this.checkZoneExit();
    
    // Slowly regenerate disclosure when blended
    if (this.isBlended && this.disclosureLevel < 100) {
      this.disclosureLevel = Math.min(100, this.disclosureLevel + 0.2);
      this.updateDisclosureMeter();
    }
  }

  /**
   * Check if player has left all editorial zones
   */
  private checkZoneExit(): void {
    let inZone = false;
    
    LEVEL_CONFIG.editorialZones.forEach(zone => {
      if (
        this.player.x >= zone.x &&
        this.player.x <= zone.x + zone.width
      ) {
        inZone = true;
      }
    });
    
    if (!inZone) {
      this.blendIndicator.setVisible(false);
      this.currentZoneColor = 0x0a0a1e;
    }
  }

  /**
   * Clean up on scene shutdown
   */
  shutdown(): void {
    this.hud?.destroy();
  }
}
