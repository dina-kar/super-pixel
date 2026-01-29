/**
 * AttributionTracker - Multi-Touch Attribution System
 * 
 * Tracks player touchpoints throughout the game to demonstrate
 * attribution modeling concepts:
 * - Linear Attribution: Equal credit to all touchpoints
 * - Time-Decay: More credit to recent touchpoints
 * - Position-Based: 40% first, 40% last, 20% middle
 * - Last-Click: All credit to final touchpoint
 */

import Phaser from 'phaser';
import type { Touchpoint, AttributionResult } from '../types/adtech';

/**
 * AttributionTracker
 * Collects and analyzes player journey touchpoints
 */
export class AttributionTracker extends Phaser.Events.EventEmitter {
  // Scene stored for potential future use
  private touchpoints: Touchpoint[] = [];
  private maxTouchpoints: number = 100;
  private conversionValue: number = 100; // Default conversion value

  constructor(_scene: Phaser.Scene) {
    super();
    console.log('[AttributionTracker] Initialized');
  }

  // ============================================================================
  // TOUCHPOINT MANAGEMENT
  // ============================================================================

  /**
   * Record a touchpoint (player interaction with a channel)
   */
  addTouchpoint(channel: string, value: number = 1, position?: { x: number; y: number }): Touchpoint {
    const touchpoint: Touchpoint = {
      id: `tp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channel,
      timestamp: Date.now(),
      value,
      x: position?.x,
      y: position?.y,
    };

    this.touchpoints.push(touchpoint);

    // Limit touchpoints to prevent memory issues
    if (this.touchpoints.length > this.maxTouchpoints) {
      this.touchpoints.shift();
    }

    this.emit('touchpoint-added', touchpoint);
    return touchpoint;
  }

  /**
   * Get all recorded touchpoints
   */
  getTouchpoints(): Touchpoint[] {
    return [...this.touchpoints];
  }

  /**
   * Get touchpoints by channel
   */
  getTouchpointsByChannel(channel: string): Touchpoint[] {
    return this.touchpoints.filter(tp => tp.channel === channel);
  }

  // ============================================================================
  // ATTRIBUTION MODELS
  // ============================================================================

  /**
   * Calculate Linear Attribution
   * Equal credit distributed to all touchpoints
   */
  calculateLinear(conversionValue?: number): AttributionResult {
    const value = conversionValue ?? this.conversionValue;
    const count = this.touchpoints.length;
    
    if (count === 0) {
      return this.emptyResult('linear');
    }

    const creditPerTouch = value / count;
    const breakdown: Record<string, number> = {};

    this.touchpoints.forEach(tp => {
      breakdown[tp.channel] = (breakdown[tp.channel] ?? 0) + creditPerTouch;
    });

    return {
      model: 'linear',
      touchpoints: [...this.touchpoints],
      attributedValue: value,
      breakdown,
    };
  }

  /**
   * Calculate Time-Decay Attribution
   * More credit to touchpoints closer to conversion
   * Uses exponential decay with configurable half-life
   */
  calculateTimeDecay(halfLife: number = 7 * 24 * 60 * 60 * 1000, conversionValue?: number): AttributionResult {
    const value = conversionValue ?? this.conversionValue;
    
    if (this.touchpoints.length === 0) {
      return this.emptyResult('time-decay');
    }

    const now = Date.now();
    const breakdown: Record<string, number> = {};
    let totalWeight = 0;

    // Calculate weights based on time decay
    const weights = this.touchpoints.map(tp => {
      const age = now - tp.timestamp;
      const weight = Math.pow(0.5, age / halfLife);
      totalWeight += weight;
      return { touchpoint: tp, weight };
    });

    // Distribute value based on weights
    weights.forEach(({ touchpoint, weight }) => {
      const credit = (weight / totalWeight) * value;
      breakdown[touchpoint.channel] = (breakdown[touchpoint.channel] ?? 0) + credit;
    });

    return {
      model: 'time-decay',
      touchpoints: [...this.touchpoints],
      attributedValue: value,
      breakdown,
    };
  }

  /**
   * Calculate Position-Based Attribution
   * 40% to first touch, 40% to last touch, 20% distributed among middle
   */
  calculatePositionBased(conversionValue?: number): AttributionResult {
    const value = conversionValue ?? this.conversionValue;
    
    if (this.touchpoints.length === 0) {
      return this.emptyResult('position-based');
    }

    const breakdown: Record<string, number> = {};

    if (this.touchpoints.length === 1) {
      // Single touchpoint gets all credit
      breakdown[this.touchpoints[0].channel] = value;
    } else if (this.touchpoints.length === 2) {
      // Two touchpoints: 50/50 split
      breakdown[this.touchpoints[0].channel] = value * 0.5;
      breakdown[this.touchpoints[1].channel] = 
        (breakdown[this.touchpoints[1].channel] ?? 0) + value * 0.5;
    } else {
      // First touch: 40%
      const first = this.touchpoints[0];
      breakdown[first.channel] = value * 0.4;

      // Last touch: 40%
      const last = this.touchpoints[this.touchpoints.length - 1];
      breakdown[last.channel] = (breakdown[last.channel] ?? 0) + value * 0.4;

      // Middle touches: 20% distributed equally
      const middleCount = this.touchpoints.length - 2;
      const middleCredit = (value * 0.2) / middleCount;

      for (let i = 1; i < this.touchpoints.length - 1; i++) {
        const tp = this.touchpoints[i];
        breakdown[tp.channel] = (breakdown[tp.channel] ?? 0) + middleCredit;
      }
    }

    return {
      model: 'position-based',
      touchpoints: [...this.touchpoints],
      attributedValue: value,
      breakdown,
    };
  }

  /**
   * Calculate Last-Click Attribution
   * All credit goes to the last touchpoint before conversion
   */
  calculateLastClick(conversionValue?: number): AttributionResult {
    const value = conversionValue ?? this.conversionValue;
    
    if (this.touchpoints.length === 0) {
      return this.emptyResult('last-click');
    }

    const lastTouch = this.touchpoints[this.touchpoints.length - 1];

    return {
      model: 'last-click',
      touchpoints: [...this.touchpoints],
      attributedValue: value,
      breakdown: {
        [lastTouch.channel]: value,
      },
    };
  }

  /**
   * Calculate First-Click Attribution
   * All credit goes to the first touchpoint
   */
  calculateFirstClick(conversionValue?: number): AttributionResult {
    const value = conversionValue ?? this.conversionValue;
    
    if (this.touchpoints.length === 0) {
      return this.emptyResult('first-click');
    }

    const firstTouch = this.touchpoints[0];

    return {
      model: 'first-click',
      touchpoints: [...this.touchpoints],
      attributedValue: value,
      breakdown: {
        [firstTouch.channel]: value,
      },
    };
  }

  /**
   * Get empty result for when no touchpoints exist
   */
  private emptyResult(model: string): AttributionResult {
    return {
      model,
      touchpoints: [],
      attributedValue: 0,
      breakdown: {},
    };
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Set conversion value for calculations
   */
  setConversionValue(value: number): void {
    this.conversionValue = value;
  }

  /**
   * Get unique channels from touchpoints
   */
  getChannels(): string[] {
    return [...new Set(this.touchpoints.map(tp => tp.channel))];
  }

  /**
   * Reset all touchpoints
   */
  reset(): void {
    this.touchpoints = [];
    this.emit('reset');
    console.log('[AttributionTracker] Reset');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.touchpoints = [];
    this.removeAllListeners();
    console.log('[AttributionTracker] Destroyed');
  }
}
