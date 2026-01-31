/**
 * World4_AuctionArena - Real-Time Bidding Arena
 * 
 * A Roman colosseum-themed level teaching auction mechanics:
 * - Second-Price Stadium: Win by bidding high, pay second-highest + $0.01
 * - First-Price Forge: Pay exactly what you bid (requires bid shading)
 * - Header Bidding Heights: Parallel platform navigation
 * - Floor Price Lava: Don't bid below the floor or fall into lava
 * 
 * This world teaches:
 * - Auction types and their strategic implications
 * - Bid shading for first-price auctions
 * - Waterfall vs Header Bidding approaches
 * - Floor price mechanics
 */

import Phaser from 'phaser';
import { BaseAdTechScene } from './BaseAdTechScene';
import { Player } from '../entities/Player';
import { HUD } from '../ui/HUD';
import { AuctionEngine } from '../components/AuctionEngine';
import type { InventorySlot } from '../components/AuctionEngine';
import { BidShading } from '../components/BidShading';
import type { ShadingSuggestion } from '../components/BidShading';
import { WaterfallSystem } from '../components/WaterfallSystem';
import type { AuctionType } from '../types/adtech';

/**
 * Level configuration
 */
const LEVEL_CONFIG = {
  width: 5000,
  height: 1200,
  groundHeight: 1100,
  
  // Zone definitions
  zones: {
    secondPrice: { start: 200, end: 1400, y: 1100 },
    firstPrice: { start: 1500, end: 2800, y: 1100 },
    waterfall: { start: 2900, end: 4000, y: 1100 },
    headerBidding: { start: 4100, end: 4900, y: 1100 },
  },
};

/**
 * Auction platform that player must bid to access
 */
interface AuctionPlatform {
  id: string;
  container: Phaser.GameObjects.Container;
  body: Phaser.Physics.Arcade.Sprite;
  slot: InventorySlot;
  auctionType: AuctionType;
  isUnlocked: boolean;
  bidUI?: Phaser.GameObjects.Container;
}

/**
 * Shadow Bidder Boss
 */
interface ShadowBidder {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  health: number;
  maxHealth: number;
  currentBid: number;
  phase: number;
}

export class World4_AuctionArena extends BaseAdTechScene {
  // Entities
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  // Lava pool reference (reserved for animation)
  // private _lavaPool!: Phaser.GameObjects.TileSprite;
  
  // Auction systems
  private auctionEngine!: AuctionEngine;
  private bidShading!: BidShading;
  private waterfallSystem!: WaterfallSystem;
  
  // Auction platforms
  private auctionPlatforms: AuctionPlatform[] = [];
  private activePlatform: AuctionPlatform | null = null;
  
  // Bidding UI
  private biddingUI!: Phaser.GameObjects.Container;
  private bidInputValue: number = 5.00;
  private isBiddingActive: boolean = false;
  
  // Shadow Bidder Boss
  private shadowBidder: ShadowBidder | null = null;
  // Boss fight state (reserved for future boss mechanics)
  // private _isBossFight: boolean = false;
  
  // Zone tracking
  private currentZone: 'second-price' | 'first-price' | 'waterfall' | 'header-bidding' = 'second-price';
  
  // UI
  private hud!: HUD;
  private zoneIndicator!: Phaser.GameObjects.Container;
  private auctionStats!: Phaser.GameObjects.Container;
  
  // Level state
  private isLevelComplete: boolean = false;

  constructor() {
    super({ key: 'World4_AuctionArena' });
  }

  init(): void {
    super.init();
    console.log('[World4] Initializing Auction Arena');
  }

  create(): void {
    super.create();
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Create visuals
    this.createBackground();
    
    // Create level geometry
    this.createGround();
    this.createLavaPool();
    this.createPlatforms();
    
    // Initialize auction systems
    this.initializeAuctionSystems();
    
    // Create auction platforms for each zone
    this.createSecondPriceZone();
    this.createFirstPriceZone();
    this.createWaterfallZone();
    this.createHeaderBiddingZone();
    
    // Create Shadow Bidder boss
    this.createShadowBidder();
    
    // Create player
    this.createPlayer();
    
    // Create UI elements
    this.createBiddingUI();
    this.createZoneIndicator();
    this.createAuctionStats();
    
    // Set up camera
    this.setupCamera();
    
    // Create HUD
    this.hud = new HUD(this, this.budgetSystem, this.viewabilityTracker, {
      worldNumber: 4,
      worldName: 'Auction Arena',
      color: '#fbbf24'
    });
    
    // Set up collisions
    this.setupCollisions();
    
    // Create exit portal
    this.createExitPortal();
    
    // Fade in
    this.cameras.main.fadeIn(500);
    
    console.log('[World4] Auction Arena created');
  }

  /**
   * Implement abstract method from BaseAdTechScene
   */
  protected setupAdTechMechanics(): void {
    this.budgetSystem.reset({
      totalBudget: 3000, // Higher budget for auction mechanics
      pricingModel: 'CPC',
      currentSpend: 0,
    });
    
    this.budgetSystem.setRates({
      CPM: 5.00,
      CPC: 1.50,
      CPA: 25.00,
    });
  }

  /**
   * Initialize auction systems
   */
  private initializeAuctionSystems(): void {
    this.auctionEngine = new AuctionEngine(this, 4);
    this.bidShading = new BidShading(this);
    this.waterfallSystem = new WaterfallSystem(this);
    
    // Set up auction event handlers
    this.auctionEngine.on('auction-complete', (event: {
      slot: InventorySlot;
      playerBid: number;
      playerWon: boolean;
      result: { winAmount: number };
    }) => {
      this.onAuctionComplete(event);
    });
  }

  // ============================================================================
  // BACKGROUND & VISUALS
  // ============================================================================

  /**
   * Create Roman colosseum background
   */
  private createBackground(): void {
    // Dark sky with digital effects
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a0a1e, 0x1a0a1e);
    sky.fillRect(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Colosseum arches in background
    for (let i = 0; i < 20; i++) {
      const arch = this.add.graphics();
      const x = i * 260 + 100;
      
      // Arch structure
      arch.fillStyle(0x2a2a3e, 0.8);
      arch.fillRect(x - 40, 200, 80, 400);
      
      // Arch opening
      arch.fillStyle(0x0a0a1e, 1);
      arch.beginPath();
      arch.arc(x, 350, 30, Math.PI, 0, true);
      arch.lineTo(x + 30, 550);
      arch.lineTo(x - 30, 550);
      arch.closePath();
      arch.fill();
      
      // Digital price displays
      const displayColor = [0x00ff88, 0xffcc00, 0xff4444][i % 3];
      arch.fillStyle(displayColor, 0.3);
      arch.fillRect(x - 25, 250, 50, 30);
      
      arch.setScrollFactor(0.3);
    }
    
    // Crowd silhouettes
    for (let row = 0; row < 3; row++) {
      const crowdGraphics = this.add.graphics();
      crowdGraphics.fillStyle(0x1a1a2e, 0.9 - row * 0.2);
      
      for (let i = 0; i < 50; i++) {
        const x = i * 100 + Phaser.Math.Between(-20, 20);
        const y = 100 + row * 50;
        const width = Phaser.Math.Between(15, 25);
        const height = Phaser.Math.Between(20, 35);
        
        // Head
        crowdGraphics.fillCircle(x, y - height / 2, width / 3);
        // Body
        crowdGraphics.fillRect(x - width / 2, y - height / 3, width, height);
      }
      
      crowdGraphics.setScrollFactor(0.1 + row * 0.05);
    }
    
    // Bid price tickers scrolling
    const tickerGraphics = this.add.graphics();
    tickerGraphics.fillStyle(0x00ff88, 0.1);
    tickerGraphics.fillRect(0, 0, LEVEL_CONFIG.width, 40);
    tickerGraphics.setScrollFactor(0);
    
    // Zone labels in background
    this.createZoneLabels();
  }

  /**
   * Create zone labels
   */
  private createZoneLabels(): void {
    const zones = [
      { x: 800, label: 'SECOND-PRICE\nSTADIUM', color: 0x00ff88 },
      { x: 2150, label: 'FIRST-PRICE\nFORGE', color: 0xffcc00 },
      { x: 3450, label: 'WATERFALL\nWILDS', color: 0x00ccff },
      { x: 4500, label: 'HEADER BIDDING\nHEIGHTS', color: 0xff44ff },
    ];
    
    zones.forEach(zone => {
      const banner = this.add.graphics();
      banner.fillStyle(zone.color, 0.2);
      banner.fillRoundedRect(zone.x - 150, 80, 300, 60, 8);
      banner.lineStyle(2, zone.color, 0.6);
      banner.strokeRoundedRect(zone.x - 150, 80, 300, 60, 8);
      banner.setScrollFactor(0.5);
      
      const label = this.add.text(zone.x, 110, zone.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
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
    
    // Arena floor sections (with gaps for lava)
    const sections = [
      { start: 0, end: 1300 },
      { start: 1600, end: 2700 },
      { start: 3000, end: 3900 },
      { start: 4200, end: LEVEL_CONFIG.width },
    ];
    
    sections.forEach(section => {
      const width = section.end - section.start;
      
      // Create ground tiles
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
      
      // Arena floor decoration
      const floorGraphics = this.add.graphics();
      floorGraphics.fillStyle(0x3a3a4e, 1);
      floorGraphics.fillRect(section.start, LEVEL_CONFIG.groundHeight, width, 100);
      floorGraphics.lineStyle(2, 0x5a5a6e, 1);
      floorGraphics.strokeRect(section.start, LEVEL_CONFIG.groundHeight, width, 100);
    });
  }

  /**
   * Create lava pool (floor price visualization)
   */
  private createLavaPool(): void {
    // Lava fills the gaps - represents falling below floor price
    const lavaZones = [
      { start: 1300, end: 1600 },
      { start: 2700, end: 3000 },
      { start: 3900, end: 4200 },
    ];
    
    lavaZones.forEach(zone => {
      const width = zone.end - zone.start;
      
      // Lava graphics
      const lava = this.add.graphics();
      lava.fillStyle(0xff4400, 0.8);
      lava.fillRect(zone.start, LEVEL_CONFIG.groundHeight + 50, width, 150);
      
      // Lava glow
      lava.fillStyle(0xff8800, 0.4);
      lava.fillRect(zone.start, LEVEL_CONFIG.groundHeight + 40, width, 20);
      
      // Floor price label
      const label = this.add.text(zone.start + width / 2, LEVEL_CONFIG.groundHeight + 100, 
        '⚠️ BELOW FLOOR PRICE', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ffffff',
      });
      label.setOrigin(0.5);
      
      // Create death zone
      const deathZone = this.add.zone(
        zone.start + width / 2,
        LEVEL_CONFIG.groundHeight + 100,
        width,
        100
      );
      this.physics.world.enable(deathZone, Phaser.Physics.Arcade.STATIC_BODY);
      // StaticBody doesn't need setAllowGravity - it's already immovable
      
      // Set data for collision handling
      deathZone.setData('isLava', true);
    });
  }

  /**
   * Create static platforms
   */
  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    // Add basic navigation platforms between auction zones
    const basicPlatforms = [
      { x: 400, y: 900, width: 150 },
      { x: 650, y: 750, width: 100 },
      { x: 950, y: 850, width: 120 },
      { x: 1800, y: 900, width: 150 },
      { x: 2200, y: 750, width: 100 },
      { x: 2500, y: 850, width: 120 },
      { x: 3200, y: 900, width: 150 },
      { x: 3550, y: 750, width: 100 },
    ];
    
    basicPlatforms.forEach(p => {
      this.createPlatformVisual(p.x, p.y, p.width);
    });
  }

  /**
   * Create a platform with visual styling
   */
  private createPlatformVisual(x: number, y: number, width: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // Platform graphic
    const graphic = this.add.graphics();
    graphic.fillStyle(0x3a3a4e, 1);
    graphic.fillRoundedRect(-width / 2, -8, width, 24, 4);
    graphic.lineStyle(2, 0x5a5a6e, 1);
    graphic.strokeRoundedRect(-width / 2, -8, width, 24, 4);
    container.add(graphic);
    
    // Physics body
    const tilesNeeded = Math.ceil(width / 32);
    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.platforms.create(
        x - width / 2 + i * 32 + 16,
        y,
        'tile-platform'
      );
      tile.setImmovable(true);
      tile.refreshBody();
    }
    
    return container;
  }

  // ============================================================================
  // AUCTION ZONES
  // ============================================================================

  /**
   * Create second-price auction zone
   */
  private createSecondPriceZone(): void {
    const zone = LEVEL_CONFIG.zones.secondPrice;
    
    // Create auction platforms
    const platformConfigs = [
      { x: 350, y: 600, value: 8, quality: 'premium' as const },
      { x: 600, y: 500, value: 6, quality: 'standard' as const },
      { x: 900, y: 550, value: 10, quality: 'premium' as const },
      { x: 1200, y: 450, value: 5, quality: 'standard' as const },
    ];
    
    platformConfigs.forEach((config, idx) => {
      this.createAuctionPlatform(
        config.x,
        config.y,
        `sp_${idx}`,
        'second-price',
        config.value,
        config.quality
      );
    });
    
    // Zone explanation NPC
    this.createExplanationSign(zone.start + 100, zone.y - 100, 
      'SECOND-PRICE AUCTION:\nWin with highest bid,\nbut only PAY second-highest + $0.01!\nNo need for bid shading here.');
  }

  /**
   * Create first-price auction zone
   */
  private createFirstPriceZone(): void {
    const zone = LEVEL_CONFIG.zones.firstPrice;
    
    const platformConfigs = [
      { x: 1650, y: 600, value: 7, quality: 'standard' as const },
      { x: 1950, y: 500, value: 9, quality: 'premium' as const },
      { x: 2250, y: 550, value: 6, quality: 'standard' as const },
      { x: 2550, y: 450, value: 12, quality: 'premium' as const },
    ];
    
    platformConfigs.forEach((config, idx) => {
      this.createAuctionPlatform(
        config.x,
        config.y,
        `fp_${idx}`,
        'first-price',
        config.value,
        config.quality
      );
    });
    
    this.createExplanationSign(zone.start + 100, zone.y - 100,
      'FIRST-PRICE AUCTION:\nYou PAY exactly what you bid!\nUse BID SHADING to avoid overpaying.\nWatch the AI suggestion!');
  }

  /**
   * Create waterfall zone
   */
  private createWaterfallZone(): void {
    const zone = LEVEL_CONFIG.zones.waterfall;
    
    // Cascading platforms (waterfall effect)
    for (let i = 0; i < 5; i++) {
      const x = zone.start + 150 + i * 180;
      const y = 800 - i * 60;
      
      this.createAuctionPlatform(
        x, y,
        `wf_${i}`,
        'second-price',
        4 + i * 1.5,
        i === 4 ? 'premium' : 'standard'
      );
    }
    
    this.createExplanationSign(zone.start + 50, zone.y - 100,
      'WATERFALL:\nPlatforms appear one-by-one.\nMiss one? Next drops lower!\nSequential = slower but predictable.');
  }

  /**
   * Create header bidding zone
   */
  private createHeaderBiddingZone(): void {
    const zone = LEVEL_CONFIG.zones.headerBidding;
    
    // All platforms visible at once (parallel)
    const platformConfigs = [
      { x: 4200, y: 700, value: 5 },
      { x: 4350, y: 550, value: 8 },
      { x: 4500, y: 650, value: 6 },
      { x: 4650, y: 500, value: 10 },
      { x: 4800, y: 600, value: 7 },
    ];
    
    platformConfigs.forEach((config, idx) => {
      this.createAuctionPlatform(
        config.x,
        config.y,
        `hb_${idx}`,
        'first-price',
        config.value,
        'standard'
      );
    });
    
    this.createExplanationSign(zone.start + 50, zone.y - 100,
      'HEADER BIDDING:\nAll platforms bid at ONCE!\nCompare prices, choose wisely.\nParallel = faster, higher yield!');
  }

  /**
   * Create an auction platform
   */
  private createAuctionPlatform(
    x: number,
    y: number,
    id: string,
    auctionType: AuctionType,
    estimatedValue: number,
    quality: 'premium' | 'standard' | 'remnant'
  ): void {
    const container = this.add.container(x, y);
    container.setDepth(100);
    
    // Platform colors based on type
    const colors = {
      'second-price': 0x00ff88,
      'first-price': 0xffcc00,
    };
    const color = colors[auctionType];
    
    // Platform graphic (locked state)
    const platformGraphic = this.add.graphics();
    platformGraphic.fillStyle(0x333333, 0.9);
    platformGraphic.fillRoundedRect(-60, -12, 120, 32, 6);
    platformGraphic.lineStyle(2, color, 0.5);
    platformGraphic.strokeRoundedRect(-60, -12, 120, 32, 6);
    container.add(platformGraphic);
    
    // Lock icon
    const lockIcon = this.add.text(0, 0, '🔒', {
      fontSize: '16px',
    });
    lockIcon.setOrigin(0.5);
    container.add(lockIcon);
    
    // Value label
    const valueLabel = this.add.text(0, -30, `$${estimatedValue.toFixed(2)}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#' + color.toString(16).padStart(6, '0'),
    });
    valueLabel.setOrigin(0.5);
    container.add(valueLabel);
    
    // Auction type badge
    const typeBadge = this.add.text(-55, 20, auctionType === 'second-price' ? '2nd' : '1st', {
      fontFamily: '"Courier New", monospace',
      fontSize: '8px',
      color: '#888888',
    });
    container.add(typeBadge);
    
    // Create physics body (disabled until unlocked)
    const body = this.physics.add.sprite(x, y, 'tile-platform');
    body.setVisible(false);
    body.setImmovable(true);
    (body.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    body.setSize(120, 24);
    body.setActive(false);
    
    // Create inventory slot
    const slot: InventorySlot = {
      id,
      name: `Platform ${id}`,
      estimatedValue,
      floorPrice: estimatedValue * 0.4,
      quality,
      position: { x, y },
    };
    
    // Store platform data
    const platform: AuctionPlatform = {
      id,
      container,
      body,
      slot,
      auctionType,
      isUnlocked: false,
    };
    
    this.auctionPlatforms.push(platform);
    
    // Create trigger zone for bidding
    const triggerZone = this.add.zone(x, y + 50, 120, 80);
    this.physics.world.enable(triggerZone, Phaser.Physics.Arcade.STATIC_BODY);
    triggerZone.setData('platformId', id);
  }

  /**
   * Create explanation sign
   */
  private createExplanationSign(x: number, y: number, text: string): void {
    const sign = this.add.container(x, y);
    
    // Sign background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-120, -60, 240, 120, 8);
    bg.lineStyle(2, 0x00ff88, 0.6);
    bg.strokeRoundedRect(-120, -60, 240, 120, 8);
    sign.add(bg);
    
    // Sign text
    const signText = this.add.text(0, 0, text, {
      fontFamily: '"Courier New", monospace',
      fontSize: '9px',
      color: '#00ff88',
      align: 'center',
      lineSpacing: 4,
    });
    signText.setOrigin(0.5);
    sign.add(signText);
    
    // Info icon
    const icon = this.add.text(-100, -45, 'ℹ️', {
      fontSize: '14px',
    });
    sign.add(icon);
  }

  // ============================================================================
  // SHADOW BIDDER BOSS
  // ============================================================================

  /**
   * Create the Shadow Bidder boss
   */
  private createShadowBidder(): void {
    // Boss area at the end of the level
    const bossX = 4900;
    const bossY = 600;
    
    const container = this.add.container(bossX, bossY);
    container.setDepth(200);
    
    // Boss sprite (dark mirror of player)
    const bossGraphic = this.add.graphics();
    bossGraphic.fillStyle(0x000000, 0.9);
    bossGraphic.fillRect(-40, -40, 80, 80);
    bossGraphic.lineStyle(3, 0xff00ff, 1);
    bossGraphic.strokeRect(-40, -40, 80, 80);
    
    // Inner glow
    bossGraphic.fillStyle(0x440044, 0.5);
    bossGraphic.fillRect(-30, -30, 60, 60);
    
    container.add(bossGraphic);
    
    // Boss name
    const nameLabel = this.add.text(0, -60, 'THE SHADOW BIDDER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ff00ff',
    });
    nameLabel.setOrigin(0.5);
    container.add(nameLabel);
    
    // Health bar
    const healthBarBg = this.add.graphics();
    healthBarBg.fillStyle(0x333333, 1);
    healthBarBg.fillRoundedRect(-50, -80, 100, 12, 4);
    container.add(healthBarBg);
    
    const healthBarFill = this.add.graphics();
    healthBarFill.fillStyle(0xff00ff, 1);
    healthBarFill.fillRoundedRect(-48, -78, 96, 8, 3);
    container.add(healthBarFill);
    
    this.shadowBidder = {
      container,
      sprite: this.add.sprite(bossX, bossY, 'player-small'),
      health: 100,
      maxHealth: 100,
      currentBid: 0,
      phase: 1,
    };
    
    // Boss is initially inactive
    container.setVisible(false);
  }

  // ============================================================================
  // BIDDING UI
  // ============================================================================

  /**
   * Create bidding interface
   */
  private createBiddingUI(): void {
    this.biddingUI = this.add.container(640, 360);
    this.biddingUI.setDepth(1000);
    this.biddingUI.setScrollFactor(0);
    this.biddingUI.setVisible(false);
    
    // Background panel
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1e, 0.98);
    bg.fillRoundedRect(-200, -150, 400, 300, 12);
    bg.lineStyle(3, 0xffcc00, 1);
    bg.strokeRoundedRect(-200, -150, 400, 300, 12);
    this.biddingUI.add(bg);
    
    // Header
    const header = this.add.text(0, -130, '🏛️ PLACE YOUR BID', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ffcc00',
    });
    header.setOrigin(0.5);
    this.biddingUI.add(header);
    
    // Bid amount display
    const bidDisplay = this.add.text(0, -50, '$5.00', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#00ff88',
    });
    bidDisplay.setOrigin(0.5);
    bidDisplay.setName('bidAmount');
    this.biddingUI.add(bidDisplay);
    
    // AI suggestion
    const suggestionBg = this.add.graphics();
    suggestionBg.fillStyle(0x1a1a3e, 0.9);
    suggestionBg.fillRoundedRect(-180, 0, 360, 60, 6);
    this.biddingUI.add(suggestionBg);
    
    const suggestionLabel = this.add.text(-170, 10, '🤖 AI Suggests:', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#888888',
    });
    this.biddingUI.add(suggestionLabel);
    
    const suggestionValue = this.add.text(-170, 30, '$4.50 (Low risk)', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#00ccff',
    });
    suggestionValue.setName('suggestion');
    this.biddingUI.add(suggestionValue);
    
    // Controls hint
    const controls = this.add.text(0, 100, '↑/↓ Adjust Bid   SPACE Confirm   ESC Cancel', {
      fontFamily: '"Courier New", monospace',
      fontSize: '9px',
      color: '#666666',
    });
    controls.setOrigin(0.5);
    this.biddingUI.add(controls);
    
    // Set up bidding input
    this.setupBiddingInput();
  }

  /**
   * Set up bidding keyboard controls
   */
  private setupBiddingInput(): void {
    if (!this.input.keyboard) return;
    
    const upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    
    upKey.on('down', () => {
      if (this.isBiddingActive) {
        this.adjustBid(0.50);
      }
    });
    
    downKey.on('down', () => {
      if (this.isBiddingActive) {
        this.adjustBid(-0.50);
      }
    });
    
    spaceKey.on('down', () => {
      if (this.isBiddingActive) {
        this.confirmBid();
      }
    });
    
    escKey.on('down', () => {
      if (this.isBiddingActive) {
        this.cancelBid();
      }
    });
  }

  /**
   * Show bidding UI for a platform
   */
  private showBiddingUI(platform: AuctionPlatform): void {
    this.activePlatform = platform;
    this.isBiddingActive = true;
    this.bidInputValue = platform.slot.estimatedValue * 0.7;
    
    // Update display
    this.updateBidDisplay();
    
    // Get AI suggestion
    const suggestion = this.bidShading.calculateShadedBid(
      platform.slot.estimatedValue,
      platform.slot.floorPrice,
      0.5
    );
    this.updateSuggestionDisplay(suggestion);
    
    // Show UI with animation
    this.biddingUI.setVisible(true);
    this.biddingUI.setAlpha(0);
    this.biddingUI.setScale(0.8);
    
    this.tweens.add({
      targets: this.biddingUI,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
    
    // Pause player
    if (this.player) {
      this.player.setVelocity(0, 0);
      (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    }
  }

  /**
   * Adjust bid amount
   */
  private adjustBid(delta: number): void {
    this.bidInputValue = Math.max(0.01, this.bidInputValue + delta);
    this.bidInputValue = Math.round(this.bidInputValue * 100) / 100;
    this.updateBidDisplay();
  }

  /**
   * Update bid amount display
   */
  private updateBidDisplay(): void {
    const bidText = this.biddingUI.getByName('bidAmount') as Phaser.GameObjects.Text;
    if (bidText) {
      bidText.setText(`$${this.bidInputValue.toFixed(2)}`);
      
      // Color based on risk
      if (this.activePlatform) {
        const ratio = this.bidInputValue / this.activePlatform.slot.estimatedValue;
        if (ratio > 0.9) {
          bidText.setColor('#ff4444'); // Overpaying
        } else if (ratio > 0.6) {
          bidText.setColor('#00ff88'); // Good range
        } else {
          bidText.setColor('#ffcc00'); // Risky low
        }
      }
    }
  }

  /**
   * Update AI suggestion display
   */
  private updateSuggestionDisplay(suggestion: ShadingSuggestion): void {
    const suggestionText = this.biddingUI.getByName('suggestion') as Phaser.GameObjects.Text;
    if (suggestionText) {
      const riskColors = {
        low: '#00ff88',
        medium: '#ffcc00',
        high: '#ff4444',
      };
      
      suggestionText.setText(
        `$${suggestion.suggestedBid.toFixed(2)} (${suggestion.riskLevel.toUpperCase()} risk)`
      );
      suggestionText.setColor(riskColors[suggestion.riskLevel]);
    }
  }

  /**
   * Confirm and execute bid
   */
  private confirmBid(): void {
    if (!this.activePlatform) return;
    
    // Execute auction
    const result = this.auctionEngine.startAuction(
      this.activePlatform.slot,
      this.bidInputValue,
      this.activePlatform.auctionType
    );
    
    // Hide bidding UI
    this.hideBiddingUI();
    
    // Handle result
    if (result.winnerId === 'player') {
      this.unlockPlatform(this.activePlatform, result.winAmount);
      
      // Deduct from budget
      this.budgetSystem.registerClick();
    } else {
      this.showLostAuctionFeedback(this.activePlatform);
    }
  }

  /**
   * Cancel bidding
   */
  private cancelBid(): void {
    this.hideBiddingUI();
  }

  /**
   * Hide bidding UI
   */
  private hideBiddingUI(): void {
    this.isBiddingActive = false;
    
    this.tweens.add({
      targets: this.biddingUI,
      alpha: 0,
      scale: 0.8,
      duration: 150,
      onComplete: () => {
        this.biddingUI.setVisible(false);
      },
    });
    
    // Resume player
    if (this.player) {
      (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
    }
    
    this.activePlatform = null;
  }

  /**
   * Unlock a platform after winning auction
   */
  private unlockPlatform(platform: AuctionPlatform, paidAmount: number): void {
    platform.isUnlocked = true;
    
    // Enable physics body
    platform.body.setActive(true);
    
    // Visual update
    const graphic = platform.container.getAt(0) as Phaser.GameObjects.Graphics;
    if (graphic) {
      graphic.clear();
      graphic.fillStyle(0x00ff88, 0.9);
      graphic.fillRoundedRect(-60, -12, 120, 32, 6);
      graphic.lineStyle(2, 0xffffff, 1);
      graphic.strokeRoundedRect(-60, -12, 120, 32, 6);
    }
    
    // Remove lock icon
    const lockIcon = platform.container.getAt(1) as Phaser.GameObjects.Text;
    if (lockIcon) {
      lockIcon.setText('✅');
    }
    
    // Show win notification
    this.showAuctionNotification(
      `WON! Paid $${paidAmount.toFixed(2)}`,
      platform.container.x,
      platform.container.y - 50,
      0x00ff88
    );
    
    // Victory sound effect (placeholder)
    try { this.sound.play('bid_win', { volume: 0.5 }); } catch { /* Audio may not be loaded */ }
  }

  /**
   * Show feedback for lost auction
   */
  private showLostAuctionFeedback(platform: AuctionPlatform): void {
    // Visual shake
    this.tweens.add({
      targets: platform.container,
      x: platform.container.x + 5,
      yoyo: true,
      repeat: 3,
      duration: 50,
    });
    
    // Lost notification
    this.showAuctionNotification(
      'OUTBID!',
      platform.container.x,
      platform.container.y - 50,
      0xff4444
    );
  }

  /**
   * Show auction result notification
   */
  private showAuctionNotification(text: string, x: number, y: number, color: number): void {
    const notification = this.add.text(x, y, text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 3,
    });
    notification.setOrigin(0.5);
    notification.setDepth(500);
    
    this.tweens.add({
      targets: notification,
      y: y - 50,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => notification.destroy(),
    });
  }

  /**
   * Handle auction completion event
   */
  private onAuctionComplete(event: {
    slot: InventorySlot;
    playerBid: number;
    playerWon: boolean;
    result: { winAmount: number };
  }): void {
    // Record outcome for bid shading learning
    this.bidShading.recordBidOutcome(
      event.slot.estimatedValue,
      event.playerBid,
      event.playerWon,
      event.result.winAmount
    );
    
    // Update stats display
    this.updateAuctionStats();
  }

  // ============================================================================
  // ZONE & STATS UI
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
    bg.fillRoundedRect(-100, -20, 200, 40, 8);
    this.zoneIndicator.add(bg);
    
    const text = this.add.text(0, 0, 'SECOND-PRICE STADIUM', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#00ff88',
    });
    text.setOrigin(0.5);
    text.setName('zoneText');
    this.zoneIndicator.add(text);
  }

  /**
   * Create auction stats display
   */
  private createAuctionStats(): void {
    this.auctionStats = this.add.container(1180, 100);
    this.auctionStats.setDepth(800);
    this.auctionStats.setScrollFactor(0);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-80, -40, 160, 80, 8);
    bg.lineStyle(1, 0xffcc00, 0.5);
    bg.strokeRoundedRect(-80, -40, 160, 80, 8);
    this.auctionStats.add(bg);
    
    const header = this.add.text(0, -30, '📊 STATS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ffcc00',
    });
    header.setOrigin(0.5);
    this.auctionStats.add(header);
    
    const statsText = this.add.text(-70, -10, 
      'Auctions: 0\nWon: 0 (0%)\nSaved: $0.00', {
      fontFamily: '"Courier New", monospace',
      fontSize: '9px',
      color: '#aaaaaa',
      lineSpacing: 4,
    });
    statsText.setName('statsText');
    this.auctionStats.add(statsText);
  }

  /**
   * Update auction stats display
   */
  private updateAuctionStats(): void {
    const stats = this.auctionEngine.getStats();
    const statsText = this.auctionStats.getByName('statsText') as Phaser.GameObjects.Text;
    
    if (statsText) {
      const winPercent = Math.round(stats.winRate * 100);
      statsText.setText(
        `Auctions: ${stats.auctions}\nWon: ${stats.won} (${winPercent}%)\nSaved: $${stats.saved.toFixed(2)}`
      );
    }
  }

  /**
   * Update zone indicator based on player position
   */
  private updateZoneIndicator(): void {
    if (!this.player) return;
    
    const playerX = this.player.x;
    let newZone: typeof this.currentZone = 'second-price';
    let zoneText = 'SECOND-PRICE STADIUM';
    let color = '#00ff88';
    
    if (playerX > 4100) {
      newZone = 'header-bidding';
      zoneText = 'HEADER BIDDING HEIGHTS';
      color = '#ff44ff';
    } else if (playerX > 2900) {
      newZone = 'waterfall';
      zoneText = 'WATERFALL WILDS';
      color = '#00ccff';
    } else if (playerX > 1500) {
      newZone = 'first-price';
      zoneText = 'FIRST-PRICE FORGE';
      color = '#ffcc00';
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

  // ============================================================================
  // PLAYER & CAMERA
  // ============================================================================

  /**
   * Create player
   */
  private createPlayer(): void {
    this.player = new Player(this, 100, LEVEL_CONFIG.groundHeight - 50);
    this.player.setBudgetManager(this.budgetSystem);
    
    // Add to scene
    this.add.existing(this.player);
  }

  /**
   * Set up camera following
   */
  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 50);
  }

  /**
   * Set up physics collisions
   */
  private setupCollisions(): void {
    // Player vs ground
    this.physics.add.collider(this.player, this.ground);
    
    // Player vs platforms
    this.physics.add.collider(this.player, this.platforms);
    
    // Player vs auction platforms (only unlocked ones)
    this.auctionPlatforms.forEach(platform => {
      this.physics.add.collider(this.player, platform.body, undefined, () => {
        return platform.isUnlocked;
      });
    });
  }

  /**
   * Create exit portal
   */
  private createExitPortal(): void {
    const portalX = LEVEL_CONFIG.width - 100;
    const portalY = 400;
    
    const portal = this.add.container(portalX, portalY);
    portal.setDepth(100);
    
    // Portal graphics
    const portalGraphic = this.add.graphics();
    portalGraphic.fillStyle(0x00ff88, 0.3);
    portalGraphic.fillCircle(0, 0, 50);
    portalGraphic.lineStyle(3, 0x00ff88, 1);
    portalGraphic.strokeCircle(0, 0, 50);
    portal.add(portalGraphic);
    
    // Portal label
    const label = this.add.text(0, 70, 'WORLD 5\nPRIVACY CITADEL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#00ff88',
      align: 'center',
    });
    label.setOrigin(0.5);
    portal.add(label);
    
    // Portal trigger zone
    const portalZone = this.add.zone(portalX, portalY, 80, 80);
    this.physics.world.enable(portalZone, Phaser.Physics.Arcade.STATIC_BODY);
    
    this.physics.add.overlap(this.player, portalZone, () => {
      if (!this.isLevelComplete) {
        this.completeLevel();
      }
    });
  }

  /**
   * Complete the level
   */
  private completeLevel(): void {
    this.isLevelComplete = true;
    
    // Show completion stats
    const stats = this.auctionEngine.getStats();
    console.log('[World4] Level complete!', stats);
    
    // Transition to next world
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('World5_PrivacyCitadel');
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
    
    // Check for auction platform triggers
    this.checkAuctionTriggers();
    
    // Update HUD
    if (this.hud) {
      this.hud.update();
    }
    
    // Viewability is tracked internally by the engine
  }

  /**
   * Check if player is near auction platforms
   */
  private checkAuctionTriggers(): void {
    if (this.isBiddingActive) return;
    
    this.auctionPlatforms.forEach(platform => {
      if (platform.isUnlocked) return;
      
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        platform.container.x,
        platform.container.y
      );
      
      if (distance < 80) {
        // Show "Press E to bid" prompt
        this.showBidPrompt(platform);
      }
    });
  }

  /**
   * Show bid prompt near platform
   */
  private showBidPrompt(platform: AuctionPlatform): void {
    // Check if E key is pressed
    if (this.input.keyboard?.checkDown(
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      250
    )) {
      this.showBiddingUI(platform);
    }
  }

  /**
   * Clean up resources
   */
  shutdown(): void {
    this.auctionEngine?.destroy();
    this.bidShading?.destroy();
    this.waterfallSystem?.destroy();
  }
}
