/**
 * LongTailPlatform
 * 
 * Moving platform representing long-tail inventory:
 * - Unpredictable movement patterns
 * - Simulates niche/programmatic inventory
 * - Educational: Teaches about long-tail publishers
 */

import Phaser from 'phaser';

type MovementPattern = 'horizontal' | 'vertical' | 'circular' | 'random';

export class LongTailPlatform extends Phaser.Physics.Arcade.Sprite {
  private pattern: MovementPattern;
  private startX: number;
  private startY: number;
  private range: number;
  private speed: number;
  private circleAngle: number = 0;
  private randomTarget: { x: number; y: number } | null = null;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    pattern: MovementPattern = 'horizontal',
    range: number = 100,
    speed: number = 50
  ) {
    super(scene, x, y, 'platform-billboard');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Configure physics
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);
    
    // Store movement parameters
    this.pattern = pattern;
    this.startX = x;
    this.startY = y;
    this.range = range;
    this.speed = speed;
    
    // Visual styling
    this.setTint(0x6b4fd4); // Purple tint for long-tail
    this.setAlpha(0.9);
    
    // Add indicator showing it's a moving platform
    this.createMovingIndicator();
    
    this.setData('type', 'long-tail');
    this.setData('pattern', pattern);
  }

  /**
   * Create visual indicator for moving platform
   */
  private createMovingIndicator(): void {
    // Arrows or dots showing movement direction
    const indicator = this.scene.add.graphics();
    indicator.setDepth(this.depth - 1);
    
    indicator.lineStyle(1, 0x9b7dff, 0.5);
    
    switch (this.pattern) {
      case 'horizontal':
        indicator.lineBetween(this.startX - this.range, this.startY, this.startX + this.range, this.startY);
        break;
      case 'vertical':
        indicator.lineBetween(this.startX, this.startY - this.range, this.startX, this.startY + this.range);
        break;
      case 'circular':
        indicator.strokeCircle(this.startX, this.startY, this.range);
        break;
    }
  }

  /**
   * Update platform movement
   */
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    
    switch (this.pattern) {
      case 'horizontal':
        this.updateHorizontal(time);
        break;
      case 'vertical':
        this.updateVertical(time);
        break;
      case 'circular':
        this.updateCircular(time, delta);
        break;
      case 'random':
        this.updateRandom(delta);
        break;
    }
  }

  /**
   * Horizontal oscillation
   */
  private updateHorizontal(time: number): void {
    const arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    const offset = Math.sin(time * 0.001 * (this.speed / 50)) * this.range;
    arcadeBody.x = this.startX + offset - this.width / 2;
    this.x = this.startX + offset;
  }

  /**
   * Vertical oscillation
   */
  private updateVertical(time: number): void {
    const arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    const offset = Math.sin(time * 0.001 * (this.speed / 50)) * this.range;
    arcadeBody.y = this.startY + offset - this.height / 2;
    this.y = this.startY + offset;
  }

  /**
   * Circular motion
   */
  private updateCircular(_time: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.circleAngle += delta * 0.001 * (this.speed / 50);
    
    const offsetX = Math.cos(this.circleAngle) * this.range;
    const offsetY = Math.sin(this.circleAngle) * this.range;
    
    body.x = this.startX + offsetX - this.width / 2;
    body.y = this.startY + offsetY - this.height / 2;
    this.x = this.startX + offsetX;
    this.y = this.startY + offsetY;
  }

  /**
   * Random/unpredictable movement
   */
  private updateRandom(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    // Set new random target if needed
    if (!this.randomTarget || this.isNearTarget()) {
      this.randomTarget = {
        x: this.startX + (Math.random() - 0.5) * this.range * 2,
        y: this.startY + (Math.random() - 0.5) * this.range * 2,
      };
    }
    
    // Move towards target
    const dx = this.randomTarget.x - this.x;
    const dy = this.randomTarget.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const moveX = (dx / distance) * this.speed * (delta / 1000);
      const moveY = (dy / distance) * this.speed * (delta / 1000);
      
      body.x += moveX;
      body.y += moveY;
      this.x += moveX;
      this.y += moveY;
    }
  }

  /**
   * Check if near random target
   */
  private isNearTarget(): boolean {
    if (!this.randomTarget) return true;
    
    const dx = this.randomTarget.x - this.x;
    const dy = this.randomTarget.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < 10;
  }

  /**
   * Get educational tooltip
   */
  getTooltip(): { title: string; content: string } {
    return {
      title: 'Long-Tail Inventory',
      content: 'Niche publisher inventory accessed through programmatic channels. Unpredictable but can reach unique audiences. Requires real-time bidding.',
    };
  }

  /**
   * Get pattern type
   */
  getPattern(): MovementPattern {
    return this.pattern;
  }
}
