/**
 * World5_PrivacyCitadel - Identity & Privacy Fortress
 * 
 * A fortress-themed level teaching privacy and identity concepts:
 * - Cookie Crumble Caverns: Platforms disappear (3rd-party deprecation)
 * - ID Bridge: Cross device islands with Universal IDs
 * - Privacy Sandbox: Safe zones with differential privacy mechanics
 * - GDPR Gauntlet: Consent gates with TCF 2.0 mechanics
 * - Clean Room Vault: Encrypted data matching puzzles
 * 
 * This world teaches:
 * - Cookie deprecation and alternatives
 * - Universal ID solutions
 * - Privacy regulations (GDPR/CCPA)
 * - Consent management
 * - Invalid traffic detection
 */

import Phaser from 'phaser';
import { BaseAdTechScene } from './BaseAdTechScene';
import { Player } from '../entities/Player';
import { HUD } from '../ui/HUD';
import { CookieSystem } from '../components/CookieSystem';
import type { CookiePlatform } from '../components/CookieSystem';
import { ConsentManager } from '../components/ConsentManager';
import { UniversalID } from '../components/UniversalID';
import type { DeviceIsland, IDBridge } from '../components/UniversalID';
import { IVTBot } from '../entities/enemies/IVTBots';

/**
 * Level configuration
 */
const LEVEL_CONFIG = {
  width: 6000,
  height: 1400,
  groundHeight: 1300,
  
  // Zone definitions
  zones: {
    cookieCaverns: { start: 200, end: 1500 },
    idBridge: { start: 1600, end: 2800 },
    privacySandbox: { start: 2900, end: 4000 },
    gdprGauntlet: { start: 4100, end: 5200 },
    cleanRoom: { start: 5300, end: 5900 },
  },
};

export class World5_PrivacyCitadel extends BaseAdTechScene {
  // Entities
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private ivtBots!: Phaser.Physics.Arcade.Group;
  
  // Privacy systems
  private cookieSystem!: CookieSystem;
  private consentManager!: ConsentManager;
  private universalID!: UniversalID;
  
  // Device islands for Universal ID
  private deviceIslands: DeviceIsland[] = [];
  private idBridges: IDBridge[] = [];
  
  // Privacy Sandbox elements
  private sandboxZones: Phaser.GameObjects.Zone[] = [];
  private noiseOverlay!: Phaser.GameObjects.Graphics;
  private isInSandbox: boolean = false;
  
  // Clean Room puzzle
  private cleanRoomPuzzle: {
    playerPattern: number[];
    targetPattern: number[];
    isActive: boolean;
    container?: Phaser.GameObjects.Container;
  } = {
    playerPattern: [],
    targetPattern: [],
    isActive: false,
  };
  
  // UI
  private hud!: HUD;
  private zoneIndicator!: Phaser.GameObjects.Container;
  private privacyStatus!: Phaser.GameObjects.Container;
  
  // Level state
  private currentZone: string = 'cookieCaverns';
  private isLevelComplete: boolean = false;

  constructor() {
    super({ key: 'World5_PrivacyCitadel' });
  }

  init(): void {
    super.init();
    console.log('[World5] Initializing Privacy Citadel');
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
    
    // Initialize privacy systems
    this.initializePrivacySystems();
    
    // Create zone-specific elements
    this.createCookieCaverns();
    this.createIDBridgeZone();
    this.createPrivacySandbox();
    this.createGDPRGauntlet();
    this.createCleanRoom();
    
    // Create IVT bots (enemies)
    this.createIVTBots();
    
    // Create player
    this.createPlayer();
    
    // Create UI elements
    this.createZoneIndicator();
    this.createPrivacyStatus();
    
    // Set up camera
    this.setupCamera();
    
    // Create HUD
    this.hud = new HUD(this, this.budgetSystem, this.viewabilityTracker, {
      worldNumber: 5,
      worldName: 'Privacy Citadel',
      color: '#38bdf8'
    });
    
    // Set up collisions
    this.setupCollisions();
    
    // Create exit portal
    this.createExitPortal();
    
    // Fade in
    this.cameras.main.fadeIn(500);
    
    console.log('[World5] Privacy Citadel created');
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
      CPM: 6.00,
      CPC: 1.25,
      CPA: 22.00,
    });
  }

  /**
   * Initialize privacy systems
   */
  private initializePrivacySystems(): void {
    this.cookieSystem = new CookieSystem(this, {
      currentLevel: 5,
      thirdPartyLifespan: 2,
      deprecationProgress: 0.8,
    });
    
    this.consentManager = new ConsentManager(this);
    this.universalID = new UniversalID(this);
    
    // Set up event handlers
    this.cookieSystem.on('cookie-expired', (data: { platform: CookiePlatform }) => {
      this.onCookieExpired(data.platform);
    });
    
    this.consentManager.on('gate-opened', () => {
      try { this.sound.play('privacy_shield', { volume: 0.4 }); } catch { /* Audio may not be loaded */ }
    });
    
    this.universalID.on('bridge-collected', (data: { bridge: IDBridge }) => {
      this.onBridgeCollected(data.bridge);
    });
  }

  // ============================================================================
  // BACKGROUND & VISUALS
  // ============================================================================

  /**
   * Create fortress background
   */
  private createBackground(): void {
    // Dark fortress sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a3e, 0x1a1a3e);
    sky.fillRect(0, 0, LEVEL_CONFIG.width, LEVEL_CONFIG.height);
    
    // Fortress walls in background
    for (let i = 0; i < 15; i++) {
      const wall = this.add.graphics();
      const x = i * 450;
      const height = Phaser.Math.Between(400, 600);
      
      // Wall structure
      wall.fillStyle(0x2a2a4e, 0.8);
      wall.fillRect(x - 80, LEVEL_CONFIG.height - height, 160, height);
      
      // Battlements
      for (let j = 0; j < 5; j++) {
        wall.fillRect(
          x - 80 + j * 32,
          LEVEL_CONFIG.height - height - 30,
          20,
          30
        );
      }
      
      // Privacy shield glow
      wall.fillStyle(0x4444ff, 0.2);
      wall.fillRect(x - 60, LEVEL_CONFIG.height - height + 50, 120, 100);
      
      wall.setScrollFactor(0.2);
    }
    
    // Crumbling cookie particles in background
    if (this.textures.exists('particle-glow')) {
      const emitter = this.add.particles(0, 0, 'particle-glow', {
        x: { min: 200, max: 1500 },
        y: { min: 600, max: 1000 },
        lifespan: 3000,
        speed: { min: 20, max: 50 },
        angle: { min: 45, max: 135 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.5, end: 0 },
        frequency: 500,
        tint: [0xc0c0c0, 0xffd700], // Silver and gold (3P and 1P cookies)
        blendMode: 'ADD',
      });
      emitter.setScrollFactor(0.5);
    }
    
    // Zone labels
    this.createZoneLabels();
  }

  /**
   * Create zone labels
   */
  private createZoneLabels(): void {
    const zones = [
      { x: 850, label: 'COOKIE CRUMBLE\nCAVERNS', color: 0xc0c0c0 },
      { x: 2200, label: 'UNIVERSAL ID\nBRIDGE', color: 0x00ff88 },
      { x: 3450, label: 'PRIVACY\nSANDBOX', color: 0x4444ff },
      { x: 4650, label: 'GDPR\nGAUNTLET', color: 0xff8800 },
      { x: 5600, label: 'CLEAN ROOM\nVAULT', color: 0x00ccff },
    ];
    
    zones.forEach(zone => {
      const banner = this.add.graphics();
      banner.fillStyle(zone.color, 0.2);
      banner.fillRoundedRect(zone.x - 120, 100, 240, 60, 8);
      banner.lineStyle(2, zone.color, 0.6);
      banner.strokeRoundedRect(zone.x - 120, 100, 240, 60, 8);
      banner.setScrollFactor(0.5);
      
      const label = this.add.text(zone.x, 130, zone.label, {
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
    
    // Ground sections with gaps for chasms
    const sections = [
      { start: 0, end: 1400 },
      { start: 1700, end: 2700 },
      { start: 3000, end: 3900 },
      { start: 4200, end: 5100 },
      { start: 5400, end: LEVEL_CONFIG.width },
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
      
      // Fortress floor decoration
      const floor = this.add.graphics();
      floor.fillStyle(0x3a3a5e, 1);
      floor.fillRect(section.start, LEVEL_CONFIG.groundHeight, width, 100);
      floor.lineStyle(2, 0x4a4a6e, 1);
      floor.strokeRect(section.start, LEVEL_CONFIG.groundHeight, width, 100);
    });
  }

  /**
   * Create basic platforms
   */
  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
  }

  // ============================================================================
  // COOKIE CRUMBLE CAVERNS
  // ============================================================================

  /**
   * Create Cookie Crumble Caverns zone
   */
  private createCookieCaverns(): void {
    const zone = LEVEL_CONFIG.zones.cookieCaverns;
    
    // Create 1st-party cookie platforms (stable, gold)
    const firstPartyPositions = [
      { x: 350, y: 1100 },
      { x: 750, y: 900 },
      { x: 1150, y: 1000 },
    ];
    
    firstPartyPositions.forEach(pos => {
      const platform = this.cookieSystem.createCookiePlatform(
        pos.x,
        pos.y,
        'first-party',
        120
      );
      
      // Add to physics
      this.physics.add.collider(this.player, platform.body, undefined, () => true);
    });
    
    // Create 3rd-party cookie platforms (unstable, silver)
    const thirdPartyPositions = [
      { x: 500, y: 1000 },
      { x: 900, y: 800 },
      { x: 1300, y: 850 },
      { x: 1100, y: 700 },
    ];
    
    thirdPartyPositions.forEach(pos => {
      const platform = this.cookieSystem.createCookiePlatform(
        pos.x,
        pos.y,
        'third-party',
        100
      );
      
      // Add to physics (with conditional based on expiry)
      this.physics.add.collider(this.player, platform.body, undefined, () => !platform.isExpired);
    });
    
    // Create deprecation warning
    this.cookieSystem.createDeprecationWarning(zone.start + 200, 500);
    
    // Explanation sign
    this.createExplanationSign(zone.start + 100, LEVEL_CONFIG.groundHeight - 100,
      '3RD-PARTY COOKIES:\nFlickering platforms are\nDEPRECATING!\n\nGold 1st-party platforms\nare stable and PERMANENT.');
  }

  // ============================================================================
  // UNIVERSAL ID BRIDGE ZONE
  // ============================================================================

  /**
   * Create Universal ID Bridge zone
   */
  private createIDBridgeZone(): void {
    const zone = LEVEL_CONFIG.zones.idBridge;
    
    // Create device islands
    const mobileIsland = this.universalID.createDeviceIsland(
      zone.start + 200,
      1000,
      'mobile',
      180
    );
    
    const desktopIsland = this.universalID.createDeviceIsland(
      zone.start + 600,
      850,
      'desktop',
      200
    );
    
    const ctvIsland = this.universalID.createDeviceIsland(
      zone.start + 1000,
      950,
      'ctv',
      180
    );
    
    this.deviceIslands.push(mobileIsland, desktopIsland, ctvIsland);
    
    // Create ID bridges between islands
    const mobileToDeskBridge = this.universalID.createBridge(mobileIsland, desktopIsland);
    const deskToCTVBridge = this.universalID.createBridge(desktopIsland, ctvIsland);
    
    this.idBridges.push(mobileToDeskBridge, deskToCTVBridge);
    
    // Create identity graph UI
    this.universalID.createIdentityGraph(1180, 150);
    
    // Explanation sign
    this.createExplanationSign(zone.start + 50, LEVEL_CONFIG.groundHeight - 100,
      'UNIVERSAL ID:\nCollect ID tokens to\nBRIDGE device islands!\n\nCross-device identity\nreplaces 3rd-party cookies.');
  }

  // ============================================================================
  // PRIVACY SANDBOX ZONE
  // ============================================================================

  /**
   * Create Privacy Sandbox zone
   */
  private createPrivacySandbox(): void {
    const zone = LEVEL_CONFIG.zones.privacySandbox;
    
    // Create differential privacy noise overlay
    this.noiseOverlay = this.add.graphics();
    this.noiseOverlay.setDepth(500);
    this.noiseOverlay.setScrollFactor(0);
    this.noiseOverlay.setVisible(false);
    
    // Create sandbox safe zones
    const sandboxPositions = [
      { x: zone.start + 300, y: 800, width: 200, height: 300 },
      { x: zone.start + 700, y: 700, width: 250, height: 400 },
    ];
    
    sandboxPositions.forEach((pos, idx) => {
      // Visual sandbox area
      const sandboxGraphics = this.add.graphics();
      sandboxGraphics.fillStyle(0x4444ff, 0.2);
      sandboxGraphics.fillRoundedRect(
        pos.x - pos.width / 2,
        pos.y - pos.height / 2,
        pos.width,
        pos.height,
        16
      );
      sandboxGraphics.lineStyle(3, 0x4444ff, 0.6);
      sandboxGraphics.strokeRoundedRect(
        pos.x - pos.width / 2,
        pos.y - pos.height / 2,
        pos.width,
        pos.height,
        16
      );
      
      // Privacy shield icon
      const icon = this.add.text(pos.x, pos.y - pos.height / 2 + 30, '🛡️', {
        fontSize: '24px',
      });
      icon.setOrigin(0.5);
      
      const label = this.add.text(pos.x, pos.y - pos.height / 2 + 60, 'PRIVACY SANDBOX', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#4444ff',
      });
      label.setOrigin(0.5);
      
      // Create detection zone
      const sandboxZone = this.add.zone(pos.x, pos.y, pos.width, pos.height);
      this.physics.world.enable(sandboxZone, Phaser.Physics.Arcade.STATIC_BODY);
      sandboxZone.setData('sandboxId', idx);
      
      this.sandboxZones.push(sandboxZone);
    });
    
    // Explanation sign
    this.createExplanationSign(zone.start + 50, LEVEL_CONFIG.groundHeight - 100,
      'PRIVACY SANDBOX:\nBlue zones add NOISE\nto protect your identity.\n\nDifferential privacy:\ndata + randomness = safe!');
  }

  /**
   * Update differential privacy noise
   */
  private updateNoiseOverlay(intensity: number): void {
    if (!this.noiseOverlay) return;
    
    this.noiseOverlay.clear();
    
    if (intensity <= 0) {
      this.noiseOverlay.setVisible(false);
      return;
    }
    
    this.noiseOverlay.setVisible(true);
    
    // Draw random noise pixels
    const noiseCount = Math.floor(intensity * 200);
    for (let i = 0; i < noiseCount; i++) {
      const x = Phaser.Math.Between(0, 1280);
      const y = Phaser.Math.Between(0, 720);
      const size = Phaser.Math.Between(2, 6);
      const alpha = Math.random() * intensity * 0.5;
      
      this.noiseOverlay.fillStyle(0x4444ff, alpha);
      this.noiseOverlay.fillRect(x, y, size, size);
    }
  }

  // ============================================================================
  // GDPR GAUNTLET
  // ============================================================================

  /**
   * Create GDPR Gauntlet zone
   */
  private createGDPRGauntlet(): void {
    const zone = LEVEL_CONFIG.zones.gdprGauntlet;
    
    // Create consent gates at different positions
    const gateConfigs = [
      { x: zone.start + 200, y: 900, height: 400, purposes: [1] }, // Store info only
      { x: zone.start + 500, y: 850, height: 500, purposes: [1, 2] }, // Store + Ads
      { x: zone.start + 800, y: 800, height: 600, purposes: [1, 2, 3] }, // Full consent
    ];
    
    gateConfigs.forEach(config => {
      this.consentManager.createConsentGate(
        config.x,
        config.y,
        config.height,
        config.purposes
      );
    });
    
    // Create consent UI
    this.consentManager.createConsentUI();
    
    // Explanation sign
    this.createExplanationSign(zone.start + 50, LEVEL_CONFIG.groundHeight - 100,
      'GDPR GAUNTLET:\nConsent gates require\nPURPOSE permissions!\n\nTCF 2.0: Purpose 1=Storage\nPurpose 2=Ads, Purpose 3=Measure');
  }

  // ============================================================================
  // CLEAN ROOM VAULT
  // ============================================================================

  /**
   * Create Clean Room zone
   */
  private createCleanRoom(): void {
    const zone = LEVEL_CONFIG.zones.cleanRoom;
    
    // Clean room visual
    const roomGraphics = this.add.graphics();
    roomGraphics.fillStyle(0x00ccff, 0.1);
    roomGraphics.fillRoundedRect(zone.start, 400, 500, 800, 16);
    roomGraphics.lineStyle(3, 0x00ccff, 0.6);
    roomGraphics.strokeRoundedRect(zone.start, 400, 500, 800, 16);
    
    // Room header
    const header = this.add.text(zone.start + 250, 420, '🔐 DATA CLEAN ROOM', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#00ccff',
    });
    header.setOrigin(0.5);
    
    // Create puzzle pattern displays
    this.createCleanRoomPuzzle(zone.start + 250, 700);
    
    // Explanation sign
    this.createExplanationSign(zone.start + 50, LEVEL_CONFIG.groundHeight - 100,
      'CLEAN ROOM:\nMatch encrypted patterns\nWITHOUT seeing raw data!\n\nPrivacy-preserving\ndata collaboration.');
  }

  /**
   * Create clean room puzzle
   */
  private createCleanRoomPuzzle(x: number, y: number): void {
    const puzzleContainer = this.add.container(x, y);
    puzzleContainer.setDepth(150);
    
    // Generate random target pattern
    this.cleanRoomPuzzle.targetPattern = Array(6).fill(0).map(() => 
      Phaser.Math.Between(0, 2)
    );
    this.cleanRoomPuzzle.playerPattern = Array(6).fill(-1);
    
    // Pattern display (encrypted - shown as symbols)
    const targetLabel = this.add.text(0, -100, 'TARGET PATTERN (ENCRYPTED)', {
      fontFamily: '"Courier New", monospace',
      fontSize: '9px',
      color: '#888888',
    });
    targetLabel.setOrigin(0.5);
    puzzleContainer.add(targetLabel);
    
    // Show encrypted target (hashed representation)
    const encryptedSymbols = ['🔵', '🔴', '🟢'];
    const targetDisplay = this.add.text(0, -70, 
      this.cleanRoomPuzzle.targetPattern.map(n => encryptedSymbols[n]).join(' '), {
      fontSize: '24px',
    });
    targetDisplay.setOrigin(0.5);
    puzzleContainer.add(targetDisplay);
    
    // Player input area
    const inputLabel = this.add.text(0, 0, 'YOUR PATTERN', {
      fontFamily: '"Courier New", monospace',
      fontSize: '9px',
      color: '#888888',
    });
    inputLabel.setOrigin(0.5);
    puzzleContainer.add(inputLabel);
    
    // Input slots
    for (let i = 0; i < 6; i++) {
      const slotX = (i - 2.5) * 50;
      
      const slot = this.add.graphics();
      slot.fillStyle(0x333344, 1);
      slot.fillRoundedRect(slotX - 20, 20, 40, 40, 6);
      slot.lineStyle(2, 0x00ccff, 0.6);
      slot.strokeRoundedRect(slotX - 20, 20, 40, 40, 6);
      puzzleContainer.add(slot);
      
      // Make interactive
      const slotZone = this.add.zone(x + slotX, y + 40, 40, 40);
      this.physics.world.enable(slotZone, Phaser.Physics.Arcade.STATIC_BODY);
      slotZone.setData('slotIndex', i);
      slotZone.setInteractive({ useHandCursor: true });
      
      slotZone.on('pointerdown', () => {
        this.cyclePatternSlot(i, puzzleContainer, slotX);
      });
    }
    
    this.cleanRoomPuzzle.container = puzzleContainer;
  }

  /**
   * Cycle pattern slot value
   */
  private cyclePatternSlot(index: number, container: Phaser.GameObjects.Container, slotX: number): void {
    const current = this.cleanRoomPuzzle.playerPattern[index];
    this.cleanRoomPuzzle.playerPattern[index] = (current + 2) % 3; // Cycle -1 -> 0 -> 1 -> 2 -> 0
    
    // Update display
    const symbols = ['🔵', '🔴', '🟢'];
    const newValue = this.cleanRoomPuzzle.playerPattern[index];
    
    // Remove old symbol if exists
    const oldSymbol = container.getByName(`slot_${index}`) as Phaser.GameObjects.Text;
    if (oldSymbol) oldSymbol.destroy();
    
    // Add new symbol
    const symbol = this.add.text(slotX, 40, symbols[newValue], {
      fontSize: '20px',
    });
    symbol.setOrigin(0.5);
    symbol.setName(`slot_${index}`);
    container.add(symbol);
    
    // Check if puzzle is complete
    this.checkCleanRoomPuzzle();
  }

  /**
   * Check if clean room puzzle is solved
   */
  private checkCleanRoomPuzzle(): void {
    const { playerPattern, targetPattern } = this.cleanRoomPuzzle;
    
    if (playerPattern.includes(-1)) return; // Not all filled
    
    const isMatch = playerPattern.every((val, idx) => val === targetPattern[idx]);
    
    if (isMatch) {
      this.onCleanRoomSolved();
    }
  }

  /**
   * Handle clean room puzzle solved
   */
  private onCleanRoomSolved(): void {
    this.cleanRoomPuzzle.isActive = false;
    
    // Success feedback
    if (this.cleanRoomPuzzle.container) {
      const successText = this.add.text(0, 100, '✅ PATTERN MATCHED!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: '#00ff88',
      });
      successText.setOrigin(0.5);
      this.cleanRoomPuzzle.container.add(successText);
    }
    
    try { this.sound.play('conversion_chime', { volume: 0.5 }); } catch { /* Audio may not be loaded */ }
  }

  // ============================================================================
  // IVT BOTS (ENEMIES)
  // ============================================================================

  /**
   * Create IVT (Invalid Traffic) bots
   */
  private createIVTBots(): void {
    this.ivtBots = this.physics.add.group();
    
    // Place IVT bots throughout the level
    const botPositions = [
      { x: 600, y: 950, type: 'fake-platform' as const },
      { x: 1000, y: 850, type: 'click-bot' as const },
      { x: 2400, y: 900, type: 'fake-platform' as const },
      { x: 3500, y: 800, type: 'click-bot' as const },
      { x: 4400, y: 850, type: 'impression-bot' as const },
    ];
    
    botPositions.forEach(pos => {
      const bot = new IVTBot(this, pos.x, pos.y, pos.type);
      this.ivtBots.add(bot);
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
    
    const text = this.add.text(0, 0, 'COOKIE CRUMBLE CAVERNS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#c0c0c0',
    });
    text.setOrigin(0.5);
    text.setName('zoneText');
    this.zoneIndicator.add(text);
  }

  /**
   * Create privacy status display
   */
  private createPrivacyStatus(): void {
    this.privacyStatus = this.add.container(100, 150);
    this.privacyStatus.setDepth(800);
    this.privacyStatus.setScrollFactor(0);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-80, -60, 160, 120, 8);
    bg.lineStyle(1, 0x4444ff, 0.5);
    bg.strokeRoundedRect(-80, -60, 160, 120, 8);
    this.privacyStatus.add(bg);
    
    const header = this.add.text(0, -45, '🛡️ PRIVACY STATUS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#4444ff',
    });
    header.setOrigin(0.5);
    this.privacyStatus.add(header);
    
    // Status items
    const items = [
      { label: '1P Cookies:', value: '✅', y: -20 },
      { label: '3P Cookies:', value: '⚠️ Deprecating', y: 0 },
      { label: 'Universal ID:', value: '❌', y: 20 },
      { label: 'Consent:', value: '❌', y: 40 },
    ];
    
    items.forEach(item => {
      const label = this.add.text(-70, item.y, item.label, {
        fontFamily: '"Courier New", monospace',
        fontSize: '8px',
        color: '#888888',
      });
      this.privacyStatus.add(label);
      
      const value = this.add.text(70, item.y, item.value, {
        fontFamily: '"Courier New", monospace',
        fontSize: '8px',
        color: '#ffffff',
      });
      value.setOrigin(1, 0);
      value.setName(`status_${item.label.replace(':', '').toLowerCase().replace(' ', '_')}`);
      this.privacyStatus.add(value);
    });
  }

  /**
   * Create explanation sign
   */
  private createExplanationSign(x: number, y: number, text: string): void {
    const sign = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-120, -70, 240, 140, 8);
    bg.lineStyle(2, 0x4444ff, 0.6);
    bg.strokeRoundedRect(-120, -70, 240, 140, 8);
    sign.add(bg);
    
    const signText = this.add.text(0, 0, text, {
      fontFamily: '"Courier New", monospace',
      fontSize: '9px',
      color: '#00ccff',
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
   * Handle cookie expiration
   */
  private onCookieExpired(_platform: CookiePlatform): void {
    // Visual feedback
    this.cameras.main.shake(100, 0.005);
    
    // Update status
    this.updatePrivacyStatus('3p_cookies', '❌ Expired');
  }

  /**
   * Handle bridge collection
   */
  private onBridgeCollected(_bridge: IDBridge): void {
    // Update identity graph
    this.universalID.updateIdentityGraph();
    
    // Update status
    this.updatePrivacyStatus('universal_id', '✅');
    
    // Sound effect
    try { this.sound.play('bid_win', { volume: 0.5 }); } catch { /* Audio may not be loaded */ }
  }

  /**
   * Update privacy status display
   */
  private updatePrivacyStatus(key: string, value: string): void {
    const statusText = this.privacyStatus.getByName(`status_${key}`) as Phaser.GameObjects.Text;
    if (statusText) {
      statusText.setText(value);
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
    
    // Player vs cookie platforms
    this.cookieSystem.getPlatforms().forEach(platform => {
      this.physics.add.collider(this.player, platform.body, undefined, () => !platform.isExpired);
    });
    
    // Player vs ID bridges
    this.universalID.getBridges().forEach(bridge => {
      if (bridge.body) {
        this.physics.add.collider(this.player, bridge.body, undefined, () => bridge.isActive);
      }
    });
    
    // Player vs consent gates
    this.consentManager.getGates().forEach(gate => {
      this.physics.add.collider(this.player, gate.zone, () => {
        if (!gate.isOpen && !this.consentManager.isVisible()) {
          this.consentManager.showConsentUI(gate);
        }
      }, () => !gate.isOpen);
    });
    
    // Player vs IVT bots
    this.physics.add.overlap(this.player, this.ivtBots, (_player, bot) => {
      this.handleIVTCollision(bot as IVTBot);
    });
    
    // Player vs sandbox zones
    this.sandboxZones.forEach(zone => {
      this.physics.add.overlap(this.player, zone, () => {
        if (!this.isInSandbox) {
          this.enterSandbox();
        }
      });
    });
  }

  /**
   * Handle IVT bot collision
   */
  private handleIVTCollision(bot: IVTBot): void {
    // IVT bots detected on collision
    bot.reveal();
    // Drain some budget for fake traffic - using registerClick as it represents a fraudulent action
    this.budgetSystem.registerClick();
  }

  /**
   * Enter privacy sandbox
   */
  private enterSandbox(): void {
    this.isInSandbox = true;
    this.updateNoiseOverlay(0.5);
    
    // Schedule exit check
    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (!this.checkPlayerInSandbox()) {
          this.exitSandbox();
        }
      },
      loop: true,
    });
  }

  /**
   * Exit privacy sandbox
   */
  private exitSandbox(): void {
    this.isInSandbox = false;
    this.updateNoiseOverlay(0);
  }

  /**
   * Check if player is in any sandbox zone
   */
  private checkPlayerInSandbox(): boolean {
    return this.sandboxZones.some(zone => {
      const bounds = zone.getBounds();
      return bounds.contains(this.player.x, this.player.y);
    });
  }

  /**
   * Create exit portal
   */
  private createExitPortal(): void {
    const portalX = LEVEL_CONFIG.width - 100;
    const portalY = 600;
    
    const portal = this.add.container(portalX, portalY);
    portal.setDepth(100);
    
    const portalGraphic = this.add.graphics();
    portalGraphic.fillStyle(0x00ff88, 0.3);
    portalGraphic.fillCircle(0, 0, 50);
    portalGraphic.lineStyle(3, 0x00ff88, 1);
    portalGraphic.strokeCircle(0, 0, 50);
    portal.add(portalGraphic);
    
    const label = this.add.text(0, 70, 'WORLD 6\nATTRIBUTION CASTLE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#00ff88',
      align: 'center',
    });
    label.setOrigin(0.5);
    portal.add(label);
    
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
    
    console.log('[World5] Level complete!');
    
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('World6_AttributionCastle');
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
    
    // Check sandbox state
    if (this.isInSandbox && !this.checkPlayerInSandbox()) {
      this.exitSandbox();
    }
  }

  /**
   * Update zone indicator based on player position
   */
  private updateZoneIndicator(): void {
    if (!this.player) return;
    
    const playerX = this.player.x;
    let newZone = 'cookieCaverns';
    let zoneText = 'COOKIE CRUMBLE CAVERNS';
    let color = '#c0c0c0';
    
    const zones = LEVEL_CONFIG.zones;
    
    if (playerX > zones.cleanRoom.start) {
      newZone = 'cleanRoom';
      zoneText = 'CLEAN ROOM VAULT';
      color = '#00ccff';
    } else if (playerX > zones.gdprGauntlet.start) {
      newZone = 'gdprGauntlet';
      zoneText = 'GDPR GAUNTLET';
      color = '#ff8800';
    } else if (playerX > zones.privacySandbox.start) {
      newZone = 'privacySandbox';
      zoneText = 'PRIVACY SANDBOX';
      color = '#4444ff';
    } else if (playerX > zones.idBridge.start) {
      newZone = 'idBridge';
      zoneText = 'UNIVERSAL ID BRIDGE';
      color = '#00ff88';
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
    this.cookieSystem?.destroy();
    this.consentManager?.destroy();
    this.universalID?.destroy();
  }
}
