/**
 * CookieSystem - Cookie Lifecycle & Deprecation System
 * 
 * Simulates the behavior of 1st-party and 3rd-party cookies:
 * - 1st-Party Cookies: Persistent, controlled by publisher
 * - 3rd-Party Cookies: Temporary, deprecating (disappear after 3 levels)
 * - Cookie Sync: Visual connections between data points
 * 
 * In-game, this manifests as platforms and checkpoints that behave
 * differently based on cookie type.
 */

import Phaser from 'phaser';
import type { CookieType, CookieData } from '../types/adtech';

/**
 * Cookie platform representing a data checkpoint
 */
export interface CookiePlatform {
  id: string;
  type: CookieType;
  x: number;
  y: number;
  container: Phaser.GameObjects.Container;
  body: Phaser.Physics.Arcade.Sprite;
  expiryLevel: number; // Level at which 3rd-party cookies expire
  isExpired: boolean;
  flickerTween?: Phaser.Tweens.Tween;
}

/**
 * Cookie system configuration
 */
interface CookieConfig {
  currentLevel: number;
  thirdPartyLifespan: number; // Levels until 3rd-party expires
  deprecationProgress: number; // 0-1, how far along deprecation is
}

/**
 * CookieSystem Component
 * Manages cookie lifecycle and visual representation
 */
export class CookieSystem extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private config: CookieConfig;
  
  // Cookie platforms
  private cookiePlatforms: CookiePlatform[] = [];
  private platformGroup!: Phaser.GameObjects.Group;
  
  // Cookie data storage
  private firstPartyCookies: CookieData[] = [];
  private thirdPartyCookies: CookieData[] = [];
  
  // Visual elements
  private syncLines!: Phaser.GameObjects.Graphics;
  private deprecationWarning!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: Partial<CookieConfig> = {}) {
    super();
    
    this.scene = scene;
    this.config = {
      currentLevel: 5,
      thirdPartyLifespan: 3,
      deprecationProgress: 0.7, // 70% through deprecation
      ...config,
    };
    
    // Create groups
    this.platformGroup = this.scene.add.group();
    
    // Create sync lines graphics
    this.syncLines = this.scene.add.graphics();
    this.syncLines.setDepth(50);
    
    console.log('[CookieSystem] Initialized with deprecation at', 
      Math.round(this.config.deprecationProgress * 100) + '%');
  }

  // ============================================================================
  // COOKIE PLATFORM CREATION
  // ============================================================================

  /**
   * Create a cookie platform (checkpoint)
   */
  createCookiePlatform(
    x: number,
    y: number,
    type: CookieType,
    width: number = 100
  ): CookiePlatform {
    const id = `cookie_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const container = this.scene.add.container(x, y);
    container.setDepth(100);
    
    // Platform colors
    const colors = {
      'first-party': { fill: 0xffd700, stroke: 0xffcc00 },  // Gold
      'third-party': { fill: 0xc0c0c0, stroke: 0x888888 },  // Silver
    };
    const color = colors[type];
    
    // Platform graphic
    const platformGraphic = this.scene.add.graphics();
    platformGraphic.fillStyle(color.fill, type === 'third-party' ? 0.6 : 1);
    platformGraphic.fillRoundedRect(-width / 2, -10, width, 28, 6);
    platformGraphic.lineStyle(2, color.stroke, 1);
    platformGraphic.strokeRoundedRect(-width / 2, -10, width, 28, 6);
    container.add(platformGraphic);
    
    // Cookie icon
    const icon = this.scene.add.text(0, 0, type === 'first-party' ? '🍪' : '🔗', {
      fontSize: '16px',
    });
    icon.setOrigin(0.5);
    container.add(icon);
    
    // Type label
    const label = this.scene.add.text(0, 20, type === 'first-party' ? '1P' : '3P', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: type === 'first-party' ? '#ffd700' : '#888888',
    });
    label.setOrigin(0.5);
    container.add(label);
    
    // Physics body
    const body = this.scene.physics.add.sprite(x, y, 'tile-platform');
    body.setVisible(false);
    body.setImmovable(true);
    (body.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    body.setSize(width, 24);
    
    // Calculate expiry level for 3rd-party
    const expiryLevel = type === 'third-party' 
      ? this.config.currentLevel + this.config.thirdPartyLifespan 
      : Infinity;
    
    const platform: CookiePlatform = {
      id,
      type,
      x,
      y,
      container,
      body,
      expiryLevel,
      isExpired: false,
    };
    
    // Add flicker effect for 3rd-party cookies
    if (type === 'third-party') {
      platform.flickerTween = this.createFlickerEffect(platform);
    }
    
    this.cookiePlatforms.push(platform);
    
    return platform;
  }

  /**
   * Create flicker effect for unstable 3rd-party cookies
   */
  private createFlickerEffect(platform: CookiePlatform): Phaser.Tweens.Tween {
    // More intense flicker as deprecation progresses
    const intensity = 0.3 + this.config.deprecationProgress * 0.5;
    
    return this.scene.tweens.add({
      targets: platform.container,
      alpha: { from: 1, to: 1 - intensity },
      duration: 200 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Expire a 3rd-party cookie platform
   */
  expireCookiePlatform(platform: CookiePlatform): void {
    if (platform.isExpired || platform.type === 'first-party') return;
    
    platform.isExpired = true;
    
    // Stop flicker
    if (platform.flickerTween) {
      platform.flickerTween.stop();
    }
    
    // Fade out and disable
    this.scene.tweens.add({
      targets: [platform.container, platform.body],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        platform.body.setActive(false);
        platform.body.setVisible(false);
      },
    });
    
    // Emit deprecation event
    this.emit('cookie-expired', { platform });
    
    console.log('[CookieSystem] 3rd-party cookie expired:', platform.id);
  }

  /**
   * Check and expire cookies based on current level
   */
  checkExpiration(currentLevel: number): void {
    this.config.currentLevel = currentLevel;
    
    this.cookiePlatforms.forEach(platform => {
      if (platform.type === 'third-party' && 
          currentLevel >= platform.expiryLevel && 
          !platform.isExpired) {
        this.expireCookiePlatform(platform);
      }
    });
  }

  // ============================================================================
  // COOKIE SYNC VISUALIZATION
  // ============================================================================

  /**
   * Draw cookie sync lines between platforms
   */
  drawSyncLines(): void {
    this.syncLines.clear();
    
    // Get active 1st-party cookies
    const firstPartyPlatforms = this.cookiePlatforms.filter(
      p => p.type === 'first-party' && !p.isExpired
    );
    
    // Get active 3rd-party cookies
    const thirdPartyPlatforms = this.cookiePlatforms.filter(
      p => p.type === 'third-party' && !p.isExpired
    );
    
    // Draw sync lines from 3P to nearest 1P
    thirdPartyPlatforms.forEach(tp => {
      const nearest = this.findNearest(tp, firstPartyPlatforms);
      if (nearest) {
        this.syncLines.lineStyle(1, 0x00ccff, 0.3);
        this.syncLines.lineBetween(tp.x, tp.y, nearest.x, nearest.y);
        
        // Animated sync pulse
        this.createSyncPulse(tp.x, tp.y, nearest.x, nearest.y);
      }
    });
  }

  /**
   * Find nearest platform
   */
  private findNearest(
    from: CookiePlatform,
    candidates: CookiePlatform[]
  ): CookiePlatform | null {
    if (candidates.length === 0) return null;
    
    return candidates.reduce((nearest, candidate) => {
      const distToCandidate = Phaser.Math.Distance.Between(
        from.x, from.y, candidate.x, candidate.y
      );
      const distToNearest = Phaser.Math.Distance.Between(
        from.x, from.y, nearest.x, nearest.y
      );
      return distToCandidate < distToNearest ? candidate : nearest;
    });
  }

  /**
   * Create animated sync pulse between cookies
   */
  private createSyncPulse(x1: number, y1: number, x2: number, y2: number): void {
    const pulse = this.scene.add.circle(x1, y1, 4, 0x00ccff, 0.8);
    pulse.setDepth(55);
    
    this.scene.tweens.add({
      targets: pulse,
      x: x2,
      y: y2,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => pulse.destroy(),
    });
  }

  // ============================================================================
  // COOKIE DATA MANAGEMENT
  // ============================================================================

  /**
   * Store a cookie
   */
  setCookie(type: CookieType, data: Record<string, unknown>): CookieData {
    const cookie: CookieData = {
      id: `${type}_${Date.now()}`,
      type,
      timestamp: Date.now(),
      expiryTime: type === 'third-party' 
        ? Date.now() + (this.config.thirdPartyLifespan * 60000) // Minutes for game time
        : Infinity,
      data,
    };
    
    if (type === 'first-party') {
      this.firstPartyCookies.push(cookie);
    } else {
      this.thirdPartyCookies.push(cookie);
    }
    
    this.emit('cookie-set', { cookie });
    return cookie;
  }

  /**
   * Get all cookies of a type
   */
  getCookies(type: CookieType): CookieData[] {
    return type === 'first-party' 
      ? [...this.firstPartyCookies]
      : [...this.thirdPartyCookies];
  }

  /**
   * Clear all 3rd-party cookies (deprecation simulation)
   */
  clearThirdPartyCookies(): void {
    const count = this.thirdPartyCookies.length;
    this.thirdPartyCookies = [];
    
    // Expire all 3P platforms
    this.cookiePlatforms
      .filter(p => p.type === 'third-party')
      .forEach(p => this.expireCookiePlatform(p));
    
    this.emit('third-party-cleared', { count });
    console.log('[CookieSystem] Cleared', count, '3rd-party cookies');
  }

  // ============================================================================
  // DEPRECATION WARNING UI
  // ============================================================================

  /**
   * Create deprecation warning overlay
   */
  createDeprecationWarning(x: number, y: number): Phaser.GameObjects.Container {
    this.deprecationWarning = this.scene.add.container(x, y);
    this.deprecationWarning.setDepth(200);
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(0xff4400, 0.2);
    bg.fillRoundedRect(-150, -40, 300, 80, 8);
    bg.lineStyle(2, 0xff4400, 0.8);
    bg.strokeRoundedRect(-150, -40, 300, 80, 8);
    this.deprecationWarning.add(bg);
    
    const icon = this.scene.add.text(-130, 0, '⚠️', { fontSize: '24px' });
    icon.setOrigin(0.5);
    this.deprecationWarning.add(icon);
    
    const text = this.scene.add.text(10, 0, 
      '3rd-Party Cookies Deprecating!\nPlatforms becoming unstable...', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#ff8800',
      align: 'center',
      lineSpacing: 4,
    });
    text.setOrigin(0.5);
    this.deprecationWarning.add(text);
    
    // Pulse animation
    this.scene.tweens.add({
      targets: this.deprecationWarning,
      alpha: { from: 1, to: 0.6 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
    
    return this.deprecationWarning;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get all cookie platforms
   */
  getPlatforms(): CookiePlatform[] {
    return [...this.cookiePlatforms];
  }

  /**
   * Get active (non-expired) platforms
   */
  getActivePlatforms(): CookiePlatform[] {
    return this.cookiePlatforms.filter(p => !p.isExpired);
  }

  /**
   * Get deprecation progress
   */
  getDeprecationProgress(): number {
    return this.config.deprecationProgress;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.cookiePlatforms.forEach(p => {
      if (p.flickerTween) p.flickerTween.stop();
      p.container.destroy();
      p.body.destroy();
    });
    this.syncLines.destroy();
    if (this.deprecationWarning) this.deprecationWarning.destroy();
  }
}
