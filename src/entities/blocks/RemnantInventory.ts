/**
 * RemnantInventory Block
 * 
 * Brown blocks representing remnant/unsold ad inventory:
 * - Low yield (10 points)
 * - Breakable by any format
 * - Educational: Teaches about remnant inventory in ad networks
 */

import Phaser from 'phaser';

export class RemnantInventory extends Phaser.Physics.Arcade.Sprite {
  private value: number = 10;
  private isBreaking: boolean = false;
  private crackLevel: number = 0; // 0-2, shows wear

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'tile-remnant');
    
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body
    
    // Slight random tint variation
    const tintVariation = 0.9 + Math.random() * 0.2;
    this.setTint(Phaser.Display.Color.GetColor(
      Math.floor(139 * tintVariation),
      Math.floor(69 * tintVariation),
      Math.floor(19 * tintVariation)
    ));
    
    this.setData('type', 'remnant');
    this.setData('value', this.value);
    this.setData('requiresFormat', []); // Any format can break
  }

  /**
   * Any format can break remnant inventory
   */
  canBreak(_format: string): boolean {
    return true;
  }

  /**
   * Attempt to break the block
   */
  tryBreak(format: string): boolean {
    if (this.isBreaking) return false;
    
    // Remnant blocks may require multiple hits (simulating lower quality)
    this.crackLevel++;
    
    if (this.crackLevel >= 2 || format === 'powered') {
      this.breakBlock();
      return true;
    } else {
      this.showCrack();
      return false;
    }
  }

  /**
   * Show crack effect (partial damage)
   */
  private showCrack(): void {
    // Shake
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 2, to: this.x + 2 },
      duration: 30,
      yoyo: true,
      repeat: 2,
    });
    
    // Add crack visual
    const crack = this.scene.add.graphics();
    crack.lineStyle(1, 0x3c1f0d, 0.8);
    crack.lineBetween(
      this.x - 8 + Math.random() * 16,
      this.y - 8,
      this.x - 8 + Math.random() * 16,
      this.y + 8
    );
    crack.setDepth(this.depth + 1);
    
    // Darken slightly
    this.setAlpha(1 - this.crackLevel * 0.1);
  }

  /**
   * Break the block
   */
  private breakBlock(): void {
    this.isBreaking = true;
    
    // Emit event before destruction
    this.emit('broken', { value: this.value, type: 'remnant' });
    
    // Break particles
    this.createBreakParticles();
    
    // Crumble animation
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.1,
      alpha: 0,
      duration: 100,
      onComplete: () => this.destroy(),
    });
  }

  /**
   * Create breaking particle effect
   */
  private createBreakParticles(): void {
    const colors = [0x8b4513, 0x5c3010, 0xa0522d, 0x654321];
    
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const speed = 40 + Math.random() * 40;
      
      const particle = this.scene.add.rectangle(
        this.x,
        this.y,
        4 + Math.random() * 3,
        4 + Math.random() * 3,
        Phaser.Utils.Array.GetRandom(colors)
      );
      
      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed + 30,
        rotation: Math.random() * Math.PI * 2,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Get educational tooltip
   */
  getTooltip(): { title: string; content: string } {
    return {
      title: 'Remnant Inventory',
      content: 'Unsold ad space sold at discount through ad networks. Lower CPMs but high volume. Often used for prospecting campaigns.',
    };
  }

  /**
   * Get block value
   */
  getValue(): number {
    return this.value;
  }
}
