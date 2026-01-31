/**
 * AuctionEngine - Real-Time Bidding Auction Mechanics
 * 
 * Implements the core auction mechanics used in programmatic advertising:
 * - First-Price Auction: Winner pays exactly what they bid
 * - Second-Price Auction: Winner pays second-highest bid + $0.01
 * - Bid Shading: Strategy to optimize bids in first-price auctions
 * 
 * In-game, auctions determine which platforms the player can access
 * and how much budget is spent on inventory.
 */

import Phaser from 'phaser';
import type { AuctionType, Bid, AuctionResult } from '../types/adtech';

/**
 * AI Bidder configuration for competitive auctions
 */
export interface AIBidder {
  id: string;
  name: string;
  minBid: number;
  maxBid: number;
  aggression: number; // 0-1, affects bidding strategy
  sprite?: Phaser.GameObjects.Sprite;
}

/**
 * Inventory slot available for auction
 */
export interface InventorySlot {
  id: string;
  name: string;
  estimatedValue: number;
  floorPrice: number;
  quality: 'premium' | 'standard' | 'remnant';
  position: { x: number; y: number };
}

/**
 * Auction event data
 */
export interface AuctionEvent {
  slot: InventorySlot;
  result: AuctionResult;
  playerBid: number;
  playerWon: boolean;
  savings?: number; // For second-price auctions
}

/**
 * AuctionEngine Component
 * Manages real-time bidding mechanics and visualization
 */
export class AuctionEngine extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  
  // AI bidders
  private aiBidders: AIBidder[] = [];
  
  // Auction history
  private auctionHistory: AuctionEvent[] = [];
  
  // Stats
  private totalAuctions: number = 0;
  private auctionsWon: number = 0;
  private totalSpent: number = 0;
  private totalSaved: number = 0; // Savings from second-price mechanics
  
  // Visual elements
  // UI container reference (reserved for future UI elements)
  // private _auctionUI!: Phaser.GameObjects.Container;
  private bidDisplays: Map<string, Phaser.GameObjects.Container> = new Map();

  constructor(scene: Phaser.Scene, aiBidderCount: number = 4) {
    super();
    this.scene = scene;
    
    // Initialize AI bidders
    this.initializeAIBidders(aiBidderCount);
    
    console.log('[AuctionEngine] Initialized with', aiBidderCount, 'AI bidders');
  }

  // ============================================================================
  // AI BIDDER MANAGEMENT
  // ============================================================================

  /**
   * Initialize AI bidders with varied strategies
   */
  private initializeAIBidders(count: number): void {
    const bidderNames = [
      'TradeDesk', 'MediaMath', 'AppNexus', 'Criteo',
      'AdRoll', 'Simpli.fi', 'StackAdapt', 'Basis'
    ];
    
    for (let i = 0; i < count; i++) {
      const bidder: AIBidder = {
        id: `ai_bidder_${i}`,
        name: bidderNames[i % bidderNames.length],
        minBid: 1.00 + Math.random() * 2,
        maxBid: 8.00 + Math.random() * 7,
        aggression: 0.3 + Math.random() * 0.5,
      };
      
      this.aiBidders.push(bidder);
    }
  }

  /**
   * Generate a bid from an AI bidder
   */
  private generateAIBid(bidder: AIBidder, slot: InventorySlot): number {
    // Base bid on slot value and bidder aggression
    const baseValue = slot.estimatedValue * (0.8 + Math.random() * 0.4);
    const aggressionMultiplier = 0.7 + bidder.aggression * 0.6;
    
    // Quality affects bid amount
    const qualityMultiplier = 
      slot.quality === 'premium' ? 1.3 :
      slot.quality === 'standard' ? 1.0 : 0.7;
    
    let bid = baseValue * aggressionMultiplier * qualityMultiplier;
    
    // Clamp to bidder's range
    bid = Math.max(bidder.minBid, Math.min(bidder.maxBid, bid));
    
    // Ensure above floor price
    bid = Math.max(slot.floorPrice, bid);
    
    return Math.round(bid * 100) / 100; // Round to cents
  }

  // ============================================================================
  // AUCTION MECHANICS
  // ============================================================================

  /**
   * Run a complete auction for an inventory slot
   */
  startAuction(
    slot: InventorySlot,
    playerBid: number,
    auctionType: AuctionType = 'second-price'
  ): AuctionResult {
    this.totalAuctions++;
    
    // Collect all bids (player + AI)
    const bids: Bid[] = [];
    
    // Player bid
    bids.push({
      bidderId: 'player',
      amount: playerBid,
      timestamp: Date.now(),
    });
    
    // AI bids
    this.aiBidders.forEach(bidder => {
      const amount = this.generateAIBid(bidder, slot);
      bids.push({
        bidderId: bidder.id,
        amount,
        timestamp: Date.now(),
      });
    });
    
    // Calculate winner based on auction type
    const result = this.calculateWinner(bids, auctionType, slot.floorPrice);
    
    // Track stats
    const playerWon = result.winnerId === 'player';
    if (playerWon) {
      this.auctionsWon++;
      this.totalSpent += result.winAmount;
      
      if (auctionType === 'second-price') {
        this.totalSaved += playerBid - result.winAmount;
      }
    }
    
    // Create auction event
    const event: AuctionEvent = {
      slot,
      result,
      playerBid,
      playerWon,
      savings: auctionType === 'second-price' && playerWon 
        ? playerBid - result.winAmount 
        : undefined,
    };
    
    this.auctionHistory.push(event);
    this.emit('auction-complete', event);
    
    return result;
  }

  /**
   * Calculate auction winner based on auction type
   */
  calculateWinner(bids: Bid[], auctionType: AuctionType, floorPrice: number = 0): AuctionResult {
    // Filter bids above floor price
    const validBids = bids.filter(b => b.amount >= floorPrice);
    
    if (validBids.length === 0) {
      return {
        winnerId: 'none',
        winAmount: 0,
        auctionType,
        allBids: bids,
      };
    }
    
    // Sort by bid amount (descending)
    const sortedBids = [...validBids].sort((a, b) => b.amount - a.amount);
    const winner = sortedBids[0];
    
    let winAmount: number;
    
    if (auctionType === 'second-price') {
      // Second-price: Pay second-highest bid + $0.01
      // If only one bidder, pay floor price + $0.01
      const secondHighest = sortedBids.length > 1 
        ? sortedBids[1].amount 
        : floorPrice;
      winAmount = Math.round((secondHighest + 0.01) * 100) / 100;
    } else {
      // First-price: Pay exactly what you bid
      winAmount = winner.amount;
    }
    
    return {
      winnerId: winner.bidderId,
      winAmount,
      auctionType,
      allBids: bids,
    };
  }

  // ============================================================================
  // BID SHADING
  // ============================================================================

  /**
   * Calculate optimal bid using bid shading algorithm
   * Used in first-price auctions to avoid overpaying
   */
  calculateShadedBid(
    estimatedValue: number,
    floorPrice: number,
    historicalWinRate: number = 0.5
  ): { suggestedBid: number; confidence: number; rationale: string } {
    // Bid shading formula: reduces bid based on predicted competition
    // Higher win rate history = lower shading (bid more aggressively)
    // Lower win rate = higher shading (bid closer to value)
    
    const shadingFactor = 0.6 + (historicalWinRate * 0.3); // 0.6 to 0.9
    let suggestedBid = estimatedValue * shadingFactor;
    
    // Ensure above floor price
    suggestedBid = Math.max(floorPrice + 0.01, suggestedBid);
    
    // Round to cents
    suggestedBid = Math.round(suggestedBid * 100) / 100;
    
    // Calculate confidence based on history depth
    const confidence = Math.min(0.9, 0.5 + (this.auctionHistory.length * 0.02));
    
    // Generate rationale
    let rationale: string;
    if (historicalWinRate > 0.7) {
      rationale = 'High win rate - shade aggressively to save budget';
    } else if (historicalWinRate < 0.3) {
      rationale = 'Low win rate - bid closer to value to improve wins';
    } else {
      rationale = 'Moderate competition - balanced shading applied';
    }
    
    return { suggestedBid, confidence, rationale };
  }

  /**
   * Get current win rate
   */
  getWinRate(): number {
    if (this.totalAuctions === 0) return 0.5;
    return this.auctionsWon / this.totalAuctions;
  }

  // ============================================================================
  // VISUAL AUCTION DISPLAY
  // ============================================================================

  /**
   * Create visual auction UI showing all bids
   */
  createAuctionDisplay(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setDepth(500);
    container.setScrollFactor(0);
    
    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0a1e, 0.95);
    bg.fillRoundedRect(-150, -100, 300, 200, 8);
    bg.lineStyle(2, 0xffcc00, 1);
    bg.strokeRoundedRect(-150, -100, 300, 200, 8);
    container.add(bg);
    
    // Header
    const header = this.scene.add.text(0, -80, '⚡ AUCTION', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ffcc00',
    });
    header.setOrigin(0.5, 0);
    container.add(header);
    
    return container;
  }

  /**
   * Animate bid reveal sequence
   */
  animateBidReveal(
    container: Phaser.GameObjects.Container,
    bids: Bid[],
    _auctionType: AuctionType,
    callback?: () => void
  ): void {
    const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
    
    // Clear existing bid displays
    container.each((child: Phaser.GameObjects.GameObject) => {
      if (child.getData('isBidDisplay')) {
        child.destroy();
      }
    });
    
    // Create bid display rows
    sortedBids.forEach((bid, index) => {
      const yOffset = -40 + index * 30;
      
      this.scene.time.delayedCall(index * 200, () => {
        const isPlayer = bid.bidderId === 'player';
        const isWinner = index === 0;
        
        const bidRow = this.scene.add.container(0, yOffset);
        bidRow.setData('isBidDisplay', true);
        
        // Bidder name
        const name = isPlayer ? 'YOU' : this.aiBidders.find(b => b.id === bid.bidderId)?.name || 'AI';
        const nameText = this.scene.add.text(-130, 0, name, {
          fontFamily: '"Courier New", monospace',
          fontSize: '10px',
          color: isPlayer ? '#00ff88' : '#888888',
        });
        bidRow.add(nameText);
        
        // Bid amount
        const amountText = this.scene.add.text(50, 0, `$${bid.amount.toFixed(2)}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '10px',
          color: isWinner ? '#ffcc00' : '#666666',
        });
        bidRow.add(amountText);
        
        // Winner indicator
        if (isWinner) {
          const crown = this.scene.add.text(120, 0, '👑', {
            fontSize: '14px',
          });
          bidRow.add(crown);
        }
        
        container.add(bidRow);
        
        // Animate appearance
        bidRow.setAlpha(0);
        bidRow.setScale(0.5);
        this.scene.tweens.add({
          targets: bidRow,
          alpha: 1,
          scale: 1,
          duration: 200,
          ease: 'Back.easeOut',
        });
        
        // Final callback
        if (index === sortedBids.length - 1 && callback) {
          this.scene.time.delayedCall(500, callback);
        }
      });
    });
  }

  // ============================================================================
  // STATS & GETTERS
  // ============================================================================

  getStats(): { auctions: number; won: number; spent: number; saved: number; winRate: number } {
    return {
      auctions: this.totalAuctions,
      won: this.auctionsWon,
      spent: this.totalSpent,
      saved: this.totalSaved,
      winRate: this.getWinRate(),
    };
  }

  getAIBidders(): AIBidder[] {
    return [...this.aiBidders];
  }

  getHistory(): AuctionEvent[] {
    return [...this.auctionHistory];
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.bidDisplays.forEach(d => d.destroy());
    this.bidDisplays.clear();
  }
}
