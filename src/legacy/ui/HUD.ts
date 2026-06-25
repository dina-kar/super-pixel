/**
 * HUD - Heads-Up Display Component
 * 
 * HTML/CSS overlay for displaying:
 * - Budget remaining (progress bar)
 * - Current pricing model toggle (CPM/CPC/CPA)
 * - Viewability percentage (live)
 * - Impression counter
 * - Current format indicator
 */

import Phaser from 'phaser';
import { BudgetManager } from '../components/BudgetManager';
import { ViewabilityEngine } from '../components/ViewabilityEngine';
import type { PricingModel } from '../types/adtech';

/**
 * World info for HUD display
 */
interface WorldInfo {
  worldNumber: number;
  worldName: string;
  color: string;
}

/**
 * HUD Class
 * Creates and manages the HTML overlay for game UI
 */
export class HUD {
  private scene: Phaser.Scene;
  private budgetManager: BudgetManager;
  private viewabilityEngine: ViewabilityEngine;
  private worldInfo: WorldInfo;
  
  // DOM Elements
  private container: HTMLElement | null = null;
  private budgetValueEl: HTMLElement | null = null;
  private budgetFillEl: HTMLElement | null = null;
  private impressionsEl: HTMLElement | null = null;
  private viewabilityEl: HTMLElement | null = null;
  private pricingButtons: Map<PricingModel, HTMLElement> = new Map();
  private debugPanel: HTMLElement | null = null;

  constructor(
    scene: Phaser.Scene,
    budgetManager: BudgetManager,
    viewabilityEngine: ViewabilityEngine,
    worldInfo?: WorldInfo
  ) {
    this.scene = scene;
    this.budgetManager = budgetManager;
    this.viewabilityEngine = viewabilityEngine;
    this.worldInfo = worldInfo || { worldNumber: 1, worldName: 'Inventory Valley', color: '#00ff88' };
    
    this.createHUD();
    this.setupEventListeners();
    
    console.log('[HUD] Created for', this.worldInfo.worldName);
  }

  /**
   * Create the HUD HTML structure
   */
  private createHUD(): void {
    const uiLayer = document.getElementById('ui-layer');
    if (!uiLayer) {
      console.error('[HUD] UI layer not found');
      return;
    }
    
    // Clear existing HUD
    uiLayer.innerHTML = '';
    
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'hud-container';
    this.container.innerHTML = `
      <!-- Budget Panel -->
      <div class="hud-panel budget-panel">
        <div class="hud-label">Campaign Budget</div>
        <div class="hud-value" id="hud-budget-value">$1,000.00</div>
        <div class="budget-bar">
          <div class="budget-fill" id="hud-budget-fill" style="width: 100%"></div>
        </div>
        <div class="pricing-toggle">
          <button class="pricing-btn active" data-model="CPM">CPM</button>
          <button class="pricing-btn" data-model="CPC">CPC</button>
          <button class="pricing-btn" data-model="CPA">CPA</button>
        </div>
      </div>
      
      <!-- Stats Panel -->
      <div class="hud-panel stats-panel">
        <div style="display: flex; gap: 32px;">
          <div>
            <div class="hud-label">Impressions</div>
            <div class="hud-value" id="hud-impressions">0</div>
          </div>
          <div>
            <div class="hud-label">Viewability</div>
            <div class="hud-value" id="hud-viewability">0%</div>
          </div>
        </div>
      </div>
      
      <!-- World Indicator -->
      <div class="hud-panel world-panel" style="padding: 8px 16px;">
        <div class="hud-label" style="margin-bottom: 0;">World ${this.worldInfo.worldNumber}</div>
        <div style="font-size: 10px; color: ${this.worldInfo.color};">${this.worldInfo.worldName}</div>
      </div>
    `;
    
    uiLayer.appendChild(this.container);
    
    // Get element references
    this.budgetValueEl = document.getElementById('hud-budget-value');
    this.budgetFillEl = document.getElementById('hud-budget-fill');
    this.impressionsEl = document.getElementById('hud-impressions');
    this.viewabilityEl = document.getElementById('hud-viewability');
    
    // Get pricing buttons
    const buttons = this.container.querySelectorAll('.pricing-btn');
    buttons.forEach(btn => {
      const model = btn.getAttribute('data-model') as PricingModel;
      if (model) {
        this.pricingButtons.set(model, btn as HTMLElement);
        
        btn.addEventListener('click', () => {
          this.setPricingModel(model);
        });
      }
    });
    
    // Create debug panel
    this.createDebugPanel(uiLayer);
    
    // Initial update
    this.update();
  }

  /**
   * Create debug panel
   */
  private createDebugPanel(uiLayer: HTMLElement): void {
    this.debugPanel = document.createElement('div');
    this.debugPanel.className = 'debug-panel';
    this.debugPanel.innerHTML = `
      <div>Debug Mode (F1 to toggle)</div>
      <div id="debug-fps">FPS: --</div>
      <div id="debug-player">Player: --</div>
      <div id="debug-budget">Budget: --</div>
    `;
    
    uiLayer.appendChild(this.debugPanel);
  }

  /**
   * Set up event listeners for budget changes
   */
  private setupEventListeners(): void {
    // Budget events
    this.budgetManager.on('spend-updated', () => {
      this.updateBudgetDisplay();
    });
    
    this.budgetManager.on('budget-low', (_data: { percent: number }) => {
      this.flashBudgetWarning();
    });
    
    this.budgetManager.on('pricing-model-changed', (data: { to: PricingModel }) => {
      this.updatePricingButtons(data.to);
    });
    
    this.budgetManager.on('impression-batch', () => {
      this.updateImpressionDisplay();
      this.flashImpressionCounter();
    });
    
    // Viewability events
    this.viewabilityEngine.on('viewable-impression', () => {
      this.updateViewabilityDisplay();
    });
  }

  /**
   * Update HUD display
   */
  update(): void {
    this.updateBudgetDisplay();
    this.updateImpressionDisplay();
    this.updateViewabilityDisplay();
    this.updateDebugPanel();
  }

  /**
   * Update budget display
   */
  private updateBudgetDisplay(): void {
    const state = this.budgetManager.getState();
    const percent = this.budgetManager.getBudgetPercent();
    
    if (this.budgetValueEl) {
      this.budgetValueEl.textContent = `$${state.remaining.toFixed(2)}`;
      
      // Color based on remaining budget
      if (percent <= 10) {
        this.budgetValueEl.className = 'hud-value danger';
      } else if (percent <= 25) {
        this.budgetValueEl.className = 'hud-value warning';
      } else {
        this.budgetValueEl.className = 'hud-value';
      }
    }
    
    if (this.budgetFillEl) {
      this.budgetFillEl.style.width = `${Math.max(0, percent)}%`;
      
      // Color gradient based on remaining
      if (percent <= 10) {
        this.budgetFillEl.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
      } else if (percent <= 25) {
        this.budgetFillEl.style.background = 'linear-gradient(90deg, #ffcc00, #ffdd44)';
      } else {
        this.budgetFillEl.style.background = 'linear-gradient(90deg, #00ff88, #00ccff)';
      }
    }
  }

  /**
   * Update impression counter
   */
  private updateImpressionDisplay(): void {
    const state = this.budgetManager.getState();
    
    if (this.impressionsEl) {
      this.impressionsEl.textContent = state.impressions.toLocaleString();
    }
  }

  /**
   * Update viewability display
   */
  private updateViewabilityDisplay(): void {
    const rate = this.viewabilityEngine.getViewabilityRate();
    
    if (this.viewabilityEl) {
      this.viewabilityEl.textContent = `${rate.toFixed(1)}%`;
      
      // Color based on viewability threshold (MRC benchmark is ~60%)
      if (rate >= 70) {
        this.viewabilityEl.style.color = '#00ff88';
      } else if (rate >= 50) {
        this.viewabilityEl.style.color = '#ffcc00';
      } else {
        this.viewabilityEl.style.color = '#ff4444';
      }
    }
  }

  /**
   * Update debug panel info
   */
  private updateDebugPanel(): void {
    if (!this.debugPanel?.classList.contains('visible')) return;
    
    const fps = Math.round(this.scene.game.loop.actualFps);
    const state = this.budgetManager.getState();
    
    const fpsEl = document.getElementById('debug-fps');
    const budgetEl = document.getElementById('debug-budget');
    
    if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
    if (budgetEl) {
      budgetEl.textContent = `Budget: $${state.remaining.toFixed(2)} | Model: ${this.budgetManager.getPricingModel()}`;
    }
  }

  /**
   * Set pricing model
   */
  private setPricingModel(model: PricingModel): void {
    this.budgetManager.setPricingModel(model);
    this.updatePricingButtons(model);
  }

  /**
   * Update pricing button states
   */
  private updatePricingButtons(activeModel: PricingModel): void {
    this.pricingButtons.forEach((btn, model) => {
      if (model === activeModel) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Flash budget warning animation
   */
  private flashBudgetWarning(): void {
    if (!this.budgetValueEl) return;
    
    this.budgetValueEl.style.animation = 'none';
    void this.budgetValueEl.offsetWidth; // Trigger reflow
    this.budgetValueEl.style.animation = 'pulse 0.3s ease-in-out 3';
  }

  /**
   * Flash impression counter on update
   */
  private flashImpressionCounter(): void {
    if (!this.impressionsEl) return;
    
    this.impressionsEl.style.transform = 'scale(1.2)';
    this.impressionsEl.style.transition = 'transform 0.1s ease-out';
    
    setTimeout(() => {
      if (this.impressionsEl) {
        this.impressionsEl.style.transform = 'scale(1)';
      }
    }, 100);
  }

  /**
   * Show/hide HUD
   */
  setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.opacity = visible ? '1' : '0';
      this.container.style.pointerEvents = visible ? 'auto' : 'none';
    }
  }

  /**
   * Clean up HUD
   */
  destroy(): void {
    // Remove container
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    
    // Remove debug panel
    if (this.debugPanel) {
      this.debugPanel.remove();
      this.debugPanel = null;
    }
    
    // Clear all pricing buttons
    this.pricingButtons.clear();
    
    // Clear all element references
    this.budgetValueEl = null;
    this.budgetFillEl = null;
    this.impressionsEl = null;
    this.viewabilityEl = null;
    
    // Clear the entire UI layer to ensure no HUD remnants
    const uiLayer = document.getElementById('ui-layer');
    if (uiLayer) {
      uiLayer.innerHTML = '';
    }
    
    console.log('[HUD] Destroyed and UI layer cleared');
  }
}
