/**
 * UniversalID - Cross-Device Identity Bridge System
 * 
 * Implements Universal ID mechanics for cross-device/cross-platform identity:
 * - ID Bridge: Connects separate device "islands"
 * - Persistent across scene transitions
 * - Alternative to 3rd-party cookies
 * 
 * In-game, Universal IDs appear as rainbow bridges that connect
 * mobile, desktop, and CTV islands, enabling player persistence.
 */

import Phaser from 'phaser';

/**
 * Device type for identity graph
 */
export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'ctv';

/**
 * Device island in the level
 */
export interface DeviceIsland {
  id: string;
  type: DeviceType;
  x: number;
  y: number;
  width: number;
  container: Phaser.GameObjects.Container;
  isConnected: boolean;
}

/**
 * Universal ID Bridge connecting islands
 */
export interface IDBridge {
  id: string;
  fromIsland: DeviceIsland;
  toIsland: DeviceIsland;
  container: Phaser.GameObjects.Container;
  body?: Phaser.Physics.Arcade.Sprite;
  isActive: boolean;
  isCollected: boolean;
}

/**
 * UniversalID Component
 * Manages cross-device identity bridges
 */
export class UniversalID extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  
  // Device islands
  private islands: DeviceIsland[] = [];
  
  // ID bridges
  private bridges: IDBridge[] = [];
  
  // Collected Universal IDs
  private collectedIDs: string[] = [];
  
  // Visual elements
  private bridgeGraphics!: Phaser.GameObjects.Graphics;
  private identityGraph!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    
    // Create bridge graphics layer
    this.bridgeGraphics = this.scene.add.graphics();
    this.bridgeGraphics.setDepth(80);
    
    console.log('[UniversalID] Initialized');
  }

  // ============================================================================
  // DEVICE ISLAND CREATION
  // ============================================================================

  /**
   * Create a device island (platform cluster)
   */
  createDeviceIsland(
    x: number,
    y: number,
    type: DeviceType,
    width: number = 200
  ): DeviceIsland {
    const id = `island_${type}_${Date.now()}`;
    
    const container = this.scene.add.container(x, y);
    container.setDepth(100);
    
    // Device-specific colors and icons
    const deviceInfo = {
      mobile: { color: 0x00ccff, icon: '📱', label: 'MOBILE' },
      desktop: { color: 0x00ff88, icon: '🖥️', label: 'DESKTOP' },
      tablet: { color: 0xffcc00, icon: '📟', label: 'TABLET' },
      ctv: { color: 0xff44ff, icon: '📺', label: 'CTV' },
    };
    
    const info = deviceInfo[type];
    
    // Island platform
    const platform = this.scene.add.graphics();
    platform.fillStyle(info.color, 0.3);
    platform.fillRoundedRect(-width / 2, -20, width, 50, 10);
    platform.lineStyle(3, info.color, 0.8);
    platform.strokeRoundedRect(-width / 2, -20, width, 50, 10);
    container.add(platform);
    
    // Device icon
    const icon = this.scene.add.text(0, -40, info.icon, {
      fontSize: '32px',
    });
    icon.setOrigin(0.5);
    container.add(icon);
    
    // Device label
    const label = this.scene.add.text(0, 40, info.label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#' + info.color.toString(16).padStart(6, '0'),
    });
    label.setOrigin(0.5);
    container.add(label);
    
    // Connection status
    const status = this.scene.add.text(0, 55, '⚡ NOT CONNECTED', {
      fontFamily: '"Courier New", monospace',
      fontSize: '8px',
      color: '#888888',
    });
    status.setOrigin(0.5);
    status.setName('status');
    container.add(status);
    
    const island: DeviceIsland = {
      id,
      type,
      x,
      y,
      width,
      container,
      isConnected: false,
    };
    
    this.islands.push(island);
    
    return island;
  }

  // ============================================================================
  // ID BRIDGE CREATION
  // ============================================================================

  /**
   * Create a Universal ID bridge between two islands
   */
  createBridge(
    fromIsland: DeviceIsland,
    toIsland: DeviceIsland
  ): IDBridge {
    const id = `bridge_${fromIsland.type}_to_${toIsland.type}`;
    
    const container = this.scene.add.container(
      (fromIsland.x + toIsland.x) / 2,
      (fromIsland.y + toIsland.y) / 2
    );
    container.setDepth(75);
    
    // Calculate bridge dimensions
    const dx = toIsland.x - fromIsland.x;
    const dy = toIsland.y - fromIsland.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Rainbow bridge visual
    this.drawRainbowBridge(
      container,
      -length / 2,
      0,
      length / 2,
      0,
      angle
    );
    
    // Bridge collectible (floating ID token)
    const token = this.scene.add.container(0, -30);
    
    const tokenBg = this.scene.add.graphics();
    tokenBg.fillStyle(0x00ff88, 0.8);
    tokenBg.fillCircle(0, 0, 20);
    tokenBg.lineStyle(2, 0xffffff, 1);
    tokenBg.strokeCircle(0, 0, 20);
    token.add(tokenBg);
    
    const tokenIcon = this.scene.add.text(0, 0, 'ID', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff',
    });
    tokenIcon.setOrigin(0.5);
    token.add(tokenIcon);
    
    container.add(token);
    
    // Floating animation
    this.scene.tweens.add({
      targets: token,
      y: -40,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Physics body for bridge walkway
    const bridgeBody = this.scene.physics.add.sprite(
      (fromIsland.x + toIsland.x) / 2,
      (fromIsland.y + toIsland.y) / 2 + 5,
      'tile-platform'
    );
    bridgeBody.setVisible(false);
    bridgeBody.setActive(false); // Inactive until collected
    bridgeBody.setImmovable(true);
    (bridgeBody.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    bridgeBody.setSize(length - 40, 20);
    bridgeBody.setAngle(angle * (180 / Math.PI));
    
    const bridge: IDBridge = {
      id,
      fromIsland,
      toIsland,
      container,
      body: bridgeBody,
      isActive: false,
      isCollected: false,
    };
    
    // Make token collectible
    const tokenZone = this.scene.add.zone(
      (fromIsland.x + toIsland.x) / 2,
      (fromIsland.y + toIsland.y) / 2 - 30,
      50,
      50
    );
    this.scene.physics.world.enable(tokenZone, Phaser.Physics.Arcade.STATIC_BODY);
    tokenZone.setData('bridgeId', id);
    
    this.bridges.push(bridge);
    
    return bridge;
  }

  /**
   * Draw rainbow bridge effect
   */
  private drawRainbowBridge(
    container: Phaser.GameObjects.Container,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    angle: number
  ): void {
    const rainbowColors = [
      0xff4444, 0xff8844, 0xffff44,
      0x44ff44, 0x4444ff, 0x8844ff
    ];
    
    const bridgeGraphics = this.scene.add.graphics();
    bridgeGraphics.setRotation(angle);
    
    // Length could be used for gradient effects
    // const length = Math.abs(x2 - x1);
    
    // Draw multiple colored bands
    rainbowColors.forEach((color, index) => {
      const yOffset = (index - 2.5) * 3;
      
      bridgeGraphics.lineStyle(4, color, 0.6);
      bridgeGraphics.beginPath();
      
      // Curved bridge path
      for (let t = 0; t <= 1; t += 0.02) {
        const px = x1 + (x2 - x1) * t;
        const curve = Math.sin(t * Math.PI) * 15; // Arc
        const py = y1 + yOffset - curve;
        
        if (t === 0) {
          bridgeGraphics.moveTo(px, py);
        } else {
          bridgeGraphics.lineTo(px, py);
        }
      }
      
      bridgeGraphics.strokePath();
    });
    
    // Glow effect
    bridgeGraphics.lineStyle(2, 0xffffff, 0.3);
    bridgeGraphics.lineBetween(x1, y1 - 20, x2, y2 - 20);
    
    container.add(bridgeGraphics);
    
    // Sparkle particles along bridge
    if (this.scene.textures.exists('particle-glow')) {
      const emitter = this.scene.add.particles(0, 0, 'particle-glow', {
        x: { min: x1, max: x2 },
        y: { min: y1 - 20, max: y1 },
        lifespan: 1500,
        speed: { min: 10, max: 30 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.6, end: 0 },
        frequency: 100,
        tint: rainbowColors,
        blendMode: 'ADD',
      });
      container.add(emitter);
    }
  }

  /**
   * Collect a Universal ID bridge
   */
  collectBridge(bridge: IDBridge): void {
    if (bridge.isCollected) return;
    
    bridge.isCollected = true;
    bridge.isActive = true;
    
    // Activate bridge body
    if (bridge.body) {
      bridge.body.setActive(true);
    }
    
    // Connect both islands
    bridge.fromIsland.isConnected = true;
    bridge.toIsland.isConnected = true;
    
    // Update island status displays
    this.updateIslandStatus(bridge.fromIsland);
    this.updateIslandStatus(bridge.toIsland);
    
    // Store collected ID
    this.collectedIDs.push(bridge.id);
    
    // Visual feedback
    this.scene.tweens.add({
      targets: bridge.container,
      alpha: 1,
      duration: 300,
    });
    
    // Remove token from display
    const token = bridge.container.getAt(1);
    if (token) {
      this.scene.tweens.add({
        targets: token,
        scale: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => (token as Phaser.GameObjects.Container).setVisible(false),
      });
    }
    
    this.emit('bridge-collected', { bridge });
    console.log('[UniversalID] Bridge collected:', bridge.id);
  }

  /**
   * Update island connection status display
   */
  private updateIslandStatus(island: DeviceIsland): void {
    const status = island.container.getByName('status') as Phaser.GameObjects.Text;
    if (status) {
      status.setText('✅ CONNECTED');
      status.setColor('#00ff88');
    }
  }

  // ============================================================================
  // IDENTITY GRAPH VISUALIZATION
  // ============================================================================

  /**
   * Create identity graph UI showing connections
   */
  createIdentityGraph(x: number, y: number): Phaser.GameObjects.Container {
    this.identityGraph = this.scene.add.container(x, y);
    this.identityGraph.setDepth(800);
    this.identityGraph.setScrollFactor(0);
    
    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-100, -80, 200, 160, 8);
    bg.lineStyle(2, 0x00ff88, 0.5);
    bg.strokeRoundedRect(-100, -80, 200, 160, 8);
    this.identityGraph.add(bg);
    
    // Header
    const header = this.scene.add.text(0, -65, '🔗 IDENTITY GRAPH', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#00ff88',
    });
    header.setOrigin(0.5);
    this.identityGraph.add(header);
    
    // Device nodes
    const nodePositions = [
      { type: 'mobile', x: -50, y: -20 },
      { type: 'desktop', x: 50, y: -20 },
      { type: 'tablet', x: -50, y: 40 },
      { type: 'ctv', x: 50, y: 40 },
    ];
    
    nodePositions.forEach(pos => {
      const node = this.scene.add.container(pos.x, pos.y);
      
      const nodeBg = this.scene.add.graphics();
      nodeBg.fillStyle(0x333344, 1);
      nodeBg.fillCircle(0, 0, 15);
      node.add(nodeBg);
      
      const icon = this.scene.add.text(0, 0, 
        pos.type === 'mobile' ? '📱' :
        pos.type === 'desktop' ? '🖥️' :
        pos.type === 'tablet' ? '📟' : '📺',
        { fontSize: '12px' }
      );
      icon.setOrigin(0.5);
      node.add(icon);
      
      this.identityGraph.add(node);
    });
    
    return this.identityGraph;
  }

  /**
   * Update identity graph to show connections
   */
  updateIdentityGraph(): void {
    if (!this.identityGraph) return;
    
    // Draw lines between connected nodes
    const connectionLines = this.scene.add.graphics();
    connectionLines.lineStyle(2, 0x00ff88, 0.6);
    
    this.bridges.filter(b => b.isActive).forEach(bridge => {
      // Draw line in the graph (simplified positions)
      const fromPos = this.getGraphNodePosition(bridge.fromIsland.type);
      const toPos = this.getGraphNodePosition(bridge.toIsland.type);
      
      if (fromPos && toPos) {
        connectionLines.lineBetween(fromPos.x, fromPos.y, toPos.x, toPos.y);
      }
    });
    
    // Add to graph container at position 1 (after background)
    if (this.identityGraph.getAt(1) instanceof Phaser.GameObjects.Graphics) {
      (this.identityGraph.getAt(1) as Phaser.GameObjects.Graphics).destroy();
    }
    this.identityGraph.addAt(connectionLines, 1);
  }

  /**
   * Get graph node position for device type
   */
  private getGraphNodePosition(type: DeviceType): { x: number; y: number } | null {
    const positions: Record<DeviceType, { x: number; y: number }> = {
      mobile: { x: -50, y: -20 },
      desktop: { x: 50, y: -20 },
      tablet: { x: -50, y: 40 },
      ctv: { x: 50, y: 40 },
    };
    return positions[type] || null;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Get all collected Universal IDs
   */
  getCollectedIDs(): string[] {
    return [...this.collectedIDs];
  }

  /**
   * Check if a bridge is collected
   */
  isBridgeCollected(bridgeId: string): boolean {
    return this.collectedIDs.includes(bridgeId);
  }

  /**
   * Get all islands
   */
  getIslands(): DeviceIsland[] {
    return [...this.islands];
  }

  /**
   * Get all bridges
   */
  getBridges(): IDBridge[] {
    return [...this.bridges];
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.islands.forEach(i => i.container.destroy());
    this.bridges.forEach(b => {
      b.container.destroy();
      if (b.body) b.body.destroy();
    });
    this.bridgeGraphics.destroy();
    if (this.identityGraph) this.identityGraph.destroy();
  }
}
