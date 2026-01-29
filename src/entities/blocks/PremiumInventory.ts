/**
 * PremiumInventory Block
 * 
 * Gold blocks representing premium ad inventory:
 * - High yield (100 points)
 * - Requires Image/Video format to break
 * - Educational: Teaches about premium vs remnant inventory
 */

import Phaser from 'phaser';

export class PremiumInventory extends Phaser.Physics.Arcade.Sprite {
  private value: number = 100;
  private isBreaking: boolean = false;
  private glowGraphics: Phaser.GameObjects.Graphics | null = null;
  private shineEffect: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'tile-premium');
    
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body
    
    // Create effects
    this.createGlowEffect();
    this.createShineEffect();
    
    this.setData('type', 'premium');
    this.setData('value', this.value);
    this.setData('requiresFormat', ['big', 'powered']);
  }

  /**
   * Create subtle glow effect
   */
  private createGlowEffect(): void {
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setDepth(this.depth - 1);
    
    this.glowGraphics.fillStyle(0xffd700, 0.1);
    this.glowGraphics.fillRect(this.x - 18, this.y - 18, 36, 36);
  }

  /**
   * Create animated shine effect
   */
  private createShineEffect(): void {
    this.shineEffect = this.scene.add.graphics();
    this.shineEffect.setDepth(this.depth + 1);
    
    // Animated shine
    this.scene.tweens.add({
      targets: this.shineEffect,
      alpha: { from: 0, to: 0.6 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.updateShine(),
    });
  }

  /**
   * Update shine position
   */
  private updateShine(): void {
    if (!this.shineEffect) return;
    
    this.shineEffect.clear();
    this.shineEffect.fillStyle(0xffff99, 0.4);
    this.shineEffect.fillRect(this.x - 10, this.y - 10, 8, 8);
  }

  /**
   * Check if can be broken by given format
   */
  canBreak(format: string): boolean {
    const requiredFormats = this.getData('requiresFormat') as string[];
    return requiredFormats.includes(format);
  }

  /**
   * Attempt to break the block
   */
  tryBreak(format: string): boolean {
    if (this.isBreaking) return false;
    
    if (this.canBreak(format)) {
      this.breakBlock();
      return true;
    } else {
      this.rejectBreak();
      return false;
    }
  }

  /**
   * Break the block (successful hit)
   */
  private breakBlock(): void {
    this.isBreaking = true;
    
    // Emit event before destruction
    this.emit('broken', { value: this.value, type: 'premium' });
    
    // Break animation
    this.createBreakParticles();
    
    // Fade and destroy
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.2,
      duration: 150,
      onComplete: () => this.destroy(),
    });
  }

  /**
   * Create breaking particle effect
   */
  private createBreakParticles(): void {
    const colors = [0xffd700, 0xffec8b, 0xb8860b, 0xdaa520];
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 80 + Math.random() * 60;
      
      const particle = this.scene.add.rectangle(
        this.x,
        this.y,
        6 + Math.random() * 4,
        6 + Math.random() * 4,
        Phaser.Utils.Array.GetRandom(colors)
      );
      
      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed + 40,
        rotation: Math.random() * Math.PI * 2,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
    
    // Gold coin pop
    const coin = this.scene.add.circle(this.x, this.y - 10, 8, 0xffd700);
    this.scene.tweens.add({
      targets: coin,
      y: this.y - 50,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => coin.destroy(),
    });
  }

  /**
   * Reject break attempt (wrong format)
   */
  private rejectBreak(): void {
    // Shake animation
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 3, to: this.x + 3 },
      duration: 50,
      yoyo: true,
      repeat: 3,
    });
    
    // Flash red briefly
    this.setTint(0xff6666);
    this.scene.time.delayedCall(200, () => {
      this.clearTint();
    });
  }

  /**
   * Get educational tooltip
   */
  getTooltip(): { title: string; content: string } {
    return {
      title: 'Premium Inventory',
      content: 'High-quality ad placements on brand-safe, viewable positions. Higher CPMs but better performance metrics. Requires display or video format.',
    };
  }

  /**
   * Get block value
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Clean up
   */
  destroy(fromScene?: boolean): void {
    if (this.glowGraphics) {
      this.glowGraphics.destroy();
      this.glowGraphics = null;
    }
    if (this.shineEffect) {
      this.shineEffect.destroy();
      this.shineEffect = null;
    }
    super.destroy(fromScene);
  }
}
