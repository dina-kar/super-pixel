/**
 * Player - "Pixel" Character Entity
 * 
 * The main playable character representing an ad impression traveling
 * through the AdTech ecosystem.
 * 
 * States:
 * - small (Text Ad): Basic form, small hitbox, fast movement
 * - big (Image Ad): Medium form, can break premium blocks
 * - powered (Video Ad): Invincibility, auto-defeat enemies, limited duration
 * 
 * AdTech Methods:
 * - collectImpression(): Register an impression
 * - registerClick(): Register a click event
 * - convert(): Complete a conversion goal
 */

import Phaser from 'phaser';
import type { CreativeFormat, InventoryItem, InventoryState } from '../types/adtech';
import { BudgetManager } from '../components/BudgetManager';

/**
 * Player configuration constants
 */
const PLAYER_CONFIG = {
  // Physics
  maxSpeed: 300,
  acceleration: 1200,
  drag: 800,
  jumpVelocity: -500,
  
  // Sizes per format
  sizes: {
    small: { width: 24, height: 24 },
    big: { width: 32, height: 32 },
    powered: { width: 40, height: 40 },
  },
  
  // Power-up duration (ms)
  poweredDuration: 15000,
  
  // Invincibility after damage (ms)
  invincibilityDuration: 2000,
};

/**
 * Player Entity
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  // Player state
  private format: CreativeFormat = 'small';
  private inventory: InventoryState;
  private isInvincible: boolean = false;
  private isPowered: boolean = false;
  private poweredTimer: Phaser.Time.TimerEvent | null = null;
  
  // Movement state
  private isJumping: boolean = false;
  private canDoubleJump: boolean = false;
  private hasDoubleJumped: boolean = false;
  
  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  
  // Reference to budget manager
  private budgetManager: BudgetManager | null = null;
  
  // Visual effects
  private glowEffect: Phaser.GameObjects.Graphics | null = null;
  private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-small');
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Configure physics body
    this.setCollideWorldBounds(true);
    this.setDragX(PLAYER_CONFIG.drag);
    this.setMaxVelocity(PLAYER_CONFIG.maxSpeed, 800);
    
    // Set initial size
    this.updateSize();
    
    // Initialize inventory
    this.inventory = {
      items: [],
      totalValue: 0,
      capacity: 100,
    };
    
    // Set up input
    this.setupInput();
    
    // Create visual effects
    this.createEffects();
    
    console.log('[Player] Created at', x, y);
  }

  /**
   * Set up keyboard input
   */
  private setupInput(): void {
    if (!this.scene.input.keyboard) return;
    
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.jumpKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Alternative WASD controls
    this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  /**
   * Create visual effects (glow, trail)
   */
  private createEffects(): void {
    // Create glow graphics
    this.glowEffect = this.scene.add.graphics();
    this.glowEffect.setDepth(this.depth - 1);
    
    // Create particle trail
    const trailTexture = this.scene.textures.exists('particle-glow') ? 'particle-glow' : null;
    
    if (trailTexture) {
      this.trailEmitter = this.scene.add.particles(0, 0, 'particle-glow', {
        follow: this,
        followOffset: { x: 0, y: 8 },
        lifespan: 300,
        speed: { min: 10, max: 30 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.6, end: 0 },
        frequency: 50,
        blendMode: 'ADD',
        tint: 0x00ff88,
      });
      this.trailEmitter.stop();
    }
  }

  /**
   * Update player each frame
   */
  update(_time: number, delta: number): void {
    // Handle movement input
    this.handleMovement();
    
    // Handle jumping
    this.handleJump();
    
    // Update visual effects
    this.updateEffects();
    
    // Track distance for budget (CPM)
    if (this.budgetManager && this.body) {
      this.budgetManager.trackDistance(Math.abs(this.body.velocity.x) * (delta / 1000));
    }
  }

  /**
   * Handle horizontal movement
   */
  private handleMovement(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;
    
    const left = this.cursors.left.isDown || keyboard.checkDown(keyboard.addKey('A'));
    const right = this.cursors.right.isDown || keyboard.checkDown(keyboard.addKey('D'));
    
    if (left) {
      this.setAccelerationX(-PLAYER_CONFIG.acceleration);
      this.setFlipX(true);
      this.startTrail();
    } else if (right) {
      this.setAccelerationX(PLAYER_CONFIG.acceleration);
      this.setFlipX(false);
      this.startTrail();
    } else {
      this.setAccelerationX(0);
      this.stopTrail();
    }
  }

  /**
   * Handle jump input
   */
  private handleJump(): void {
    const onGround = this.body && (this.body as Phaser.Physics.Arcade.Body).onFloor();
    
    // Reset jump state when landing
    if (onGround) {
      this.isJumping = false;
      this.hasDoubleJumped = false;
    }
    
    // Jump on key press (not hold)
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      if (onGround) {
        // Normal jump
        this.setVelocityY(PLAYER_CONFIG.jumpVelocity);
        this.isJumping = true;
        this.emit('jump');
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        // Double jump (if power-up grants it)
        this.setVelocityY(PLAYER_CONFIG.jumpVelocity * 0.85);
        this.hasDoubleJumped = true;
        this.emit('double-jump');
      }
    }
    
    // Variable jump height - release early for shorter jump
    if (this.isJumping && !this.jumpKey.isDown && !this.cursors.up.isDown) {
      if (this.body && this.body.velocity.y < -200) {
        this.setVelocityY(-200);
      }
    }
  }

  /**
   * Update visual effects
   */
  private updateEffects(): void {
    if (!this.glowEffect) return;
    
    this.glowEffect.clear();
    
    // Draw glow based on format
    let glowColor = 0x00ff88;
    let glowAlpha = 0.2;
    let glowRadius = 20;
    
    switch (this.format) {
      case 'big':
        glowColor = 0x00ff88;
        glowAlpha = 0.3;
        glowRadius = 30;
        break;
      case 'powered':
        glowColor = 0xff00ff;
        glowAlpha = 0.5;
        glowRadius = 45;
        break;
    }
    
    // Invincibility flash
    if (this.isInvincible) {
      glowColor = 0xffffff;
      glowAlpha = Math.sin(this.scene.time.now * 0.02) * 0.3 + 0.3;
    }
    
    this.glowEffect.fillStyle(glowColor, glowAlpha);
    this.glowEffect.fillCircle(this.x, this.y, glowRadius);
  }

  // ============================================================================
  // FORMAT & POWER-UP SYSTEM
  // ============================================================================

  /**
   * Get current creative format
   */
  getFormat(): CreativeFormat {
    return this.format;
  }

  /**
   * Set creative format (power-up collection)
   */
  setFormat(format: CreativeFormat): void {
    const oldFormat = this.format;
    this.format = format;
    
    // Update sprite
    const textureKey = `player-${format}`;
    if (this.scene.textures.exists(textureKey)) {
      this.setTexture(textureKey);
    }
    
    // Update size
    this.updateSize();
    
    // Handle powered state
    if (format === 'powered') {
      this.activatePowered();
    } else if (oldFormat === 'powered') {
      this.deactivatePowered();
    }
    
    this.emit('format-changed', { from: oldFormat, to: format });
    console.log(`[Player] Format changed: ${oldFormat} → ${format}`);
  }

  /**
   * Update physics body size based on format
   */
  private updateSize(): void {
    const size = PLAYER_CONFIG.sizes[this.format];
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    if (body) {
      body.setSize(size.width * 0.8, size.height * 0.9);
      body.setOffset((this.width - size.width * 0.8) / 2, (this.height - size.height * 0.9));
    }
  }

  /**
   * Activate powered (video ad) state
   */
  private activatePowered(): void {
    this.isPowered = true;
    this.isInvincible = true;
    this.canDoubleJump = true;
    
    // Visual feedback
    if (this.trailEmitter) {
      this.trailEmitter.start();
    }
    
    // Set timer
    this.poweredTimer = this.scene.time.delayedCall(
      PLAYER_CONFIG.poweredDuration,
      () => {
        this.setFormat('big'); // Downgrade to big form
      }
    );
    
    this.emit('powered-activated');
    console.log('[Player] Powered mode activated!');
  }

  /**
   * Deactivate powered state
   */
  private deactivatePowered(): void {
    this.isPowered = false;
    this.isInvincible = false;
    this.canDoubleJump = false;
    
    if (this.poweredTimer) {
      this.poweredTimer.destroy();
      this.poweredTimer = null;
    }
    
    if (this.trailEmitter) {
      // Trail color handled by particle config
    }
    
    this.emit('powered-deactivated');
    console.log('[Player] Powered mode ended');
  }

  /**
   * Power down one level (damage)
   */
  powerDown(): boolean {
    if (this.isInvincible) return false;
    
    if (this.format === 'powered') {
      this.setFormat('big');
    } else if (this.format === 'big') {
      this.setFormat('small');
    } else {
      // Already small - take damage/die
      return true;
    }
    
    // Temporary invincibility
    this.setInvincible(PLAYER_CONFIG.invincibilityDuration);
    this.emit('damaged');
    
    return false;
  }

  /**
   * Set temporary invincibility
   */
  setInvincible(duration: number): void {
    this.isInvincible = true;
    
    // Flash effect
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.4 },
      duration: 100,
      yoyo: true,
      repeat: Math.floor(duration / 200),
      onComplete: () => {
        this.isInvincible = false;
        this.setAlpha(1);
      },
    });
  }

  // ============================================================================
  // ADTECH METHODS
  // ============================================================================

  /**
   * Set budget manager reference
   */
  setBudgetManager(manager: BudgetManager): void {
    this.budgetManager = manager;
  }

  /**
   * Collect an impression (CPM-related pickup)
   */
  collectImpression(value: number = 1): void {
    const item: InventoryItem = {
      id: `imp-${Date.now()}`,
      type: this.format,
      value,
      timestamp: Date.now(),
    };
    
    this.inventory.items.push(item);
    this.inventory.totalValue += value;
    
    this.emit('impression-collected', item);
  }

  /**
   * Register a click event (CPC action)
   */
  registerClick(): number {
    if (!this.budgetManager) return 0;
    
    const cost = this.budgetManager.registerClick();
    this.emit('click-registered', { cost });
    return cost;
  }

  /**
   * Complete a conversion (reach goal)
   */
  convert(): number {
    if (!this.budgetManager) return 0;
    
    const cost = this.budgetManager.registerConversion();
    this.emit('conversion-completed', {
      cost,
      inventory: this.inventory,
    });
    
    return cost;
  }

  /**
   * Get current inventory state
   */
  getInventory(): InventoryState {
    return { ...this.inventory };
  }

  /**
   * Can break premium inventory blocks?
   */
  canBreakPremium(): boolean {
    return this.format === 'big' || this.format === 'powered';
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Start particle trail
   */
  private startTrail(): void {
    if (this.trailEmitter && !this.trailEmitter.emitting) {
      this.trailEmitter.start();
    }
  }

  /**
   * Stop particle trail
   */
  private stopTrail(): void {
    if (this.trailEmitter && this.trailEmitter.emitting && !this.isPowered) {
      this.trailEmitter.stop();
    }
  }

  /**
   * Bounce (hit enemy from above)
   */
  bounce(): void {
    this.setVelocityY(PLAYER_CONFIG.jumpVelocity * 0.6);
  }

  /**
   * Get player state for UI/debugging
   */
  getState() {
    return {
      x: this.x,
      y: this.y,
      format: this.format,
      isInvincible: this.isInvincible,
      isPowered: this.isPowered,
      inventory: this.inventory,
    };
  }

  /**
   * Clean up resources
   */
  destroy(fromScene?: boolean): void {
    if (this.glowEffect) {
      this.glowEffect.destroy();
      this.glowEffect = null;
    }
    
    if (this.trailEmitter) {
      this.trailEmitter.destroy();
      this.trailEmitter = null;
    }
    
    if (this.poweredTimer) {
      this.poweredTimer.destroy();
      this.poweredTimer = null;
    }
    
    super.destroy(fromScene);
    console.log('[Player] Destroyed');
  }
}
