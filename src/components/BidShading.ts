/**
 * BidShading - Bid Optimization Strategy Component
 * 
 * Implements bid shading algorithms used in first-price auctions.
 * Bid shading helps advertisers avoid overpaying by predicting
 * the minimum bid needed to win.
 * 
 * Key Concepts:
 * - Win Rate Analysis: Historical win/loss patterns inform bidding
 * - Price Prediction: Estimate clearing prices based on signals
 * - Risk Management: Balance between winning and budget efficiency
 */

import Phaser from 'phaser';

/**
 * Historical bid data for ML-style prediction
 */
interface BidHistoryEntry {
  estimatedValue: number;
  bidAmount: number;
  won: boolean;
  clearingPrice: number;
  timestamp: number;
}

/**
 * Shading suggestion with visual data
 */
export interface ShadingSuggestion {
  suggestedBid: number;
  minBid: number;
  maxBid: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  rationale: string;
  predictedWinProb: number;
}

/**
 * BidShading Component
 * Provides intelligent bid recommendations
 */
export class BidShading extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  
  // Historical data for predictions
  private bidHistory: BidHistoryEntry[] = [];
  private maxHistorySize: number = 50;
  
  // Running statistics
  private avgWinningBid: number = 5.00;
  private avgLosingBid: number = 3.00;
  private winCount: number = 0;
  private lossCount: number = 0;
  
  // Visual elements
  private shadingUI!: Phaser.GameObjects.Container;
  private riskMeter!: Phaser.GameObjects.Graphics;
  private predictionLine!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    
    console.log('[BidShading] Initialized');
  }

  // ============================================================================
  // HISTORY TRACKING
  // ============================================================================

  /**
   * Record a bid outcome for learning
   */
  recordBidOutcome(
    estimatedValue: number,
    bidAmount: number,
    won: boolean,
    clearingPrice: number
  ): void {
    const entry: BidHistoryEntry = {
      estimatedValue,
      bidAmount,
      won,
      clearingPrice,
      timestamp: Date.now(),
    };
    
    this.bidHistory.push(entry);
    
    // Limit history size
    if (this.bidHistory.length > this.maxHistorySize) {
      this.bidHistory.shift();
    }
    
    // Update running averages
    if (won) {
      this.winCount++;
      this.avgWinningBid = (this.avgWinningBid * (this.winCount - 1) + bidAmount) / this.winCount;
    } else {
      this.lossCount++;
      this.avgLosingBid = (this.avgLosingBid * (this.lossCount - 1) + bidAmount) / this.lossCount;
    }
    
    this.emit('outcome-recorded', entry);
  }

  // ============================================================================
  // BID SHADING ALGORITHMS
  // ============================================================================

  /**
   * Calculate optimal shaded bid
   */
  calculateShadedBid(
    estimatedValue: number,
    floorPrice: number,
    competitionLevel: number = 0.5 // 0-1, higher = more competition
  ): ShadingSuggestion {
    // Base shading factor (how much to reduce from value)
    let shadingFactor = this.calculateShadingFactor(competitionLevel);
    
    // Adjust based on historical win rate
    const winRate = this.getWinRate();
    if (winRate < 0.3) {
      // Losing too much, shade less (bid higher)
      shadingFactor *= 0.85;
    } else if (winRate > 0.7) {
      // Winning easily, shade more (bid lower)
      shadingFactor *= 1.15;
    }
    
    // Calculate suggested bid
    let suggestedBid = estimatedValue * shadingFactor;
    
    // Ensure above floor
    suggestedBid = Math.max(floorPrice + 0.01, suggestedBid);
    
    // Round to cents
    suggestedBid = Math.round(suggestedBid * 100) / 100;
    
    // Calculate risk level
    const riskLevel = this.assessRiskLevel(suggestedBid, estimatedValue, floorPrice);
    
    // Calculate min/max range
    const minBid = Math.max(floorPrice + 0.01, estimatedValue * 0.5);
    const maxBid = estimatedValue * 1.1;
    
    // Predict win probability
    const predictedWinProb = this.predictWinProbability(suggestedBid, competitionLevel);
    
    // Generate rationale
    const rationale = this.generateRationale(winRate, competitionLevel, riskLevel);
    
    return {
      suggestedBid,
      minBid: Math.round(minBid * 100) / 100,
      maxBid: Math.round(maxBid * 100) / 100,
      confidence: Math.min(0.95, 0.5 + this.bidHistory.length * 0.01),
      riskLevel,
      rationale,
      predictedWinProb,
    };
  }

  /**
   * Calculate shading factor based on competition
   */
  private calculateShadingFactor(competitionLevel: number): number {
    // Higher competition = less shading (bid closer to value)
    // Lower competition = more shading (bid lower)
    // Base factor: 0.6 to 0.9
    return 0.6 + (competitionLevel * 0.3);
  }

  /**
   * Assess risk level of a bid
   */
  private assessRiskLevel(
    bid: number,
    estimatedValue: number,
    floorPrice: number
  ): 'low' | 'medium' | 'high' {
    const bidRatio = bid / estimatedValue;
    const marginAboveFloor = (bid - floorPrice) / floorPrice;
    
    if (bidRatio > 0.85 || marginAboveFloor > 0.5) {
      return 'low'; // Safe bid, likely to win
    } else if (bidRatio > 0.65 || marginAboveFloor > 0.25) {
      return 'medium'; // Moderate risk
    } else {
      return 'high'; // Aggressive shading, might lose
    }
  }

  /**
   * Predict win probability based on bid amount
   */
  private predictWinProbability(bid: number, competitionLevel: number): number {
    // Use historical data if available
    if (this.bidHistory.length >= 5) {
      const relevantBids = this.bidHistory.filter(h => 
        Math.abs(h.bidAmount - bid) < 2
      );
      
      if (relevantBids.length > 0) {
        const wins = relevantBids.filter(h => h.won).length;
        return wins / relevantBids.length;
      }
    }
    
    // Default prediction based on competition
    // Higher bid + lower competition = higher probability
    const baseProb = 0.5;
    const bidBonus = Math.min(0.3, (bid / this.avgWinningBid) * 0.2);
    const compPenalty = competitionLevel * 0.2;
    
    return Math.max(0.1, Math.min(0.95, baseProb + bidBonus - compPenalty));
  }

  /**
   * Generate human-readable rationale
   */
  private generateRationale(
    winRate: number,
    competitionLevel: number,
    riskLevel: 'low' | 'medium' | 'high'
  ): string {
    const parts: string[] = [];
    
    // Win rate insight
    if (winRate > 0.7) {
      parts.push('Strong win history');
    } else if (winRate < 0.3) {
      parts.push('Need to improve wins');
    } else {
      parts.push('Balanced performance');
    }
    
    // Competition insight
    if (competitionLevel > 0.7) {
      parts.push('high competition detected');
    } else if (competitionLevel < 0.3) {
      parts.push('low competition opportunity');
    }
    
    // Risk insight
    if (riskLevel === 'high') {
      parts.push('aggressive shading applied');
    } else if (riskLevel === 'low') {
      parts.push('conservative bid recommended');
    }
    
    return parts.join(', ');
  }

  // ============================================================================
  // VISUAL COMPONENTS
  // ============================================================================

  /**
   * Create bid shading visualization UI
   */
  createShadingUI(x: number, y: number): Phaser.GameObjects.Container {
    this.shadingUI = this.scene.add.container(x, y);
    this.shadingUI.setDepth(600);
    this.shadingUI.setScrollFactor(0);
    
    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-120, -80, 240, 160, 8);
    bg.lineStyle(2, 0x00ccff, 1);
    bg.strokeRoundedRect(-120, -80, 240, 160, 8);
    this.shadingUI.add(bg);
    
    // Header
    const header = this.scene.add.text(0, -65, '📊 BID SHADING AI', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#00ccff',
    });
    header.setOrigin(0.5, 0);
    this.shadingUI.add(header);
    
    // Risk meter background
    const meterBg = this.scene.add.graphics();
    meterBg.fillStyle(0x333333, 1);
    meterBg.fillRoundedRect(-100, -40, 200, 20, 4);
    this.shadingUI.add(meterBg);
    
    // Risk meter fill
    this.riskMeter = this.scene.add.graphics();
    this.shadingUI.add(this.riskMeter);
    
    // Prediction line
    this.predictionLine = this.scene.add.graphics();
    this.shadingUI.add(this.predictionLine);
    
    return this.shadingUI;
  }

  /**
   * Update shading UI with current suggestion
   */
  updateShadingUI(suggestion: ShadingSuggestion): void {
    if (!this.shadingUI) return;
    
    // Update risk meter
    this.riskMeter.clear();
    const riskColors = {
      low: 0x00ff88,
      medium: 0xffcc00,
      high: 0xff4444,
    };
    
    const fillWidth = 200 * suggestion.predictedWinProb;
    this.riskMeter.fillStyle(riskColors[suggestion.riskLevel], 1);
    this.riskMeter.fillRoundedRect(-100, -40, fillWidth, 20, 4);
    
    // Add glow effect
    this.riskMeter.lineStyle(2, riskColors[suggestion.riskLevel], 0.5);
    this.riskMeter.strokeRoundedRect(-100, -40, fillWidth, 20, 4);
  }

  /**
   * Draw prediction line showing optimal bid zone
   */
  drawPredictionLine(
    minBid: number,
    maxBid: number,
    suggestedBid: number,
    floorPrice: number
  ): void {
    if (!this.predictionLine) return;
    
    this.predictionLine.clear();
    
    const lineY = 20;
    const lineWidth = 200;
    const lineStart = -100;
    
    // Scale bids to line position
    const range = maxBid - floorPrice;
    const toX = (bid: number) => lineStart + ((bid - floorPrice) / range) * lineWidth;
    
    // Draw range line
    this.predictionLine.lineStyle(2, 0x444444, 1);
    this.predictionLine.lineBetween(lineStart, lineY, lineStart + lineWidth, lineY);
    
    // Draw optimal zone
    const optZoneStart = toX(minBid);
    const optZoneEnd = toX(suggestedBid * 1.1);
    this.predictionLine.fillStyle(0x00ff88, 0.3);
    this.predictionLine.fillRect(optZoneStart, lineY - 5, optZoneEnd - optZoneStart, 10);
    
    // Draw suggested bid marker
    const suggestX = toX(suggestedBid);
    this.predictionLine.fillStyle(0x00ff88, 1);
    this.predictionLine.fillTriangle(
      suggestX, lineY - 10,
      suggestX - 5, lineY - 20,
      suggestX + 5, lineY - 20
    );
    
    // Draw floor price marker
    const floorX = toX(floorPrice);
    this.predictionLine.fillStyle(0xff4444, 1);
    this.predictionLine.fillRect(floorX - 1, lineY - 8, 2, 16);
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get current win rate
   */
  getWinRate(): number {
    const total = this.winCount + this.lossCount;
    if (total === 0) return 0.5;
    return this.winCount / total;
  }

  /**
   * Get statistics summary
   */
  getStats(): { winRate: number; avgWin: number; avgLoss: number; totalBids: number } {
    return {
      winRate: this.getWinRate(),
      avgWin: this.avgWinningBid,
      avgLoss: this.avgLosingBid,
      totalBids: this.bidHistory.length,
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    if (this.shadingUI) this.shadingUI.destroy();
  }
}
