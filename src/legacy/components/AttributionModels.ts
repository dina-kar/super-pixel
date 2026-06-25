/**
 * AttributionModels - Attribution Modeling Engine
 * 
 * Manages different attribution models for the Attribution Castle world:
 * - First Touch: First touchpoint gets all credit
 * - Last Touch: Last touchpoint gets all credit
 * - Linear: Equal credit across all touchpoints
 * - Time Decay: More recent touchpoints get more credit
 * - Position-Based (U-Shaped): 40-20-40 distribution
 * - Data-Driven: ML-based attribution
 * 
 * Educational concept: Attribution determines how conversion credit
 * is assigned across the customer journey touchpoints.
 */

import Phaser from 'phaser';

export interface TouchPoint {
  id: string;
  channel: 'search' | 'social' | 'display' | 'email' | 'direct' | 'affiliate';
  position: { x: number; y: number };
  timestamp: number;
  credit: number; // 0-1, percentage of credit
  isCollected: boolean;
  sprite?: Phaser.GameObjects.Container;
}

export interface ConversionPath {
  touchpoints: TouchPoint[];
  totalValue: number;
  isComplete: boolean;
}

export type AttributionModelType = 
  | 'first-touch'
  | 'last-touch'
  | 'linear'
  | 'time-decay'
  | 'position-based'
  | 'data-driven';

const CHANNEL_CONFIG: Record<TouchPoint['channel'], {
  color: number;
  emoji: string;
  name: string;
}> = {
  search: { color: 0x4285f4, emoji: '🔍', name: 'Search' },
  social: { color: 0x1877f2, emoji: '👥', name: 'Social' },
  display: { color: 0xff6600, emoji: '🖼️', name: 'Display' },
  email: { color: 0xea4335, emoji: '📧', name: 'Email' },
  direct: { color: 0x34a853, emoji: '🔗', name: 'Direct' },
  affiliate: { color: 0x9b59b6, emoji: '🤝', name: 'Affiliate' },
};

const MODEL_CONFIG: Record<AttributionModelType, {
  name: string;
  description: string;
  color: number;
}> = {
  'first-touch': {
    name: 'First Touch',
    description: 'First touchpoint gets 100% credit',
    color: 0xff4444,
  },
  'last-touch': {
    name: 'Last Touch',
    description: 'Last touchpoint gets 100% credit',
    color: 0x44ff44,
  },
  'linear': {
    name: 'Linear',
    description: 'Equal credit across all touchpoints',
    color: 0x4444ff,
  },
  'time-decay': {
    name: 'Time Decay',
    description: 'Recent touchpoints get more credit',
    color: 0xffff44,
  },
  'position-based': {
    name: 'Position-Based',
    description: '40% first, 20% middle, 40% last',
    color: 0xff44ff,
  },
  'data-driven': {
    name: 'Data-Driven',
    description: 'ML optimizes credit distribution',
    color: 0x00ffff,
  },
};

export class AttributionModels extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  
  // Current attribution model
  private currentModel: AttributionModelType = 'last-touch';
  
  // Conversion paths
  private conversionPaths: Map<string, ConversionPath> = new Map();
  
  // UI elements
  private modelSelector!: Phaser.GameObjects.Container;
  private pathVisualization!: Phaser.GameObjects.Graphics;
  private creditDisplay!: Phaser.GameObjects.Container;
  
  // Active touchpoints in the scene
  private touchpoints: TouchPoint[] = [];

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    
    // Initialize path visualization
    this.pathVisualization = scene.add.graphics();
    this.pathVisualization.setDepth(150);
    
    console.log('[AttributionModels] Initialized');
  }

  /**
   * Create a touchpoint in the scene
   */
  createTouchpoint(
    x: number,
    y: number,
    channel: TouchPoint['channel'],
    pathId: string = 'main'
  ): TouchPoint {
    const config = CHANNEL_CONFIG[channel];
    
    const touchpoint: TouchPoint = {
      id: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channel,
      position: { x, y },
      timestamp: this.scene.time.now,
      credit: 0,
      isCollected: false,
    };
    
    // Create visual container
    const container = this.scene.add.container(x, y);
    container.setDepth(200);
    
    // Platform base
    const platform = this.scene.add.graphics();
    platform.fillStyle(config.color, 0.3);
    platform.fillRoundedRect(-40, -20, 80, 40, 8);
    platform.lineStyle(2, config.color, 1);
    platform.strokeRoundedRect(-40, -20, 80, 40, 8);
    container.add(platform);
    
    // Glowing orb
    const glow = this.scene.add.graphics();
    glow.fillStyle(config.color, 0.2);
    glow.fillCircle(0, -40, 25);
    glow.fillStyle(config.color, 0.4);
    glow.fillCircle(0, -40, 18);
    glow.fillStyle(config.color, 0.8);
    glow.fillCircle(0, -40, 10);
    container.add(glow);
    
    // Channel emoji
    const emoji = this.scene.add.text(0, -40, config.emoji, {
      fontSize: '20px',
    });
    emoji.setOrigin(0.5);
    container.add(emoji);
    
    // Channel label
    const label = this.scene.add.text(0, 5, config.name.toUpperCase(), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#' + config.color.toString(16).padStart(6, '0'),
    });
    label.setOrigin(0.5);
    container.add(label);
    
    // Credit indicator (hidden until collected)
    const creditText = this.scene.add.text(0, -70, '0%', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    creditText.setOrigin(0.5);
    creditText.setVisible(false);
    creditText.setName('creditText');
    container.add(creditText);
    
    // Pulse animation
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.5,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    touchpoint.sprite = container;
    this.touchpoints.push(touchpoint);
    
    // Add to conversion path
    this.addToPath(pathId, touchpoint);
    
    // Add physics body for collision
    const zone = this.scene.add.zone(x, y - 40, 50, 50);
    this.scene.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('touchpointId', touchpoint.id);
    
    return touchpoint;
  }

  /**
   * Add touchpoint to a conversion path
   */
  private addToPath(pathId: string, touchpoint: TouchPoint): void {
    let path = this.conversionPaths.get(pathId);
    
    if (!path) {
      path = {
        touchpoints: [],
        totalValue: 100, // Default conversion value
        isComplete: false,
      };
      this.conversionPaths.set(pathId, path);
    }
    
    path.touchpoints.push(touchpoint);
  }

  /**
   * Collect a touchpoint (player touches it)
   */
  collectTouchpoint(touchpointId: string): void {
    const touchpoint = this.touchpoints.find(tp => tp.id === touchpointId);
    if (!touchpoint || touchpoint.isCollected) return;
    
    touchpoint.isCollected = true;
    touchpoint.timestamp = this.scene.time.now;
    
    // Visual feedback
    if (touchpoint.sprite) {
      this.scene.tweens.add({
        targets: touchpoint.sprite,
        scaleY: 0.8,
        duration: 100,
        yoyo: true,
      });
    }
    
    // Recalculate credits
    this.calculateCredits();
    
    this.emit('touchpoint-collected', { touchpoint });
  }

  /**
   * Calculate attribution credits based on current model
   */
  calculateCredits(): void {
    this.conversionPaths.forEach((path, _pathId) => {
      const collected = path.touchpoints.filter(tp => tp.isCollected);
      if (collected.length === 0) return;
      
      // Reset credits
      path.touchpoints.forEach(tp => tp.credit = 0);
      
      // Apply attribution model
      switch (this.currentModel) {
        case 'first-touch':
          this.applyFirstTouch(collected);
          break;
        case 'last-touch':
          this.applyLastTouch(collected);
          break;
        case 'linear':
          this.applyLinear(collected);
          break;
        case 'time-decay':
          this.applyTimeDecay(collected);
          break;
        case 'position-based':
          this.applyPositionBased(collected);
          break;
        case 'data-driven':
          this.applyDataDriven(collected);
          break;
      }
      
      // Update visuals
      this.updateCreditVisuals(collected);
    });
    
    // Update path visualization
    this.visualizePaths();
    
    this.emit('credits-updated', { model: this.currentModel });
  }

  /**
   * First Touch attribution
   */
  private applyFirstTouch(touchpoints: TouchPoint[]): void {
    if (touchpoints.length === 0) return;
    
    // Sort by timestamp
    touchpoints.sort((a, b) => a.timestamp - b.timestamp);
    touchpoints[0].credit = 1;
  }

  /**
   * Last Touch attribution
   */
  private applyLastTouch(touchpoints: TouchPoint[]): void {
    if (touchpoints.length === 0) return;
    
    // Sort by timestamp
    touchpoints.sort((a, b) => a.timestamp - b.timestamp);
    touchpoints[touchpoints.length - 1].credit = 1;
  }

  /**
   * Linear attribution
   */
  private applyLinear(touchpoints: TouchPoint[]): void {
    if (touchpoints.length === 0) return;
    
    const creditPerTouch = 1 / touchpoints.length;
    touchpoints.forEach(tp => tp.credit = creditPerTouch);
  }

  /**
   * Time Decay attribution
   */
  private applyTimeDecay(touchpoints: TouchPoint[]): void {
    if (touchpoints.length === 0) return;
    
    // Sort by timestamp
    touchpoints.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate decay (half-life = 7 days, but scaled for game time)
    const now = this.scene.time.now;
    const halfLife = 5000; // 5 seconds in game time
    
    let totalWeight = 0;
    const weights: number[] = [];
    
    touchpoints.forEach(tp => {
      const timeSince = now - tp.timestamp;
      const weight = Math.pow(0.5, timeSince / halfLife);
      weights.push(weight);
      totalWeight += weight;
    });
    
    touchpoints.forEach((tp, i) => {
      tp.credit = weights[i] / totalWeight;
    });
  }

  /**
   * Position-Based (U-Shaped) attribution
   */
  private applyPositionBased(touchpoints: TouchPoint[]): void {
    if (touchpoints.length === 0) return;
    
    // Sort by timestamp
    touchpoints.sort((a, b) => a.timestamp - b.timestamp);
    
    if (touchpoints.length === 1) {
      touchpoints[0].credit = 1;
    } else if (touchpoints.length === 2) {
      touchpoints[0].credit = 0.5;
      touchpoints[1].credit = 0.5;
    } else {
      // 40% first, 40% last, 20% distributed among middle
      touchpoints[0].credit = 0.4;
      touchpoints[touchpoints.length - 1].credit = 0.4;
      
      const middleCredit = 0.2 / (touchpoints.length - 2);
      for (let i = 1; i < touchpoints.length - 1; i++) {
        touchpoints[i].credit = middleCredit;
      }
    }
  }

  /**
   * Data-Driven attribution (simulated ML)
   */
  private applyDataDriven(touchpoints: TouchPoint[]): void {
    if (touchpoints.length === 0) return;
    
    // Simulate ML-based attribution with weighted channels
    const channelWeights: Record<TouchPoint['channel'], number> = {
      search: 0.25,
      social: 0.15,
      display: 0.20,
      email: 0.18,
      direct: 0.12,
      affiliate: 0.10,
    };
    
    let totalWeight = 0;
    touchpoints.forEach(tp => {
      totalWeight += channelWeights[tp.channel];
    });
    
    touchpoints.forEach(tp => {
      tp.credit = channelWeights[tp.channel] / totalWeight;
    });
  }

  /**
   * Update credit display visuals
   */
  private updateCreditVisuals(touchpoints: TouchPoint[]): void {
    touchpoints.forEach(tp => {
      if (!tp.sprite) return;
      
      const creditText = tp.sprite.getByName('creditText') as Phaser.GameObjects.Text;
      if (creditText) {
        const percentage = Math.round(tp.credit * 100);
        creditText.setText(`${percentage}%`);
        creditText.setVisible(tp.isCollected && tp.credit > 0);
        
        // Scale based on credit
        const scale = 0.8 + tp.credit * 0.4;
        tp.sprite.setScale(scale);
      }
    });
  }

  /**
   * Visualize conversion paths
   */
  private visualizePaths(): void {
    this.pathVisualization.clear();
    
    this.conversionPaths.forEach(path => {
      const collected = path.touchpoints.filter(tp => tp.isCollected);
      if (collected.length < 2) return;
      
      // Sort by timestamp
      collected.sort((a, b) => a.timestamp - b.timestamp);
      
      // Draw connecting lines
      for (let i = 0; i < collected.length - 1; i++) {
        const from = collected[i];
        const to = collected[i + 1];
        
        const config = CHANNEL_CONFIG[from.channel];
        
        // Gradient line based on credit
        const alpha = 0.3 + from.credit * 0.5;
        this.pathVisualization.lineStyle(3 + from.credit * 4, config.color, alpha);
        
        this.pathVisualization.beginPath();
        this.pathVisualization.moveTo(from.position.x, from.position.y - 40);
        
        // Draw straight line (could use bezier for curves)
        this.pathVisualization.lineTo(to.position.x, to.position.y - 40);
        this.pathVisualization.strokePath();
        
        // Arrow indicator
        this.drawArrow(from.position.x, from.position.y - 40, to.position.x, to.position.y - 40, config.color);
      }
    });
  }

  /**
   * Draw an arrow between two points
   */
  private drawArrow(fromX: number, fromY: number, toX: number, toY: number, color: number): void {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowSize = 8;
    
    this.pathVisualization.fillStyle(color, 0.8);
    this.pathVisualization.beginPath();
    this.pathVisualization.moveTo(
      midX + Math.cos(angle) * arrowSize,
      midY + Math.sin(angle) * arrowSize
    );
    this.pathVisualization.lineTo(
      midX + Math.cos(angle + 2.5) * arrowSize,
      midY + Math.sin(angle + 2.5) * arrowSize
    );
    this.pathVisualization.lineTo(
      midX + Math.cos(angle - 2.5) * arrowSize,
      midY + Math.sin(angle - 2.5) * arrowSize
    );
    this.pathVisualization.closePath();
    this.pathVisualization.fillPath();
  }

  /**
   * Set the current attribution model
   */
  setModel(model: AttributionModelType): void {
    this.currentModel = model;
    this.calculateCredits();
    this.emit('model-changed', { model });
    
    console.log(`[AttributionModels] Switched to ${MODEL_CONFIG[model].name}`);
  }

  /**
   * Get current model
   */
  getModel(): AttributionModelType {
    return this.currentModel;
  }

  /**
   * Get model config
   */
  getModelConfig(model: AttributionModelType): typeof MODEL_CONFIG['first-touch'] {
    return MODEL_CONFIG[model];
  }

  /**
   * Get all available models
   */
  getAvailableModels(): AttributionModelType[] {
    return Object.keys(MODEL_CONFIG) as AttributionModelType[];
  }

  /**
   * Create model selector UI
   */
  createModelSelector(x: number, y: number): Phaser.GameObjects.Container {
    this.modelSelector = this.scene.add.container(x, y);
    this.modelSelector.setDepth(900);
    this.modelSelector.setScrollFactor(0);
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-150, -20, 300, 180, 8);
    bg.lineStyle(2, 0x00ff88, 0.6);
    bg.strokeRoundedRect(-150, -20, 300, 180, 8);
    this.modelSelector.add(bg);
    
    // Title
    const title = this.scene.add.text(0, -5, '📊 ATTRIBUTION MODEL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#00ff88',
    });
    title.setOrigin(0.5);
    this.modelSelector.add(title);
    
    // Model buttons
    const models = this.getAvailableModels();
    const cols = 2;
    const btnWidth = 130;
    const btnHeight = 24;
    
    models.forEach((model, index) => {
      const config = MODEL_CONFIG[model];
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const btnX = (col - 0.5) * (btnWidth + 10);
      const btnY = 30 + row * (btnHeight + 6);
      
      // Button background
      const btn = this.scene.add.graphics();
      btn.fillStyle(model === this.currentModel ? config.color : 0x333344, 0.8);
      btn.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 4);
      btn.lineStyle(1, config.color, 1);
      btn.strokeRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 4);
      btn.setName(`btn_${model}`);
      this.modelSelector.add(btn);
      
      // Button text
      const btnText = this.scene.add.text(btnX, btnY, config.name, {
        fontFamily: '"Courier New", monospace',
        fontSize: '8px',
        color: model === this.currentModel ? '#000000' : '#ffffff',
      });
      btnText.setOrigin(0.5);
      btnText.setName(`text_${model}`);
      this.modelSelector.add(btnText);
      
      // Make interactive
      const zone = this.scene.add.zone(x + btnX, y + btnY, btnWidth, btnHeight);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.setModel(model));
      zone.on('pointerover', () => btn.setAlpha(1.2));
      zone.on('pointerout', () => btn.setAlpha(1));
    });
    
    // Description
    const descText = this.scene.add.text(0, 140, MODEL_CONFIG[this.currentModel].description, {
      fontFamily: '"Courier New", monospace',
      fontSize: '8px',
      color: '#888888',
    });
    descText.setOrigin(0.5);
    descText.setName('descText');
    this.modelSelector.add(descText);
    
    return this.modelSelector;
  }

  /**
   * Get touchpoints
   */
  getTouchpoints(): TouchPoint[] {
    return this.touchpoints;
  }

  /**
   * Complete a conversion path
   */
  completePath(pathId: string = 'main'): void {
    const path = this.conversionPaths.get(pathId);
    if (!path) return;
    
    path.isComplete = true;
    this.emit('conversion-complete', { pathId, path });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.pathVisualization) this.pathVisualization.destroy();
    if (this.modelSelector) this.modelSelector.destroy();
    if (this.creditDisplay) this.creditDisplay.destroy();
    
    this.touchpoints.forEach(tp => {
      if (tp.sprite) tp.sprite.destroy();
    });
    
    this.touchpoints = [];
    this.conversionPaths.clear();
    
    this.removeAllListeners();
  }
}
