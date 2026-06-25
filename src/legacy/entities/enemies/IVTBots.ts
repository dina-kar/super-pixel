/**
 * IVTBots - Invalid Traffic Enemy
 * 
 * Enemies representing Invalid Traffic (bots, fraud):
 * - Fake platforms that look solid but player falls through
 * - Bot detection visualization
 * - Educational: Teaches about ad fraud and IVT
 */

import Phaser from 'phaser';

type IVTType = 'fake-platform' | 'click-bot' | 'impression-bot';

export class IVTBot extends Phaser.Physics.Arcade.Sprite {
  private ivtType: IVTType;
  private isRevealed: boolean = false;
  private disguiseSprite: Phaser.GameObjects.Sprite | null = null;
  private warningGraphics: Phaser.GameObjects.Graphics | null = null;
  private detectionRadius: number = 100;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    type: IVTType = 'click-bot'
  ) {
    super(scene, x, y, 'enemy-ivt');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.ivtType = type;
    
    // Configure based on type
    this.configureByType();
    
    // Create warning indicator
    this.createWarningIndicator();
    
    this.setData('type', 'ivt');
    this.setData('ivtType', type);
    this.setData('detected', false);
  }

  /**
   * Configure behavior based on IVT type
   */
  private configureByType(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    switch (this.ivtType) {
      case 'fake-platform':
        // Looks like a platform, player falls through
        body.setAllowGravity(false);
        body.setImmovable(true);
        this.setTexture('tile-ground'); // Disguise as platform
        this.setAlpha(0.9);
        break;
        
      case 'click-bot':
        // Moving enemy that simulates fake clicks
        body.setAllowGravity(true);
        body.setVelocityX(60);
        body.setCollideWorldBounds(true);
        this.startPatrol();
        break;
        
      case 'impression-bot':
        // Stationary but constantly "viewing" ads
        body.setAllowGravity(false);
        body.setImmovable(true);
        this.startFakeViewingAnimation();
        break;
    }
  }

  /**
   * Create warning indicator (shows when bot detection is active)
   */
  private createWarningIndicator(): void {
    this.warningGraphics = this.scene.add.graphics();
    this.warningGraphics.setDepth(this.depth + 1);
    this.warningGraphics.setAlpha(0);
  }

  /**
   * Start patrol behavior for click bots
   */
  private startPatrol(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let direction = 1;
    const startX = this.x;
    const range = 80;
    
    // Check boundaries and reverse
    this.scene.events.on('update', () => {
      if (!this.active) return;
      
      if (this.x > startX + range) {
        direction = -1;
        this.setFlipX(true);
      } else if (this.x < startX - range) {
        direction = 1;
        this.setFlipX(false);
      }
      
      body.setVelocityX(60 * direction);
    });
  }

  /**
   * Start fake viewing animation for impression bots
   */
  private startFakeViewingAnimation(): void {
    // Pulsing "eye" effect to show it's watching
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Fake impression counter
    const counter = this.scene.add.text(this.x, this.y - 25, '0', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#ff4444',
    });
    counter.setOrigin(0.5);
    counter.setAlpha(0.7);
    
    let fakeImpressions = 0;
    this.scene.time.addEvent({
      delay: 200,
      callback: () => {
        if (!this.active) return;
        fakeImpressions++;
        counter.setText(fakeImpressions.toString());
        counter.setPosition(this.x, this.y - 25);
      },
      loop: true,
    });
  }

  /**
   * Reveal the bot (detection successful)
   */
  reveal(): void {
    if (this.isRevealed) return;
    this.isRevealed = true;
    
    this.setData('detected', true);
    
    // Show true nature
    this.setTexture('enemy-ivt');
    
    // Warning flash
    if (this.warningGraphics) {
      this.warningGraphics.clear();
      this.warningGraphics.lineStyle(2, 0xff0000, 1);
      this.warningGraphics.strokeCircle(this.x, this.y, 20);
      this.warningGraphics.setAlpha(1);
      
      this.scene.tweens.add({
        targets: this.warningGraphics,
        alpha: 0,
        duration: 1000,
        repeat: 2,
        yoyo: true,
      });
    }
    
    // Add "FRAUD DETECTED" label
    const label = this.scene.add.text(this.x, this.y - 30, 'IVT DETECTED', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#ff4444',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    label.setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: label,
      y: this.y - 50,
      alpha: 0,
      duration: 2000,
      onComplete: () => label.destroy(),
    });
  }

  /**
   * Check if player is within detection radius
   */
  isPlayerNearby(playerX: number, playerY: number): boolean {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.detectionRadius;
  }

  /**
   * Handle being defeated
   */
  defeat(): void {
    // Glitch death animation
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0 },
      scaleX: { from: 1, to: 0.1 },
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.createDefeatEffect();
        this.destroy();
      },
    });
  }

  /**
   * Create defeat visual effect
   */
  private createDefeatEffect(): void {
    // Binary particle burst (0s and 1s)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const text = this.scene.add.text(
        this.x,
        this.y,
        Math.random() > 0.5 ? '0' : '1',
        {
          fontFamily: '"Courier New", monospace',
          fontSize: '14px',
          color: '#ff4444',
        }
      );
      text.setOrigin(0.5);
      
      this.scene.tweens.add({
        targets: text,
        x: this.x + Math.cos(angle) * 60,
        y: this.y + Math.sin(angle) * 60,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => text.destroy(),
      });
    }
  }

  /**
   * Get IVT type
   */
  getIVTType(): IVTType {
    return this.ivtType;
  }

  /**
   * Is this a fake platform type?
   */
  isFakePlatform(): boolean {
    return this.ivtType === 'fake-platform';
  }

  /**
   * Get educational tooltip
   */
  getTooltip(): { title: string; content: string } {
    const tooltips = {
      'fake-platform': {
        title: 'SIVT - Fake Inventory',
        content: 'Fraudulent ad placements that appear legitimate but deliver no real impressions. Use verification tools to detect.',
      },
      'click-bot': {
        title: 'GIVT - Click Fraud Bot',
        content: 'Automated scripts generating fake clicks to drain advertiser budgets. Identified through behavioral analysis.',
      },
      'impression-bot': {
        title: 'GIVT - Impression Bot',
        content: 'Bots that load ad impressions without human viewership. Inflates impression counts without real engagement.',
      },
    };
    
    return tooltips[this.ivtType];
  }

  /**
   * Clean up
   */
  destroy(fromScene?: boolean): void {
    if (this.warningGraphics) {
      this.warningGraphics.destroy();
      this.warningGraphics = null;
    }
    if (this.disguiseSprite) {
      this.disguiseSprite.destroy();
      this.disguiseSprite = null;
    }
    super.destroy(fromScene);
  }
}
