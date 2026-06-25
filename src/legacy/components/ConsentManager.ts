/**
 * ConsentManager - GDPR/CCPA Consent Management Platform (CMP)
 * 
 * Implements consent management mechanics for privacy compliance:
 * - Purpose-based consent (TCF 2.0 style)
 * - Consent gates that block paths
 * - Impact of consent choices on gameplay
 * 
 * In-game, consent gates require player to toggle consent purposes
 * to proceed. Rejecting consent makes the level harder (less targeting data).
 */

import Phaser from 'phaser';
import type { ConsentState } from '../types/adtech';

/**
 * Consent purpose definition
 */
export interface ConsentPurpose {
  id: number;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  gameEffect: string;
}

/**
 * Consent gate (blocking element)
 */
export interface ConsentGate {
  id: string;
  x: number;
  y: number;
  container: Phaser.GameObjects.Container;
  zone: Phaser.GameObjects.Zone;
  requiredPurposes: number[];
  isOpen: boolean;
}

/**
 * ConsentManager Component
 * Manages consent collection and gate mechanics
 */
export class ConsentManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  
  // Consent purposes (TCF 2.0 simplified)
  private purposes: ConsentPurpose[] = [];
  
  // Consent state
  private consentState: ConsentState = {
    purpose1: false, // Store info
    purpose2: false, // Select ads
    purpose3: false, // Measure
  };
  
  // Consent gates in the level
  private gates: ConsentGate[] = [];
  
  // UI elements
  private consentUI!: Phaser.GameObjects.Container;
  private isUIVisible: boolean = false;
  private currentGate: ConsentGate | null = null;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    
    // Initialize purposes
    this.initializePurposes();
    
    console.log('[ConsentManager] Initialized');
  }

  // ============================================================================
  // PURPOSE DEFINITIONS
  // ============================================================================

  /**
   * Initialize consent purposes (simplified TCF 2.0)
   */
  private initializePurposes(): void {
    this.purposes = [
      {
        id: 1,
        name: 'Store Information',
        description: 'Store and access info on device',
        required: true, // Basic functionality
        enabled: false,
        gameEffect: 'Enables checkpoint saving',
      },
      {
        id: 2,
        name: 'Select Ads',
        description: 'Personalized ad selection',
        required: false,
        enabled: false,
        gameEffect: 'Enables targeting power-ups',
      },
      {
        id: 3,
        name: 'Measure Performance',
        description: 'Measure ad performance',
        required: false,
        enabled: false,
        gameEffect: 'Enables viewability tracking',
      },
      {
        id: 4,
        name: 'Develop & Improve',
        description: 'Develop and improve products',
        required: false,
        enabled: false,
        gameEffect: 'Enables analytics bonuses',
      },
      {
        id: 5,
        name: 'Create Profiles',
        description: 'Create personalized content profile',
        required: false,
        enabled: false,
        gameEffect: 'Unlocks user profile power-up',
      },
    ];
  }

  // ============================================================================
  // CONSENT GATES
  // ============================================================================

  /**
   * Create a consent gate that blocks a path
   */
  createConsentGate(
    x: number,
    y: number,
    height: number,
    requiredPurposes: number[]
  ): ConsentGate {
    const id = `gate_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const container = this.scene.add.container(x, y);
    container.setDepth(150);
    
    // Gate barrier graphics
    const barrier = this.scene.add.graphics();
    barrier.fillStyle(0x4444ff, 0.6);
    barrier.fillRect(-15, -height / 2, 30, height);
    barrier.lineStyle(3, 0x6666ff, 1);
    barrier.strokeRect(-15, -height / 2, 30, height);
    container.add(barrier);
    
    // Privacy shield icon
    const icon = this.scene.add.text(0, -height / 2 - 30, '🛡️', {
      fontSize: '32px',
    });
    icon.setOrigin(0.5);
    container.add(icon);
    
    // "Consent Required" label
    const label = this.scene.add.text(0, -height / 2 - 60, 'CONSENT REQUIRED', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#6666ff',
    });
    label.setOrigin(0.5);
    container.add(label);
    
    // Requirement list
    const reqText = requiredPurposes.map(pId => {
      const purpose = this.purposes.find(p => p.id === pId);
      return purpose ? `• ${purpose.name}` : '';
    }).join('\n');
    
    const reqLabel = this.scene.add.text(0, 0, reqText, {
      fontFamily: '"Courier New", monospace',
      fontSize: '8px',
      color: '#aaaaff',
      align: 'center',
      lineSpacing: 4,
    });
    reqLabel.setOrigin(0.5);
    container.add(reqLabel);
    
    // Physics zone (solid barrier)
    const zone = this.scene.add.zone(x, y, 30, height);
    this.scene.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('gateId', id);
    
    const gate: ConsentGate = {
      id,
      x,
      y,
      container,
      zone,
      requiredPurposes,
      isOpen: false,
    };
    
    this.gates.push(gate);
    
    return gate;
  }

  /**
   * Check if gate requirements are met
   */
  checkGateRequirements(gate: ConsentGate): boolean {
    return gate.requiredPurposes.every(pId => {
      const purpose = this.purposes.find(p => p.id === pId);
      return purpose?.enabled ?? false;
    });
  }

  /**
   * Open a consent gate
   */
  openGate(gate: ConsentGate): void {
    if (gate.isOpen) return;
    
    gate.isOpen = true;
    
    // Disable physics
    (gate.zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    
    // Animate opening
    this.scene.tweens.add({
      targets: gate.container,
      alpha: 0.3,
      scaleX: 0.1,
      duration: 500,
      ease: 'Power2',
    });
    
    this.emit('gate-opened', { gate });
    console.log('[ConsentManager] Gate opened:', gate.id);
  }

  // ============================================================================
  // CONSENT UI
  // ============================================================================

  /**
   * Create consent collection UI (TCF-style popup)
   */
  createConsentUI(): Phaser.GameObjects.Container {
    this.consentUI = this.scene.add.container(640, 360);
    this.consentUI.setDepth(2000);
    this.consentUI.setScrollFactor(0);
    this.consentUI.setVisible(false);
    
    // Background overlay
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(-640, -360, 1280, 720);
    this.consentUI.add(overlay);
    
    // Main panel
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.98);
    panel.fillRoundedRect(-280, -220, 560, 440, 12);
    panel.lineStyle(3, 0x4444ff, 1);
    panel.strokeRoundedRect(-280, -220, 560, 440, 12);
    this.consentUI.add(panel);
    
    // Header
    const header = this.scene.add.text(0, -200, '🛡️ PRIVACY CONSENT', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ffffff',
    });
    header.setOrigin(0.5);
    this.consentUI.add(header);
    
    // Subheader
    const subheader = this.scene.add.text(0, -170, 
      'We value your privacy. Choose what data you want to share:', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#888888',
      wordWrap: { width: 500 },
      align: 'center',
    });
    subheader.setOrigin(0.5);
    this.consentUI.add(subheader);
    
    // Purpose toggles
    this.purposes.forEach((purpose, index) => {
      const yPos = -110 + index * 55;
      this.createPurposeToggle(purpose, yPos);
    });
    
    // Buttons
    this.createConsentButtons();
    
    return this.consentUI;
  }

  /**
   * Create a purpose toggle row
   */
  private createPurposeToggle(purpose: ConsentPurpose, y: number): void {
    const row = this.scene.add.container(0, y);
    
    // Toggle box
    const toggleBg = this.scene.add.graphics();
    toggleBg.fillStyle(0x333344, 1);
    toggleBg.fillRoundedRect(-250, -20, 500, 45, 6);
    row.add(toggleBg);
    
    // Purpose name
    const name = this.scene.add.text(-230, -10, purpose.name, {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: purpose.required ? 'bold' : 'normal',
    });
    row.add(name);
    
    // Required badge
    if (purpose.required) {
      const badge = this.scene.add.text(-230, 8, '(Required)', {
        fontFamily: '"Courier New", monospace',
        fontSize: '8px',
        color: '#ff8800',
      });
      row.add(badge);
    }
    
    // Game effect hint
    const effect = this.scene.add.text(20, -5, purpose.gameEffect, {
      fontFamily: '"Courier New", monospace',
      fontSize: '9px',
      color: '#666688',
      wordWrap: { width: 180 },
    });
    row.add(effect);
    
    // Toggle switch
    const toggle = this.createToggleSwitch(210, 0, purpose);
    row.add(toggle);
    
    this.consentUI.add(row);
  }

  /**
   * Create toggle switch for purpose
   */
  private createToggleSwitch(
    x: number,
    y: number,
    purpose: ConsentPurpose
  ): Phaser.GameObjects.Container {
    const toggle = this.scene.add.container(x, y);
    
    // Track
    const track = this.scene.add.graphics();
    track.fillStyle(purpose.enabled ? 0x00ff88 : 0x444444, 1);
    track.fillRoundedRect(-20, -10, 40, 20, 10);
    toggle.add(track);
    
    // Thumb
    const thumb = this.scene.add.circle(
      purpose.enabled ? 10 : -10,
      0,
      8,
      0xffffff
    );
    toggle.add(thumb);
    
    // Make interactive
    toggle.setSize(50, 30);
    toggle.setInteractive({ useHandCursor: true });
    
    toggle.on('pointerdown', () => {
      if (purpose.required && !purpose.enabled) {
        // Required purposes can only be enabled
        purpose.enabled = true;
      } else if (!purpose.required) {
        purpose.enabled = !purpose.enabled;
      }
      
      // Update visual
      track.clear();
      track.fillStyle(purpose.enabled ? 0x00ff88 : 0x444444, 1);
      track.fillRoundedRect(-20, -10, 40, 20, 10);
      
      this.scene.tweens.add({
        targets: thumb,
        x: purpose.enabled ? 10 : -10,
        duration: 150,
        ease: 'Power2',
      });
      
      // Update consent state
      this.updateConsentState();
      
      this.emit('purpose-toggled', { purpose });
    });
    
    return toggle;
  }

  /**
   * Create Accept/Reject buttons
   */
  private createConsentButtons(): void {
    // Accept All button
    const acceptBtn = this.scene.add.container(-90, 170);
    
    const acceptBg = this.scene.add.graphics();
    acceptBg.fillStyle(0x00ff88, 1);
    acceptBg.fillRoundedRect(-70, -18, 140, 36, 6);
    acceptBtn.add(acceptBg);
    
    const acceptText = this.scene.add.text(0, 0, 'ACCEPT ALL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#000000',
    });
    acceptText.setOrigin(0.5);
    acceptBtn.add(acceptText);
    
    acceptBtn.setSize(140, 36);
    acceptBtn.setInteractive({ useHandCursor: true });
    acceptBtn.on('pointerdown', () => this.acceptAll());
    acceptBtn.on('pointerover', () => acceptBg.setAlpha(0.8));
    acceptBtn.on('pointerout', () => acceptBg.setAlpha(1));
    
    this.consentUI.add(acceptBtn);
    
    // Save Choices button
    const saveBtn = this.scene.add.container(90, 170);
    
    const saveBg = this.scene.add.graphics();
    saveBg.fillStyle(0x4444ff, 1);
    saveBg.fillRoundedRect(-70, -18, 140, 36, 6);
    saveBtn.add(saveBg);
    
    const saveText = this.scene.add.text(0, 0, 'SAVE CHOICES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff',
    });
    saveText.setOrigin(0.5);
    saveBtn.add(saveText);
    
    saveBtn.setSize(140, 36);
    saveBtn.setInteractive({ useHandCursor: true });
    saveBtn.on('pointerdown', () => this.saveChoices());
    saveBtn.on('pointerover', () => saveBg.setAlpha(0.8));
    saveBtn.on('pointerout', () => saveBg.setAlpha(1));
    
    this.consentUI.add(saveBtn);
  }

  /**
   * Update internal consent state
   */
  private updateConsentState(): void {
    this.consentState = {
      purpose1: this.purposes.find(p => p.id === 1)?.enabled ?? false,
      purpose2: this.purposes.find(p => p.id === 2)?.enabled ?? false,
      purpose3: this.purposes.find(p => p.id === 3)?.enabled ?? false,
    };
  }

  /**
   * Accept all purposes
   */
  private acceptAll(): void {
    this.purposes.forEach(p => p.enabled = true);
    this.updateConsentState();
    this.hideConsentUI();
    this.checkCurrentGate();
    
    this.emit('consent-accepted-all');
  }

  /**
   * Save current choices
   */
  private saveChoices(): void {
    this.updateConsentState();
    this.hideConsentUI();
    this.checkCurrentGate();
    
    this.emit('consent-saved', { state: this.consentState });
  }

  /**
   * Check if current gate should open
   */
  private checkCurrentGate(): void {
    if (this.currentGate && this.checkGateRequirements(this.currentGate)) {
      this.openGate(this.currentGate);
    }
  }

  // ============================================================================
  // UI VISIBILITY
  // ============================================================================

  /**
   * Show consent UI for a gate
   */
  showConsentUI(gate: ConsentGate): void {
    if (this.isUIVisible) return;
    
    this.currentGate = gate;
    this.isUIVisible = true;
    
    if (!this.consentUI) {
      this.createConsentUI();
    }
    
    this.consentUI.setVisible(true);
    this.consentUI.setAlpha(0);
    this.consentUI.setScale(0.9);
    
    this.scene.tweens.add({
      targets: this.consentUI,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
    
    this.emit('consent-ui-shown');
  }

  /**
   * Hide consent UI
   */
  hideConsentUI(): void {
    if (!this.isUIVisible) return;
    
    this.isUIVisible = false;
    
    this.scene.tweens.add({
      targets: this.consentUI,
      alpha: 0,
      scale: 0.9,
      duration: 150,
      onComplete: () => {
        this.consentUI.setVisible(false);
        this.currentGate = null;
      },
    });
    
    this.emit('consent-ui-hidden');
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Get consent state
   */
  getConsentState(): ConsentState {
    return { ...this.consentState };
  }

  /**
   * Check if a specific purpose is enabled
   */
  isPurposeEnabled(purposeId: number): boolean {
    return this.purposes.find(p => p.id === purposeId)?.enabled ?? false;
  }

  /**
   * Get all gates
   */
  getGates(): ConsentGate[] {
    return [...this.gates];
  }

  /**
   * Check if UI is visible
   */
  isVisible(): boolean {
    return this.isUIVisible;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.gates.forEach(g => {
      g.container.destroy();
      g.zone.destroy();
    });
    if (this.consentUI) this.consentUI.destroy();
  }
}
