/**
 * BaseAdTechScene - Abstract Base Scene for AdTech Game
 * 
 * Provides common functionality for all game scenes:
 * - Budget management system
 * - Viewability tracking engine
 * - Attribution tracking
 * - Debug mode toggling
 * - Common UI event handling
 */

import Phaser from 'phaser';
import { BudgetManager } from '../components/BudgetManager';
import { ViewabilityEngine } from '../components/ViewabilityEngine';
import { AttributionTracker } from '../components/AttributionTracker';
import { gameState } from '../main';
import type { PricingModel } from '../types/adtech';

/**
 * BaseAdTechScene
 * Abstract base class for all game scenes
 */
export abstract class BaseAdTechScene extends Phaser.Scene {
  // AdTech Systems
  protected budgetSystem!: BudgetManager;
  protected viewabilityTracker!: ViewabilityEngine;
  protected attributionModel!: AttributionTracker;
  
  // Debug mode
  protected isDebugMode: boolean = false;
  
  // Input keys
  protected debugKey!: Phaser.Input.Keyboard.Key;
  
  // UI reference
  protected uiLayer: HTMLElement | null = null;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
  }

  // ============================================================================
  // LIFECYCLE METHODS
  // ============================================================================

  /**
   * Initialize common systems
   */
  init(_data?: unknown): void {
    console.log(`[${this.scene.key}] Initializing...`);
    
    // Get UI layer reference
    this.uiLayer = document.getElementById('ui-layer');
    
    // Initialize debug mode from saved settings
    this.isDebugMode = gameState.settings.showDebug;
  }

  /**
   * Create common systems and setup
   */
  create(): void {
    // Initialize AdTech systems
    this.budgetSystem = new BudgetManager(this, {
      totalBudget: 1000,
      pricingModel: 'CPM',
    });
    
    this.viewabilityTracker = new ViewabilityEngine(this);
    this.attributionModel = new AttributionTracker(this);
    
    // Set up debug key (F1)
    if (this.input.keyboard) {
      this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
      this.debugKey.on('down', this.toggleDebugMode, this);
    }
    
    // Apply initial debug mode
    if (this.isDebugMode) {
      this.enableDebugMode();
    }
    
    // Wire up AdTech system events
    this.setupAdTechEvents();
    
    // Call abstract setup method for scene-specific mechanics
    this.setupAdTechMechanics();
  }

  /**
   * Abstract method - implement scene-specific AdTech mechanics
   */
  protected abstract setupAdTechMechanics(): void;

  /**
   * Set up event listeners between AdTech systems
   */
  private setupAdTechEvents(): void {
    // Budget events
    this.budgetSystem.on('budget-depleted', () => {
      this.onBudgetDepleted();
    });
    
    this.budgetSystem.on('budget-low', (data: { remaining: number; percent: number }) => {
      this.onBudgetLow(data.percent);
    });
    
    this.budgetSystem.on('impression-batch', (data: { count: number; total: number }) => {
      this.onImpressionBatch(data.count, data.total);
    });
    
    // Viewability events
    this.viewabilityTracker.on('viewable-impression', (data: any) => {
      this.onViewableImpression(data);
    });
    
    // Listen for global debug toggle
    gameState.on('debug-toggled', (enabled: boolean) => {
      if (enabled !== this.isDebugMode) {
        this.toggleDebugMode();
      }
    });
  }

  // ============================================================================
  // DEBUG MODE
  // ============================================================================

  /**
   * Toggle debug mode
   */
  protected toggleDebugMode(): void {
    this.isDebugMode = !this.isDebugMode;
    
    if (this.isDebugMode) {
      this.enableDebugMode();
    } else {
      this.disableDebugMode();
    }
    
    gameState.updateSettings({ showDebug: this.isDebugMode });
    console.log(`[${this.scene.key}] Debug mode: ${this.isDebugMode ? 'ON' : 'OFF'}`);
  }

  /**
   * Enable debug mode visuals
   */
  protected enableDebugMode(): void {
    // Enable physics debug
    this.physics.world.drawDebug = true;
    
    // Enable viewability debug
    this.viewabilityTracker.enableDebug();
    
    // Show debug panel
    const debugPanel = document.querySelector('.debug-panel');
    if (debugPanel) {
      debugPanel.classList.add('visible');
    }
  }

  /**
   * Disable debug mode visuals
   */
  protected disableDebugMode(): void {
    // Disable physics debug
    this.physics.world.drawDebug = false;
    this.physics.world.debugGraphic?.clear();
    
    // Disable viewability debug
    this.viewabilityTracker.disableDebug();
    
    // Hide debug panel
    const debugPanel = document.querySelector('.debug-panel');
    if (debugPanel) {
      debugPanel.classList.remove('visible');
    }
  }

  // ============================================================================
  // BUDGET HELPERS
  // ============================================================================

  /**
   * Get current pricing model
   */
  protected getPricingModel(): PricingModel {
    return this.budgetSystem.getPricingModel();
  }

  /**
   * Set pricing model
   */
  protected setPricingModel(model: PricingModel): void {
    this.budgetSystem.setPricingModel(model);
    this.onPricingModelChanged(model);
  }

  // ============================================================================
  // EVENT HANDLERS (Override in subclasses)
  // ============================================================================

  /**
   * Called when budget is depleted
   */
  protected onBudgetDepleted(): void {
    console.log(`[${this.scene.key}] Budget depleted!`);
    // Override in subclass for game-over logic
  }

  /**
   * Called when budget is low (< 25%)
   */
  protected onBudgetLow(percentRemaining: number): void {
    console.log(`[${this.scene.key}] Budget low: ${percentRemaining.toFixed(1)}% remaining`);
  }

  /**
   * Called when impression batch is registered
   */
  protected onImpressionBatch(_count: number, _total: number): void {
    // Override for impression-related feedback
  }

  /**
   * Called when a viewable impression is registered
   */
  protected onViewableImpression(_data: unknown): void {
    // Override for viewability-related feedback
  }

  /**
   * Called when pricing model changes
   */
  protected onPricingModelChanged(model: PricingModel): void {
    console.log(`[${this.scene.key}] Pricing model changed to: ${model}`);
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  /**
   * Update HUD with current budget state
   */
  protected updateHUD(): void {
    // Override in subclass to update scene-specific HUD
  }

  /**
   * Show educational tooltip
   */
  protected showTooltip(title: string, content: string): void {
    // Will be implemented with tooltip system
    console.log(`[Tooltip] ${title}: ${content}`);
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Clean up scene resources
   */
  shutdown(): void {
    console.log(`[${this.scene.key}] Shutting down...`);
    
    // Clean up AdTech systems
    this.budgetSystem?.destroy();
    this.viewabilityTracker?.destroy();
    this.attributionModel?.destroy();
    
    // Remove debug key listener
    if (this.debugKey) {
      this.debugKey.off('down', this.toggleDebugMode, this);
    }
  }
}
