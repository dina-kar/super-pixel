/**
 * BudgetManager - AdTech Budget & Pricing System
 * 
 * Handles the core monetization mechanics of the game:
 * - CPM (Cost Per Mille): Cost per 1000 impressions (distance traveled)
 * - CPC (Cost Per Click): Cost per action button press
 * - CPA (Cost Per Acquisition): Cost per conversion (level completion)
 * 
 * This component teaches players how advertising pricing models work
 * by making them directly affect gameplay resources.
 */

import Phaser from 'phaser';
import type { BudgetConfig, BudgetState, GameEvent, PricingModel } from '../types/adtech';

/**
 * Default CPM/CPC/CPA rates (in cents for precision)
 */
const DEFAULT_RATES = {
  CPM: 2.50,  // $2.50 per 1000 impressions
  CPC: 0.50,  // $0.50 per click
  CPA: 10.00, // $10.00 per conversion
};

/**
 * BudgetManager
 * Extends Phaser.Events.EventEmitter for loose coupling with game systems
 */
export class BudgetManager extends Phaser.Events.EventEmitter {
  // Scene reference for potential future use
  private config: BudgetConfig;
  private state: BudgetState;
  private rates: Record<PricingModel, number>;
  
  // Impression tracking
  private distanceTraveled: number = 0;
  private impressionThreshold: number = 1000; // pixels per impression batch

  constructor(_scene: Phaser.Scene, config: Partial<BudgetConfig> = {}) {
    super();
    
    this.config = {
      totalBudget: config.totalBudget ?? 1000,
      pricingModel: config.pricingModel ?? 'CPM',
      currentSpend: config.currentSpend ?? 0,
    };
    
    this.state = {
      remaining: this.config.totalBudget,
      spent: 0,
      roas: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };
    
    this.rates = { ...DEFAULT_RATES };
    
    console.log(`[BudgetManager] Initialized with $${this.config.totalBudget} budget, ${this.config.pricingModel} model`);
  }

  // ============================================================================
  // PRICING MODEL MANAGEMENT
  // ============================================================================

  /**
   * Get current pricing model
   */
  getPricingModel(): PricingModel {
    return this.config.pricingModel;
  }

  /**
   * Switch pricing model (affects how costs are calculated)
   */
  setPricingModel(model: PricingModel): void {
    const oldModel = this.config.pricingModel;
    this.config.pricingModel = model;
    this.emit('pricing-model-changed', { from: oldModel, to: model });
    console.log(`[BudgetManager] Switched from ${oldModel} to ${model}`);
  }

  /**
   * Set custom rates for pricing models
   */
  setRates(rates: Partial<Record<PricingModel, number>>): void {
    this.rates = { ...this.rates, ...rates };
  }

  // ============================================================================
  // SPEND CALCULATION
  // ============================================================================

  /**
   * Calculate and apply spend based on game event
   */
  calculateSpend(event: GameEvent): number {
    let cost = 0;
    
    switch (event.type) {
      case 'impression':
        // Only charge for impressions in CPM mode
        if (this.config.pricingModel === 'CPM') {
          cost = (this.rates.CPM / 1000) * event.value;
        }
        this.state.impressions += event.value;
        break;
        
      case 'click':
        // Only charge for clicks in CPC mode
        if (this.config.pricingModel === 'CPC') {
          cost = this.rates.CPC * event.value;
        }
        this.state.clicks += event.value;
        break;
        
      case 'conversion':
        // Only charge for conversions in CPA mode
        if (this.config.pricingModel === 'CPA') {
          cost = this.rates.CPA * event.value;
        }
        this.state.conversions += event.value;
        break;
    }
    
    if (cost > 0) {
      this.deductBudget(cost);
    }
    
    return cost;
  }

  /**
   * Track distance for CPM calculations
   * Every 1000 pixels = 1 CPM unit (batch of impressions)
   */
  trackDistance(distance: number): void {
    this.distanceTraveled += Math.abs(distance);
    
    // Check if we've hit an impression threshold
    while (this.distanceTraveled >= this.impressionThreshold) {
      this.distanceTraveled -= this.impressionThreshold;
      
      // Register impressions (1000 impressions per CPM)
      this.calculateSpend({
        type: 'impression',
        timestamp: Date.now(),
        value: 1000,
      });
      
      this.emit('impression-batch', { count: 1000, total: this.state.impressions });
    }
  }

  /**
   * Register a click event (action button press, enemy defeat)
   */
  registerClick(): number {
    const event: GameEvent = {
      type: 'click',
      timestamp: Date.now(),
      value: 1,
    };
    
    const cost = this.calculateSpend(event);
    this.emit('click-registered', { cost, totalClicks: this.state.clicks });
    return cost;
  }

  /**
   * Register a conversion (level complete, goal reached)
   */
  registerConversion(): number {
    const event: GameEvent = {
      type: 'conversion',
      timestamp: Date.now(),
      value: 1,
    };
    
    const cost = this.calculateSpend(event);
    this.updateROAS();
    this.emit('conversion-registered', { cost, totalConversions: this.state.conversions });
    return cost;
  }

  // ============================================================================
  // BUDGET OPERATIONS
  // ============================================================================

  /**
   * Deduct from budget
   */
  private deductBudget(amount: number): boolean {
    if (this.state.remaining >= amount) {
      this.state.remaining -= amount;
      this.state.spent += amount;
      this.config.currentSpend = this.state.spent;
      
      this.emit('spend-updated', {
        spent: amount,
        remaining: this.state.remaining,
        total: this.state.spent,
      });
      
      // Check for low budget warning
      const percentRemaining = (this.state.remaining / this.config.totalBudget) * 100;
      if (percentRemaining <= 25 && percentRemaining > 0) {
        this.emit('budget-low', { remaining: this.state.remaining, percent: percentRemaining });
      }
      
      // Check for budget depletion
      if (this.state.remaining <= 0) {
        this.emit('budget-depleted', { totalSpent: this.state.spent });
      }
      
      return true;
    }
    
    this.emit('budget-insufficient', { requested: amount, available: this.state.remaining });
    return false;
  }

  /**
   * Add budget (bonus, reward)
   */
  addBudget(amount: number): void {
    this.state.remaining += amount;
    this.config.totalBudget += amount;
    this.emit('budget-added', { amount, newTotal: this.state.remaining });
  }

  // ============================================================================
  // METRICS
  // ============================================================================

  /**
   * Calculate Return on Ad Spend
   * ROAS = (Revenue from conversions) / (Ad spend)
   * For the game, each conversion is worth $50 in simulated revenue
   */
  private updateROAS(): void {
    const conversionValue = 50; // Simulated revenue per conversion
    const revenue = this.state.conversions * conversionValue;
    this.state.roas = this.state.spent > 0 ? revenue / this.state.spent : 0;
  }

  /**
   * Get current ROAS
   */
  getROAS(): number {
    return this.state.roas;
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    return this.state.remaining;
  }

  /**
   * Get total spent
   */
  getTotalSpent(): number {
    return this.state.spent;
  }

  /**
   * Get full budget state for UI display
   */
  getState(): Readonly<BudgetState> {
    return { ...this.state };
  }

  /**
   * Get budget percentage remaining
   */
  getBudgetPercent(): number {
    return (this.state.remaining / this.config.totalBudget) * 100;
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * Reset manager for new level
   */
  reset(config?: Partial<BudgetConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.state = {
      remaining: this.config.totalBudget,
      spent: 0,
      roas: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };
    
    this.distanceTraveled = 0;
    this.emit('budget-reset', this.state);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    console.log('[BudgetManager] Destroyed');
  }
}
