/**
 * SSPAuction - Supply-Side Platform Auction System
 * 
 * Models how SSPs (Supply-Side Platforms) set floor prices for ad inventory.
 * In the game, this manifests as horizontal "floor price lines" that the player
 * must jump above to register as a valid bid.
 * 
 * Key Concepts:
 * - Floor Price: Minimum bid required to compete for ad inventory
 * - Dynamic Pricing: Floor adjusts based on competition and demand
 * - Ghost Bidders: Visual representation of competing AI bidders
 */

import Phaser from 'phaser';

/**
 * Ghost bidder representing competing advertisers
 */
interface GhostBidder {
  id: string;
  name: string;
  sprite: Phaser.GameObjects.Sprite;
  currentBid: number;
  maxBid: number;
  aggression: number; // 0-1, affects bidding behavior
}

/**
 * Floor price barrier in the level
 */
export interface FloorPriceBarrier {
  id: string;
  y: number;
  price: number;
  line: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  isActive: boolean;
  zone: Phaser.GameObjects.Zone;
}

/**
 * SSP Auction configuration
 */
interface SSPConfig {
  baseFloorPrice: number;
  maxFloorPrice: number;
  minFloorPrice: number;
  volatility: number; // How much the floor can shift
  competitorCount: number;
}

/**
 * SSPAuction Component
 * Manages floor price mechanics and competitor visualization
 */
export class SSPAuction extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private config: SSPConfig;
  
  // Floor price state
  private currentFloorPrice: number;
  private barriers: FloorPriceBarrier[] = [];
  
  // Ghost bidders (AI competition)
  private ghostBidders: GhostBidder[] = [];
  
  // Visual elements
  private floorPriceGroup!: Phaser.GameObjects.Group;
  private ghostGroup!: Phaser.GameObjects.Group;
  
  // Animation tweens
  private activeTweens: Phaser.Tweens.Tween[] = [];
  
  // Market state
  private demand: number = 0.5; // 0-1 scale
  private competition: number = 0.5; // 0-1 scale

  constructor(scene: Phaser.Scene, config: Partial<SSPConfig> = {}) {
    super();
    
    this.scene = scene;
    this.config = {
      baseFloorPrice: 2.50,
      maxFloorPrice: 10.00,
      minFloorPrice: 0.50,
      volatility: 0.3,
      competitorCount: 3,
      ...config,
    };
    
    this.currentFloorPrice = this.config.baseFloorPrice;
    
    // Create groups
    this.floorPriceGroup = this.scene.add.group();
    this.ghostGroup = this.scene.add.group();
    
    // Initialize ghost bidders
    this.initializeGhostBidders();
    
    console.log('[SSPAuction] Initialized with floor price $' + this.currentFloorPrice.toFixed(2));
  }

  // ============================================================================
  // FLOOR PRICE BARRIERS
  // ============================================================================

  /**
   * Create a floor price barrier at the specified position
   * Player must jump above this line to register a valid bid
   */
  createFloorBarrier(
    x: number,
    y: number,
    width: number,
    price?: number
  ): FloorPriceBarrier {
    const barrierPrice = price ?? this.currentFloorPrice;
    const barrierId = `floor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the floor line graphics
    const line = this.scene.add.graphics();
    this.drawFloorLine(line, width, barrierPrice);
    line.setPosition(x, y);
    line.setDepth(100);
    
    // Create price label with retro styling
    const label = this.scene.add.text(x + width + 10, y - 12, `$${barrierPrice.toFixed(2)}`, {
      fontFamily: '"Press Start 2P", "Courier New", monospace',
      fontSize: '10px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 2,
    });
    label.setDepth(100);
    
    // Create detection zone (invisible collision area)
    const zone = this.scene.add.zone(x + width / 2, y, width, 20);
    this.scene.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    
    const barrier: FloorPriceBarrier = {
      id: barrierId,
      y,
      price: barrierPrice,
      line,
      label,
      isActive: true,
      zone,
    };
    
    this.barriers.push(barrier);
    this.floorPriceGroup.add(line);
    
    // Animate the line appearing
    line.setAlpha(0);
    label.setAlpha(0);
    this.scene.tweens.add({
      targets: [line, label],
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
    
    return barrier;
  }

  /**
   * Draw the floor line with gradient and glow effect
   */
  private drawFloorLine(graphics: Phaser.GameObjects.Graphics, width: number, price: number): void {
    const intensity = this.getPriceIntensity(price);
    const color = this.getPriceColor(intensity);
    
    graphics.clear();
    
    // Glow effect (multiple semi-transparent lines)
    for (let i = 4; i > 0; i--) {
      graphics.lineStyle(i * 2, color, 0.1 * (5 - i));
      graphics.beginPath();
      graphics.moveTo(0, 0);
      graphics.lineTo(width, 0);
      graphics.strokePath();
    }
    
    // Main line
    graphics.lineStyle(2, color, 1);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(width, 0);
    graphics.strokePath();
    
    // Add tick marks
    for (let i = 0; i <= width; i += 50) {
      graphics.lineStyle(1, color, 0.7);
      graphics.beginPath();
      graphics.moveTo(i, -5);
      graphics.lineTo(i, 5);
      graphics.strokePath();
    }
    
    // Add animated particles along the line
    this.addFloorLineParticles(graphics.x, graphics.y, width, color);
  }

  /**
   * Add particle effect along floor line
   */
  private addFloorLineParticles(x: number, y: number, width: number, color: number): void {
    // Create subtle particle flow along the line
    if (this.scene.textures.exists('particle-glow')) {
      const emitter = this.scene.add.particles(x, y, 'particle-glow', {
        x: { min: 0, max: width },
        y: { min: -3, max: 3 },
        lifespan: 1000,
        speed: { min: 20, max: 40 },
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.5, end: 0 },
        frequency: 200,
        tint: color,
        blendMode: 'ADD',
      });
      emitter.setDepth(99);
    }
  }

  /**
   * Get color based on price intensity (higher price = more red/urgent)
   */
  private getPriceColor(intensity: number): number {
    // Gradient from green (low) -> yellow (medium) -> red (high)
    if (intensity < 0.33) {
      return 0x00ff88; // Neon green - affordable
    } else if (intensity < 0.66) {
      return 0xffcc00; // Gold - moderate
    } else {
      return 0xff4444; // Red - expensive
    }
  }

  /**
   * Calculate price intensity relative to range
   */
  private getPriceIntensity(price: number): number {
    const range = this.config.maxFloorPrice - this.config.minFloorPrice;
    return (price - this.config.minFloorPrice) / range;
  }

  // ============================================================================
  // DYNAMIC FLOOR PRICING
  // ============================================================================

  /**
   * Update floor prices based on market conditions
   */
  updateFloorPrices(): void {
    // Calculate new base floor based on demand and competition
    const marketPressure = (this.demand * 0.5 + this.competition * 0.5);
    const volatilityFactor = (Math.random() - 0.5) * 2 * this.config.volatility;
    
    const priceChange = this.config.baseFloorPrice * volatilityFactor * marketPressure;
    this.currentFloorPrice = Phaser.Math.Clamp(
      this.currentFloorPrice + priceChange,
      this.config.minFloorPrice,
      this.config.maxFloorPrice
    );
    
    // Animate existing barriers to new prices
    this.barriers.forEach(barrier => {
      if (barrier.isActive) {
        this.animateFloorPriceChange(barrier);
      }
    });
    
    // Update ghost bidders
    this.updateGhostBidders();
    
    this.emit('floor-price-updated', {
      price: this.currentFloorPrice,
      demand: this.demand,
      competition: this.competition,
    });
  }

  /**
   * Animate barrier price change
   */
  private animateFloorPriceChange(barrier: FloorPriceBarrier): void {
    const oldY = barrier.y;
    const priceRatio = barrier.price / this.currentFloorPrice;
    const newY = oldY * priceRatio;
    
    this.scene.tweens.add({
      targets: [barrier.line, barrier.label, barrier.zone],
      y: newY,
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        barrier.y = newY;
        // Redraw line with new color
        const width = 400; // Default width, adjust as needed
        this.drawFloorLine(barrier.line, width, barrier.price);
      },
    });
  }

  /**
   * Set market demand (affects floor prices)
   */
  setDemand(demand: number): void {
    this.demand = Phaser.Math.Clamp(demand, 0, 1);
    console.log(`[SSPAuction] Demand set to ${(this.demand * 100).toFixed(0)}%`);
  }

  /**
   * Set competition level (affects floor prices)
   */
  setCompetition(competition: number): void {
    this.competition = Phaser.Math.Clamp(competition, 0, 1);
    console.log(`[SSPAuction] Competition set to ${(this.competition * 100).toFixed(0)}%`);
  }

  // ============================================================================
  // GHOST BIDDERS (AI COMPETITION)
  // ============================================================================

  /**
   * Initialize ghost bidder competitors
   */
  private initializeGhostBidders(): void {
    const bidderNames = ['AdCorp', 'MediaMax', 'BrandBoost', 'TargetPro', 'DigitalDash'];
    
    for (let i = 0; i < this.config.competitorCount; i++) {
      const name = bidderNames[i % bidderNames.length];
      
      // Create ghost sprite (semi-transparent competitor visualization)
      const sprite = this.scene.add.sprite(0, 0, 'ghost-bidder');
      sprite.setAlpha(0.4);
      sprite.setTint(this.getGhostColor(i));
      sprite.setVisible(false);
      sprite.setDepth(50);
      
      const ghost: GhostBidder = {
        id: `ghost_${i}`,
        name,
        sprite,
        currentBid: 0,
        maxBid: this.config.maxFloorPrice * (0.5 + Math.random() * 0.5),
        aggression: 0.3 + Math.random() * 0.7,
      };
      
      this.ghostBidders.push(ghost);
      this.ghostGroup.add(sprite);
    }
  }

  /**
   * Get color for ghost bidder
   */
  private getGhostColor(index: number): number {
    const colors = [0x66ccff, 0xff66cc, 0xccff66, 0xff9966, 0x9966ff];
    return colors[index % colors.length];
  }

  /**
   * Update ghost bidder positions and bids
   */
  private updateGhostBidders(): void {
    this.ghostBidders.forEach(ghost => {
      // Calculate bid based on aggression and current floor
      const bidMultiplier = 1 + (ghost.aggression * this.competition);
      ghost.currentBid = Math.min(
        this.currentFloorPrice * bidMultiplier,
        ghost.maxBid
      );
    });
  }

  /**
   * Show ghost bidders racing to a barrier
   */
  showGhostBiddersRacing(barrier: FloorPriceBarrier): void {
    this.ghostBidders.forEach((ghost, index) => {
      ghost.sprite.setVisible(true);
      ghost.sprite.setPosition(barrier.zone.x - 200, barrier.y + 50 + index * 30);
      
      // Animate ghost racing toward barrier
      this.scene.tweens.add({
        targets: ghost.sprite,
        x: barrier.zone.x,
        y: barrier.y - (ghost.currentBid >= barrier.price ? 50 : 20),
        alpha: ghost.currentBid >= barrier.price ? 0.7 : 0.2,
        duration: 1000 + index * 200,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Fade out after race
          this.scene.time.delayedCall(500, () => {
            this.scene.tweens.add({
              targets: ghost.sprite,
              alpha: 0,
              duration: 300,
            });
          });
        },
      });
    });
  }

  // ============================================================================
  // BID VALIDATION
  // ============================================================================

  /**
   * Check if player's position constitutes a valid bid above floor
   */
  validateBid(playerY: number, barrier: FloorPriceBarrier): boolean {
    const isAboveFloor = playerY < barrier.y;
    
    if (isAboveFloor) {
      this.emit('valid-bid', {
        barrier,
        playerY,
        margin: barrier.y - playerY,
      });
      
      // Visual feedback
      this.flashBarrierSuccess(barrier);
      return true;
    } else {
      this.emit('invalid-bid', {
        barrier,
        playerY,
        deficit: playerY - barrier.y,
      });
      
      // Visual feedback
      this.flashBarrierFailure(barrier);
      return false;
    }
  }

  /**
   * Flash barrier green on success
   */
  private flashBarrierSuccess(barrier: FloorPriceBarrier): void {
    // Redraw with success color
    const width = 400;
    barrier.line.clear();
    barrier.line.lineStyle(4, 0x00ff00, 1);
    barrier.line.beginPath();
    barrier.line.moveTo(0, 0);
    barrier.line.lineTo(width, 0);
    barrier.line.strokePath();
    
    this.scene.tweens.add({
      targets: barrier.line,
      alpha: 0.5,
      yoyo: true,
      duration: 100,
      repeat: 2,
      onComplete: () => {
        barrier.line.setAlpha(1);
        this.drawFloorLine(barrier.line, width, barrier.price);
      },
    });
  }

  /**
   * Flash barrier red on failure
   */
  private flashBarrierFailure(barrier: FloorPriceBarrier): void {
    // Redraw with failure color
    const width = 400;
    barrier.line.clear();
    barrier.line.lineStyle(4, 0xff0000, 1);
    barrier.line.beginPath();
    barrier.line.moveTo(0, 0);
    barrier.line.lineTo(width, 0);
    barrier.line.strokePath();
    
    this.scene.tweens.add({
      targets: barrier.line,
      alpha: 0.3,
      yoyo: true,
      duration: 50,
      repeat: 4,
      onComplete: () => {
        barrier.line.setAlpha(1);
        this.drawFloorLine(barrier.line, width, barrier.price);
      },
    });
  }

  // ============================================================================
  // GETTERS & UTILITIES
  // ============================================================================

  /**
   * Get current floor price
   */
  getCurrentFloorPrice(): number {
    return this.currentFloorPrice;
  }

  /**
   * Get all barriers
   */
  getBarriers(): FloorPriceBarrier[] {
    return this.barriers;
  }

  /**
   * Get active barriers only
   */
  getActiveBarriers(): FloorPriceBarrier[] {
    return this.barriers.filter(b => b.isActive);
  }

  /**
   * Deactivate a barrier (player passed it)
   */
  deactivateBarrier(barrier: FloorPriceBarrier): void {
    barrier.isActive = false;
    
    this.scene.tweens.add({
      targets: [barrier.line, barrier.label],
      alpha: 0.3,
      duration: 300,
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Kill all tweens
    this.activeTweens.forEach(tween => tween.destroy());
    this.activeTweens = [];
    
    // Destroy barriers
    this.barriers.forEach(barrier => {
      barrier.line.destroy();
      barrier.label.destroy();
      barrier.zone.destroy();
    });
    this.barriers = [];
    
    // Destroy ghost bidders
    this.ghostBidders.forEach(ghost => {
      ghost.sprite.destroy();
    });
    this.ghostBidders = [];
    
    // Destroy groups
    this.floorPriceGroup.destroy(true);
    this.ghostGroup.destroy(true);
    
    this.removeAllListeners();
    
    console.log('[SSPAuction] Destroyed');
  }
}
