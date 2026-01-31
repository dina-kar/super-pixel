/**
 * World3_AudioAlps - Audio Advertising Level
 * 
 * A mountain/alpine-themed level teaching audio ad concepts:
 * - Rhythm Platforms: Only visible/solid on audio beats
 * - Companion Banners: Paired platforms that work together
 * - Frequency Visualization: Background reacts to "audio" frequencies
 * 
 * This world teaches:
 * - Audio ad formats and companion ads
 * - Sync between audio and visual elements
 * - Engagement through interactivity
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
  height: 1000,
  groundHeight: 900,
  
  // Audio track segments
  audioSegments: [
    { x: 400, bpm: 120, duration: 8000 },
    { x: 1200, bpm: 140, duration: 8000 },
    { x: 2000, bpm: 100, duration: 10000 },
    { x: 2800, bpm: 160, duration: 6000 },
    { x: 3500, bpm: 120, duration: 8000 },
  ],
};

/**
 * Beat state for rhythm platforms
 */
interface BeatState {
  isOnBeat: boolean;
  beatTime: number;
  nextBeat: number;
  bpm: number;
}

/**
 * Companion banner config
 */
interface CompanionBanner {
  audioZone: Phaser.GameObjects.Zone;
  bannerPlatform: Phaser.GameObjects.Container;
  isActive: boolean;
}

export class World3_AudioAlps extends BaseAdTechScene {
  // Entities
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private rhythmPlatforms: Phaser.GameObjects.Container[] = [];
  private rhythmBodies: Phaser.Physics.Arcade.StaticGroup | null = null;
  
  // Audio mechanics
  private beatState: BeatState = {
    isOnBeat: false,
    beatTime: 0,
    nextBeat: 0,
    bpm: 120,
  };
  private currentSegment: number = -1;
  private _segmentStartTime: number = 0;
  private companionBanners: CompanionBanner[] = [];
  
  // Visualization
  private frequencyBars: Phaser.GameObjects.Rectangle[] = [];
  private waveformLine!: Phaser.GameObjects.Graphics;
  
  // UI
  private hud!: HUD;
  private audioUI!: Phaser.GameObjects.Container;
  private bpmDisplay!: Phaser.GameObjects.Text;
  private beatIndicator!: Phaser.GameObjects.Graphics;
  
  // Level state
  private isLevelComplete: boolean = false;

  constructor() {
    super({ key: 'World3_AudioAlps' });
  }

  init(): void {
    super.init();
    console.log('[World3] Initializing Audio Alps');
  }

  create(): void {
    super.create();
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Create background with frequency visualization
    this.createBackground();
    
    // Create level geometry
    this.createGround();
    this.createPlatforms();
    
    // Create rhythm mechanics
    this.createRhythmPlatforms();
    this.createCompanionBanners();
    
    // Create player
    this.createPlayer();
    
    // Create audio UI
    this.createAudioUI();
    
    // Set up camera
    this.setupCamera();
    
    // Create HUD
    this.hud = new HUD(this, this.budgetSystem, this.viewabilityTracker, {
      worldNumber: 3,
      worldName: 'Audio Alps',
      color: '#9d4edd'
    });
    
    // Set up collisions
    this.setupCollisions();
    
    // Create exit portal
    this.createExitPortal();
    
    // Start beat system
    this.startBeatSystem();
    
    // Fade in
    this.cameras.main.fadeIn(500);
    
    console.log('[World3] Audio Alps created');
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
      CPM: 8.00, // Audio typically lower than video
      CPC: 1.00,
      CPA: 20.00,
    });
  }

  // ============================================================================
  // BACKGROUND & VISUALS
  // ============================================================================

  /**
   * Create alpine background with audio visualization
   */
  private createBackground(): void {
    // Gradient sky (alpine)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1a3366, 0x1a3366, 0x334499, 0x334499);
    sky.fillRect(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Mountain peaks
    for (let i = 0; i < 12; i++) {
      const mountain = this.add.graphics();
      const x = i * 400 - 100;
      const height = Phaser.Math.Between(200, 400);
      
      // Snow-capped mountains
      mountain.fillStyle(0x445577, 1);
      mountain.beginPath();
      mountain.moveTo(x, LEVEL_CONFIG.height);
      mountain.lineTo(x + 100, LEVEL_CONFIG.height - height);
      mountain.lineTo(x + 200, LEVEL_CONFIG.height);
      mountain.closePath();
      mountain.fill();
      
      // Snow cap
      mountain.fillStyle(0xffffff, 0.8);
      mountain.beginPath();
      mountain.moveTo(x + 80, LEVEL_CONFIG.height - height + 20);
      mountain.lineTo(x + 100, LEVEL_CONFIG.height - height);
      mountain.lineTo(x + 120, LEVEL_CONFIG.height - height + 20);
      mountain.closePath();
      mountain.fill();
      
      mountain.setScrollFactor(0.2 + i * 0.02);
    }
    
    // Frequency visualization bars (background)
    for (let i = 0; i < 32; i++) {
      const bar = this.add.rectangle(
        i * (LEVEL_CONFIG.width / 32) + 50,
        LEVEL_CONFIG.height - 50,
        30,
        50,
        0x6688cc,
        0.3
      );
      bar.setOrigin(0.5, 1);
      bar.setScrollFactor(0.1);
      this.frequencyBars.push(bar);
    }
    
    // Waveform overlay
    this.waveformLine = this.add.graphics();
    this.waveformLine.setScrollFactor(0);
    this.waveformLine.setDepth(10);
    
    // "AUDIO ZONE" signage
    const sign = this.add.text(200, 100, '🎵 AUDIO ALPS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#88aaff',
    });
    sign.setScrollFactor(0);
    sign.setDepth(100);
  }

  /**
   * Update frequency visualization
   */
  private updateVisualization(): void {
    // Simulate frequency bars based on beat
    this.frequencyBars.forEach((bar, i) => {
      const beatIntensity = this.beatState.isOnBeat ? 1.5 : 0.5;
      const randomHeight = Phaser.Math.Between(30, 150) * beatIntensity;
      const phase = Math.sin(this.time.now / 200 + i * 0.3) * 30;
      
      bar.setSize(30, randomHeight + phase);
      bar.setFillStyle(
        this.beatState.isOnBeat ? 0x88ccff : 0x6688cc,
        this.beatState.isOnBeat ? 0.6 : 0.3
      );
    });
    
    // Draw waveform
    this.waveformLine.clear();
    this.waveformLine.lineStyle(2, 0x88aaff, 0.5);
    this.waveformLine.beginPath();
    
    for (let x = 0; x < 1280; x += 4) {
      const y = 680 + Math.sin((x + this.time.now) / 30) * 20 * 
                (this.beatState.isOnBeat ? 2 : 1);
      if (x === 0) {
        this.waveformLine.moveTo(x, y);
      } else {
        this.waveformLine.lineTo(x, y);
      }
    }
    this.waveformLine.strokePath();
  }

  // ============================================================================
  // LEVEL GEOMETRY
  // ============================================================================

  /**
   * Create ground
   */
  private createGround(): void {
    this.ground = this.physics.add.staticGroup();
    
    // Ground with gaps for audio zones
    const groundSections = [
      { start: 0, end: 300 },
      { start: 500, end: 1100 },
      { start: 1300, end: 1900 },
      { start: 2100, end: 2700 },
      { start: 2900, end: 3400 },
      { start: 3600, end: LEVEL_CONFIG.width },
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
        tile.setTint(0x556677); // Alpine tint
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
      { x: 200, y: 750, width: 128 },
      { x: 700, y: 700, width: 160 },
      { x: 1500, y: 750, width: 128 },
      { x: 2300, y: 700, width: 160 },
      { x: 3100, y: 750, width: 128 },
      { x: 3800, y: 700, width: 192 },
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
        tile.setTint(0x667788);
        tile.refreshBody();
      }
    });
  }

  // ============================================================================
  // RHYTHM MECHANICS
  // ============================================================================

  /**
   * Create rhythm-based platforms
   */
  private createRhythmPlatforms(): void {
    this.rhythmBodies = this.physics.add.staticGroup();
    
    const rhythmDefs = [
      // Segment 1 platforms
      { x: 400, y: 800, width: 80, segment: 0 },
      { x: 500, y: 700, width: 80, segment: 0 },
      { x: 600, y: 600, width: 80, segment: 0 },
      // Segment 2 platforms
      { x: 1200, y: 800, width: 80, segment: 1 },
      { x: 1350, y: 650, width: 80, segment: 1 },
      { x: 1500, y: 500, width: 80, segment: 1 },
      // Segment 3 platforms
      { x: 2000, y: 750, width: 100, segment: 2 },
      { x: 2150, y: 600, width: 100, segment: 2 },
      { x: 2300, y: 750, width: 100, segment: 2 },
      // Segment 4 platforms
      { x: 2800, y: 800, width: 60, segment: 3 },
      { x: 2900, y: 700, width: 60, segment: 3 },
      { x: 3000, y: 600, width: 60, segment: 3 },
      { x: 3100, y: 500, width: 60, segment: 3 },
      // Segment 5 platforms
      { x: 3500, y: 750, width: 80, segment: 4 },
      { x: 3600, y: 650, width: 80, segment: 4 },
      { x: 3700, y: 550, width: 80, segment: 4 },
    ];
    
    rhythmDefs.forEach(def => {
      const container = this.add.container(def.x, def.y);
      container.setData('segment', def.segment);
      container.setData('width', def.width);
      
      // Platform visual
      const visual = this.add.graphics();
      visual.fillStyle(0x88aaff, 0.8);
      visual.fillRoundedRect(-def.width / 2, -10, def.width, 20, 6);
      visual.lineStyle(2, 0xaaddff, 1);
      visual.strokeRoundedRect(-def.width / 2, -10, def.width, 20, 6);
      container.add(visual);
      
      // Beat indicator ring
      const ring = this.add.graphics();
      ring.lineStyle(3, 0xffff88, 0);
      ring.strokeCircle(0, 0, def.width / 2 + 10);
      ring.setData('ring', true);
      container.add(ring);
      
      // Note icon
      const note = this.add.text(0, -25, '♪', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#88aaff',
      });
      note.setOrigin(0.5);
      container.add(note);
      
      // Create physics body (starts disabled)
      const body = this.rhythmBodies!.create(def.x, def.y, 'tile-platform');
      body.setImmovable(true);
      body.setScale(def.width / 32, 0.6);
      body.setAlpha(0); // Invisible - visual is in container
      (body.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      body.setData('container', container);
      container.setData('body', body);
      body.refreshBody();
      
      this.rhythmPlatforms.push(container);
    });
  }

  /**
   * Start the beat system
   */
  private startBeatSystem(): void {
    this.beatState = {
      isOnBeat: false,
      beatTime: 0,
      nextBeat: 0,
      bpm: 120,
    };
  }

  /**
   * Update beat state
   */
  private updateBeatState(): void {
    const now = this.time.now;
    const beatInterval = 60000 / this.beatState.bpm;
    
    // Check if we're on a beat
    if (now >= this.beatState.nextBeat) {
      this.beatState.isOnBeat = true;
      this.beatState.beatTime = now;
      this.beatState.nextBeat = now + beatInterval;
      
      // Trigger beat effects
      this.onBeat();
    } else if (now - this.beatState.beatTime > 100) {
      this.beatState.isOnBeat = false;
    }
    
    // Determine which segment player is in
    const playerX = this.player.x;
    let newSegment = -1;
    
    LEVEL_CONFIG.audioSegments.forEach((seg, idx) => {
      if (playerX >= seg.x - 100 && playerX < seg.x + 400) {
        newSegment = idx;
      }
    });
    
    if (newSegment !== this.currentSegment) {
      this.currentSegment = newSegment;
      
      if (newSegment >= 0) {
        this.beatState.bpm = LEVEL_CONFIG.audioSegments[newSegment].bpm;
        this._segmentStartTime = now;
        console.log(`[World3] Entered segment ${newSegment} at ${this.beatState.bpm} BPM`);
      }
    }
  }

  /**
   * Beat triggered effects
   */
  private onBeat(): void {
    // Flash beat indicator
    if (this.beatIndicator) {
      this.beatIndicator.clear();
      this.beatIndicator.fillStyle(0xffff88, 1);
      this.beatIndicator.fillCircle(0, 0, 15);
      
      this.tweens.add({
        targets: this.beatIndicator,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
      });
    }
    
    // Activate rhythm platforms in current segment
    this.rhythmPlatforms.forEach(container => {
      const segment = container.getData('segment') as number;
      const body = container.getData('body') as Phaser.Physics.Arcade.Sprite;
      
      if (segment === this.currentSegment || this.currentSegment === -1) {
        // Enable platform
        container.setAlpha(1);
        const physBody = body.body as Phaser.Physics.Arcade.StaticBody;
        physBody.enable = true;
        
        // Pulse effect
        this.tweens.add({
          targets: container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100,
          yoyo: true,
          ease: 'Bounce.easeOut',
        });
        
        // Ring effect
        const ring = container.getAll().find((child: Phaser.GameObjects.GameObject) => 
          child.getData && child.getData('ring')
        ) as Phaser.GameObjects.Graphics;
        
        if (ring) {
          ring.clear();
          ring.lineStyle(3, 0xffff88, 1);
          ring.strokeCircle(0, 0, (container.getData('width') as number) / 2 + 5);
          
          this.tweens.add({
            targets: ring,
            alpha: 0,
            duration: 200,
          });
        }
      }
    });
    
    // Disable after beat window
    this.time.delayedCall(200, () => {
      this.rhythmPlatforms.forEach(container => {
        const body = container.getData('body') as Phaser.Physics.Arcade.Sprite;
        container.setAlpha(0.4);
        const physBody = body.body as Phaser.Physics.Arcade.StaticBody;
        physBody.enable = false;
      });
    });
  }

  // ============================================================================
  // COMPANION BANNERS
  // ============================================================================

  /**
   * Create companion banner mechanics
   */
  private createCompanionBanners(): void {
    const companionDefs = [
      { audioX: 800, bannerX: 900, y: 650 },
      { audioX: 1600, bannerX: 1700, y: 550 },
      { audioX: 2400, bannerX: 2500, y: 650 },
      { audioX: 3200, bannerX: 3300, y: 550 },
    ];
    
    companionDefs.forEach((def, idx) => {
      // Audio zone (speaker icon)
      const audioContainer = this.add.container(def.audioX, def.y);
      
      const speaker = this.add.graphics();
      speaker.fillStyle(0x88aaff, 0.8);
      speaker.fillRoundedRect(-30, -30, 60, 60, 8);
      audioContainer.add(speaker);
      
      const speakerIcon = this.add.text(0, 0, '🔊', {
        fontSize: '24px',
      });
      speakerIcon.setOrigin(0.5);
      audioContainer.add(speakerIcon);
      
      const audioLabel = this.add.text(0, 45, 'AUDIO AD', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#88aaff',
      });
      audioLabel.setOrigin(0.5);
      audioContainer.add(audioLabel);
      
      const audioZone = this.add.zone(def.audioX, def.y, 80, 80);
      this.physics.world.enable(audioZone, Phaser.Physics.Arcade.STATIC_BODY);
      audioZone.setData('companionIndex', idx);
      
      // Banner platform (initially hidden)
      const bannerContainer = this.add.container(def.bannerX, def.y);
      bannerContainer.setAlpha(0.2);
      
      const bannerBg = this.add.graphics();
      bannerBg.fillStyle(0xaaddff, 0.9);
      bannerBg.fillRoundedRect(-60, -20, 120, 40, 6);
      bannerBg.lineStyle(2, 0xffffff, 1);
      bannerBg.strokeRoundedRect(-60, -20, 120, 40, 6);
      bannerContainer.add(bannerBg);
      
      const bannerText = this.add.text(0, 0, '📰 COMPANION', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#334466',
      });
      bannerText.setOrigin(0.5);
      bannerContainer.add(bannerText);
      
      // Create physics for banner (disabled initially)
      const bannerBody = this.platforms.create(def.bannerX, def.y, 'tile-platform');
      bannerBody.setImmovable(true);
      bannerBody.setScale(4, 1.2);
      bannerBody.setAlpha(0);
      (bannerBody.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      bannerBody.refreshBody();
      
      bannerContainer.setData('body', bannerBody);
      
      // Connection line
      const connLine = this.add.graphics();
      connLine.lineStyle(2, 0x88aaff, 0.3);
      connLine.lineBetween(def.audioX, def.y, def.bannerX, def.y);
      
      this.companionBanners.push({
        audioZone,
        bannerPlatform: bannerContainer,
        isActive: false,
      });
    });
  }

  /**
   * Activate companion banner
   */
  private activateCompanionBanner(index: number): void {
    const companion = this.companionBanners[index];
    if (companion.isActive) return;
    
    companion.isActive = true;
    
    // Reveal banner
    this.tweens.add({
      targets: companion.bannerPlatform,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
    
    // Enable physics
    const body = companion.bannerPlatform.getData('body') as Phaser.Physics.Arcade.Sprite;
    (body.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    
    console.log(`[World3] Companion banner ${index} activated`);
  }

  // ============================================================================
  // AUDIO UI
  // ============================================================================

  /**
   * Create audio player UI
   */
  private createAudioUI(): void {
    this.audioUI = this.add.container(640, 50);
    this.audioUI.setDepth(1000);
    this.audioUI.setScrollFactor(0);
    
    // Audio player frame
    const frame = this.add.graphics();
    frame.fillStyle(0x1a2a4a, 0.9);
    frame.fillRoundedRect(-200, -30, 400, 60, 8);
    frame.lineStyle(2, 0x88aaff, 0.8);
    frame.strokeRoundedRect(-200, -30, 400, 60, 8);
    this.audioUI.add(frame);
    
    // BPM display
    this.bpmDisplay = this.add.text(-150, 0, '♪ 120 BPM', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#88aaff',
    });
    this.bpmDisplay.setOrigin(0, 0.5);
    this.audioUI.add(this.bpmDisplay);
    
    // Beat indicator
    this.beatIndicator = this.add.graphics();
    this.beatIndicator.fillStyle(0xffff88, 0.3);
    this.beatIndicator.fillCircle(0, 0, 12);
    this.beatIndicator.setPosition(150, 0);
    this.audioUI.add(this.beatIndicator);
    
    // Beat label
    const beatLabel = this.add.text(150, 25, 'BEAT', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#888888',
    });
    beatLabel.setOrigin(0.5);
    this.audioUI.add(beatLabel);
  }

  /**
   * Update audio UI
   */
  private updateAudioUI(): void {
    this.bpmDisplay.setText(`♪ ${this.beatState.bpm} BPM`);
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
    // Ground and static platforms
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platforms);
    
    // Rhythm platforms
    if (this.rhythmBodies) {
      this.physics.add.collider(this.player, this.rhythmBodies);
    }
    
    // Companion audio zones
    this.companionBanners.forEach((companion, idx) => {
      this.physics.add.overlap(
        this.player,
        companion.audioZone,
        () => this.activateCompanionBanner(idx),
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
    
    const glow = this.add.graphics();
    glow.fillStyle(0x88aaff, 0.3);
    glow.fillCircle(0, 0, 60);
    portal.add(glow);
    
    const ring = this.add.graphics();
    ring.lineStyle(4, 0x88aaff, 1);
    ring.strokeCircle(0, 0, 50);
    portal.add(ring);
    
    const label = this.add.text(0, 80, 'EXIT', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#88aaff',
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
    
    console.log('[World3] Audio Alps complete!');
    
    // Clear HUD before transition
    this.hud?.destroy();
    
    this.cameras.main.fadeOut(1000);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Go through tutorial for Rich Media Rainbow
      this.scene.start('AdTechTutorialScene', { levelKey: 'World3_RichMediaRainbow' });
    });
  }

  // ============================================================================
  // UPDATE LOOP
  // ============================================================================

  update(time: number, delta: number): void {
    if (this.isLevelComplete) return;
    
    this.player.update(time, delta);
    this.updateBeatState();
    this.updateVisualization();
    this.updateAudioUI();
  }

  /**
   * Clean up
   */
  shutdown(): void {
    this.hud?.destroy();
  }
}
