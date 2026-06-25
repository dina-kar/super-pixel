/**
 * TextMushroom Power-up
 * 
 * Basic format power-up representing a Text Ad:
 * - Grants small boost (if already small, gives bonus points)
 * - Fast movement speed
 * - Educational: Teaches about text-based ad formats
 */

import Phaser from 'phaser';

export class TextMushroom extends Phaser.Physics.Arcade.Sprite {
  private glowGraphics: Phaser.GameObjects.Graphics | null = null;
  private isCollected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'powerup-text');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Configure physics
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    
    // Create glow effect
    this.createGlowEffect();
    
    // Start animations
    this.startAnimations();
  }

  /**
   * Create pulsing glow effect
   */
  private createGlowEffect(): void {
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setDepth(this.depth - 1);
    
    this.updateGlow();
  }

  /**
   * Update glow position
   */
  private updateGlow(): void {
    if (!this.glowGraphics) return;
    
    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(0x00ccff, 0.2);
    this.glowGraphics.fillCircle(this.x, this.y, 24);
  }

  /**
   * Start idle animations
   */
  private startAnimations(): void {
    // Floating animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Pulsing scale
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Called when collected by player
   */
  collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;
    
    // Collection animation
    this.scene.tweens.add({
      targets: this,
      scale: 2,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });
    
    // Glow expansion
    if (this.glowGraphics) {
      this.scene.tweens.add({
        targets: this.glowGraphics,
        alpha: 0,
        duration: 200,
      });
    }
  }

  /**
   * Get power-up type
   */
  getType(): string {
    return 'text';
  }

  /**
   * Get educational tooltip content
   */
  getTooltip(): { title: string; content: string } {
    return {
      title: 'Text Ad',
      content: 'The simplest ad format. Low CPM but high volume. Great for retargeting campaigns.',
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
    super.destroy(fromScene);
  }
}
