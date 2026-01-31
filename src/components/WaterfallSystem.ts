/**
 * WaterfallSystem - Publisher Waterfall vs Header Bidding
 * 
 * Demonstrates the difference between traditional waterfall (sequential)
 * and header bidding (parallel) auction approaches.
 * 
 * Key Concepts:
 * - Waterfall: Sequential calls to demand sources in priority order
 * - Header Bidding: Parallel calls to all demand sources simultaneously
 * - Latency vs Revenue: Trade-offs between speed and yield
 */

import Phaser from 'phaser';

/**
 * Demand source in the waterfall
 */
export interface DemandSource {
  id: string;
  name: string;
  priority: number; // Lower = higher priority (waterfall only)
  avgBid: number;
  latency: number; // ms to respond
  fillRate: number; // 0-1, probability of bidding
  color: number;
}

/**
 * Waterfall execution result
 */
export interface WaterfallResult {
  method: 'waterfall' | 'header-bidding';
  winner: DemandSource | null;
  winningBid: number;
  totalLatency: number;
  allBids: { source: DemandSource; bid: number | null }[];
  revenueGained: number;
  revenueOpportunity: number; // Potential if all had bid
}

/**
 * WaterfallSystem Component
 * Manages waterfall and header bidding mechanics
 */
export class WaterfallSystem extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  
  // Demand sources
  private demandSources: DemandSource[] = [];
  
  // Execution state
  private isExecuting: boolean = false;
  private executionStep: number = 0;
  
  // Visual elements
  private waterfallUI!: Phaser.GameObjects.Container;
  private sourceCards: Map<string, Phaser.GameObjects.Container> = new Map();
  private connectionLines!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    
    // Initialize default demand sources
    this.initializeDemandSources();
    
    console.log('[WaterfallSystem] Initialized with', this.demandSources.length, 'sources');
  }

  // ============================================================================
  // DEMAND SOURCE MANAGEMENT
  // ============================================================================

  /**
   * Initialize default demand sources
   */
  private initializeDemandSources(): void {
    this.demandSources = [
      {
        id: 'google_adx',
        name: 'Google AdX',
        priority: 1,
        avgBid: 8.50,
        latency: 80,
        fillRate: 0.9,
        color: 0x4285f4,
      },
      {
        id: 'amazon_aps',
        name: 'Amazon APS',
        priority: 2,
        avgBid: 7.20,
        latency: 100,
        fillRate: 0.85,
        color: 0xff9900,
      },
      {
        id: 'index_exchange',
        name: 'Index Exchange',
        priority: 3,
        avgBid: 6.80,
        latency: 60,
        fillRate: 0.8,
        color: 0x00cc66,
      },
      {
        id: 'openx',
        name: 'OpenX',
        priority: 4,
        avgBid: 5.50,
        latency: 90,
        fillRate: 0.75,
        color: 0x9933ff,
      },
      {
        id: 'rubicon',
        name: 'Magnite',
        priority: 5,
        avgBid: 5.00,
        latency: 70,
        fillRate: 0.7,
        color: 0xff4444,
      },
      {
        id: 'pubmatic',
        name: 'PubMatic',
        priority: 6,
        avgBid: 4.20,
        latency: 85,
        fillRate: 0.65,
        color: 0x00cccc,
      },
    ];
  }

  /**
   * Add a demand source
   */
  addDemandSource(source: DemandSource): void {
    this.demandSources.push(source);
    this.demandSources.sort((a, b) => a.priority - b.priority);
  }

  // ============================================================================
  // WATERFALL EXECUTION
  // ============================================================================

  /**
   * Execute traditional waterfall (sequential)
   */
  async executeWaterfall(floorPrice: number): Promise<WaterfallResult> {
    this.isExecuting = true;
    this.executionStep = 0;
    
    const allBids: { source: DemandSource; bid: number | null }[] = [];
    let winner: DemandSource | null = null;
    let winningBid = 0;
    let totalLatency = 0;
    
    // Sort by priority
    const sorted = [...this.demandSources].sort((a, b) => a.priority - b.priority);
    
    for (const source of sorted) {
      this.executionStep++;
      this.emit('waterfall-step', { source, step: this.executionStep, total: sorted.length });
      
      // Simulate latency
      totalLatency += source.latency;
      await this.delay(source.latency);
      
      // Check if source fills
      const fills = Math.random() < source.fillRate;
      
      if (fills) {
        // Generate bid
        const bid = this.generateBid(source);
        allBids.push({ source, bid });
        
        if (bid >= floorPrice && bid > winningBid) {
          // First bid above floor wins in waterfall
          winner = source;
          winningBid = bid;
          
          this.emit('waterfall-winner', { source, bid });
          break; // Waterfall stops at first fill
        }
      } else {
        allBids.push({ source, bid: null });
        this.emit('waterfall-passback', { source });
      }
    }
    
    this.isExecuting = false;
    
    // Calculate opportunity cost
    const potentialMax = Math.max(...this.demandSources.map(s => 
      s.avgBid * (1 + Math.random() * 0.3)
    ));
    
    const result: WaterfallResult = {
      method: 'waterfall',
      winner,
      winningBid,
      totalLatency,
      allBids,
      revenueGained: winningBid,
      revenueOpportunity: potentialMax,
    };
    
    this.emit('waterfall-complete', result);
    return result;
  }

  /**
   * Execute header bidding (parallel)
   */
  async executeHeaderBidding(floorPrice: number, timeout: number = 200): Promise<WaterfallResult> {
    this.isExecuting = true;
    
    const allBids: { source: DemandSource; bid: number | null }[] = [];
    
    // All sources bid in parallel
    const bidPromises = this.demandSources.map(async (source) => {
      // Simulate latency (but all run simultaneously)
      const respondTime = Math.min(source.latency, timeout);
      await this.delay(respondTime);
      
      // Check if timed out
      if (source.latency > timeout) {
        this.emit('header-timeout', { source });
        return { source, bid: null, timedOut: true };
      }
      
      // Check if source fills
      if (Math.random() < source.fillRate) {
        const bid = this.generateBid(source);
        return { source, bid, timedOut: false };
      }
      
      return { source, bid: null, timedOut: false };
    });
    
    this.emit('header-bidding-start', { sourceCount: this.demandSources.length, timeout });
    
    // Wait for all bids (up to timeout)
    const startTime = Date.now();
    const results = await Promise.all(bidPromises);
    const totalLatency = Date.now() - startTime;
    
    // Collect valid bids
    results.forEach(r => {
      allBids.push({ source: r.source, bid: r.bid });
      if (r.bid !== null) {
        this.emit('header-bid-received', { source: r.source, bid: r.bid });
      }
    });
    
    // Find highest bid above floor
    const validBids = results.filter(r => r.bid !== null && r.bid >= floorPrice);
    validBids.sort((a, b) => (b.bid ?? 0) - (a.bid ?? 0));
    
    const winner = validBids.length > 0 ? validBids[0].source : null;
    const winningBid = validBids.length > 0 ? (validBids[0].bid ?? 0) : 0;
    
    if (winner) {
      this.emit('header-bidding-winner', { source: winner, bid: winningBid });
    }
    
    this.isExecuting = false;
    
    const result: WaterfallResult = {
      method: 'header-bidding',
      winner,
      winningBid,
      totalLatency,
      allBids,
      revenueGained: winningBid,
      revenueOpportunity: Math.max(...allBids.map(b => b.bid ?? 0)),
    };
    
    this.emit('header-bidding-complete', result);
    return result;
  }

  /**
   * Generate a bid for a demand source
   */
  private generateBid(source: DemandSource): number {
    // Bid varies around average
    const variance = 0.3;
    const multiplier = 1 - variance + Math.random() * variance * 2;
    return Math.round(source.avgBid * multiplier * 100) / 100;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.scene.time.delayedCall(ms, resolve);
    });
  }

  // ============================================================================
  // VISUAL COMPONENTS
  // ============================================================================

  /**
   * Create waterfall visualization UI
   */
  createWaterfallUI(x: number, y: number): Phaser.GameObjects.Container {
    this.waterfallUI = this.scene.add.container(x, y);
    this.waterfallUI.setDepth(500);
    
    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0a1e, 0.95);
    bg.fillRoundedRect(-150, -200, 300, 400, 8);
    bg.lineStyle(2, 0x00ff88, 1);
    bg.strokeRoundedRect(-150, -200, 300, 400, 8);
    this.waterfallUI.add(bg);
    
    // Connection lines
    this.connectionLines = this.scene.add.graphics();
    this.waterfallUI.add(this.connectionLines);
    
    // Create source cards
    this.demandSources.forEach((source, index) => {
      const cardY = -150 + index * 60;
      const card = this.createSourceCard(source, 0, cardY);
      this.sourceCards.set(source.id, card);
      this.waterfallUI.add(card);
    });
    
    return this.waterfallUI;
  }

  /**
   * Create a demand source card
   */
  private createSourceCard(source: DemandSource, x: number, y: number): Phaser.GameObjects.Container {
    const card = this.scene.add.container(x, y);
    
    // Card background
    const cardBg = this.scene.add.graphics();
    cardBg.fillStyle(source.color, 0.3);
    cardBg.fillRoundedRect(-130, -20, 260, 50, 6);
    cardBg.lineStyle(2, source.color, 0.8);
    cardBg.strokeRoundedRect(-130, -20, 260, 50, 6);
    card.add(cardBg);
    
    // Priority badge
    const priorityBadge = this.scene.add.text(-115, -10, `#${source.priority}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ffffff',
      backgroundColor: '#' + source.color.toString(16).padStart(6, '0'),
      padding: { x: 4, y: 2 },
    });
    card.add(priorityBadge);
    
    // Source name
    const nameText = this.scene.add.text(-80, -10, source.name, {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#ffffff',
    });
    card.add(nameText);
    
    // Avg bid
    const bidText = this.scene.add.text(60, -10, `~$${source.avgBid.toFixed(2)}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#00ff88',
    });
    card.add(bidText);
    
    // Latency indicator
    const latencyText = this.scene.add.text(-80, 8, `${source.latency}ms`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '8px',
      color: '#888888',
    });
    card.add(latencyText);
    
    // Fill rate bar
    const fillBar = this.scene.add.graphics();
    fillBar.fillStyle(0x333333, 1);
    fillBar.fillRect(60, 10, 60, 8);
    fillBar.fillStyle(source.color, 1);
    fillBar.fillRect(60, 10, 60 * source.fillRate, 8);
    card.add(fillBar);
    
    return card;
  }

  /**
   * Animate waterfall execution
   */
  animateWaterfallStep(sourceId: string, state: 'active' | 'win' | 'pass' | 'idle'): void {
    const card = this.sourceCards.get(sourceId);
    if (!card) return;
    
    const colors = {
      active: 0xffcc00,
      win: 0x00ff88,
      pass: 0xff4444,
      idle: 0x333333,
    };
    
    // Animate card highlight
    this.scene.tweens.add({
      targets: card,
      scaleX: state === 'active' ? 1.05 : 1,
      scaleY: state === 'active' ? 1.05 : 1,
      duration: 200,
      ease: 'Sine.easeOut',
    });
    
    // Update border color
    const bg = card.getAt(0) as Phaser.GameObjects.Graphics;
    if (bg) {
      const source = this.demandSources.find(s => s.id === sourceId);
      if (source) {
        bg.clear();
        bg.fillStyle(source.color, state === 'active' ? 0.5 : 0.3);
        bg.fillRoundedRect(-130, -20, 260, 50, 6);
        bg.lineStyle(3, colors[state], 1);
        bg.strokeRoundedRect(-130, -20, 260, 50, 6);
      }
    }
  }

  /**
   * Draw header bidding parallel connections
   */
  drawParallelConnections(): void {
    if (!this.connectionLines) return;
    
    this.connectionLines.clear();
    this.connectionLines.lineStyle(2, 0x00ccff, 0.5);
    
    // Draw lines from center to all sources
    this.demandSources.forEach((_, index) => {
      const cardY = -150 + index * 60;
      this.connectionLines.lineBetween(-170, 0, -130, cardY);
      this.connectionLines.lineBetween(130, cardY, 170, 0);
    });
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get demand sources
   */
  getDemandSources(): DemandSource[] {
    return [...this.demandSources];
  }

  /**
   * Compare waterfall vs header bidding results
   */
  compareResults(waterfall: WaterfallResult, headerBidding: WaterfallResult): {
    revenueDiff: number;
    latencyDiff: number;
    headerBiddingBetter: boolean;
    summary: string;
  } {
    const revenueDiff = headerBidding.winningBid - waterfall.winningBid;
    const latencyDiff = headerBidding.totalLatency - waterfall.totalLatency;
    const headerBiddingBetter = revenueDiff > 0;
    
    let summary: string;
    if (revenueDiff > 0) {
      summary = `Header bidding earned $${revenueDiff.toFixed(2)} more but took ${Math.abs(latencyDiff)}ms ${latencyDiff > 0 ? 'longer' : 'less'}`;
    } else if (revenueDiff < 0) {
      summary = `Waterfall earned $${Math.abs(revenueDiff).toFixed(2)} more and was ${Math.abs(latencyDiff)}ms faster`;
    } else {
      summary = `Both methods yielded similar results`;
    }
    
    return { revenueDiff, latencyDiff, headerBiddingBetter, summary };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.sourceCards.forEach(c => c.destroy());
    this.sourceCards.clear();
    if (this.waterfallUI) this.waterfallUI.destroy();
  }
}
