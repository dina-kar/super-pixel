/**
 * ImageFlower Power-up
 * 
 * Medium format power-up representing an Image/Display Ad:
 * - Upgrades player to "big" format
 * - Can break premium inventory blocks (gold bricks)
 * - Educational: Teaches about display advertising
 */

import Phaser from 'phaser';

export class ImageFlower extends Phaser.Physics.Arcade.Sprite {
  private glowGraphics: Phaser.GameObjects.Graphics | null = null;
  private petalGraphics: Phaser.GameObjects.Graphics[] = [];
  private isCollected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'powerup-image');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Configure physics
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    
    // Create effects
    this.createGlowEffect();
    
    // Start animations
    this.startAnimations();
  }

  /**
   * Create glow effect
   */
  private createGlowEffect(): void {
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setDepth(this.depth - 1);
    
    // Warm glow
    this.glowGraphics.fillStyle(0xff6b6b, 0.25);
    this.glowGraphics.fillCircle(this.x, this.y, 30);
  }

  /**
   * Start idle animations
   */
  private startAnimations(): void {
    // Floating animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Rotation for flower effect
    this.scene.tweens.add({
      targets: this,
      rotation: Math.PI * 2,
      duration: 4000,
      repeat: -1,
      ease: 'Linear',
    });
    
    // Glow pulsing
    if (this.glowGraphics) {
      this.scene.tweens.add({
        targets: this.glowGraphics,
        alpha: { from: 0.8, to: 1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  /**
   * Called when collected by player
   */
  collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;
    
    // Burst animation
    this.createBurstEffect();
    
    // Fade out
    this.scene.tweens.add({
      targets: this,
      scale: 2.5,
      alpha: 0,
      rotation: this.rotation + Math.PI,
      duration: 300,
      ease: 'Back.in',
      onComplete: () => this.destroy(),
    });
  }

  /**
   * Create particle burst on collection
   */
  private createBurstEffect(): void {
    const colors = [0xff6b6b, 0xff8e8e, 0xffd93d, 0xffec8b];
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        4,
        Phaser.Utils.Array.GetRandom(colors)
      );
      
      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * 50,
        y: this.y + Math.sin(angle) * 50,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Get power-up type
   */
  getType(): string {
    return 'image';
  }

  /**
   * Get educational tooltip content
   */
  getTooltip(): { title: string; content: string } {
    return {
      title: 'Display Ad (Image)',
      content: 'Visual ad format with higher engagement rates. Supports IAB standard sizes. Premium inventory access granted.',
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
    this.petalGraphics.forEach(g => g.destroy());
    this.petalGraphics = [];
    super.destroy(fromScene);
  }
}
