/**
 * VideoStar Power-up
 * 
 * Ultimate format power-up representing a Video Ad:
 * - Upgrades player to "powered" format
 * - Grants invincibility for 15 seconds
 * - Auto-defeats enemies on contact
 * - Educational: Teaches about video advertising (highest CPM)
 */

import Phaser from 'phaser';

export class VideoStar extends Phaser.Physics.Arcade.Sprite {
  private glowGraphics: Phaser.GameObjects.Graphics | null = null;
  private sparkleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private isCollected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'powerup-video');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Configure physics
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    
    // Create effects
    this.createGlowEffect();
    this.createSparkles();
    
    // Start animations
    this.startAnimations();
  }

  /**
   * Create pulsing glow effect
   */
  private createGlowEffect(): void {
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setDepth(this.depth - 1);
    
    // Golden glow
    this.glowGraphics.fillStyle(0xffd700, 0.3);
    this.glowGraphics.fillCircle(this.x, this.y, 40);
    
    // Inner bright core
    this.glowGraphics.fillStyle(0xffff00, 0.2);
    this.glowGraphics.fillCircle(this.x, this.y, 25);
  }

  /**
   * Create sparkle particle effect
   */
  private createSparkles(): void {
    // Create sparkle texture if not exists
    if (!this.scene.textures.exists('sparkle')) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(2, 2, 2);
      graphics.generateTexture('sparkle', 4, 4);
      graphics.destroy();
    }
    
    this.sparkleEmitter = this.scene.add.particles(this.x, this.y, 'sparkle', {
      speed: { min: 20, max: 60 },
      lifespan: 600,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: 100,
      blendMode: 'ADD',
      tint: [0xffd700, 0xffff00, 0xffffff],
      emitting: true,
    });
    
    this.sparkleEmitter.setDepth(this.depth + 1);
  }

  /**
   * Start idle animations
   */
  private startAnimations(): void {
    // Floating animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Rotation
    this.scene.tweens.add({
      targets: this,
      rotation: Math.PI * 2,
      duration: 2000,
      repeat: -1,
      ease: 'Linear',
    });
    
    // Pulsing scale
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.3 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Glow pulsing
    if (this.glowGraphics) {
      this.scene.tweens.add({
        targets: this.glowGraphics,
        alpha: { from: 0.6, to: 1 },
        scale: { from: 1, to: 1.2 },
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  /**
   * Update sparkle emitter position
   */
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    
    if (this.sparkleEmitter) {
      this.sparkleEmitter.setPosition(this.x, this.y);
    }
    
    // Update glow position
    if (this.glowGraphics && !this.isCollected) {
      this.glowGraphics.clear();
      this.glowGraphics.fillStyle(0xffd700, 0.3);
      this.glowGraphics.fillCircle(this.x, this.y, 40);
      this.glowGraphics.fillStyle(0xffff00, 0.2);
      this.glowGraphics.fillCircle(this.x, this.y, 25);
    }
  }

  /**
   * Called when collected by player
   */
  collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;
    
    // Stop sparkles
    if (this.sparkleEmitter) {
      this.sparkleEmitter.stop();
    }
    
    // Explosion effect
    this.createExplosionEffect();
    
    // Dramatic collection animation
    this.scene.tweens.add({
      targets: this,
      scale: 3,
      alpha: 0,
      rotation: this.rotation + Math.PI * 2,
      duration: 400,
      ease: 'Power3',
      onComplete: () => this.destroy(),
    });
    
    // Camera shake for emphasis
    this.scene.cameras.main.shake(200, 0.01);
    
    // Flash
    this.scene.cameras.main.flash(200, 255, 215, 0, false, undefined, this);
  }

  /**
   * Create explosion effect on collection
   */
  private createExplosionEffect(): void {
    // Ring burst
    const ring = this.scene.add.circle(this.x, this.y, 10, 0xffd700, 0);
    ring.setStrokeStyle(4, 0xffd700, 1);
    
    this.scene.tweens.add({
      targets: ring,
      radius: 80,
      strokeAlpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
    
    // Star burst particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 60 + Math.random() * 30;
      
      const star = this.scene.add.star(
        this.x,
        this.y,
        5,
        4,
        8,
        0xffd700
      );
      
      this.scene.tweens.add({
        targets: star,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        rotation: Math.PI * 2,
        duration: 500,
        ease: 'Power2',
        onComplete: () => star.destroy(),
      });
    }
  }

  /**
   * Get power-up type
   */
  getType(): string {
    return 'video';
  }

  /**
   * Get educational tooltip content
   */
  getTooltip(): { title: string; content: string } {
    return {
      title: 'Video Ad (Star Power)',
      content: 'Premium video format with highest CPMs. 15-30 second spots with high completion rates. VAST/VPAID compliant for programmatic.',
    };
  }

  /**
   * Clean up
   */
  destroy(fromScene?: boolean): void {
    if (this.glowGraphics) {
      this.glowGraphics.destroy();
      this.glowGraphics = null;
    }
    if (this.sparkleEmitter) {
      this.sparkleEmitter.destroy();
      this.sparkleEmitter = null;
    }
    super.destroy(fromScene);
  }
}
