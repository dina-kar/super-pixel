/**
 * AdServerGate - Checkpoint System
 * 
 * Represents First-Party vs Third-Party ad servers:
 * - Visual: Server rack gateway with data pipes
 * - Logic: Validates collected impressions before allowing progress
 * - Educational: Teaches about ad serving infrastructure
 */

import Phaser from 'phaser';

type ServerType = 'first-party' | 'third-party';

interface GateConfig {
  requiredImpressions: number;
  serverType: ServerType;
  width?: number;
  height?: number;
}

export class AdServerGate extends Phaser.GameObjects.Container {
  // Gate state
  private serverType: ServerType;
  private requiredImpressions: number;
  private isOpen: boolean = false;
  private isValidating: boolean = false;
  
  // Visual components
  private gateBody!: Phaser.GameObjects.Graphics;
  private serverRacks!: Phaser.GameObjects.Graphics;
  private dataPipes!: Phaser.GameObjects.Graphics[];
  private statusLights!: Phaser.GameObjects.Graphics[];
  private barrierBody!: Phaser.Physics.Arcade.Body;
  private barrier!: Phaser.GameObjects.Rectangle;
  private progressBar!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private serverLabel!: Phaser.GameObjects.Text;
  
  // Animation state
  private dataFlowOffset: number = 0;
  private pulsePhase: number = 0;
  
  // Dimensions
  private gateWidth: number;
  private gateHeight: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: GateConfig
  ) {
    super(scene, x, y);
    
    this.serverType = config.serverType;
    this.requiredImpressions = config.requiredImpressions;
    this.gateWidth = config.width || 80;
    this.gateHeight = config.height || 200;
    
    // Add to scene
    scene.add.existing(this);
    
    // Create visual components
    this.createGateStructure();
    this.createServerRacks();
    this.createDataPipes();
    this.createStatusLights();
    this.createBarrier();
    this.createUI();
    
    // Start animations
    this.startAnimations();
    
    // Set depth
    this.setDepth(10);
    
    this.setData('type', 'ad-server-gate');
    this.setData('serverType', this.serverType);
  }

  /**
   * Create the main gate structure
   */
  private createGateStructure(): void {
    this.gateBody = this.scene.add.graphics();
    
    // Main frame
    const frameColor = this.serverType === 'first-party' ? 0x00aa66 : 0x6644aa;
    const frameColorDark = this.serverType === 'first-party' ? 0x005533 : 0x331166;
    
    // Outer frame
    this.gateBody.fillStyle(frameColorDark, 1);
    this.gateBody.fillRect(-this.gateWidth / 2 - 10, -this.gateHeight, this.gateWidth + 20, this.gateHeight);
    
    // Inner panel
    this.gateBody.fillStyle(0x0a0a1e, 0.95);
    this.gateBody.fillRect(-this.gateWidth / 2, -this.gateHeight + 10, this.gateWidth, this.gateHeight - 20);
    
    // Top arch
    this.gateBody.fillStyle(frameColor, 1);
    this.gateBody.fillRect(-this.gateWidth / 2 - 15, -this.gateHeight - 20, this.gateWidth + 30, 25);
    
    // Border glow
    this.gateBody.lineStyle(2, frameColor, 0.8);
    this.gateBody.strokeRect(-this.gateWidth / 2 - 10, -this.gateHeight, this.gateWidth + 20, this.gateHeight);
    
    this.add(this.gateBody);
  }

  /**
   * Create server rack visuals
   */
  private createServerRacks(): void {
    this.serverRacks = this.scene.add.graphics();
    
    const rackColor = this.serverType === 'first-party' ? 0x00ff88 : 0x9966ff;
    const rackCount = 4;
    const rackHeight = 30;
    const startY = -this.gateHeight + 40;
    
    for (let i = 0; i < rackCount; i++) {
      const y = startY + i * (rackHeight + 10);
      
      // Rack body
      this.serverRacks.fillStyle(0x1a1a2e, 1);
      this.serverRacks.fillRect(-this.gateWidth / 2 + 10, y, this.gateWidth - 20, rackHeight);
      
      // Rack front panel
      this.serverRacks.fillStyle(0x2a2a4e, 1);
      this.serverRacks.fillRect(-this.gateWidth / 2 + 12, y + 2, this.gateWidth - 24, rackHeight - 4);
      
      // LED indicators
      for (let j = 0; j < 3; j++) {
        const ledX = -this.gateWidth / 2 + 18 + j * 12;
        this.serverRacks.fillStyle(rackColor, 0.6);
        this.serverRacks.fillCircle(ledX, y + rackHeight / 2, 3);
      }
      
      // Vent slits
      this.serverRacks.lineStyle(1, 0x333344, 0.5);
      for (let k = 0; k < 5; k++) {
        const slitX = 10 + k * 8;
        this.serverRacks.lineBetween(slitX, y + 6, slitX, y + rackHeight - 6);
      }
    }
    
    this.add(this.serverRacks);
  }

  /**
   * Create animated data pipe visuals
   */
  private createDataPipes(): void {
    this.dataPipes = [];
    const pipeColor = this.serverType === 'first-party' ? 0x00ff88 : 0x9966ff;
    
    // Left pipes
    const leftPipe = this.scene.add.graphics();
    leftPipe.lineStyle(4, 0x1a1a3e, 1);
    leftPipe.lineBetween(-this.gateWidth / 2 - 30, -this.gateHeight / 2, -this.gateWidth / 2 - 10, -this.gateHeight / 2);
    leftPipe.lineBetween(-this.gateWidth / 2 - 30, -this.gateHeight / 2, -this.gateWidth / 2 - 30, -20);
    
    // Data flow overlay (will be animated)
    leftPipe.lineStyle(2, pipeColor, 0.5);
    leftPipe.lineBetween(-this.gateWidth / 2 - 30, -this.gateHeight / 2, -this.gateWidth / 2 - 10, -this.gateHeight / 2);
    
    this.add(leftPipe);
    this.dataPipes.push(leftPipe);
    
    // Right pipes
    const rightPipe = this.scene.add.graphics();
    rightPipe.lineStyle(4, 0x1a1a3e, 1);
    rightPipe.lineBetween(this.gateWidth / 2 + 10, -this.gateHeight / 2, this.gateWidth / 2 + 30, -this.gateHeight / 2);
    rightPipe.lineBetween(this.gateWidth / 2 + 30, -this.gateHeight / 2, this.gateWidth / 2 + 30, -20);
    
    rightPipe.lineStyle(2, pipeColor, 0.5);
    rightPipe.lineBetween(this.gateWidth / 2 + 10, -this.gateHeight / 2, this.gateWidth / 2 + 30, -this.gateHeight / 2);
    
    this.add(rightPipe);
    this.dataPipes.push(rightPipe);
  }

  /**
   * Create status indicator lights
   */
  private createStatusLights(): void {
    this.statusLights = [];
    const lightY = -this.gateHeight - 10;
    const colors = [0xff4444, 0xffaa00, 0x00ff88]; // Red, Yellow, Green
    
    for (let i = 0; i < 3; i++) {
      const light = this.scene.add.graphics();
      const lightX = -20 + i * 20;
      
      // Light housing
      light.fillStyle(0x1a1a2e, 1);
      light.fillCircle(lightX, lightY, 8);
      
      // Light glow (initially red)
      light.fillStyle(i === 0 ? colors[0] : 0x333333, i === 0 ? 1 : 0.3);
      light.fillCircle(lightX, lightY, 5);
      
      this.add(light);
      this.statusLights.push(light);
    }
  }

  /**
   * Create the physical barrier (collision body)
   */
  private createBarrier(): void {
    // Create invisible barrier for physics
    this.barrier = this.scene.add.rectangle(
      0,
      -this.gateHeight / 2,
      this.gateWidth - 20,
      this.gateHeight,
      0xff0000,
      0 // Invisible
    );
    
    this.scene.physics.add.existing(this.barrier, true);
    this.barrierBody = this.barrier.body as Phaser.Physics.Arcade.Body;
    
    this.add(this.barrier);
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    const labelColor = this.serverType === 'first-party' ? '#00ff88' : '#9966ff';
    const serverName = this.serverType === 'first-party' ? '1ST PARTY' : '3RD PARTY';
    
    // Server type label
    this.serverLabel = this.scene.add.text(0, -this.gateHeight - 35, serverName, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: labelColor,
    });
    this.serverLabel.setOrigin(0.5);
    this.add(this.serverLabel);
    
    // Progress bar background
    this.progressBar = this.scene.add.graphics();
    this.updateProgressBar(0);
    this.add(this.progressBar);
    
    // Status text
    this.statusText = this.scene.add.text(0, -30, '0%', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    this.statusText.setOrigin(0.5);
    this.add(this.statusText);
  }

  /**
   * Update the progress bar
   */
  private updateProgressBar(progress: number): void {
    this.progressBar.clear();
    
    const barWidth = this.gateWidth - 30;
    const barHeight = 8;
    const barY = -50;
    
    // Background
    this.progressBar.fillStyle(0x1a1a2e, 1);
    this.progressBar.fillRect(-barWidth / 2, barY, barWidth, barHeight);
    
    // Progress fill
    const fillColor = this.serverType === 'first-party' ? 0x00ff88 : 0x9966ff;
    const fillWidth = barWidth * Math.min(progress, 1);
    this.progressBar.fillStyle(fillColor, 1);
    this.progressBar.fillRect(-barWidth / 2, barY, fillWidth, barHeight);
    
    // Border
    this.progressBar.lineStyle(1, 0x444466, 1);
    this.progressBar.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
  }

  /**
   * Start idle animations
   */
  private startAnimations(): void {
    // Pulse animation for server label
    this.scene.tweens.add({
      targets: this.serverLabel,
      alpha: { from: 0.7, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Update loop
   */
  preUpdate(_time: number, delta: number): void {
    // Data flow animation
    this.dataFlowOffset += delta * 0.1;
    this.pulsePhase += delta * 0.003;
    
    // Update status lights pulse
    if (!this.isOpen) {
      const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
      this.statusLights[0]?.setAlpha(pulse);
    }
  }

  /**
   * Validate impressions and potentially open gate
   */
  validate(currentImpressions: number): boolean {
    if (this.isOpen) return true;
    
    const progress = currentImpressions / this.requiredImpressions;
    this.updateProgressBar(progress);
    this.statusText.setText(`${Math.floor(progress * 100)}%`);
    
    // Update status lights based on progress
    if (progress >= 0.33) {
      this.updateLight(1, 0xffaa00, true);
    }
    if (progress >= 0.66) {
      this.updateLight(2, 0xffff00, true);
    }
    
    if (currentImpressions >= this.requiredImpressions) {
      this.openGate();
      return true;
    }
    
    return false;
  }

  /**
   * Update a status light
   */
  private updateLight(index: number, color: number, active: boolean): void {
    const light = this.statusLights[index];
    if (!light) return;
    
    light.clear();
    
    const lightX = -20 + index * 20;
    const lightY = -this.gateHeight - 10;
    
    light.fillStyle(0x1a1a2e, 1);
    light.fillCircle(lightX, lightY, 8);
    
    light.fillStyle(color, active ? 1 : 0.3);
    light.fillCircle(lightX, lightY, 5);
    
    if (active) {
      // Glow effect
      light.fillStyle(color, 0.2);
      light.fillCircle(lightX, lightY, 10);
    }
  }

  /**
   * Open the gate with animation
   */
  private openGate(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    
    console.log('[AdServerGate] Gate opening!');
    
    // Update all lights to green
    this.updateLight(0, 0x00ff88, true);
    this.updateLight(1, 0x00ff88, true);
    this.updateLight(2, 0x00ff88, true);
    
    // Update status text
    this.statusText.setText('ACCESS GRANTED');
    this.statusText.setColor('#00ff88');
    
    // Flash effect
    this.scene.cameras.main.flash(200, 0, 255, 136, false);
    
    // Open animation - slide barrier up
    this.scene.tweens.add({
      targets: this.barrier,
      y: -this.gateHeight - 50,
      duration: 500,
      ease: 'Power2',
    });
    
    // Disable collision
    this.barrierBody.enable = false;
    
    // Success particles
    this.createSuccessParticles();
    
    // Emit event
    this.emit('gate-opened', { serverType: this.serverType });
  }

  /**
   * Create success particle effect
   */
  private createSuccessParticles(): void {
    const color = this.serverType === 'first-party' ? 0x00ff88 : 0x9966ff;
    
    // Create particle texture if not exists
    if (!this.scene.textures.exists('gate-particle')) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRect(0, 0, 4, 4);
      graphics.generateTexture('gate-particle', 4, 4);
      graphics.destroy();
    }
    
    const emitter = this.scene.add.particles(this.x, this.y - this.gateHeight / 2, 'gate-particle', {
      speed: { min: 100, max: 200 },
      lifespan: 800,
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      blendMode: 'ADD',
      emitting: false,
    });
    
    emitter.explode(30);
    
    // Clean up after animation
    this.scene.time.delayedCall(1000, () => {
      emitter.destroy();
    });
  }

  /**
   * Deny access with animation
   */
  denyAccess(): void {
    if (this.isValidating) return;
    this.isValidating = true;
    
    // Shake effect
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 5, to: this.x + 5 },
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.isValidating = false;
      },
    });
    
    // Flash red
    this.statusText.setText('ACCESS DENIED');
    this.statusText.setColor('#ff4444');
    
    this.scene.time.delayedCall(1000, () => {
      if (!this.isOpen) {
        this.statusText.setColor('#ffffff');
      }
    });
    
    // Emit event
    this.emit('access-denied', { 
      serverType: this.serverType,
      required: this.requiredImpressions,
    });
  }

  /**
   * Get the barrier for collision detection
   */
  getBarrier(): Phaser.GameObjects.Rectangle {
    return this.barrier;
  }

  /**
   * Check if gate is open
   */
  getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Get required impressions
   */
  getRequiredImpressions(): number {
    return this.requiredImpressions;
  }

  /**
   * Get server type
   */
  getServerType(): ServerType {
    return this.serverType;
  }

  /**
   * Clean up
   */
  destroy(fromScene?: boolean): void {
    this.gateBody?.destroy();
    this.serverRacks?.destroy();
    this.dataPipes?.forEach(p => p.destroy());
    this.statusLights?.forEach(l => l.destroy());
    this.progressBar?.destroy();
    this.statusText?.destroy();
    this.serverLabel?.destroy();
    this.barrier?.destroy();
    
    super.destroy(fromScene);
  }
}
