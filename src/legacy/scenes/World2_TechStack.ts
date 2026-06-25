/**
 * World2_TechStack - Tech Stack Towers (DSP/SSP/DMP)
 * 
 * A vertical scrolling tower level teaching programmatic advertising concepts:
 * - SSP Zone: Floor price barriers, ascending with bid validation
 * - DSP Zone: Falling with bid decision gates and time pressure
 * - DMP Zone: Horizontal data collection maze
 * 
 * This world teaches:
 * - Supply-Side Platform mechanics (floor prices, inventory management)
 * - Demand-Side Platform mechanics (RTB, bid shading, 100ms decisions)
 * - Data Management Platform concepts (1st vs 3rd party data, user profiles)
 * 
 * NPCs: S.S. Peter (robot helper), Debbie DSP (AI companion)
 */

import { BaseAdTechScene } from './BaseAdTechScene';
import { Player } from '../entities/Player';
import { HUD } from '../ui/HUD';
import { SSPAuction } from '../components/SSPAuction';
import type { FloorPriceBarrier } from '../components/SSPAuction';
import { DSPBidder } from '../components/DSPBidder';
import type { BidResponse } from '../components/DSPBidder';
import { DMPSystem } from '../components/DMPSystem';
import type { DataType, AudienceSegmentData } from '../types/adtech';

/**
 * Level configuration - Vertical tower design
 */
const LEVEL_CONFIG = {
  width: 1280,
  height: 3000, // Tall vertical level
  
  // Zone heights (from bottom to top)
  sspZone: { start: 2000, end: 3000 },  // Bottom: SSP ascending
  dspZone: { start: 1000, end: 2000 },  // Middle: DSP falling decisions
  dmpZone: { start: 0, end: 1000 },     // Top: DMP data maze
  
  spawnY: 2800, // Start near bottom
};

/**
 * NPC Dialogue data
 */
const NPC_DIALOGUES = {
  ssPeter: [
    "Hello! I'm S.S. Peter, your Supply-Side guide.",
    "See those glowing lines? Those are FLOOR PRICES.",
    "Publishers set minimum bids. Jump ABOVE the line to qualify!",
    "The higher the line, the more premium the inventory.",
    "Watch out - floor prices can SHIFT based on demand!",
  ],
  debbieDSP: [
    "Hey there! I'm Debbie, your DSP companion.",
    "In RTB, you have just 100 MILLISECONDS to decide!",
    "Press ↑ to BID or ↓ to PASS when you see a request.",
    "My AI will suggest optimal bids - but you make the call!",
    "Remember: bid too high = waste budget. Too low = lose auctions.",
  ],
};

export class World2_TechStack extends BaseAdTechScene {
  // Entities
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  
  // AdTech Systems (World 2 specific)
  private sspAuction!: SSPAuction;
  private dspBidder!: DSPBidder;
  private dmpSystem!: DMPSystem;
  
  // NPCs
  private ssPeter!: Phaser.GameObjects.Container;
  private debbieDSP!: Phaser.GameObjects.Container;
  private dialogueBox!: Phaser.GameObjects.Container;
  private currentDialogue: string[] = [];
  private dialogueIndex: number = 0;
  
  // UI
  private hud!: HUD;
  private zoneIndicator!: Phaser.GameObjects.Text;
  
  // Level state
  private currentZone: 'ssp' | 'dsp' | 'dmp' = 'ssp';
  private isLevelComplete: boolean = false;
  private floorBarriers: FloorPriceBarrier[] = [];
  private bidTriggers: Phaser.GameObjects.Zone[] = [];

  constructor() {
    super({ key: 'World2_TechStack' });
  }

  init(): void {
    super.init();
    console.log('[World2] Initializing Tech Stack Towers');
  }

  create(): void {
    super.create();
    
    // Set world bounds (tall vertical level)
    this.physics.world.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Create visuals
    this.createBackground();
    
    // Create level geometry
    this.createWalls();
    this.createPlatforms();
    
    // Initialize AdTech systems
    this.initializeAdTechSystems();
    
    // Create zone-specific elements
    this.createSSPZone();
    this.createDSPZone();
    this.createDMPZone();
    
    // Create NPCs
    this.createNPCs();
    
    // Create dialogue system
    this.createDialogueBox();
    
    // Create player
    this.createPlayer();
    
    // Set up camera (vertical following)
    this.setupCamera();
    
    // Create HUD
    this.hud = new HUD(this, this.budgetSystem, this.viewabilityTracker, {
      worldNumber: 2,
      worldName: 'Tech Stack',
      color: '#00d4ff'
    });
    
    // Create zone indicator
    this.createZoneIndicator();
    
    // Set up collisions
    this.setupCollisions();
    
    // Set up AdTech event handlers
    this.setupAdTechEventHandlers();
    
    // Fade in
    this.cameras.main.fadeIn(500);
    
    console.log('[World2] Scene created');
  }

  /**
   * Implement abstract method from BaseAdTechScene
   */
  protected setupAdTechMechanics(): void {
    // Configure budget for this level
    this.budgetSystem.reset({
      totalBudget: 2000, // More budget for auction mechanics
      pricingModel: 'CPC', // Focus on bidding costs
      currentSpend: 0,
    });
    
    this.budgetSystem.setRates({
      CPM: 4.00,
      CPC: 1.00,
      CPA: 20.00,
    });
  }

  /**
   * Initialize World 2 specific AdTech systems
   */
  private initializeAdTechSystems(): void {
    // SSP Auction system
    this.sspAuction = new SSPAuction(this, {
      baseFloorPrice: 3.00,
      maxFloorPrice: 15.00,
      minFloorPrice: 1.00,
      volatility: 0.2,
      competitorCount: 3,
    });
    
    // DSP Bidder system
    this.dspBidder = new DSPBidder(this, {
      decisionWindowMs: 100,
      baseBudget: 500,
      maxBidMultiplier: 3,
    });
    
    // DMP System
    this.dmpSystem = new DMPSystem(this, {
      currentLevel: 2,
      thirdPartyCookieLifespan: 3,
      profileCapacity: 100,
    });
  }

  // ============================================================================
  // BACKGROUND & VISUALS
  // ============================================================================

  /**
   * Create vertical tower background with zone gradients
   */
  private createBackground(): void {
    // Create gradient backgrounds for each zone
    const bg = this.add.graphics();
    
    // SSP Zone (bottom) - Blue/Cyan gradient (publishers)
    bg.fillGradientStyle(0x0a1628, 0x0a1628, 0x0a2840, 0x0a2840);
    bg.fillRect(0, LEVEL_CONFIG.sspZone.start, LEVEL_CONFIG.width, 1000);
    
    // DSP Zone (middle) - Purple gradient (advertisers)
    bg.fillGradientStyle(0x0a2840, 0x0a2840, 0x1a0a28, 0x1a0a28);
    bg.fillRect(0, LEVEL_CONFIG.dspZone.start, LEVEL_CONFIG.width, 1000);
    
    // DMP Zone (top) - Green/Gold gradient (data)
    bg.fillGradientStyle(0x1a0a28, 0x1a0a28, 0x0a280a, 0x0a280a);
    bg.fillRect(0, LEVEL_CONFIG.dmpZone.start, LEVEL_CONFIG.width, 1000);
    
    // Server rack decorations in background
    this.createServerRackDecorations();
    
    // Data flow particle streams
    this.createDataFlowStreams();
    
    // Grid overlay
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x00ff88, 0.05);
    
    for (let y = 0; y < LEVEL_CONFIG.height; y += 64) {
      gridGraphics.lineBetween(0, y, LEVEL_CONFIG.width, y);
    }
    for (let x = 0; x < LEVEL_CONFIG.width; x += 64) {
      gridGraphics.lineBetween(x, 0, x, LEVEL_CONFIG.height);
    }
    gridGraphics.setScrollFactor(0.8);
  }

  /**
   * Create server rack decoration sprites in background
   */
  private createServerRackDecorations(): void {
    const rackPositions = [
      { x: 100, y: 2500 }, { x: 1180, y: 2500 },
      { x: 100, y: 1500 }, { x: 1180, y: 1500 },
      { x: 100, y: 500 }, { x: 1180, y: 500 },
    ];
    
    rackPositions.forEach((pos, idx) => {
      const rack = this.add.graphics();
      rack.fillStyle(0x1a1a2e, 0.6);
      rack.fillRect(-40, -100, 80, 200);
      
      // Server lights (blinking)
      for (let i = 0; i < 8; i++) {
        rack.fillStyle(0x00ff88, 0.8);
        rack.fillCircle(-25 + (i % 4) * 15, -80 + Math.floor(i / 4) * 40, 3);
      }
      
      rack.lineStyle(1, 0x00ff88, 0.3);
      rack.strokeRect(-40, -100, 80, 200);
      
      rack.setPosition(pos.x, pos.y);
      rack.setScrollFactor(0.2);
      
      // Blink animation
      this.tweens.add({
        targets: rack,
        alpha: 0.7,
        duration: 500 + idx * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  /**
   * Create flowing data stream particles
   */
  private createDataFlowStreams(): void {
    // Vertical data streams
    for (let i = 0; i < 5; i++) {
      const x = 200 + i * 200;
      
      if (this.textures.exists('particle-glow')) {
        const stream = this.add.particles(x, LEVEL_CONFIG.height / 2, 'particle-glow', {
          y: { min: 0, max: LEVEL_CONFIG.height },
          lifespan: 3000,
          speed: { min: 100, max: 200 },
          angle: -90, // Upward flow
          scale: { start: 0.3, end: 0 },
          alpha: { start: 0.4, end: 0 },
          frequency: 300,
          tint: [0x00ff88, 0x66ccff, 0xffcc00],
          blendMode: 'ADD',
        });
        stream.setScrollFactor(0.5);
        stream.setDepth(-1);
      }
    }
  }

  // ============================================================================
  // LEVEL GEOMETRY
  // ============================================================================

  /**
   * Create tower walls
   */
  private createWalls(): void {
    this.walls = this.physics.add.staticGroup();
    
    // Left wall
    for (let y = 0; y < LEVEL_CONFIG.height; y += 32) {
      const tile = this.walls.create(16, y + 16, 'tile-wall');
      tile.setImmovable(true);
      tile.refreshBody();
    }
    
    // Right wall
    for (let y = 0; y < LEVEL_CONFIG.height; y += 32) {
      const tile = this.walls.create(LEVEL_CONFIG.width - 16, y + 16, 'tile-wall');
      tile.setImmovable(true);
      tile.refreshBody();
    }
    
    // Ground at bottom
    for (let x = 32; x < LEVEL_CONFIG.width - 32; x += 32) {
      const tile = this.walls.create(x + 16, LEVEL_CONFIG.height - 16, 'tile-ground');
      tile.setImmovable(true);
      tile.refreshBody();
    }
  }

  /**
   * Create platforms throughout the tower
   */
  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    // SSP Zone platforms (ascending challenge)
    const sspPlatforms = [
      { x: 640, y: 2900, width: 256 }, // Starting platform
      { x: 400, y: 2750, width: 160 },
      { x: 880, y: 2600, width: 160 },
      { x: 300, y: 2450, width: 128 },
      { x: 640, y: 2300, width: 192 },
      { x: 980, y: 2150, width: 128 },
      { x: 500, y: 2050, width: 320 }, // SSP exit platform
    ];
    
    // DSP Zone platforms (mixed challenge)
    const dspPlatforms = [
      { x: 640, y: 1950, width: 256 }, // DSP entry
      { x: 300, y: 1800, width: 128 },
      { x: 900, y: 1650, width: 128 },
      { x: 640, y: 1500, width: 192 },
      { x: 200, y: 1350, width: 128 },
      { x: 1000, y: 1200, width: 128 },
      { x: 640, y: 1050, width: 320 }, // DSP exit platform
    ];
    
    // DMP Zone platforms (maze-like)
    const dmpPlatforms = [
      { x: 640, y: 950, width: 256 }, // DMP entry
      { x: 250, y: 850, width: 160 },
      { x: 640, y: 750, width: 160 },
      { x: 1030, y: 650, width: 160 },
      { x: 400, y: 550, width: 128 },
      { x: 880, y: 450, width: 128 },
      { x: 640, y: 300, width: 192 },
      { x: 640, y: 100, width: 384 }, // Final platform / exit
    ];
    
    // Create all platforms
    [...sspPlatforms, ...dspPlatforms, ...dmpPlatforms].forEach(def => {
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
    
    // Platform glow effect
    const glow = this.add.graphics();
    glow.lineStyle(2, 0x00ff88, 0.3);
    glow.strokeRect(x - width / 2, y - 16, width, 32);
  }

  // ============================================================================
  // SSP ZONE CREATION
  // ============================================================================

  /**
   * Create SSP Zone elements (floor price barriers)
   */
  private createSSPZone(): void {
    // Zone label
    this.add.text(640, 2980, 'SSP ZONE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#66ccff',
    }).setOrigin(0.5);
    
    this.add.text(640, 2960, 'Supply-Side Platform', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    
    // Create floor price barriers at strategic heights
    const barrierPositions = [
      { x: 100, y: 2700, width: 500, price: 2.50 },
      { x: 680, y: 2550, width: 500, price: 3.50 },
      { x: 100, y: 2400, width: 400, price: 4.00 },
      { x: 780, y: 2200, width: 400, price: 5.00 },
      { x: 200, y: 2100, width: 880, price: 6.00 }, // Zone exit barrier
    ];
    
    barrierPositions.forEach(pos => {
      const barrier = this.sspAuction.createFloorBarrier(pos.x, pos.y, pos.width, pos.price);
      this.floorBarriers.push(barrier);
    });
  }

  // ============================================================================
  // DSP ZONE CREATION
  // ============================================================================

  /**
   * Create DSP Zone elements (bid request triggers)
   */
  private createDSPZone(): void {
    // Zone label
    this.add.text(640, 1980, 'DSP ZONE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#cc66ff',
    }).setOrigin(0.5);
    
    this.add.text(640, 1960, 'Demand-Side Platform', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    
    // Create bid request trigger zones
    const bidTriggerPositions = [
      { x: 300, y: 1850, width: 100, height: 50 },
      { x: 900, y: 1700, width: 100, height: 50 },
      { x: 640, y: 1550, width: 100, height: 50 },
      { x: 200, y: 1400, width: 100, height: 50 },
      { x: 1000, y: 1250, width: 100, height: 50 },
    ];
    
    bidTriggerPositions.forEach((pos, idx) => {
      // Create invisible trigger zone
      const zone = this.add.zone(pos.x, pos.y, pos.width, pos.height);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      zone.setData('bidTriggerId', idx);
      zone.setData('triggered', false);
      this.bidTriggers.push(zone);
      
      // Visual indicator
      const indicator = this.add.graphics();
      indicator.lineStyle(2, 0xcc66ff, 0.5);
      indicator.strokeRect(pos.x - pos.width / 2, pos.y - pos.height / 2, pos.width, pos.height);
      
      // Pulsing animation
      this.tweens.add({
        targets: indicator,
        alpha: 0.2,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      
      // "BID" label
      this.add.text(pos.x, pos.y - 40, '⚡BID', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#cc66ff',
      }).setOrigin(0.5);
    });
  }

  // ============================================================================
  // DMP ZONE CREATION
  // ============================================================================

  /**
   * Create DMP Zone elements (data coins)
   */
  private createDMPZone(): void {
    // Zone label
    this.add.text(640, 980, 'DMP ZONE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#66ff88',
    }).setOrigin(0.5);
    
    this.add.text(640, 960, 'Data Management Platform', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    
    // 1st-Party Data Coins (Gold - permanent)
    const firstPartyPositions = [
      { x: 250, y: 900, type: 'demographic' as DataType },
      { x: 640, y: 800, type: 'behavioral' as DataType },
      { x: 1030, y: 700, type: 'contextual' as DataType },
      { x: 400, y: 600, type: 'technographic' as DataType },
      { x: 640, y: 350, type: 'demographic' as DataType },
    ];
    
    firstPartyPositions.forEach(pos => {
      this.dmpSystem.createFirstPartyDataCoin(pos.x, pos.y, pos.type, 15);
    });
    
    // 3rd-Party Data Coins (Silver - temporary/flickering)
    const thirdPartyPositions = [
      { x: 350, y: 900, type: 'behavioral' as DataType },
      { x: 530, y: 800, type: 'contextual' as DataType },
      { x: 750, y: 800, type: 'demographic' as DataType },
      { x: 920, y: 700, type: 'technographic' as DataType },
      { x: 500, y: 600, type: 'behavioral' as DataType },
      { x: 780, y: 500, type: 'contextual' as DataType },
      { x: 550, y: 350, type: 'behavioral' as DataType },
      { x: 730, y: 350, type: 'technographic' as DataType },
    ];
    
    thirdPartyPositions.forEach(pos => {
      this.dmpSystem.createThirdPartyDataCoin(pos.x, pos.y, pos.type, 8);
    });
    
    // Exit portal at top
    this.createExitPortal();
  }

  /**
   * Create exit portal at top of tower
   */
  private createExitPortal(): void {
    const portal = this.add.container(640, 50);
    
    // Portal glow
    const glow = this.add.graphics();
    glow.fillStyle(0x00ff88, 0.3);
    glow.fillCircle(0, 0, 60);
    glow.fillStyle(0xffd700, 0.5);
    glow.fillCircle(0, 0, 40);
    portal.add(glow);
    
    // Portal ring
    const ring = this.add.graphics();
    ring.lineStyle(4, 0x00ff88, 1);
    ring.strokeCircle(0, 0, 50);
    portal.add(ring);
    
    // Portal label
    const label = this.add.text(0, 80, 'EXIT', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#00ff88',
    });
    label.setOrigin(0.5);
    portal.add(label);
    
    // Rotation animation
    this.tweens.add({
      targets: ring,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear',
    });
    
    // Pulse animation
    this.tweens.add({
      targets: glow,
      scale: 1.2,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Create trigger zone
    const exitZone = this.add.zone(640, 50, 80, 80);
    this.physics.world.enable(exitZone, Phaser.Physics.Arcade.STATIC_BODY);
    exitZone.setData('isExit', true);
    
    // Store for collision detection
    this.data.set('exitZone', exitZone);
  }

  // ============================================================================
  // NPCS
  // ============================================================================

  /**
   * Create NPC characters
   */
  private createNPCs(): void {
    // S.S. Peter (SSP Zone helper)
    this.ssPeter = this.createNPC(
      200, 2880,
      'S.S. Peter',
      0x66ccff,
      '🤖'
    );
    this.ssPeter.setData('dialogues', NPC_DIALOGUES.ssPeter);
    
    // Debbie DSP (DSP Zone helper)
    this.debbieDSP = this.createNPC(
      1000, 1880,
      'Debbie DSP',
      0xcc66ff,
      '🤖'
    );
    this.debbieDSP.setData('dialogues', NPC_DIALOGUES.debbieDSP);
    
    // Set up NPC interaction zones
    this.createNPCInteractionZone(this.ssPeter, 200, 2880);
    this.createNPCInteractionZone(this.debbieDSP, 1000, 1880);
  }

  /**
   * Create a single NPC
   */
  private createNPC(
    x: number,
    y: number,
    name: string,
    color: number,
    emoji: string
  ): Phaser.GameObjects.Container {
    const npc = this.add.container(x, y);
    npc.setDepth(100);
    
    // Body glow
    const glow = this.add.graphics();
    glow.fillStyle(color, 0.3);
    glow.fillCircle(0, 0, 30);
    npc.add(glow);
    
    // Robot body
    const body = this.add.graphics();
    body.fillStyle(color, 0.8);
    body.fillRoundedRect(-20, -30, 40, 50, 6);
    body.lineStyle(2, 0xffffff, 0.5);
    body.strokeRoundedRect(-20, -30, 40, 50, 6);
    npc.add(body);
    
    // Face emoji
    const face = this.add.text(0, -15, emoji, {
      fontSize: '20px',
    });
    face.setOrigin(0.5);
    npc.add(face);
    
    // Name tag
    const nameTag = this.add.text(0, 35, name, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#ffffff',
      backgroundColor: color.toString(16).padStart(6, '0'),
      padding: { x: 4, y: 2 },
    });
    nameTag.setOrigin(0.5);
    npc.add(nameTag);
    
    // Speech indicator
    const speechBubble = this.add.text(0, -50, '💬', {
      fontSize: '16px',
    });
    speechBubble.setOrigin(0.5);
    speechBubble.setName('speechBubble');
    npc.add(speechBubble);
    
    // Idle animation
    this.tweens.add({
      targets: npc,
      y: y - 5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Speech bubble bounce
    this.tweens.add({
      targets: speechBubble,
      y: -55,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    return npc;
  }

  /**
   * Create NPC interaction zone
   */
  private createNPCInteractionZone(npc: Phaser.GameObjects.Container, x: number, y: number): void {
    const zone = this.add.zone(x, y, 100, 80);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('npc', npc);
    zone.setData('interacted', false);
    
    // Store reference
    if (!this.data.get('npcZones')) {
      this.data.set('npcZones', []);
    }
    this.data.get('npcZones').push(zone);
  }

  // ============================================================================
  // DIALOGUE SYSTEM
  // ============================================================================

  /**
   * Create dialogue box UI
   */
  private createDialogueBox(): void {
    this.dialogueBox = this.add.container(640, 650);
    this.dialogueBox.setDepth(2000);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setVisible(false);
    
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1e, 0.95);
    bg.fillRoundedRect(-300, -50, 600, 100, 8);
    bg.lineStyle(2, 0x00ff88, 0.8);
    bg.strokeRoundedRect(-300, -50, 600, 100, 8);
    this.dialogueBox.add(bg);
    
    // Dialogue text
    const dialogueText = this.add.text(0, -10, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 560 },
    });
    dialogueText.setOrigin(0.5);
    dialogueText.setName('dialogueText');
    this.dialogueBox.add(dialogueText);
    
    // Continue hint
    const hint = this.add.text(0, 35, 'Press SPACE to continue', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#888888',
    });
    hint.setOrigin(0.5);
    this.dialogueBox.add(hint);
    
    // Set up space key to advance dialogue
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.dialogueBox.visible) {
        this.advanceDialogue();
      }
    });
  }

  /**
   * Show dialogue from NPC
   */
  private showDialogue(npc: Phaser.GameObjects.Container): void {
    const dialogues = npc.getData('dialogues') as string[];
    if (!dialogues || dialogues.length === 0) return;
    
    this.currentDialogue = dialogues;
    this.dialogueIndex = 0;
    
    this.dialogueBox.setVisible(true);
    this.updateDialogueText();
    
    // Freeze player completely during dialogue
    this.player.setData('canMove', false);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (playerBody) {
      playerBody.setVelocity(0, 0);
      playerBody.setAllowGravity(false);
    }
  }

  /**
   * Advance to next dialogue line
   */
  private advanceDialogue(): void {
    this.dialogueIndex++;
    
    if (this.dialogueIndex >= this.currentDialogue.length) {
      // End dialogue
      this.dialogueBox.setVisible(false);
      this.currentDialogue = [];
      this.dialogueIndex = 0;
      this.player.setData('canMove', true);
      
      // Restore player physics
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      if (playerBody) {
        playerBody.setAllowGravity(true);
      }
    } else {
      this.updateDialogueText();
    }
  }

  /**
   * Update dialogue text display
   */
  private updateDialogueText(): void {
    const textObj = this.dialogueBox.getByName('dialogueText') as Phaser.GameObjects.Text;
    if (textObj && this.currentDialogue[this.dialogueIndex]) {
      textObj.setText(this.currentDialogue[this.dialogueIndex]);
    }
  }

  // ============================================================================
  // PLAYER & CAMERA
  // ============================================================================

  /**
   * Create player entity
   */
  private createPlayer(): void {
    this.player = new Player(this, 640, LEVEL_CONFIG.spawnY);
    this.player.setBudgetManager(this.budgetSystem);
    this.player.setData('canMove', true);
  }

  /**
   * Set up camera to follow player (vertical focus)
   */
  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    this.cameras.main.setDeadzone(200, 150);
  }

  /**
   * Create zone indicator UI
   */
  private createZoneIndicator(): void {
    this.zoneIndicator = this.add.text(640, 50, 'SSP ZONE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#66ccff',
      backgroundColor: '#0a0a1e',
      padding: { x: 8, y: 4 },
    });
    this.zoneIndicator.setOrigin(0.5);
    this.zoneIndicator.setScrollFactor(0);
    this.zoneIndicator.setDepth(1000);
  }

  // ============================================================================
  // COLLISIONS
  // ============================================================================

  /**
   * Set up all collision handlers
   */
  private setupCollisions(): void {
    // Platform collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.walls);
    
    // Data coin collection
    const coinSprites = this.dmpSystem.getDataCoins().map(c => c.sprite);
    if (coinSprites.length > 0) {
      this.physics.add.overlap(
        this.player,
        coinSprites,
        this.handleDataCoinCollection as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );
    }
    
    // Bid trigger zones
    this.bidTriggers.forEach(zone => {
      this.physics.add.overlap(
        this.player,
        zone,
        this.handleBidTrigger as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );
    });
    
    // NPC interaction zones
    const npcZones = this.data.get('npcZones') as Phaser.GameObjects.Zone[];
    if (npcZones) {
      npcZones.forEach(zone => {
        this.physics.add.overlap(
          this.player,
          zone,
          this.handleNPCInteraction as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
          undefined,
          this
        );
      });
    }
    
    // Exit zone
    const exitZone = this.data.get('exitZone') as Phaser.GameObjects.Zone;
    if (exitZone) {
      this.physics.add.overlap(
        this.player,
        exitZone,
        this.handleLevelComplete as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );
    }
  }

  /**
   * Handle data coin collection
   */
  private handleDataCoinCollection(
    _player: Phaser.GameObjects.GameObject,
    coinSprite: Phaser.GameObjects.Sprite
  ): void {
    const coin = this.dmpSystem.getDataCoins().find(c => c.sprite === coinSprite);
    if (coin && !coin.isCollected) {
      this.dmpSystem.collectCoin(coin);
    }
  }

  /**
   * Handle bid trigger zone
   */
  private handleBidTrigger(
    _player: Phaser.GameObjects.GameObject,
    zone: Phaser.GameObjects.Zone
  ): void {
    if (zone.getData('triggered') || this.dspBidder.isShowingBidRequest()) return;
    
    zone.setData('triggered', true);
    
    // Generate and present a bid request
    const bidRequest = this.dspBidder.generateRandomBidRequest();
    this.dspBidder.presentBidRequest(bidRequest);
  }

  /**
   * Handle NPC interaction
   */
  private handleNPCInteraction(
    _player: Phaser.GameObjects.GameObject,
    zone: Phaser.GameObjects.Zone
  ): void {
    if (zone.getData('interacted') || this.dialogueBox.visible) return;
    
    const npc = zone.getData('npc') as Phaser.GameObjects.Container;
    if (npc) {
      zone.setData('interacted', true);
      this.showDialogue(npc);
      
      // Reset after delay
      this.time.delayedCall(5000, () => {
        zone.setData('interacted', false);
      });
    }
  }

  /**
   * Handle level completion
   */
  private handleLevelComplete(): void {
    if (this.isLevelComplete) return;
    this.isLevelComplete = true;
    
    console.log('[World2] Level complete!');
    
    // Get final stats
    const budgetState = this.budgetSystem.getState();
    const dmpStats = this.dmpSystem.getStats();
    
    // Show victory overlay
    this.showVictoryOverlay(budgetState, dmpStats);
  }

  /**
   * Show victory overlay with stats and auto-transition
   */
  private showVictoryOverlay(budgetState: any, dmpStats: any): void {
    // Dim background
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85);
    overlay.setScrollFactor(0);
    overlay.setDepth(3000);
    
    // Victory text
    const title = this.add.text(640, 150, 'TECH STACK CONQUERED!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '28px',
      color: '#66ccff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(3001);
    
    // Subtitle
    const subtitle = this.add.text(640, 200, 'DSP · SSP · DMP Mastered', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#888888',
    });
    subtitle.setOrigin(0.5);
    subtitle.setScrollFactor(0);
    subtitle.setDepth(3001);
    
    // Stats
    const statsText = [
      `Budget Remaining: $${(budgetState.totalBudget - budgetState.spent).toFixed(2)}`,
      `Bids Won: ${budgetState.clicks}`,
      `Data Points: ${dmpStats?.totalScore || 0}`,
      `Segments Unlocked: ${dmpStats?.segmentsUnlocked || 0}`,
    ].join('\n');
    
    const stats = this.add.text(640, 340, statsText, {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#ffffff',
      lineSpacing: 12,
      align: 'center',
    });
    stats.setOrigin(0.5);
    stats.setScrollFactor(0);
    stats.setDepth(3001);
    
    // Auto-continue countdown
    let countdown = 5;
    const prompt = this.add.text(640, 500, `Continuing in ${countdown}...`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#00ff88',
    });
    prompt.setOrigin(0.5);
    prompt.setScrollFactor(0);
    prompt.setDepth(3001);
    
    // Skip hint
    const skipHint = this.add.text(640, 535, 'Press SPACE or ENTER to continue now', {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#666666',
    });
    skipHint.setOrigin(0.5);
    skipHint.setScrollFactor(0);
    skipHint.setDepth(3001);
    
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
    
    // Allow early skip
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
      gameState.setCurrentWorld(2); // World 3 index
      gameState.save();
    });
    
    // Clear HUD before transitioning
    this.hud?.destroy();
    
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Go through tutorial for the next world
      this.scene.start('AdTechTutorialScene', { levelKey: 'World3_NativeNinja' });
    });
  }

  // ============================================================================
  // ADTECH EVENT HANDLERS
  // ============================================================================

  /**
   * Set up event handlers for AdTech systems
   */
  private setupAdTechEventHandlers(): void {
    // SSP events
    this.sspAuction.on('valid-bid', (data: { barrier: FloorPriceBarrier; playerY: number; margin: number }) => {
      console.log('[World2] Valid bid above floor price!', data);
      // Could award bonus points
    });
    
    this.sspAuction.on('invalid-bid', (data: { barrier: FloorPriceBarrier; playerY: number; deficit: number }) => {
      console.log('[World2] Bid below floor price!', data);
      // Could penalize player
    });
    
    // DSP events
    this.dspBidder.on('bid-submitted', (response: BidResponse) => {
      console.log('[World2] Bid submitted:', response);
      // Deduct from budget
      this.budgetSystem.calculateSpend({
        type: 'click',
        timestamp: Date.now(),
        value: response.bidAmount,
      });
    });
    
    this.dspBidder.on('bid-passed', () => {
      console.log('[World2] Bid passed - saved budget!');
    });
    
    // DMP events
    this.dmpSystem.on('data-collected', (data: { totalScore: number }) => {
      console.log('[World2] Data collected:', data);
    });
    
    this.dmpSystem.on('segment-unlocked', (segment: AudienceSegmentData) => {
      console.log('[World2] Segment unlocked:', segment.name);
    });
  }

  // ============================================================================
  // UPDATE LOOP
  // ============================================================================

  update(time: number, delta: number): void {
    if (this.isLevelComplete) return;
    
    // Update player
    if (this.player.getData('canMove')) {
      this.player.update(time, delta);
    }
    
    // Update zone indicator based on player Y position
    this.updateZoneIndicator();
    
    // Check floor price barriers (SSP Zone)
    this.checkFloorBarriers();
    
    // Show nearby floor price in SSP zone
    this.updateNearbyFloorPriceHint();
    
    // Check if player reached the exit zone (top of level)
    this.checkExitZone();
    
    // Update AdTech systems
    this.updateAdTechSystems();
    
    // Update HUD
    this.hud.update();
  }
  
  /**
   * Show hint about nearby floor price barriers
   */
  private updateNearbyFloorPriceHint(): void {
    if (this.currentZone !== 'ssp') return;
    
    const playerY = this.player.y;
    
    // Find nearest active barrier above player
    let nearestBarrier: FloorPriceBarrier | null = null;
    let nearestDist = Infinity;
    
    for (const barrier of this.floorBarriers) {
      if (!barrier.isActive) continue;
      const dist = playerY - barrier.y;
      if (dist > 0 && dist < nearestDist) {
        nearestDist = dist;
        nearestBarrier = barrier;
      }
    }
    
    // Show hint if barrier is close
    if (nearestBarrier !== null && nearestDist < 200) {
      const barrier = nearestBarrier;
      
      // Create or update hint
      if (!this.data.get('floorHint')) {
        const hint = this.add.text(0, 0, '', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffcc00',
          stroke: '#000000',
          strokeThickness: 2,
        });
        hint.setOrigin(0.5);
        hint.setDepth(1500);
        this.data.set('floorHint', hint);
      }
      
      const hint = this.data.get('floorHint') as Phaser.GameObjects.Text;
      hint.setPosition(this.player.x, this.player.y - 40);
      hint.setText(`FLOOR: $${barrier.price.toFixed(2)} ↑`);
      hint.setAlpha(Math.min(1, (200 - nearestDist) / 100));
      hint.setVisible(true);
    } else {
      const hint = this.data.get('floorHint') as Phaser.GameObjects.Text;
      if (hint) {
        hint.setVisible(false);
      }
    }
  }

  /**
   * Check if player has reached the exit zone
   */
  private checkExitZone(): void {
    // Player reached near the top of the level
    if (this.player.y < 150) {
      this.handleLevelComplete();
    }
  }

  /**
   * Update zone indicator based on player position
   */
  private updateZoneIndicator(): void {
    const playerY = this.player.y;
    let newZone: 'ssp' | 'dsp' | 'dmp' = this.currentZone;
    
    if (playerY >= LEVEL_CONFIG.sspZone.start) {
      newZone = 'ssp';
    } else if (playerY >= LEVEL_CONFIG.dspZone.start) {
      newZone = 'dsp';
    } else {
      newZone = 'dmp';
    }
    
    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
      this.onZoneChange(newZone);
    }
  }

  /**
   * Handle zone change
   */
  private onZoneChange(zone: 'ssp' | 'dsp' | 'dmp'): void {
    const zoneNames = {
      ssp: { name: 'SSP ZONE', color: '#66ccff' },
      dsp: { name: 'DSP ZONE', color: '#cc66ff' },
      dmp: { name: 'DMP ZONE', color: '#66ff88' },
    };
    
    const info = zoneNames[zone];
    this.zoneIndicator.setText(info.name);
    this.zoneIndicator.setColor(info.color);
    
    // Flash effect
    this.tweens.add({
      targets: this.zoneIndicator,
      scale: 1.3,
      duration: 200,
      yoyo: true,
      ease: 'Power2',
    });
    
    console.log(`[World2] Entered ${info.name}`);
  }

  /**
   * Check player against floor price barriers
   */
  private checkFloorBarriers(): void {
    if (this.currentZone !== 'ssp') return;
    
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (!playerBody) return;
    
    this.floorBarriers.forEach(barrier => {
      if (!barrier.isActive) return;
      
      const playerY = this.player.y;
      const barrierY = barrier.y;
      
      // Store previous position data
      const prevY = barrier.zone.getData('prevPlayerY') as number | undefined;
      barrier.zone.setData('prevPlayerY', playerY);
      
      // Check if player crossed from below to above the barrier
      if (prevY !== undefined && prevY >= barrierY && playerY < barrierY) {
        // Player jumped above barrier - valid bid!
        this.sspAuction.validateBid(playerY, barrier);
        this.sspAuction.deactivateBarrier(barrier);
        
        // Show success feedback
        this.showFloorPriceSuccess(barrier);
      } else if (prevY !== undefined && prevY < barrierY && playerY >= barrierY) {
        // Player fell below a barrier they were above - could penalize
        console.log('[World2] Player fell below floor price barrier');
      }
    });
  }
  
  /**
   * Show visual feedback when player clears a floor price
   */
  private showFloorPriceSuccess(barrier: FloorPriceBarrier): void {
    const text = this.add.text(this.player.x, this.player.y - 50, `+$${barrier.price.toFixed(2)} BID WON!`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    text.setDepth(2000);
    
    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
    
    // Award points
    this.budgetSystem.calculateSpend({
      type: 'impression',
      timestamp: Date.now(),
      value: barrier.price,
    });
  }

  /**
   * Update AdTech systems each frame
   */
  private updateAdTechSystems(): void {
    // Periodically update floor prices in SSP zone
    if (this.currentZone === 'ssp' && Phaser.Math.Between(0, 300) === 0) {
      this.sspAuction.updateFloorPrices();
    }
  }

  /**
   * Clean up on scene shutdown
   */
  shutdown(): void {
    this.sspAuction?.destroy();
    this.dspBidder?.destroy();
    this.dmpSystem?.destroy();
    this.hud?.destroy();
  }
}
