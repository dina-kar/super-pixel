/**
 * ViewabilityEngine - MRC Standard Viewability Tracking
 * 
 * Implements the Media Rating Council (MRC) viewability standard:
 * - 50% of ad pixels must be visible in the viewport
 * - Must be visible for at least 1 continuous second
 * 
 * In-game, this translates to:
 * - Game objects (platforms, collectibles) only "count" when viewable
 * - Visual feedback shows viewability state (green = viewable, red = not)
 * - Teaches players about ad measurement standards
 */

import Phaser from 'phaser';
import type { ViewabilityState, ImpressionData } from '../types/adtech';

/**
 * ViewabilityEngine
 * Monitors game objects against camera viewport
 */
export class ViewabilityEngine extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private trackedObjects: Map<string, TrackedObject> = new Map();
  private viewabilityThreshold: number = 0.5; // 50% visibility required
  private timeThreshold: number = 1000; // 1 second (1000ms) required
  private debugGraphics: Phaser.GameObjects.Graphics | null = null;
  private debugMode: boolean = false;
  
  // Metrics
  private totalImpressions: number = 0;
  private viewableImpressions: number = 0;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    
    // Set up update loop for viewability checks
    this.scene.events.on('update', this.update, this);
    
    console.log('[ViewabilityEngine] Initialized with MRC standards');
  }

  // ============================================================================
  // OBJECT TRACKING
  // ============================================================================

  /**
   * Start tracking a game object for viewability
   */
  track(id: string, gameObject: Phaser.GameObjects.GameObject & { x: number; y: number; width?: number; height?: number }): void {
    const tracked: TrackedObject = {
      id,
      gameObject,
      state: {
        isViewable: false,
        percentageVisible: 0,
        timeInViewport: 0,
        lastChecked: Date.now(),
      },
      hasTriggeredViewable: false,
    };
    
    this.trackedObjects.set(id, tracked);
  }

  /**
   * Stop tracking a game object
   */
  untrack(id: string): void {
    this.trackedObjects.delete(id);
  }

  /**
   * Check if an object is currently viewable
   */
  isViewable(id: string): boolean {
    const tracked = this.trackedObjects.get(id);
    return tracked?.state.isViewable ?? false;
  }

  // ============================================================================
  // VIEWABILITY CALCULATIONS
  // ============================================================================

  /**
   * Calculate percentage of object visible in camera viewport
   */
  private calculateVisibility(gameObject: Phaser.GameObjects.GameObject & { x: number; y: number; width?: number; height?: number }): number {
    const camera = this.scene.cameras.main;
    
    // Get object bounds
    const objWidth = gameObject.width ?? 32;
    const objHeight = gameObject.height ?? 32;
    const objLeft = gameObject.x - objWidth / 2;
    const objRight = gameObject.x + objWidth / 2;
    const objTop = gameObject.y - objHeight / 2;
    const objBottom = gameObject.y + objHeight / 2;
    
    // Get camera bounds (world coordinates)
    const camLeft = camera.scrollX;
    const camRight = camera.scrollX + camera.width;
    const camTop = camera.scrollY;
    const camBottom = camera.scrollY + camera.height;
    
    // Calculate overlap
    const overlapLeft = Math.max(objLeft, camLeft);
    const overlapRight = Math.min(objRight, camRight);
    const overlapTop = Math.max(objTop, camTop);
    const overlapBottom = Math.min(objBottom, camBottom);
    
    // No overlap
    if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) {
      return 0;
    }
    
    // Calculate visible area percentage
    const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
    const totalArea = objWidth * objHeight;
    
    return overlapArea / totalArea;
  }

  /**
   * Update viewability state for all tracked objects
   */
  private update(_time: number, delta: number): void {
    const now = Date.now();
    
    this.trackedObjects.forEach((tracked, id) => {
      const { gameObject, state } = tracked;
      
      // Skip if game object is destroyed
      if (!gameObject.active) {
        return;
      }
      
      // Calculate current visibility percentage
      const visibility = this.calculateVisibility(gameObject);
      const wasViewable = state.isViewable;
      
      state.percentageVisible = visibility;
      state.lastChecked = now;
      
      // Check if meets visibility threshold (50%)
      if (visibility >= this.viewabilityThreshold) {
        // Accumulate time in viewport
        state.timeInViewport += delta;
        
        // Check if meets time threshold (1 second)
        if (state.timeInViewport >= this.timeThreshold && !tracked.hasTriggeredViewable) {
          state.isViewable = true;
          tracked.hasTriggeredViewable = true;
          
          // Emit viewable impression event
          this.viewableImpressions++;
          this.totalImpressions++;
          
          const impressionData: ImpressionData = {
            id: `${id}-${now}`,
            timestamp: now,
            viewable: true,
            percentageVisible: visibility,
            duration: state.timeInViewport,
          };
          
          this.emit('viewable-impression', impressionData);
          console.log(`[ViewabilityEngine] Viewable impression: ${id}`);
        }
      } else {
        // Reset time if visibility drops below threshold
        state.timeInViewport = 0;
        state.isViewable = false;
        
        // Reset trigger flag when leaving viewport
        if (wasViewable) {
          tracked.hasTriggeredViewable = false;
          this.emit('left-viewport', { id, state });
        }
      }
    });
    
    // Update debug overlay if enabled
    if (this.debugMode && this.debugGraphics) {
      this.renderDebugOverlay();
    }
  }

  // ============================================================================
  // DEBUG VISUALIZATION
  // ============================================================================

  /**
   * Enable debug mode with visual overlays
   */
  enableDebug(): void {
    this.debugMode = true;
    
    if (!this.debugGraphics) {
      this.debugGraphics = this.scene.add.graphics();
      this.debugGraphics.setDepth(9999);
    }
    
    console.log('[ViewabilityEngine] Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebug(): void {
    this.debugMode = false;
    
    if (this.debugGraphics) {
      this.debugGraphics.clear();
    }
    
    console.log('[ViewabilityEngine] Debug mode disabled');
  }

  /**
   * Toggle debug mode
   */
  toggleDebug(): boolean {
    if (this.debugMode) {
      this.disableDebug();
    } else {
      this.enableDebug();
    }
    return this.debugMode;
  }

  /**
   * Render debug overlay showing viewability state
   */
  private renderDebugOverlay(): void {
    if (!this.debugGraphics) return;
    
    this.debugGraphics.clear();
    
    this.trackedObjects.forEach((tracked) => {
      const { gameObject, state } = tracked;
      
      if (!gameObject.active) return;
      
      const objWidth = (gameObject as any).width ?? 32;
      const objHeight = (gameObject as any).height ?? 32;
      const x = gameObject.x - objWidth / 2;
      const y = gameObject.y - objHeight / 2;
      
      // Color based on viewability
      const color = state.isViewable 
        ? 0x00ff00 // Green - viewable
        : (state.percentageVisible >= this.viewabilityThreshold)
          ? 0xffff00 // Yellow - visible but time threshold not met
          : 0xff0000; // Red - not visible enough
      
      const alpha = 0.3;
      
      this.debugGraphics!.fillStyle(color, alpha);
      this.debugGraphics!.fillRect(x, y, objWidth, objHeight);
      
      this.debugGraphics!.lineStyle(2, color, 1);
      this.debugGraphics!.strokeRect(x, y, objWidth, objHeight);
    });
  }

  // ============================================================================
  // METRICS
  // ============================================================================

  /**
   * Get viewability rate (viewable impressions / total impressions)
   */
  getViewabilityRate(): number {
    return this.totalImpressions > 0 
      ? (this.viewableImpressions / this.totalImpressions) * 100 
      : 0;
  }

  /**
   * Get total viewable impressions
   */
  getViewableImpressions(): number {
    return this.viewableImpressions;
  }

  /**
   * Get total impressions
   */
  getTotalImpressions(): number {
    return this.totalImpressions;
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * Reset tracking state
   */
  reset(): void {
    this.trackedObjects.clear();
    this.totalImpressions = 0;
    this.viewableImpressions = 0;
    
    if (this.debugGraphics) {
      this.debugGraphics.clear();
    }
    
    console.log('[ViewabilityEngine] Reset');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.scene.events.off('update', this.update, this);
    
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = null;
    }
    
    this.trackedObjects.clear();
    this.removeAllListeners();
    
    console.log('[ViewabilityEngine] Destroyed');
  }
}

/**
 * Internal interface for tracked object data
 */
interface TrackedObject {
  id: string;
  gameObject: Phaser.GameObjects.GameObject & { x: number; y: number; width?: number; height?: number; active: boolean };
  state: ViewabilityState;
  hasTriggeredViewable: boolean;
}
