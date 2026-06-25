/**
 * DMPSystem - Data Management Platform System
 * 
 * Simulates data collection and user profile building used by DMPs.
 * In the game, this manifests as collectible data coins that build
 * a user profile used for targeting.
 * 
 * Key Concepts:
 * - 1st-Party Data: Gold coins, permanent, owned by publisher
 * - 3rd-Party Data: Silver coins, temporary, disappear after 3 levels (cookie deprecation)
 * - Data Taxonomy: Demographic, Behavioral, Contextual, Technographic categories
 * - User Profile: Accumulated data points that affect targeting options
 */

import Phaser from 'phaser';
import type { DataType, DataPoint, UserProfile } from '../types/adtech';

/**
 * Data coin representing a collectible data point
 */
export interface DataCoin {
  id: string;
  type: 'first-party' | 'third-party';
  dataType: DataType;
  value: number;
  label: string;
  sprite: Phaser.GameObjects.Sprite;
  glow: Phaser.GameObjects.Graphics;
  isCollected: boolean;
  expiresAtLevel?: number; // For 3rd-party cookies
}

/**
 * Segment definition for targeting
 */
export interface AudienceSegment {
  id: string;
  name: string;
  category: DataType;
  requiredPoints: number;
  isUnlocked: boolean;
  description: string;
}

/**
 * DMP configuration
 */
interface DMPConfig {
  currentLevel: number;
  thirdPartyCookieLifespan: number; // Levels until 3rd-party data expires
  profileCapacity: number;
}

/**
 * DMPSystem Component
 * Manages data collection, user profiling, and segment building
 */
export class DMPSystem extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private config: DMPConfig;
  
  // Collected data
  private dataPoints: DataPoint[] = [];
  private userProfile: UserProfile;
  
  // Data coins in the scene
  private dataCoins: DataCoin[] = [];
  private coinGroup!: Phaser.GameObjects.Group;
  
  // Audience segments (unlockable)
  private segments: AudienceSegment[] = [];
  
  // Score by data type
  private dataScores: Record<DataType, number> = {
    demographic: 0,
    behavioral: 0,
    contextual: 0,
    technographic: 0,
  };
  
  // Visual elements
  private profileUI!: Phaser.GameObjects.Container;
  private profileBars: Record<DataType, Phaser.GameObjects.Graphics> = {} as Record<DataType, Phaser.GameObjects.Graphics>;

  constructor(scene: Phaser.Scene, config: Partial<DMPConfig> = {}) {
    super();
    
    this.scene = scene;
    this.config = {
      currentLevel: 1,
      thirdPartyCookieLifespan: 3, // 3rd-party data expires after 3 levels
      profileCapacity: 100,
      ...config,
    };
    
    // Initialize user profile
    this.userProfile = {
      data: [],
      score: 0,
      lastUpdated: Date.now(),
    };
    
    // Create groups
    this.coinGroup = this.scene.add.group();
    
    // Initialize segments
    this.initializeSegments();
    
    // Create profile UI
    this.createProfileUI();
    
    console.log('[DMPSystem] Initialized');
  }

  // ============================================================================
  // SEGMENT DEFINITIONS
  // ============================================================================

  /**
   * Initialize available audience segments
   */
  private initializeSegments(): void {
    this.segments = [
      // Demographic segments
      {
        id: 'demo_young_adult',
        name: 'Young Adults 18-24',
        category: 'demographic',
        requiredPoints: 20,
        isUnlocked: false,
        description: 'Users aged 18-24, high engagement with mobile content',
      },
      {
        id: 'demo_affluent',
        name: 'High Income HH',
        category: 'demographic',
        requiredPoints: 40,
        isUnlocked: false,
        description: 'Household income $150k+, premium purchasing power',
      },
      
      // Behavioral segments
      {
        id: 'behav_purchaser',
        name: 'Recent Purchaser',
        category: 'behavioral',
        requiredPoints: 25,
        isUnlocked: false,
        description: 'Made purchase in last 7 days, high conversion probability',
      },
      {
        id: 'behav_cart_abandon',
        name: 'Cart Abandoner',
        category: 'behavioral',
        requiredPoints: 30,
        isUnlocked: false,
        description: 'Left items in cart, responsive to retargeting',
      },
      
      // Contextual segments
      {
        id: 'ctx_sports_fan',
        name: 'Sports Enthusiast',
        category: 'contextual',
        requiredPoints: 15,
        isUnlocked: false,
        description: 'Consumes sports content, interested in athletics',
      },
      {
        id: 'ctx_tech_savvy',
        name: 'Tech Early Adopter',
        category: 'contextual',
        requiredPoints: 35,
        isUnlocked: false,
        description: 'Interested in new technology, gadgets, and innovation',
      },
      
      // Technographic segments
      {
        id: 'tech_mobile_first',
        name: 'Mobile-First User',
        category: 'technographic',
        requiredPoints: 10,
        isUnlocked: false,
        description: 'Primarily uses mobile devices, touch-optimized ads recommended',
      },
      {
        id: 'tech_connected_tv',
        name: 'CTV Household',
        category: 'technographic',
        requiredPoints: 45,
        isUnlocked: false,
        description: 'Has connected TV devices, reachable via streaming',
      },
    ];
  }

  // ============================================================================
  // DATA COIN CREATION
  // ============================================================================

  /**
   * Create a 1st-party data coin (gold, permanent)
   */
  createFirstPartyDataCoin(
    x: number,
    y: number,
    dataType: DataType,
    value: number = 10,
    label?: string
  ): DataCoin {
    const coinId = `1p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Create glow effect
    const glow = this.scene.add.graphics();
    glow.setPosition(x, y);
    this.drawCoinGlow(glow, 0xffd700, 0.6); // Gold glow
    
    // Create sprite
    const sprite = this.scene.add.sprite(x, y, 'data-coin-gold');
    sprite.setScale(1);
    sprite.setDepth(50);
    
    // Add floating animation
    this.scene.tweens.add({
      targets: [sprite, glow],
      y: y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Add rotation shimmer
    this.scene.tweens.add({
      targets: sprite,
      scaleX: 0.8,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Enable physics
    this.scene.physics.world.enable(sprite, Phaser.Physics.Arcade.STATIC_BODY);
    
    const coin: DataCoin = {
      id: coinId,
      type: 'first-party',
      dataType,
      value,
      label: label ?? this.getRandomLabel(dataType),
      sprite,
      glow,
      isCollected: false,
    };
    
    this.dataCoins.push(coin);
    this.coinGroup.add(sprite);
    
    return coin;
  }

  /**
   * Create a 3rd-party data coin (silver, temporary - disappears after 3 levels)
   */
  createThirdPartyDataCoin(
    x: number,
    y: number,
    dataType: DataType,
    value: number = 5,
    label?: string
  ): DataCoin {
    const coinId = `3p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Create glow effect (silver, flickering)
    const glow = this.scene.add.graphics();
    glow.setPosition(x, y);
    this.drawCoinGlow(glow, 0xc0c0c0, 0.4); // Silver glow
    
    // Create sprite
    const sprite = this.scene.add.sprite(x, y, 'data-coin-silver');
    sprite.setScale(0.9);
    sprite.setDepth(50);
    
    // Add floating animation with flicker (unstable 3rd-party cookie)
    this.scene.tweens.add({
      targets: [sprite, glow],
      y: y - 5,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Flickering effect (cookie deprecation warning)
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0.6,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Stepped',
    });
    
    // Enable physics
    this.scene.physics.world.enable(sprite, Phaser.Physics.Arcade.STATIC_BODY);
    
    const coin: DataCoin = {
      id: coinId,
      type: 'third-party',
      dataType,
      value,
      label: label ?? this.getRandomLabel(dataType),
      sprite,
      glow,
      isCollected: false,
      expiresAtLevel: this.config.currentLevel + this.config.thirdPartyCookieLifespan,
    };
    
    this.dataCoins.push(coin);
    this.coinGroup.add(sprite);
    
    return coin;
  }

  /**
   * Draw glow effect for coin
   */
  private drawCoinGlow(graphics: Phaser.GameObjects.Graphics, color: number, alpha: number): void {
    graphics.clear();
    
    // Outer glow rings
    for (let i = 3; i > 0; i--) {
      graphics.fillStyle(color, alpha * (0.3 / i));
      graphics.fillCircle(0, 0, 16 + i * 6);
    }
    
    graphics.setDepth(49);
  }

  /**
   * Get random label for data type
   */
  private getRandomLabel(dataType: DataType): string {
    const labels: Record<DataType, string[]> = {
      demographic: ['Age: 25-34', 'Gender: M', 'Income: High', 'Education: College', 'Location: Urban'],
      behavioral: ['Purchaser', 'Browser', 'Converter', 'Returner', 'Loyalist'],
      contextual: ['Sports Fan', 'Tech Reader', 'News Consumer', 'Gamer', 'Traveler'],
      technographic: ['Mobile User', 'Desktop Pro', 'CTV Viewer', 'Multi-Device', 'App Heavy'],
    };
    
    return Phaser.Math.RND.pick(labels[dataType]);
  }

  // ============================================================================
  // DATA COLLECTION
  // ============================================================================

  /**
   * Collect a data coin
   */
  collectCoin(coin: DataCoin): void {
    if (coin.isCollected) return;
    
    coin.isCollected = true;
    
    // Create data point
    const dataPoint: DataPoint = {
      id: coin.id,
      type: coin.dataType,
      value: coin.label,
      timestamp: Date.now(),
      source: coin.type,
    };
    
    // Add to profile
    this.dataPoints.push(dataPoint);
    this.userProfile.data.push(dataPoint);
    this.userProfile.score += coin.value;
    this.userProfile.lastUpdated = Date.now();
    
    // Update data scores
    this.dataScores[coin.dataType] += coin.value;
    
    // Check for segment unlocks
    this.checkSegmentUnlocks();
    
    // Update UI
    this.updateProfileUI();
    
    // Collection animation
    this.playCollectionAnimation(coin);
    
    this.emit('data-collected', {
      coin,
      dataPoint,
      totalScore: this.userProfile.score,
    });
    
    console.log(`[DMPSystem] Collected ${coin.type} ${coin.dataType} data: ${coin.label}`);
  }

  /**
   * Play collection animation
   */
  private playCollectionAnimation(coin: DataCoin): void {
    const color = coin.type === 'first-party' ? 0xffd700 : 0xc0c0c0;
    
    // Score popup
    const scoreText = this.scene.add.text(coin.sprite.x, coin.sprite.y, `+${coin.value}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: coin.type === 'first-party' ? '#ffd700' : '#c0c0c0',
      stroke: '#000000',
      strokeThickness: 2,
    });
    scoreText.setOrigin(0.5);
    scoreText.setDepth(200);
    
    // Animate score popup
    this.scene.tweens.add({
      targets: scoreText,
      y: coin.sprite.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => scoreText.destroy(),
    });
    
    // Label popup
    const labelText = this.scene.add.text(coin.sprite.x, coin.sprite.y + 15, coin.label, {
      fontFamily: '"Courier New", monospace',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    });
    labelText.setOrigin(0.5);
    labelText.setDepth(200);
    
    this.scene.tweens.add({
      targets: labelText,
      y: coin.sprite.y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => labelText.destroy(),
    });
    
    // Burst particles
    if (this.scene.textures.exists('particle-glow')) {
      const emitter = this.scene.add.particles(coin.sprite.x, coin.sprite.y, 'particle-glow', {
        speed: { min: 50, max: 150 },
        lifespan: 400,
        scale: { start: 0.4, end: 0 },
        alpha: { start: 1, end: 0 },
        quantity: 10,
        tint: color,
        blendMode: 'ADD',
        emitting: false,
      });
      emitter.explode(10);
      this.scene.time.delayedCall(500, () => emitter.destroy());
    }
    
    // Destroy coin visuals
    this.scene.tweens.add({
      targets: [coin.sprite, coin.glow],
      scale: 0,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        coin.sprite.destroy();
        coin.glow.destroy();
      },
    });
  }

  /**
   * Check if any segments should be unlocked
   */
  private checkSegmentUnlocks(): void {
    this.segments.forEach(segment => {
      if (!segment.isUnlocked && this.dataScores[segment.category] >= segment.requiredPoints) {
        segment.isUnlocked = true;
        this.onSegmentUnlocked(segment);
      }
    });
  }

  /**
   * Handle segment unlock
   */
  private onSegmentUnlocked(segment: AudienceSegment): void {
    this.emit('segment-unlocked', segment);
    console.log(`[DMPSystem] Segment unlocked: ${segment.name}`);
    
    // Show unlock notification
    this.showSegmentUnlockNotification(segment);
  }

  /**
   * Show segment unlock notification
   */
  private showSegmentUnlockNotification(segment: AudienceSegment): void {
    const notification = this.scene.add.container(640, 100);
    notification.setDepth(2000);
    notification.setScrollFactor(0);
    notification.setAlpha(0);
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-150, -30, 300, 60, 8);
    bg.lineStyle(2, this.getCategoryColor(segment.category), 1);
    bg.strokeRoundedRect(-150, -30, 300, 60, 8);
    notification.add(bg);
    
    // Icon
    const icon = this.scene.add.text(-130, 0, '🎯', { fontSize: '20px' });
    icon.setOrigin(0, 0.5);
    notification.add(icon);
    
    // Title
    const title = this.scene.add.text(-100, -8, 'SEGMENT UNLOCKED', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#00ff88',
    });
    notification.add(title);
    
    // Segment name
    const name = this.scene.add.text(-100, 8, segment.name, {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    notification.add(name);
    
    // Animate in
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      y: 120,
      duration: 300,
      ease: 'Back.easeOut',
    });
    
    // Animate out after delay
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: notification,
        alpha: 0,
        y: 80,
        duration: 300,
        ease: 'Power2',
        onComplete: () => notification.destroy(),
      });
    });
  }

  /**
   * Get color for data category
   */
  private getCategoryColor(category: DataType): number {
    const colors: Record<DataType, number> = {
      demographic: 0x66ccff, // Blue
      behavioral: 0xff66cc, // Pink
      contextual: 0x66ff88, // Green
      technographic: 0xffcc66, // Orange
    };
    return colors[category];
  }

  // ============================================================================
  // PROFILE UI
  // ============================================================================

  /**
   * Create the user profile display UI
   */
  private createProfileUI(): void {
    this.profileUI = this.scene.add.container(1180, 200);
    this.profileUI.setDepth(1000);
    this.profileUI.setScrollFactor(0);
    
    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0a1e, 0.9);
    bg.fillRoundedRect(-90, -80, 180, 160, 6);
    bg.lineStyle(1, 0x00ff88, 0.5);
    bg.strokeRoundedRect(-90, -80, 180, 160, 6);
    this.profileUI.add(bg);
    
    // Title
    const title = this.scene.add.text(0, -65, 'USER PROFILE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#00ff88',
    });
    title.setOrigin(0.5, 0);
    this.profileUI.add(title);
    
    // Data type bars
    const categories: DataType[] = ['demographic', 'behavioral', 'contextual', 'technographic'];
    const categoryLabels = ['DEMO', 'BEHAV', 'CTX', 'TECH'];
    const categoryColors = [0x66ccff, 0xff66cc, 0x66ff88, 0xffcc66];
    
    categories.forEach((cat, i) => {
      const y = -40 + i * 30;
      
      // Label
      const label = this.scene.add.text(-80, y, categoryLabels[i], {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#888888',
      });
      this.profileUI.add(label);
      
      // Bar background
      const barBg = this.scene.add.graphics();
      barBg.fillStyle(0x333333, 1);
      barBg.fillRoundedRect(-30, y - 4, 110, 12, 3);
      this.profileUI.add(barBg);
      
      // Progress bar
      const bar = this.scene.add.graphics();
      this.profileBars[cat] = bar;
      this.profileUI.add(bar);
      
      // Draw initial state
      this.drawProfileBar(cat, categoryColors[i]);
    });
    
    // Score display
    const scoreLabel = this.scene.add.text(0, 55, 'SCORE: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ffd700',
    });
    scoreLabel.setOrigin(0.5, 0);
    scoreLabel.setName('scoreLabel');
    this.profileUI.add(scoreLabel);
  }

  /**
   * Draw a profile bar
   */
  private drawProfileBar(category: DataType, color: number): void {
    const bar = this.profileBars[category];
    if (!bar) return;
    
    bar.clear();
    
    const maxWidth = 106;
    const score = this.dataScores[category];
    const maxScore = 50; // Max per category for full bar
    const width = Math.min((score / maxScore) * maxWidth, maxWidth);
    
    if (width > 0) {
      bar.fillStyle(color, 0.8);
      bar.fillRoundedRect(-28, this.getCategoryYOffset(category), width, 8, 2);
      
      // Glow effect when near full
      if (score / maxScore > 0.7) {
        bar.fillStyle(color, 0.3);
        bar.fillRoundedRect(-28, this.getCategoryYOffset(category), width, 8, 2);
      }
    }
  }

  /**
   * Get Y offset for category bar
   */
  private getCategoryYOffset(category: DataType): number {
    const offsets: Record<DataType, number> = {
      demographic: -42,
      behavioral: -12,
      contextual: 18,
      technographic: 48,
    };
    return offsets[category];
  }

  /**
   * Update profile UI
   */
  private updateProfileUI(): void {
    const categories: DataType[] = ['demographic', 'behavioral', 'contextual', 'technographic'];
    const colors = [0x66ccff, 0xff66cc, 0x66ff88, 0xffcc66];
    
    categories.forEach((cat, i) => {
      this.drawProfileBar(cat, colors[i]);
    });
    
    // Update score
    const scoreLabel = this.profileUI.getByName('scoreLabel') as Phaser.GameObjects.Text;
    if (scoreLabel) {
      scoreLabel.setText(`SCORE: ${this.userProfile.score}`);
    }
  }

  // ============================================================================
  // 3RD-PARTY COOKIE DEPRECATION
  // ============================================================================

  /**
   * Advance to next level (expires old 3rd-party data)
   */
  advanceLevel(): void {
    this.config.currentLevel++;
    
    // Find expired 3rd-party data
    const expiredData = this.dataPoints.filter(
      dp => dp.source === 'third-party' && 
            this.dataCoins.find(c => c.id === dp.id)?.expiresAtLevel === this.config.currentLevel
    );
    
    if (expiredData.length > 0) {
      this.expireThirdPartyData(expiredData);
    }
    
    console.log(`[DMPSystem] Advanced to level ${this.config.currentLevel}`);
  }

  /**
   * Expire 3rd-party data points (cookie deprecation simulation)
   */
  private expireThirdPartyData(expiredData: DataPoint[]): void {
    let lostScore = 0;
    
    expiredData.forEach(dp => {
      // Find and subtract from data scores
      const coin = this.dataCoins.find(c => c.id === dp.id);
      if (coin) {
        this.dataScores[dp.type] = Math.max(0, this.dataScores[dp.type] - coin.value);
        lostScore += coin.value;
      }
      
      // Remove from profile
      this.userProfile.data = this.userProfile.data.filter(d => d.id !== dp.id);
    });
    
    this.userProfile.score -= lostScore;
    this.userProfile.lastUpdated = Date.now();
    
    // Update UI
    this.updateProfileUI();
    
    // Show deprecation notification
    this.showDeprecationNotification(expiredData.length, lostScore);
    
    this.emit('data-expired', {
      count: expiredData.length,
      lostScore,
      remaining: this.userProfile.score,
    });
  }

  /**
   * Show cookie deprecation notification
   */
  private showDeprecationNotification(count: number, lostScore: number): void {
    const notification = this.scene.add.container(640, 400);
    notification.setDepth(2000);
    notification.setScrollFactor(0);
    notification.setAlpha(0);
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x2a0a0a, 0.95);
    bg.fillRoundedRect(-180, -40, 360, 80, 8);
    bg.lineStyle(2, 0xff4444, 1);
    bg.strokeRoundedRect(-180, -40, 360, 80, 8);
    notification.add(bg);
    
    // Warning icon
    const icon = this.scene.add.text(-150, 0, '⚠️', { fontSize: '24px' });
    icon.setOrigin(0, 0.5);
    notification.add(icon);
    
    // Title
    const title = this.scene.add.text(-110, -12, '3RD-PARTY COOKIES EXPIRED', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ff4444',
    });
    notification.add(title);
    
    // Details
    const details = this.scene.add.text(-110, 10, `${count} data points lost • -${lostScore} score`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#cccccc',
    });
    notification.add(details);
    
    // Animate in with shake
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      duration: 200,
    });
    
    this.scene.tweens.add({
      targets: notification,
      x: '+=5',
      duration: 50,
      yoyo: true,
      repeat: 5,
    });
    
    // Animate out
    this.scene.time.delayedCall(4000, () => {
      this.scene.tweens.add({
        targets: notification,
        alpha: 0,
        duration: 300,
        onComplete: () => notification.destroy(),
      });
    });
  }

  // ============================================================================
  // GETTERS & UTILITIES
  // ============================================================================

  /**
   * Get user profile
   */
  getUserProfile(): UserProfile {
    return { ...this.userProfile };
  }

  /**
   * Get data scores by type
   */
  getDataScores(): Record<DataType, number> {
    return { ...this.dataScores };
  }

  /**
   * Get unlocked segments
   */
  getUnlockedSegments(): AudienceSegment[] {
    return this.segments.filter(s => s.isUnlocked);
  }

  /**
   * Get all segments
   */
  getAllSegments(): AudienceSegment[] {
    return [...this.segments];
  }

  /**
   * Get stats for level completion
   */
  getStats(): { totalScore: number; segmentsUnlocked: number; dataPoints: number } {
    const unlockedCount = this.segments.filter(s => s.isUnlocked).length;
    const totalScore = Object.values(this.dataScores).reduce((sum, score) => sum + score, 0);
    
    return {
      totalScore,
      segmentsUnlocked: unlockedCount,
      dataPoints: this.dataPoints.length,
    };
  }

  /**
   * Get coin group for collision detection
   */
  getCoinGroup(): Phaser.GameObjects.Group {
    return this.coinGroup;
  }

  /**
   * Get all data coins
   */
  getDataCoins(): DataCoin[] {
    return this.dataCoins.filter(c => !c.isCollected);
  }

  /**
   * Toggle profile UI visibility
   */
  toggleProfileUI(visible: boolean): void {
    this.profileUI.setVisible(visible);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.dataCoins.forEach(coin => {
      if (coin.sprite && !coin.sprite.scene) return;
      coin.sprite?.destroy();
      coin.glow?.destroy();
    });
    this.dataCoins = [];
    
    this.coinGroup.destroy(true);
    this.profileUI.destroy();
    
    this.removeAllListeners();
    console.log('[DMPSystem] Destroyed');
  }
}
