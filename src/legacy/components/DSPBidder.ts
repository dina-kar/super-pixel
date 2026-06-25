/**
 * DSPBidder - Demand-Side Platform Bidding System
 * 
 * Simulates the real-time bidding (RTB) decision process used by DSPs.
 * In programmatic advertising, DSPs have ~100ms to decide whether to bid
 * and at what price.
 * 
 * Key Concepts:
 * - Bid Request: Contains user data and inventory details
 * - 100ms Decision Window: Time pressure for bid decisions
 * - Bid Shading: AI-optimized bid price suggestion
 * - Bid Response: Final decision to bid or pass
 */

import Phaser from 'phaser';

/**
 * Bid request data (what the SSP sends to DSPs)
 */
export interface BidRequest {
  id: string;
  inventoryId: string;
  floorPrice: number;
  timestamp: number;
  userData: {
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'ctv';
    geo: string;
    segments: string[];
    frequency: number; // How many times user has seen ads
  };
  contextData: {
    domain: string;
    category: string;
    viewability: number; // Predicted viewability 0-1
    adPosition: 'above-fold' | 'below-fold';
  };
}

/**
 * Bid response (DSP's answer)
 */
export interface BidResponse {
  requestId: string;
  bidAmount: number;
  didBid: boolean;
  timestamp: number;
  responseTime: number; // ms to respond
}

/**
 * Bid shading suggestion
 */
export interface BidShadingSuggestion {
  suggestedBid: number;
  confidence: number;
  rationale: string;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * DSP Bidder configuration
 */
interface DSPConfig {
  decisionWindowMs: number; // Default 100ms
  baseBudget: number;
  maxBidMultiplier: number;
  winRateHistory: number[]; // Historical win rates for shading
}

/**
 * DSPBidder Component
 * Manages the bid decision UI and logic
 */
export class DSPBidder extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private config: DSPConfig;
  
  // State
  private remainingBudget: number;
  private bidsPlaced: number = 0;
  private bidsWon: number = 0;
  private bidHistory: BidResponse[] = [];
  
  // Active bid request
  private currentRequest: BidRequest | null = null;
  private decisionTimer: Phaser.Time.TimerEvent | null = null;
  private decisionStartTime: number = 0;
  
  // UI Elements
  private bidPopup!: Phaser.GameObjects.Container;
  private countdownBar!: Phaser.GameObjects.Graphics;
  private bidInfoText!: Phaser.GameObjects.Text;
  private suggestionText!: Phaser.GameObjects.Text;
  private bidAmountDisplay!: Phaser.GameObjects.Text;
  private riskMeter!: Phaser.GameObjects.Graphics;
  
  // Visual state
  private isPopupVisible: boolean = false;
  private currentBidAmount: number = 0;

  constructor(scene: Phaser.Scene, config: Partial<DSPConfig> = {}) {
    super();
    
    this.scene = scene;
    this.config = {
      decisionWindowMs: 100, // 100ms decision window (real RTB timing)
      baseBudget: 1000,
      maxBidMultiplier: 3,
      winRateHistory: [0.5, 0.5, 0.5], // Start with 50% win rate assumption
      ...config,
    };
    
    this.remainingBudget = this.config.baseBudget;
    
    // Set up input
    this.setupInput();
    
    // Create bid popup UI (hidden initially)
    this.createBidPopupUI();
    
    console.log('[DSPBidder] Initialized with $' + this.remainingBudget + ' budget');
  }

  // ============================================================================
  // INPUT SETUP
  // ============================================================================

  /**
   * Set up keyboard controls for bidding
   * Note: Actual key bindings are set up in startDecisionTimer when popup is shown
   */
  private setupInput(): void {
    // Keys are bound dynamically when bid popup appears
  }

  // ============================================================================
  // BID POPUP UI
  // ============================================================================

  /**
   * Create the bid decision popup interface
   */
  private createBidPopupUI(): void {
    this.bidPopup = this.scene.add.container(640, 360);
    this.bidPopup.setDepth(1000);
    this.bidPopup.setVisible(false);
    this.bidPopup.setScrollFactor(0);
    
    // Background panel with cyber aesthetic
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x0a0a1e, 0.95);
    panelBg.fillRoundedRect(-200, -150, 400, 300, 8);
    panelBg.lineStyle(2, 0x00ff88, 1);
    panelBg.strokeRoundedRect(-200, -150, 400, 300, 8);
    
    // Add glowing border effect
    panelBg.lineStyle(4, 0x00ff88, 0.3);
    panelBg.strokeRoundedRect(-204, -154, 408, 308, 10);
    
    this.bidPopup.add(panelBg);
    
    // Header
    const header = this.scene.add.text(0, -130, '⚡ BID REQUEST', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#00ff88',
      align: 'center',
    });
    header.setOrigin(0.5, 0);
    this.bidPopup.add(header);
    
    // Countdown bar background
    const countdownBg = this.scene.add.graphics();
    countdownBg.fillStyle(0x333333, 1);
    countdownBg.fillRoundedRect(-180, -100, 360, 16, 4);
    this.bidPopup.add(countdownBg);
    
    // Countdown bar (animated)
    this.countdownBar = this.scene.add.graphics();
    this.drawCountdownBar(1);
    this.bidPopup.add(this.countdownBar);
    
    // Countdown label
    const countdownLabel = this.scene.add.text(0, -100, '100ms', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ffffff',
    });
    countdownLabel.setOrigin(0.5, 0);
    this.bidPopup.add(countdownLabel);
    
    // Bid info section
    this.bidInfoText = this.scene.add.text(-180, -70, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#aaaaaa',
      lineSpacing: 4,
    });
    this.bidPopup.add(this.bidInfoText);
    
    // Bid amount display
    this.bidAmountDisplay = this.scene.add.text(0, 20, '$0.00', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffcc00',
    });
    this.bidAmountDisplay.setOrigin(0.5, 0.5);
    this.bidPopup.add(this.bidAmountDisplay);
    
    // AI suggestion
    this.suggestionText = this.scene.add.text(0, 60, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#66ccff',
      align: 'center',
    });
    this.suggestionText.setOrigin(0.5, 0);
    this.bidPopup.add(this.suggestionText);
    
    // Risk meter
    this.riskMeter = this.scene.add.graphics();
    this.bidPopup.add(this.riskMeter);
    
    // Controls hint
    const controlsHint = this.scene.add.text(0, 115, '↑ BID  |  ↓ PASS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#888888',
    });
    controlsHint.setOrigin(0.5, 0);
    this.bidPopup.add(controlsHint);
  }

  /**
   * Draw the countdown progress bar
   */
  private drawCountdownBar(progress: number): void {
    this.countdownBar.clear();
    
    // Color gradient based on remaining time
    let color = 0x00ff88; // Green
    if (progress < 0.5) color = 0xffcc00; // Yellow
    if (progress < 0.25) color = 0xff4444; // Red
    
    const width = 356 * progress;
    this.countdownBar.fillStyle(color, 1);
    this.countdownBar.fillRoundedRect(-178, -98, width, 12, 3);
    
    // Add pulse effect when low
    if (progress < 0.3) {
      this.countdownBar.fillStyle(color, 0.3);
      this.countdownBar.fillRoundedRect(-178, -98, width, 12, 3);
    }
  }

  /**
   * Draw the risk meter visualization
   */
  private drawRiskMeter(_riskLevel: 'low' | 'medium' | 'high', bidRatio: number): void {
    this.riskMeter.clear();
    
    const y = 90;
    const width = 200;
    
    // Background
    this.riskMeter.fillStyle(0x333333, 1);
    this.riskMeter.fillRoundedRect(-100, y, width, 12, 4);
    
    // Risk gradient (green to red)
    const colors = [0x00ff88, 0x88ff00, 0xffff00, 0xff8800, 0xff4444];
    const segments = 5;
    const segmentWidth = width / segments;
    
    for (let i = 0; i < segments; i++) {
      this.riskMeter.fillStyle(colors[i], 0.3);
      this.riskMeter.fillRect(-100 + i * segmentWidth, y, segmentWidth, 12);
    }
    
    // Current position indicator
    const indicatorX = -100 + (bidRatio * width);
    this.riskMeter.fillStyle(0xffffff, 1);
    this.riskMeter.fillTriangle(
      indicatorX, y - 4,
      indicatorX - 4, y - 8,
      indicatorX + 4, y - 8
    );
  }

  // ============================================================================
  // BID REQUEST HANDLING
  // ============================================================================

  /**
   * Present a new bid request to the player
   */
  presentBidRequest(request: BidRequest): void {
    this.currentRequest = request;
    this.decisionStartTime = Date.now();
    
    // Calculate initial suggested bid
    const suggestion = this.calculateBidShading(request);
    this.currentBidAmount = suggestion.suggestedBid;
    
    // Update UI
    this.updateBidInfo(request);
    this.updateBidAmount(this.currentBidAmount);
    this.updateSuggestion(suggestion);
    
    // Show popup with animation
    this.showBidPopup();
    
    // Start countdown timer
    this.startDecisionTimer();
    
    this.emit('bid-request-presented', request);
    console.log('[DSPBidder] Bid request presented:', request.id);
  }

  /**
   * Update bid info display
   */
  private updateBidInfo(request: BidRequest): void {
    const lines = [
      `📱 Device: ${request.userData.deviceType.toUpperCase()}`,
      `📍 Geo: ${request.userData.geo}`,
      `👁 Viewability: ${(request.contextData.viewability * 100).toFixed(0)}%`,
      `📊 Position: ${request.contextData.adPosition}`,
      `💰 Floor: $${request.floorPrice.toFixed(2)}`,
    ];
    this.bidInfoText.setText(lines.join('\n'));
  }

  /**
   * Update bid amount display
   */
  private updateBidAmount(amount: number): void {
    this.bidAmountDisplay.setText(`$${amount.toFixed(2)}`);
    
    // Color based on budget usage
    if (amount > this.remainingBudget * 0.1) {
      this.bidAmountDisplay.setColor('#ff4444');
    } else if (amount > this.remainingBudget * 0.05) {
      this.bidAmountDisplay.setColor('#ffcc00');
    } else {
      this.bidAmountDisplay.setColor('#00ff88');
    }
  }

  /**
   * Update AI suggestion display
   */
  private updateSuggestion(suggestion: BidShadingSuggestion): void {
    const confidenceBar = '█'.repeat(Math.round(suggestion.confidence * 5)) + 
                          '░'.repeat(5 - Math.round(suggestion.confidence * 5));
    
    this.suggestionText.setText(
      `🤖 AI: ${suggestion.rationale}\n` +
      `Confidence: [${confidenceBar}] ${(suggestion.confidence * 100).toFixed(0)}%`
    );
    
    // Draw risk meter
    const bidRatio = this.currentBidAmount / (this.currentRequest?.floorPrice ?? 1) / this.config.maxBidMultiplier;
    this.drawRiskMeter(suggestion.riskLevel, Phaser.Math.Clamp(bidRatio, 0, 1));
  }

  /**
   * Show bid popup with animation
   */
  private showBidPopup(): void {
    this.isPopupVisible = true;
    this.bidPopup.setVisible(true);
    this.bidPopup.setScale(0.5);
    this.bidPopup.setAlpha(0);
    
    // Slow down game time for dramatic effect
    this.scene.time.timeScale = 0.1;
    
    this.scene.tweens.add({
      targets: this.bidPopup,
      scale: 1,
      alpha: 1,
      duration: 150,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Hide bid popup
   */
  private hideBidPopup(): void {
    this.isPopupVisible = false;
    
    // Restore game time
    this.scene.time.timeScale = 1;
    
    this.scene.tweens.add({
      targets: this.bidPopup,
      scale: 0.8,
      alpha: 0,
      duration: 100,
      ease: 'Power2',
      onComplete: () => {
        this.bidPopup.setVisible(false);
      },
    });
  }

  /**
   * Start the decision countdown timer
   */
  private startDecisionTimer(): void {
    // For gameplay, extend the 100ms to something playable (e.g., 3 seconds)
    const gameplayDuration = 3000; // 3 seconds for player reaction
    
    // Update countdown bar every frame
    const startTime = this.scene.time.now;
    
    const updateLoop = this.scene.time.addEvent({
      delay: 16, // ~60fps
      callback: () => {
        const elapsed = this.scene.time.now - startTime;
        const progress = 1 - (elapsed / gameplayDuration);
        
        if (progress <= 0) {
          this.handleTimeout();
          updateLoop.destroy();
        } else {
          this.drawCountdownBar(progress);
        }
      },
      loop: true,
    });
    
    this.decisionTimer = updateLoop;
    
    // Listen for input during decision window
    this.scene.input.keyboard?.once('keydown-UP', () => {
      if (this.isPopupVisible) {
        this.submitBid(this.currentBidAmount);
      }
    });
    
    this.scene.input.keyboard?.once('keydown-DOWN', () => {
      if (this.isPopupVisible) {
        this.passBid();
      }
    });
  }

  /**
   * Handle timeout (no decision made)
   */
  private handleTimeout(): void {
    if (!this.currentRequest) return;
    
    const response: BidResponse = {
      requestId: this.currentRequest.id,
      bidAmount: 0,
      didBid: false,
      timestamp: Date.now(),
      responseTime: Date.now() - this.decisionStartTime,
    };
    
    this.bidHistory.push(response);
    this.hideBidPopup();
    
    this.emit('bid-timeout', response);
    console.log('[DSPBidder] Bid timed out');
    
    this.currentRequest = null;
  }

  /**
   * Submit a bid
   */
  submitBid(amount: number): void {
    if (!this.currentRequest) return;
    
    // Clear timer
    this.decisionTimer?.destroy();
    
    const responseTime = Date.now() - this.decisionStartTime;
    
    const response: BidResponse = {
      requestId: this.currentRequest.id,
      bidAmount: amount,
      didBid: true,
      timestamp: Date.now(),
      responseTime,
    };
    
    this.bidsPlaced++;
    this.bidHistory.push(response);
    this.hideBidPopup();
    
    this.emit('bid-submitted', response);
    console.log(`[DSPBidder] Bid submitted: $${amount.toFixed(2)} in ${responseTime}ms`);
    
    this.currentRequest = null;
  }

  /**
   * Pass on bid opportunity
   */
  passBid(): void {
    if (!this.currentRequest) return;
    
    // Clear timer
    this.decisionTimer?.destroy();
    
    const response: BidResponse = {
      requestId: this.currentRequest.id,
      bidAmount: 0,
      didBid: false,
      timestamp: Date.now(),
      responseTime: Date.now() - this.decisionStartTime,
    };
    
    this.bidHistory.push(response);
    this.hideBidPopup();
    
    this.emit('bid-passed', response);
    console.log('[DSPBidder] Bid passed');
    
    this.currentRequest = null;
  }

  // ============================================================================
  // BID SHADING AI
  // ============================================================================

  /**
   * Calculate optimal bid price using bid shading algorithm
   */
  calculateBidShading(request: BidRequest): BidShadingSuggestion {
    const { floorPrice, userData, contextData } = request;
    
    // Base suggestion is just above floor
    let suggestedBid = floorPrice * 1.1;
    let confidence = 0.5;
    let rationale = 'Base bid above floor';
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    
    // Adjust based on viewability
    if (contextData.viewability > 0.7) {
      suggestedBid *= 1.2;
      confidence += 0.1;
      rationale = 'High viewability premium';
    } else if (contextData.viewability < 0.3) {
      suggestedBid *= 0.8;
      confidence -= 0.1;
      rationale = 'Low viewability discount';
    }
    
    // Adjust based on ad position
    if (contextData.adPosition === 'above-fold') {
      suggestedBid *= 1.15;
      rationale = 'Above-fold premium';
    }
    
    // Adjust based on device type
    if (userData.deviceType === 'ctv') {
      suggestedBid *= 1.5;
      rationale = 'CTV premium inventory';
    } else if (userData.deviceType === 'desktop') {
      suggestedBid *= 1.1;
    }
    
    // Adjust based on historical win rate
    const avgWinRate = this.config.winRateHistory.reduce((a, b) => a + b, 0) / 
                       this.config.winRateHistory.length;
    
    if (avgWinRate < 0.3) {
      suggestedBid *= 1.2;
      rationale = 'Aggressive: low win rate';
      riskLevel = 'high';
    } else if (avgWinRate > 0.7) {
      suggestedBid *= 0.9;
      rationale = 'Conservative: high win rate';
      riskLevel = 'low';
      confidence += 0.2;
    }
    
    // User frequency cap consideration
    if (userData.frequency > 3) {
      suggestedBid *= 0.7;
      rationale = 'Frequency cap: user oversaturated';
      confidence -= 0.2;
    }
    
    // Cap at max bid
    const maxBid = floorPrice * this.config.maxBidMultiplier;
    suggestedBid = Math.min(suggestedBid, maxBid);
    
    // Ensure we don't exceed remaining budget
    suggestedBid = Math.min(suggestedBid, this.remainingBudget);
    
    // Clamp confidence
    confidence = Phaser.Math.Clamp(confidence, 0.1, 0.95);
    
    return {
      suggestedBid,
      confidence,
      rationale,
      riskLevel,
    };
  }

  /**
   * Record auction result (won or lost)
   */
  recordAuctionResult(won: boolean, winningPrice: number): void {
    if (won) {
      this.bidsWon++;
      this.remainingBudget -= winningPrice;
    }
    
    // Update win rate history (sliding window)
    this.config.winRateHistory.push(won ? 1 : 0);
    if (this.config.winRateHistory.length > 10) {
      this.config.winRateHistory.shift();
    }
    
    this.emit('auction-result', { won, winningPrice, remainingBudget: this.remainingBudget });
  }

  // ============================================================================
  // GETTERS & UTILITIES
  // ============================================================================

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    return this.remainingBudget;
  }

  /**
   * Get win rate
   */
  getWinRate(): number {
    if (this.bidsPlaced === 0) return 0;
    return this.bidsWon / this.bidsPlaced;
  }

  /**
   * Get bid history
   */
  getBidHistory(): BidResponse[] {
    return [...this.bidHistory];
  }

  /**
   * Check if currently showing a bid request
   */
  isShowingBidRequest(): boolean {
    return this.isPopupVisible;
  }

  /**
   * Generate a random bid request for testing/gameplay
   */
  generateRandomBidRequest(): BidRequest {
    const devices: Array<'mobile' | 'desktop' | 'tablet' | 'ctv'> = ['mobile', 'desktop', 'tablet', 'ctv'];
    const geos = ['US', 'UK', 'DE', 'FR', 'JP', 'BR', 'AU', 'CA'];
    const categories = ['news', 'sports', 'entertainment', 'tech', 'finance', 'lifestyle'];
    const segments = ['intent:high', 'demo:25-34', 'interest:gaming', 'behavior:purchaser'];
    
    return {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inventoryId: `inv_${Math.random().toString(36).substr(2, 6)}`,
      floorPrice: Phaser.Math.FloatBetween(0.50, 5.00),
      timestamp: Date.now(),
      userData: {
        deviceType: Phaser.Math.RND.pick(devices),
        geo: Phaser.Math.RND.pick(geos),
        segments: Phaser.Math.RND.shuffle([...segments]).slice(0, 2),
        frequency: Phaser.Math.Between(0, 5),
      },
      contextData: {
        domain: `example-${Phaser.Math.Between(1, 100)}.com`,
        category: Phaser.Math.RND.pick(categories),
        viewability: Phaser.Math.FloatBetween(0.3, 0.95),
        adPosition: Math.random() > 0.5 ? 'above-fold' : 'below-fold',
      },
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.decisionTimer?.destroy();
    this.bidPopup.destroy();
    this.removeAllListeners();
    console.log('[DSPBidder] Destroyed');
  }
}
