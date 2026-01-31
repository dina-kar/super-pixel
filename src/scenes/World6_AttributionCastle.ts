/**
 * World6_AttributionCastle - Attribution & Measurement Fortress
 * 
 * A grand castle themed level teaching attribution concepts:
 * - First Touch Tower: First touchpoint gets all credit
 * - Last Touch Tower: Last touchpoint gets all credit
 * - Multi-Touch Maze: Linear, Time-Decay, Position-Based models
 * - Conversion Cathedral: Final conversion tracking
 * 
 * This world teaches:
 * - Attribution modeling fundamentals
 * - Multi-touch attribution
 * - Conversion tracking
 * - Customer journey mapping
 */

import Phaser from 'phaser';
import { BaseAdTechScene } from './BaseAdTechScene';
import { Player } from '../entities/Player';
import { HUD } from '../ui/HUD';
import { AttributionModels } from '../components/AttributionModels';
import type { TouchPoint, AttributionModelType } from '../components/AttributionModels';

/**
 * Level configuration
 */
const LEVEL_CONFIG = {
  width: 7000,
  height: 1500,
  groundHeight: 1400,
  
  // Zone definitions
  zones: {
    entrance: { start: 0, end: 600 },
    firstTouch: { start: 700, end: 1800 },
    lastTouch: { start: 1900, end: 3000 },
    multiTouch: { start: 3100, end: 5000 },
    cathedral: { start: 5100, end: 6900 },
  },
};

export class World6_AttributionCastle extends BaseAdTechScene {
  // Entities
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  
  // Attribution system
  private attributionModels!: AttributionModels;
  
  // Touchpoint zones for collision detection
  private touchpointZones: Phaser.GameObjects.Zone[] = [];
  
  // UI
  private hud!: HUD;
  private zoneIndicator!: Phaser.GameObjects.Container;
  private journeyDisplay!: Phaser.GameObjects.Container;
  
  // Conversion gate
  private conversionGate!: Phaser.GameObjects.Container;
  private isConversionUnlocked: boolean = false;
  
  // Level state
  private currentZone: string = 'entrance';
  private isLevelComplete: boolean = false;
  private collectedTouchpoints: number = 0;
  private requiredTouchpoints: number = 6;

  constructor() {
    super({ key: 'World6_AttributionCastle' });
  }

  init(): void {
    super.init();
    console.log('[World6] Initializing Attribution Castle');
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
    
    // Initialize attribution system
    this.attributionModels = new AttributionModels(this);
    this.setupAttributionEvents();
    
    // Create zone-specific elements
    this.createEntrance();
    this.createFirstTouchTower();
    this.createLastTouchTower();
    this.createMultiTouchMaze();
    this.createConversionCathedral();
    
    // Create player
    this.createPlayer();
    
    // Create UI elements
    this.createZoneIndicator();
    this.createJourneyDisplay();
    this.createModelSelector();
    
    // Set up camera
    this.setupCamera();
    
    // Create HUD
    this.hud = new HUD(this, this.budgetSystem, this.viewabilityTracker, {
      worldNumber: 6,
      worldName: 'Attribution Castle',
      color: '#c084fc'
    });
    
    // Set up collisions
    this.setupCollisions();
    
    // Fade in
    this.cameras.main.fadeIn(500);
    
    console.log('[World6] Attribution Castle created');
  }

  /**
   * Implement abstract method from BaseAdTechScene
   */
  protected setupAdTechMechanics(): void {
    this.budgetSystem.reset({
      totalBudget: 3000,
      pricingModel: 'CPA',
      currentSpend: 0,
    });
    
    this.budgetSystem.setRates({
      CPM: 5.00,
      CPC: 1.00,
      CPA: 25.00,
    });
  }

  /**
   * Set up attribution event handlers
   */
  private setupAttributionEvents(): void {
    this.attributionModels.on('touchpoint-collected', (data: { touchpoint: TouchPoint }) => {
      this.onTouchpointCollected(data.touchpoint);
    });
    
    this.attributionModels.on('conversion-complete', () => {
      this.onConversionComplete();
    });
    
    this.attributionModels.on('model-changed', (data: { model: AttributionModelType }) => {
      this.onModelChanged(data.model);
    });
  }

  // ============================================================================
  // BACKGROUND & VISUALS
  // ============================================================================

  /**
   * Create castle background
   */
  private createBackground(): void {
    // Twilight gradient sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x2d1b4e, 0x2d1b4e, 0x6b3fa0, 0x6b3fa0);
    sky.fillRect(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Stars
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, LEVEL_CONFIG.width);
      const y = Phaser.Math.Between(0, 600);
      const size = Math.random() * 2;
      
      const star = this.add.graphics();
      star.fillStyle(0xffffff, 0.3 + Math.random() * 0.7);
      star.fillCircle(x, y, size);
      star.setScrollFactor(0.3);
      
      // Twinkling animation
      if (Math.random() > 0.7) {
        this.tweens.add({
          targets: star,
          alpha: 0.3,
          duration: Phaser.Math.Between(1000, 3000),
          yoyo: true,
          repeat: -1,
        });
      }
    }
    
    // Castle towers in background
    this.createBackgroundTowers();
    
    // Zone labels
    this.createZoneLabels();
  }

  /**
   * Create background castle towers
   */
  private createBackgroundTowers(): void {
    const towers = [
      { x: 1250, height: 700, color: 0xff4444, label: 'FIRST TOUCH' },
      { x: 2450, height: 700, color: 0x44ff44, label: 'LAST TOUCH' },
      { x: 4050, height: 600, color: 0x4444ff, label: 'MULTI-TOUCH' },
      { x: 6000, height: 800, color: 0xffd700, label: 'CATHEDRAL' },
    ];
    
    towers.forEach(tower => {
      const graphics = this.add.graphics();
      graphics.setScrollFactor(0.3);
      
      // Tower body
      graphics.fillStyle(tower.color, 0.2);
      graphics.fillRect(tower.x - 80, LEVEL_CONFIG.height - tower.height, 160, tower.height);
      
      // Tower top (pointed)
      graphics.fillStyle(tower.color, 0.3);
      graphics.beginPath();
      graphics.moveTo(tower.x - 90, LEVEL_CONFIG.height - tower.height);
      graphics.lineTo(tower.x, LEVEL_CONFIG.height - tower.height - 100);
      graphics.lineTo(tower.x + 90, LEVEL_CONFIG.height - tower.height);
      graphics.closePath();
      graphics.fillPath();
      
      // Windows
      for (let i = 0; i < 5; i++) {
        graphics.fillStyle(0xffff88, 0.5);
        graphics.fillRect(
          tower.x - 20,
          LEVEL_CONFIG.height - tower.height + 80 + i * 100,
          40,
          60
        );
      }
    });
  }

  /**
   * Create zone labels
   */
  private createZoneLabels(): void {
    const zones = [
      { x: 300, label: 'ENTRANCE\nHALL', color: 0x888888 },
      { x: 1250, label: 'FIRST TOUCH\nTOWER', color: 0xff4444 },
      { x: 2450, label: 'LAST TOUCH\nTOWER', color: 0x44ff44 },
      { x: 4050, label: 'MULTI-TOUCH\nMAZE', color: 0x4444ff },
      { x: 6000, label: 'CONVERSION\nCATHEDRAL', color: 0xffd700 },
    ];
    
    zones.forEach(zone => {
      const banner = this.add.graphics();
      banner.fillStyle(zone.color, 0.2);
      banner.fillRoundedRect(zone.x - 100, 100, 200, 50, 8);
      banner.lineStyle(2, zone.color, 0.6);
      banner.strokeRoundedRect(zone.x - 100, 100, 200, 50, 8);
      banner.setScrollFactor(0.5);
      
      const label = this.add.text(zone.x, 125, zone.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#ffffff',
        align: 'center',
      });
      label.setOrigin(0.5);
      label.setScrollFactor(0.5);
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
    
    // Ground sections with castle flooring
    const sections = [
      { start: 0, end: 1700 },
      { start: 2000, end: 2900 },
      { start: 3200, end: 4900 },
      { start: 5200, end: LEVEL_CONFIG.width },
    ];
    
    sections.forEach(section => {
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
      
      // Castle floor decoration
      const floor = this.add.graphics();
      floor.fillStyle(0x4a3a5e, 1);
      floor.fillRect(section.start, LEVEL_CONFIG.groundHeight, width, 100);
      
      // Checkered pattern
      for (let i = 0; i < width / 64; i++) {
        floor.fillStyle(i % 2 === 0 ? 0x5a4a6e : 0x3a2a4e, 0.5);
        floor.fillRect(section.start + i * 64, LEVEL_CONFIG.groundHeight, 64, 32);
      }
    });
  }

  /**
   * Create platforms
   */
  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    // Add platforms for each zone
    const platformDefs = [
      // First Touch Tower
      { x: 800, y: 1200, w: 150 },
      { x: 1000, y: 1000, w: 150 },
      { x: 1200, y: 800, w: 150 },
      { x: 1400, y: 600, w: 150 },
      { x: 1600, y: 800, w: 150 },
      
      // Last Touch Tower
      { x: 2100, y: 1200, w: 150 },
      { x: 2300, y: 1000, w: 150 },
      { x: 2500, y: 800, w: 150 },
      { x: 2700, y: 600, w: 150 },
      { x: 2900, y: 800, w: 150 },
      
      // Multi-Touch Maze
      { x: 3300, y: 1100, w: 200 },
      { x: 3600, y: 900, w: 200 },
      { x: 3900, y: 700, w: 200 },
      { x: 4200, y: 500, w: 200 },
      { x: 4500, y: 700, w: 200 },
      { x: 4800, y: 900, w: 200 },
      
      // Cathedral
      { x: 5400, y: 1100, w: 200 },
      { x: 5700, y: 900, w: 200 },
      { x: 6000, y: 700, w: 300 },
      { x: 6400, y: 900, w: 200 },
      { x: 6700, y: 1100, w: 200 },
    ];
    
    platformDefs.forEach(def => {
      this.createCastlePlatform(def.x, def.y, def.w);
    });
  }

  /**
   * Create a castle-styled platform
   */
  private createCastlePlatform(x: number, y: number, width: number): void {
    const tilesNeeded = Math.ceil(width / 32);
    
    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.platforms.create(
        x - width / 2 + i * 32 + 16,
        y,
        'tile-ground'
      );
      tile.setImmovable(true);
      tile.setTint(0x6b3fa0);
      tile.refreshBody();
    }
    
    // Castle trim
    const trim = this.add.graphics();
    trim.fillStyle(0x8b5fc0, 1);
    trim.fillRect(x - width / 2, y - 8, width, 8);
    trim.fillStyle(0x5a3f8e, 1);
    trim.fillRect(x - width / 2, y + 24, width, 4);
  }

  // ============================================================================
  // ZONE CREATION
  // ============================================================================

  /**
   * Create entrance area
   */
  private createEntrance(): void {
    const zone = LEVEL_CONFIG.zones.entrance;
    
    // Welcome sign
    this.createExplanationSign(zone.start + 300, LEVEL_CONFIG.groundHeight - 150,
      '🏰 ATTRIBUTION CASTLE\n\nCollect TOUCHPOINTS\nalong the customer journey.\n\nDifferent models assign\nCREDIT differently!');
    
    // Castle gates
    const gates = this.add.graphics();
    gates.fillStyle(0x4a3a5e, 1);
    gates.fillRect(550, LEVEL_CONFIG.groundHeight - 300, 50, 300);
    gates.fillRect(550, LEVEL_CONFIG.groundHeight - 350, 100, 50);
    gates.lineStyle(3, 0x8b5fc0, 1);
    gates.strokeRect(550, LEVEL_CONFIG.groundHeight - 300, 50, 300);
  }

  /**
   * Create First Touch Tower zone
   */
  private createFirstTouchTower(): void {
    const zone = LEVEL_CONFIG.zones.firstTouch;
    
    // Touchpoints for first-touch demonstration
    const tp1 = this.attributionModels.createTouchpoint(800, 1150, 'search', 'first-touch-path');
    const tp2 = this.attributionModels.createTouchpoint(1200, 750, 'display', 'first-touch-path');
    
    this.registerTouchpointZones([tp1, tp2]);
    
    // Explanation sign
    this.createExplanationSign(zone.start + 150, LEVEL_CONFIG.groundHeight - 100,
      'FIRST TOUCH TOWER\n\nThe FIRST touchpoint\ngets 100% credit.\n\nGood for awareness\ncampaign tracking.');
    
    // Tower visual
    const tower = this.add.graphics();
    tower.fillStyle(0xff4444, 0.1);
    tower.fillRect(zone.start + 350, 400, 300, 1000);
    tower.lineStyle(3, 0xff4444, 0.4);
    tower.strokeRect(zone.start + 350, 400, 300, 1000);
  }

  /**
   * Create Last Touch Tower zone
   */
  private createLastTouchTower(): void {
    const zone = LEVEL_CONFIG.zones.lastTouch;
    
    // Touchpoints for last-touch demonstration
    const tp1 = this.attributionModels.createTouchpoint(2100, 1150, 'social', 'last-touch-path');
    const tp2 = this.attributionModels.createTouchpoint(2700, 550, 'email', 'last-touch-path');
    
    this.registerTouchpointZones([tp1, tp2]);
    
    // Explanation sign
    this.createExplanationSign(zone.start + 150, LEVEL_CONFIG.groundHeight - 100,
      'LAST TOUCH TOWER\n\nThe LAST touchpoint\ngets 100% credit.\n\nCommon but may miss\nearly journey value.');
    
    // Tower visual
    const tower = this.add.graphics();
    tower.fillStyle(0x44ff44, 0.1);
    tower.fillRect(zone.start + 350, 400, 300, 1000);
    tower.lineStyle(3, 0x44ff44, 0.4);
    tower.strokeRect(zone.start + 350, 400, 300, 1000);
  }

  /**
   * Create Multi-Touch Maze zone
   */
  private createMultiTouchMaze(): void {
    const zone = LEVEL_CONFIG.zones.multiTouch;
    
    // Multiple touchpoints for multi-touch demonstration
    const touchpoints = [
      this.attributionModels.createTouchpoint(3300, 1050, 'search', 'multi-touch-path'),
      this.attributionModels.createTouchpoint(3600, 850, 'display', 'multi-touch-path'),
      this.attributionModels.createTouchpoint(3900, 650, 'social', 'multi-touch-path'),
      this.attributionModels.createTouchpoint(4200, 450, 'email', 'multi-touch-path'),
      this.attributionModels.createTouchpoint(4500, 650, 'affiliate', 'multi-touch-path'),
      this.attributionModels.createTouchpoint(4800, 850, 'direct', 'multi-touch-path'),
    ];
    
    this.registerTouchpointZones(touchpoints);
    
    // Explanation sign
    this.createExplanationSign(zone.start + 100, LEVEL_CONFIG.groundHeight - 100,
      'MULTI-TOUCH MAZE\n\nLinear: Equal credit\nTime Decay: Recent = more\nPosition: 40-20-40 split\n\nChoose model in menu!');
    
    // Maze walls visual
    const maze = this.add.graphics();
    maze.lineStyle(4, 0x4444ff, 0.3);
    
    // Create maze-like pattern
    for (let i = 0; i < 10; i++) {
      const startX = zone.start + 100 + i * 180;
      const startY = 600 + (i % 2) * 200;
      maze.lineTo(startX, startY);
      maze.lineTo(startX + 100, startY + (i % 2 === 0 ? 100 : -100));
    }
    maze.strokePath();
  }

  /**
   * Create Conversion Cathedral zone
   */
  private createConversionCathedral(): void {
    const zone = LEVEL_CONFIG.zones.cathedral;
    
    // Grand cathedral structure
    const cathedral = this.add.graphics();
    cathedral.fillStyle(0xffd700, 0.1);
    cathedral.fillRect(zone.start + 300, 200, 800, 1200);
    
    // Stained glass windows
    const windowColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
    for (let i = 0; i < 6; i++) {
      const windowX = zone.start + 400 + i * 120;
      cathedral.fillStyle(windowColors[i], 0.3);
      cathedral.fillRect(windowX, 300, 80, 150);
      cathedral.lineStyle(2, windowColors[i], 0.6);
      cathedral.strokeRect(windowX, 300, 80, 150);
    }
    
    // Cathedral spire
    cathedral.fillStyle(0xffd700, 0.2);
    cathedral.beginPath();
    cathedral.moveTo(zone.start + 700, 200);
    cathedral.lineTo(zone.start + 600, 100);
    cathedral.lineTo(zone.start + 800, 100);
    cathedral.closePath();
    cathedral.fillPath();
    
    // Conversion gate
    this.createConversionGate(zone.start + 700, 700);
    
    // Explanation sign
    this.createExplanationSign(zone.start + 200, LEVEL_CONFIG.groundHeight - 100,
      'CONVERSION CATHEDRAL\n\nCollect ALL touchpoints\nto unlock the CONVERSION!\n\nYour journey determines\nfinal attribution credit.');
  }

  /**
   * Create conversion gate
   */
  private createConversionGate(x: number, y: number): void {
    this.conversionGate = this.add.container(x, y);
    this.conversionGate.setDepth(200);
    
    // Gate structure
    const gate = this.add.graphics();
    gate.fillStyle(0x4a3a5e, 1);
    gate.fillRect(-80, -150, 160, 300);
    gate.fillStyle(0x2a1a3e, 1);
    gate.fillRect(-60, -130, 120, 260);
    gate.lineStyle(4, 0xffd700, 0.8);
    gate.strokeRect(-60, -130, 120, 260);
    this.conversionGate.add(gate);
    
    // Lock icon
    const lock = this.add.text(0, -50, '🔒', {
      fontSize: '40px',
    });
    lock.setOrigin(0.5);
    lock.setName('lock');
    this.conversionGate.add(lock);
    
    // Progress indicator
    const progress = this.add.text(0, 50, '0 / 6\nTOUCHPOINTS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffd700',
      align: 'center',
    });
    progress.setOrigin(0.5);
    progress.setName('progress');
    this.conversionGate.add(progress);
    
    // Label
    const label = this.add.text(0, 130, 'CONVERSION GATE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffd700',
    });
    label.setOrigin(0.5);
    this.conversionGate.add(label);
    
    // Create collision zone
    const gateZone = this.add.zone(x, y, 100, 250);
    this.physics.world.enable(gateZone, Phaser.Physics.Arcade.STATIC_BODY);
    gateZone.setData('isConversionGate', true);
    
    this.physics.add.overlap(this.player, gateZone, () => {
      this.tryConversion();
    });
  }

  /**
   * Register touchpoint zones for collision
   */
  private registerTouchpointZones(touchpoints: TouchPoint[]): void {
    touchpoints.forEach(tp => {
      const zone = this.add.zone(tp.position.x, tp.position.y - 40, 50, 50);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      zone.setData('touchpointId', tp.id);
      this.touchpointZones.push(zone);
    });
  }

  // ============================================================================
  // UI ELEMENTS
  // ============================================================================

  /**
   * Create zone indicator
   */
  private createZoneIndicator(): void {
    this.zoneIndicator = this.add.container(640, 50);
    this.zoneIndicator.setDepth(800);
    this.zoneIndicator.setScrollFactor(0);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-120, -20, 240, 40, 8);
    this.zoneIndicator.add(bg);
    
    const text = this.add.text(0, 0, 'ENTRANCE HALL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#888888',
    });
    text.setOrigin(0.5);
    text.setName('zoneText');
    this.zoneIndicator.add(text);
  }

  /**
   * Create journey display
   */
  private createJourneyDisplay(): void {
    this.journeyDisplay = this.add.container(100, 200);
    this.journeyDisplay.setDepth(800);
    this.journeyDisplay.setScrollFactor(0);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-80, -40, 160, 100, 8);
    bg.lineStyle(1, 0xffd700, 0.5);
    bg.strokeRoundedRect(-80, -40, 160, 100, 8);
    this.journeyDisplay.add(bg);
    
    const header = this.add.text(0, -25, '🎯 JOURNEY PROGRESS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#ffd700',
    });
    header.setOrigin(0.5);
    this.journeyDisplay.add(header);
    
    const collected = this.add.text(0, 5, '0 / 6', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ffffff',
    });
    collected.setOrigin(0.5);
    collected.setName('collected');
    this.journeyDisplay.add(collected);
    
    const label = this.add.text(0, 35, 'TOUCHPOINTS', {
      fontFamily: '"Courier New", monospace',
      fontSize: '8px',
      color: '#888888',
    });
    label.setOrigin(0.5);
    this.journeyDisplay.add(label);
  }

  /**
   * Create model selector
   */
  private createModelSelector(): void {
    this.attributionModels.createModelSelector(1150, 130);
  }

  /**
   * Create explanation sign
   */
  private createExplanationSign(x: number, y: number, text: string): void {
    const sign = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-130, -80, 260, 160, 8);
    bg.lineStyle(2, 0x8b5fc0, 0.6);
    bg.strokeRoundedRect(-130, -80, 260, 160, 8);
    sign.add(bg);
    
    const signText = this.add.text(0, 0, text, {
      fontFamily: '"Courier New", monospace',
      fontSize: '9px',
      color: '#ffd700',
      align: 'center',
      lineSpacing: 4,
    });
    signText.setOrigin(0.5);
    sign.add(signText);
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle touchpoint collection
   */
  private onTouchpointCollected(_touchpoint: TouchPoint): void {
    this.collectedTouchpoints++;
    
    // Update journey display
    const collected = this.journeyDisplay.getByName('collected') as Phaser.GameObjects.Text;
    if (collected) {
      collected.setText(`${this.collectedTouchpoints} / ${this.requiredTouchpoints}`);
    }
    
    // Update conversion gate
    this.updateConversionGate();
    
    // Sound effect
    try { this.sound.play('bid_win', { volume: 0.4 }); } catch { /* Audio may not be loaded */ }
    
    // Check if all collected
    if (this.collectedTouchpoints >= this.requiredTouchpoints) {
      this.unlockConversion();
    }
  }

  /**
   * Update conversion gate progress
   */
  private updateConversionGate(): void {
    const progress = this.conversionGate.getByName('progress') as Phaser.GameObjects.Text;
    if (progress) {
      progress.setText(`${this.collectedTouchpoints} / ${this.requiredTouchpoints}\nTOUCHPOINTS`);
    }
  }

  /**
   * Unlock conversion gate
   */
  private unlockConversion(): void {
    this.isConversionUnlocked = true;
    
    // Update lock icon
    const lock = this.conversionGate.getByName('lock') as Phaser.GameObjects.Text;
    if (lock) {
      lock.setText('🔓');
    }
    
    // Glow effect
    this.tweens.add({
      targets: this.conversionGate,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: 2,
    });
    
    // Sound
    try { this.sound.play('conversion_chime', { volume: 0.6 }); } catch { /* Audio may not be loaded */ }
  }

  /**
   * Try to enter conversion gate
   */
  private tryConversion(): void {
    if (!this.isConversionUnlocked) {
      // Show message
      const msg = this.add.text(640, 360, 'Collect all touchpoints first!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: '#ff4444',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      });
      msg.setOrigin(0.5);
      msg.setScrollFactor(0);
      msg.setDepth(999);
      
      this.tweens.add({
        targets: msg,
        alpha: 0,
        y: 340,
        duration: 1500,
        onComplete: () => msg.destroy(),
      });
      
      return;
    }
    
    // Complete conversion
    this.attributionModels.completePath('multi-touch-path');
  }

  /**
   * Handle conversion complete
   */
  private onConversionComplete(): void {
    console.log('[World6] Conversion complete!');
    
    // Show attribution summary
    this.showAttributionSummary();
    
    // After delay, complete level
    this.time.delayedCall(3000, () => {
      this.completeLevel();
    });
  }

  /**
   * Handle model change
   */
  private onModelChanged(model: AttributionModelType): void {
    const config = this.attributionModels.getModelConfig(model);
    
    // Show model change notification
    const notification = this.add.text(640, 100, `📊 ${config.name} Model Active`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#' + config.color.toString(16).padStart(6, '0'),
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });
    notification.setOrigin(0.5);
    notification.setScrollFactor(0);
    notification.setDepth(999);
    
    this.tweens.add({
      targets: notification,
      alpha: 0,
      y: 80,
      duration: 2000,
      delay: 1000,
      onComplete: () => notification.destroy(),
    });
  }

  /**
   * Show attribution summary
   */
  private showAttributionSummary(): void {
    const summary = this.add.container(640, 360);
    summary.setDepth(999);
    summary.setScrollFactor(0);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(-200, -150, 400, 300, 16);
    bg.lineStyle(3, 0xffd700, 1);
    bg.strokeRoundedRect(-200, -150, 400, 300, 16);
    summary.add(bg);
    
    const title = this.add.text(0, -120, '🎉 CONVERSION COMPLETE!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ffd700',
    });
    title.setOrigin(0.5);
    summary.add(title);
    
    const model = this.attributionModels.getModel();
    const modelConfig = this.attributionModels.getModelConfig(model);
    
    const modelText = this.add.text(0, -80, `Model: ${modelConfig.name}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    modelText.setOrigin(0.5);
    summary.add(modelText);
    
    // Show touchpoint credits
    const touchpoints = this.attributionModels.getTouchpoints().filter(tp => tp.isCollected);
    let yOffset = -40;
    
    touchpoints.forEach(tp => {
      const credit = Math.round(tp.credit * 100);
      const line = this.add.text(0, yOffset, `${tp.channel.toUpperCase()}: ${credit}%`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '10px',
        color: credit > 30 ? '#00ff88' : '#888888',
      });
      line.setOrigin(0.5);
      summary.add(line);
      yOffset += 20;
    });
    
    const continueText = this.add.text(0, 120, 'Proceeding to Final World...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#00ff88',
    });
    continueText.setOrigin(0.5);
    summary.add(continueText);
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
    
    // Player vs touchpoint zones
    this.touchpointZones.forEach(zone => {
      this.physics.add.overlap(this.player, zone, () => {
        const tpId = zone.getData('touchpointId');
        if (tpId) {
          this.attributionModels.collectTouchpoint(tpId);
          zone.setData('touchpointId', null); // Prevent re-collection
        }
      });
    });
  }

  /**
   * Complete the level
   */
  private completeLevel(): void {
    this.isLevelComplete = true;
    
    console.log('[World6] Level complete!');
    
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('FinalWorld_WalledGarden');
    });
  }

  // ============================================================================
  // UPDATE LOOP
  // ============================================================================

  update(time: number, delta: number): void {
    if (!this.player || this.isLevelComplete) return;
    
    // Update player
    this.player.update(time, delta);
    
    // Update zone indicator
    this.updateZoneIndicator();
    
    // Update HUD
    if (this.hud) {
      this.hud.update();
    }
  }

  /**
   * Update zone indicator based on player position
   */
  private updateZoneIndicator(): void {
    if (!this.player) return;
    
    const playerX = this.player.x;
    let newZone = 'entrance';
    let zoneText = 'ENTRANCE HALL';
    let color = '#888888';
    
    const zones = LEVEL_CONFIG.zones;
    
    if (playerX > zones.cathedral.start) {
      newZone = 'cathedral';
      zoneText = 'CONVERSION CATHEDRAL';
      color = '#ffd700';
    } else if (playerX > zones.multiTouch.start) {
      newZone = 'multiTouch';
      zoneText = 'MULTI-TOUCH MAZE';
      color = '#4444ff';
    } else if (playerX > zones.lastTouch.start) {
      newZone = 'lastTouch';
      zoneText = 'LAST TOUCH TOWER';
      color = '#44ff44';
    } else if (playerX > zones.firstTouch.start) {
      newZone = 'firstTouch';
      zoneText = 'FIRST TOUCH TOWER';
      color = '#ff4444';
    }
    
    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
      
      const text = this.zoneIndicator.getByName('zoneText') as Phaser.GameObjects.Text;
      if (text) {
        text.setText(zoneText);
        text.setColor(color);
      }
    }
  }

  /**
   * Clean up resources
   */
  shutdown(): void {
    this.attributionModels?.destroy();
  }
}
