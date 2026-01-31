/**
 * World3_VideoVolcano - Video Advertising Level
 * 
 * A volcanic-themed level teaching video ad concepts:
 * - VAST Protocol: Platforms appear in sequence (preroll, midroll, postroll)
 * - Buffer Zones: Pause platforms where player must wait (loading simulation)
 * - Skip Button: Appears after 5 seconds, grants bonus if waited full 30s
 * 
 * This world teaches:
 * - Video ad formats and VAST protocol
 * - Completion rates and skip behavior
 * - Buffer/latency impacts on viewability
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
  height: 1200,
  groundHeight: 1100,
  
  // Video ad break positions
  adBreaks: [
    { x: 800, type: 'preroll', duration: 15, skippableAt: 5 },
    { x: 1800, type: 'midroll1', duration: 20, skippableAt: 5 },
    { x: 2800, type: 'midroll2', duration: 20, skippableAt: 5 },
    { x: 3800, type: 'postroll', duration: 30, skippableAt: 5 },
  ],
};

/**
 * Video ad states
 */
type AdState = 'waiting' | 'playing' | 'skipped' | 'completed';

/**
 * Ad break data
 */
interface AdBreak {
  x: number;
  type: string;
  duration: number;
  skippableAt: number;
  state: AdState;
  startTime: number;
  platforms: Phaser.GameObjects.GameObject[];
  skipButton?: Phaser.GameObjects.Container;
  progressBar?: Phaser.GameObjects.Graphics;
  timerText?: Phaser.GameObjects.Text;
}

export class World3_VideoVolcano extends BaseAdTechScene {
  // Entities
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private lavaPools!: Phaser.Physics.Arcade.StaticGroup;
  
  // Video ad mechanics
  private adBreaks: AdBreak[] = [];
  private currentAdBreak: AdBreak | null = null;
  private _isInAdBreak: boolean = false;
  private bufferZones: Phaser.GameObjects.Zone[] = [];
  private isBuffering: boolean = false;
  
  // UI
  private hud!: HUD;
  private videoUI!: Phaser.GameObjects.Container;
  private completionRateDisplay!: Phaser.GameObjects.Text;
  
  // Stats
  private adsCompleted: number = 0;
  private adsSkipped: number = 0;
  private totalViewTime: number = 0;
  
  // Level state
  private isLevelComplete: boolean = false;

  constructor() {
    super({ key: 'World3_VideoVolcano' });
  }

  init(): void {
    super.init();
    console.log('[World3] Initializing Video Volcano');
  }

  create(): void {
    super.create();
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Create background
    this.createBackground();
    
    // Create level geometry
    this.createGround();
    this.createLavaPools();
    this.createPlatforms();
    
    // Create ad break zones
    this.createAdBreaks();
    
    // Create buffer zones
    this.createBufferZones();
    
    // Create player
    this.createPlayer();
    
    // Create video UI overlay
    this.createVideoUI();
    
    // Set up camera
    this.setupCamera();
    
    // Create HUD
    this.hud = new HUD(this, this.budgetSystem, this.viewabilityTracker, {
      worldNumber: 3,
      worldName: 'Video Volcano',
      color: '#ff4444'
    });
    
    // Set up collisions
    this.setupCollisions();
    
    // Create exit portal
    this.createExitPortal();
    
    // Fade in
    this.cameras.main.fadeIn(500);
    
    console.log('[World3] Video Volcano created');
  }

  /**
   * Implement abstract method from BaseAdTechScene
   */
  protected setupAdTechMechanics(): void {
    this.budgetSystem.reset({
      totalBudget: 2000,
      pricingModel: 'CPM', // Video is typically CPM based
      currentSpend: 0,
    });
    
    this.budgetSystem.setRates({
      CPM: 15.00, // Video ads have highest CPM
      CPC: 2.00,
      CPA: 40.00,
    });
  }

  // ============================================================================
  // BACKGROUND & VISUALS
  // ============================================================================

  /**
   * Create volcanic background
   */
  private createBackground(): void {
    // Dark volcanic sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1a0505, 0x1a0505, 0x330a0a, 0x330a0a);
    sky.fillRect(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Volcanic mountains in background
    for (let i = 0; i < 8; i++) {
      const mountain = this.add.graphics();
      const x = i * 600;
      const height = Phaser.Math.Between(300, 500);
      
      mountain.fillStyle(0x2a1515, 1);
      mountain.beginPath();
      mountain.moveTo(x, LEVEL_CONFIG.height);
      mountain.lineTo(x + 150, LEVEL_CONFIG.height - height);
      mountain.lineTo(x + 300, LEVEL_CONFIG.height);
      mountain.closePath();
      mountain.fill();
      
      // Lava glow at top
      mountain.fillStyle(0xff4400, 0.5);
      mountain.fillCircle(x + 150, LEVEL_CONFIG.height - height + 20, 30);
      
      mountain.setScrollFactor(0.3);
    }
    
    // Lava particles rising
    if (this.textures.exists('particle-glow')) {
      for (let i = 0; i < 5; i++) {
        const x = 400 + i * 800;
        
        const emitter = this.add.particles(x, LEVEL_CONFIG.height, 'particle-glow', {
          y: { min: -200, max: 0 },
          lifespan: 2000,
          speed: { min: 50, max: 100 },
          angle: { min: -100, max: -80 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.8, end: 0 },
          frequency: 500,
          tint: [0xff4400, 0xff6600, 0xffaa00],
          blendMode: 'ADD',
        });
        emitter.setScrollFactor(0.5);
      }
    }
    
    // "VIDEO ZONE" signage
    const sign = this.add.text(200, 100, '🎬 VIDEO VOLCANO', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ff6600',
    });
    sign.setScrollFactor(0);
    sign.setDepth(100);
  }

  // ============================================================================
  // LEVEL GEOMETRY
  // ============================================================================

  /**
   * Create ground platforms
   */
  private createGround(): void {
    this.ground = this.physics.add.staticGroup();
    
    // Ground with lava gaps
    const groundSections = [
      { start: 0, end: 700 },
      { start: 900, end: 1700 },
      { start: 1900, end: 2700 },
      { start: 2900, end: 3700 },
      { start: 3900, end: LEVEL_CONFIG.width },
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
        tile.setTint(0x663333); // Volcanic tint
        tile.refreshBody();
      }
    });
  }

  /**
   * Create lava pools (danger zones)
   */
  private createLavaPools(): void {
    this.lavaPools = this.physics.add.staticGroup();
    
    const lavaPositions = [
      { start: 700, end: 900 },
      { start: 1700, end: 1900 },
      { start: 2700, end: 2900 },
      { start: 3700, end: 3900 },
    ];
    
    lavaPositions.forEach(pos => {
      // Visual lava
      const lava = this.add.graphics();
      lava.fillStyle(0xff4400, 0.8);
      lava.fillRect(pos.start, LEVEL_CONFIG.groundHeight, pos.end - pos.start, 100);
      
      // Animated lava surface
      const surface = this.add.graphics();
      surface.fillStyle(0xffaa00, 0.6);
      surface.fillRect(pos.start, LEVEL_CONFIG.groundHeight - 5, pos.end - pos.start, 10);
      
      // Damage zone
      const zone = this.add.zone(
        (pos.start + pos.end) / 2,
        LEVEL_CONFIG.groundHeight + 50,
        pos.end - pos.start,
        100
      );
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      zone.setData('isLava', true);
      this.lavaPools.add(zone);
      
      // Bubbling animation
      this.tweens.add({
        targets: surface,
        y: LEVEL_CONFIG.groundHeight - 8,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  /**
   * Create floating platforms
   */
  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    const platformDefs = [
      // Between ad breaks
      { x: 400, y: 950, width: 160 },
      { x: 600, y: 850, width: 128 },
      { x: 1200, y: 900, width: 160 },
      { x: 1500, y: 800, width: 128 },
      { x: 2200, y: 950, width: 160 },
      { x: 2500, y: 850, width: 128 },
      { x: 3200, y: 900, width: 160 },
      { x: 3500, y: 800, width: 128 },
      { x: 4100, y: 900, width: 192 },
    ];
    
    platformDefs.forEach(def => {
      const tilesNeeded = Math.ceil(def.width / 32);
      
      for (let i = 0; i < tilesNeeded; i++) {
        const tile = this.platforms.create(
          def.x + i * 32 - (def.width / 2) + 16,
          def.y,
          'tile-platform'
        );
        tile.setImmovable(true);
        tile.setTint(0x885533);
        tile.refreshBody();
      }
    });
  }

  // ============================================================================
  // AD BREAK ZONES
  // ============================================================================

  /**
   * Create ad break zones with VAST-style sequencing
   */
  private createAdBreaks(): void {
    LEVEL_CONFIG.adBreaks.forEach((config, idx) => {
      const adBreak: AdBreak = {
        ...config,
        state: 'waiting',
        startTime: 0,
        platforms: [],
      };
      
      // Create ad zone trigger
      const triggerZone = this.add.zone(config.x, LEVEL_CONFIG.groundHeight - 200, 150, 400);
      this.physics.world.enable(triggerZone, Phaser.Physics.Arcade.STATIC_BODY);
      triggerZone.setData('adBreakIndex', idx);
      
      // Visual marker
      const marker = this.add.container(config.x, LEVEL_CONFIG.groundHeight - 300);
      
      // Billboard background
      const billboard = this.add.graphics();
      billboard.fillStyle(0x1a1a1a, 0.95);
      billboard.fillRoundedRect(-100, -80, 200, 160, 8);
      billboard.lineStyle(3, 0xff6600, 1);
      billboard.strokeRoundedRect(-100, -80, 200, 160, 8);
      marker.add(billboard);
      
      // Type label
      const typeLabels: Record<string, string> = {
        preroll: '📺 PRE-ROLL',
        midroll1: '📺 MID-ROLL',
        midroll2: '📺 MID-ROLL',
        postroll: '📺 POST-ROLL',
      };
      
      const typeLabel = this.add.text(0, -50, typeLabels[config.type] || '📺 AD', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#ff6600',
      });
      typeLabel.setOrigin(0.5);
      marker.add(typeLabel);
      
      // Duration label
      const durationLabel = this.add.text(0, -25, `${config.duration}s`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '14px',
        color: '#ffffff',
      });
      durationLabel.setOrigin(0.5);
      marker.add(durationLabel);
      
      // Skip info
      const skipLabel = this.add.text(0, 0, `Skip after ${config.skippableAt}s`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '10px',
        color: '#888888',
      });
      skipLabel.setOrigin(0.5);
      marker.add(skipLabel);
      
      // Progress bar (hidden initially)
      const progressBar = this.add.graphics();
      progressBar.setVisible(false);
      marker.add(progressBar);
      adBreak.progressBar = progressBar;
      
      // Timer text (hidden initially)
      const timerText = this.add.text(0, 40, '0:00', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: '#ffffff',
      });
      timerText.setOrigin(0.5);
      timerText.setVisible(false);
      marker.add(timerText);
      adBreak.timerText = timerText;
      
      // Create skip button (hidden initially)
      adBreak.skipButton = this.createSkipButton(config.x, LEVEL_CONFIG.groundHeight - 150);
      adBreak.skipButton.setVisible(false);
      adBreak.skipButton.setData('adBreakIndex', idx);
      
      // Create sequential platforms (appear during ad)
      this.createAdPlatforms(adBreak, config.x);
      
      this.adBreaks.push(adBreak);
      
      // Store trigger zone
      if (!this.data.get('adTriggers')) {
        this.data.set('adTriggers', []);
      }
      this.data.get('adTriggers').push(triggerZone);
    });
  }

  /**
   * Create platforms that appear during ad playback
   */
  private createAdPlatforms(adBreak: AdBreak, baseX: number): void {
    // Platforms appear in sequence like VAST tracking events
    const platformSequence = [
      { offset: 50, y: 900, width: 96, appearsAt: 0 },      // start
      { offset: 100, y: 800, width: 96, appearsAt: 0.25 },  // firstQuartile
      { offset: 150, y: 700, width: 96, appearsAt: 0.50 },  // midpoint
      { offset: 100, y: 600, width: 128, appearsAt: 0.75 }, // thirdQuartile
      { offset: 50, y: 500, width: 160, appearsAt: 1.0 },   // complete
    ];
    
    platformSequence.forEach(def => {
      const x = baseX + def.offset;
      const container = this.add.container(x, def.y);
      container.setAlpha(0.3); // Hidden until ad progresses
      container.setData('appearsAt', def.appearsAt);
      container.setData('revealed', false);
      
      // Platform graphics
      const platform = this.add.graphics();
      platform.fillStyle(0xff6600, 1);
      platform.fillRoundedRect(-def.width / 2, -8, def.width, 16, 4);
      platform.lineStyle(2, 0xffaa00, 1);
      platform.strokeRoundedRect(-def.width / 2, -8, def.width, 16, 4);
      container.add(platform);
      
      // Quartile label
      const quartileLabels = ['START', '25%', '50%', '75%', '100%'];
      const labelIdx = platformSequence.indexOf(def);
      const label = this.add.text(0, -20, quartileLabels[labelIdx], {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#ffcc00',
      });
      label.setOrigin(0.5);
      container.add(label);
      
      adBreak.platforms.push(container);
    });
  }

  /**
   * Create skip button for ad break
   */
  private createSkipButton(x: number, y: number): Phaser.GameObjects.Container {
    const button = this.add.container(x + 150, y);
    button.setDepth(500);
    
    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.95);
    bg.fillRoundedRect(-50, -20, 100, 40, 6);
    bg.lineStyle(2, 0xffcc00, 1);
    bg.strokeRoundedRect(-50, -20, 100, 40, 6);
    button.add(bg);
    
    // Skip text
    const text = this.add.text(0, 0, 'SKIP ⏭', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffcc00',
    });
    text.setOrigin(0.5);
    button.add(text);
    
    // Make interactive
    const hitArea = this.add.zone(0, 0, 100, 40);
    button.add(hitArea);
    hitArea.setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x555555, 0.95);
      bg.fillRoundedRect(-50, -20, 100, 40, 6);
      bg.lineStyle(2, 0xffff00, 1);
      bg.strokeRoundedRect(-50, -20, 100, 40, 6);
    });
    
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x333333, 0.95);
      bg.fillRoundedRect(-50, -20, 100, 40, 6);
      bg.lineStyle(2, 0xffcc00, 1);
      bg.strokeRoundedRect(-50, -20, 100, 40, 6);
    });
    
    hitArea.on('pointerdown', () => {
      const idx = button.getData('adBreakIndex');
      this.skipAd(idx);
    });
    
    return button;
  }

  // ============================================================================
  // BUFFER ZONES
  // ============================================================================

  /**
   * Create buffer/loading zones
   */
  private createBufferZones(): void {
    const bufferPositions = [
      { x: 1000, y: LEVEL_CONFIG.groundHeight - 100 },
      { x: 2000, y: LEVEL_CONFIG.groundHeight - 100 },
      { x: 3000, y: LEVEL_CONFIG.groundHeight - 100 },
    ];
    
    bufferPositions.forEach((pos, idx) => {
      // Buffer zone visual
      const bufferVisual = this.add.container(pos.x, pos.y);
      
      // Spinning loader
      const loader = this.add.graphics();
      loader.lineStyle(4, 0xffcc00, 1);
      loader.arc(0, 0, 30, 0, Math.PI * 1.5);
      loader.strokePath();
      bufferVisual.add(loader);
      
      // Animate spin
      this.tweens.add({
        targets: loader,
        angle: 360,
        duration: 1000,
        repeat: -1,
        ease: 'Linear',
      });
      
      // "BUFFERING" text
      const text = this.add.text(0, 50, 'BUFFERING...', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ffcc00',
      });
      text.setOrigin(0.5);
      bufferVisual.add(text);
      
      // Blink animation
      this.tweens.add({
        targets: text,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
      
      // Trigger zone
      const zone = this.add.zone(pos.x, pos.y, 80, 150);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      zone.setData('bufferIndex', idx);
      zone.setData('bufferVisual', bufferVisual);
      zone.setData('buffered', false);
      
      this.bufferZones.push(zone);
    });
  }

  // ============================================================================
  // VIDEO UI
  // ============================================================================

  /**
   * Create video player UI overlay
   */
  private createVideoUI(): void {
    this.videoUI = this.add.container(640, 50);
    this.videoUI.setDepth(1000);
    this.videoUI.setScrollFactor(0);
    
    // Video player frame
    const frame = this.add.graphics();
    frame.fillStyle(0x1a1a1a, 0.9);
    frame.fillRoundedRect(-200, -30, 400, 60, 8);
    frame.lineStyle(2, 0xff6600, 0.8);
    frame.strokeRoundedRect(-200, -30, 400, 60, 8);
    this.videoUI.add(frame);
    
    // Completion rate display
    this.completionRateDisplay = this.add.text(0, 0, 'VCR: 0% | Completed: 0 | Skipped: 0', {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#ffffff',
    });
    this.completionRateDisplay.setOrigin(0.5);
    this.videoUI.add(this.completionRateDisplay);
  }

  /**
   * Update video stats display
   */
  private updateVideoStats(): void {
    const totalAds = this.adsCompleted + this.adsSkipped;
    const vcr = totalAds > 0 ? Math.round((this.adsCompleted / totalAds) * 100) : 0;
    
    this.completionRateDisplay.setText(
      `VCR: ${vcr}% | Completed: ${this.adsCompleted} | Skipped: ${this.adsSkipped}`
    );
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
    
    // Lava damage
    this.physics.add.overlap(
      this.player,
      this.lavaPools,
      this.handleLavaDamage as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    
    // Ad break triggers
    const adTriggers = this.data.get('adTriggers') as Phaser.GameObjects.Zone[];
    if (adTriggers) {
      adTriggers.forEach(trigger => {
        this.physics.add.overlap(
          this.player,
          trigger,
          this.handleAdTrigger as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
          undefined,
          this
        );
      });
    }
    
    // Buffer zones
    this.bufferZones.forEach(zone => {
      this.physics.add.overlap(
        this.player,
        zone,
        this.handleBufferZone as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );
    });
  }

  /**
   * Handle lava damage
   */
  private handleLavaDamage(): void {
    // Respawn player at last safe position
    this.player.setPosition(this.player.x - 100, LEVEL_CONFIG.groundHeight - 100);
    this.cameras.main.flash(200, 255, 100, 0);
    
    // Cost penalty
    this.budgetSystem.calculateSpend({
      type: 'click',
      timestamp: Date.now(),
      value: 5,
    });
  }

  /**
   * Handle entering an ad break zone
   */
  private handleAdTrigger(
    _player: Phaser.GameObjects.GameObject,
    trigger: Phaser.GameObjects.GameObject
  ): void {
    const idx = (trigger as Phaser.GameObjects.Zone).getData('adBreakIndex') as number;
    const adBreak = this.adBreaks[idx];
    
    if (adBreak.state !== 'waiting') return;
    
    this.startAdBreak(idx);
  }

  /**
   * Handle buffer zone
   */
  private handleBufferZone(
    _player: Phaser.GameObjects.GameObject,
    zone: Phaser.GameObjects.GameObject
  ): void {
    const zoneObj = zone as Phaser.GameObjects.Zone;
    if (zoneObj.getData('buffered')) return;
    
    this.isBuffering = true;
    
    // Slow player during buffering
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(body.velocity.x * 0.3);
    
    // Complete buffering after delay
    this.time.delayedCall(1500, () => {
      zoneObj.setData('buffered', true);
      this.isBuffering = false;
      
      // Hide buffer visual
      const visual = zoneObj.getData('bufferVisual') as Phaser.GameObjects.Container;
      if (visual) {
        this.tweens.add({
          targets: visual,
          alpha: 0,
          duration: 300,
          onComplete: () => visual.setVisible(false),
        });
      }
    });
  }

  // ============================================================================
  // AD BREAK MECHANICS
  // ============================================================================

  /**
   * Start an ad break
   */
  private startAdBreak(index: number): void {
    const adBreak = this.adBreaks[index];
    adBreak.state = 'playing';
    adBreak.startTime = this.time.now;
    this.currentAdBreak = adBreak;
    this._isInAdBreak = true;
    
    console.log(`[World3] Ad break started: ${adBreak.type}`);
    
    // Show progress bar
    if (adBreak.progressBar) {
      adBreak.progressBar.setVisible(true);
    }
    if (adBreak.timerText) {
      adBreak.timerText.setVisible(true);
    }
    
    // Reveal first platform
    this.revealPlatform(adBreak, 0);
  }

  /**
   * Skip the current ad
   */
  private skipAd(index: number): void {
    const adBreak = this.adBreaks[index];
    if (adBreak.state !== 'playing') return;
    
    adBreak.state = 'skipped';
    this.adsSkipped++;
    this._isInAdBreak = false;
    this.currentAdBreak = null;
    
    // Hide skip button
    if (adBreak.skipButton) {
      adBreak.skipButton.setVisible(false);
    }
    
    // Flash effect
    this.cameras.main.flash(100, 255, 255, 0);
    
    // Penalty - don't reveal remaining platforms
    console.log(`[World3] Ad skipped: ${adBreak.type}`);
    
    this.updateVideoStats();
    
    // Emit skip event
    this.budgetSystem.calculateSpend({
      type: 'impression',
      timestamp: Date.now(),
      value: 0.5, // Partial credit
    });
  }

  /**
   * Complete an ad break
   */
  private completeAdBreak(adBreak: AdBreak): void {
    adBreak.state = 'completed';
    this.adsCompleted++;
    this._isInAdBreak = false;
    this.currentAdBreak = null;
    
    // Hide skip button
    if (adBreak.skipButton) {
      adBreak.skipButton.setVisible(false);
    }
    
    console.log(`[World3] Ad completed: ${adBreak.type}`);
    
    this.updateVideoStats();
    
    // Bonus for completion
    this.budgetSystem.calculateSpend({
      type: 'impression',
      timestamp: Date.now(),
      value: 1,
    });
    
    // Celebration effect
    this.cameras.main.flash(200, 0, 255, 100);
  }

  /**
   * Reveal a platform at the given progress index
   */
  private revealPlatform(adBreak: AdBreak, index: number): void {
    if (index >= adBreak.platforms.length) return;
    
    const platform = adBreak.platforms[index] as Phaser.GameObjects.Container;
    if (platform.getData('revealed')) return;
    
    platform.setData('revealed', true);
    
    this.tweens.add({
      targets: platform,
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });
    
    // Enable physics for this platform
    const x = platform.x;
    const y = platform.y;
    const physPlatform = this.platforms.create(x, y, 'tile-platform');
    physPlatform.setImmovable(true);
    physPlatform.setTint(0xff6600);
    physPlatform.setScale(3, 0.5);
    physPlatform.refreshBody();
  }

  /**
   * Update ad break progress
   */
  private updateAdBreak(adBreak: AdBreak): void {
    const elapsed = (this.time.now - adBreak.startTime) / 1000;
    const progress = Math.min(elapsed / adBreak.duration, 1);
    
    // Update progress bar
    if (adBreak.progressBar) {
      adBreak.progressBar.clear();
      adBreak.progressBar.fillStyle(0x333333, 1);
      adBreak.progressBar.fillRoundedRect(-80, 60, 160, 12, 3);
      adBreak.progressBar.fillStyle(0xff6600, 1);
      adBreak.progressBar.fillRoundedRect(-78, 62, 156 * progress, 8, 2);
    }
    
    // Update timer
    if (adBreak.timerText) {
      const remaining = Math.max(0, adBreak.duration - elapsed);
      const mins = Math.floor(remaining / 60);
      const secs = Math.floor(remaining % 60);
      adBreak.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
    
    // Show skip button after skippable time
    if (elapsed >= adBreak.skippableAt && adBreak.skipButton && !adBreak.skipButton.visible) {
      adBreak.skipButton.setVisible(true);
      
      // Animate in
      adBreak.skipButton.setAlpha(0);
      adBreak.skipButton.setScale(0.5);
      this.tweens.add({
        targets: adBreak.skipButton,
        alpha: 1,
        scale: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }
    
    // Reveal platforms based on progress
    adBreak.platforms.forEach((platform, idx) => {
      const container = platform as Phaser.GameObjects.Container;
      const appearsAt = container.getData('appearsAt') as number;
      
      if (progress >= appearsAt && !container.getData('revealed')) {
        this.revealPlatform(adBreak, idx);
      }
    });
    
    // Track view time
    this.totalViewTime += this.game.loop.delta / 1000;
    
    // Check for completion
    if (progress >= 1) {
      this.completeAdBreak(adBreak);
    }
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
    
    const glow = this.add.graphics();
    glow.fillStyle(0xff6600, 0.3);
    glow.fillCircle(0, 0, 60);
    portal.add(glow);
    
    const ring = this.add.graphics();
    ring.lineStyle(4, 0xff6600, 1);
    ring.strokeCircle(0, 0, 50);
    portal.add(ring);
    
    const label = this.add.text(0, 80, 'EXIT', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ff6600',
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
    
    console.log('[World3] Video Volcano complete!');
    console.log(`Final VCR: ${Math.round((this.adsCompleted / (this.adsCompleted + this.adsSkipped)) * 100)}%`);
    
    // Clear HUD before transition
    this.hud?.destroy();
    
    this.cameras.main.fadeOut(1000);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Go through tutorial for Audio Alps
      this.scene.start('AdTechTutorialScene', { levelKey: 'World3_AudioAlps' });
    });
  }

  // ============================================================================
  // UPDATE LOOP
  // ============================================================================

  update(time: number, delta: number): void {
    if (this.isLevelComplete) return;
    
    // Update player (slower if buffering)
    if (!this.isBuffering) {
      this.player.update(time, delta);
    }
    
    // Update current ad break
    if (this.currentAdBreak && this.currentAdBreak.state === 'playing') {
      this.updateAdBreak(this.currentAdBreak);
    }
  }

  /**
   * Clean up on scene shutdown
   */
  shutdown(): void {
    this.hud?.destroy();
  }
}
