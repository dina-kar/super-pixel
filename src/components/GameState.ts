/**
 * GameState - Global State Management Singleton
 * 
 * Manages persistent game state across scenes including:
 * - Total budget spent across worlds
 * - Unlocked mechanics and achievements
 * - Encyclopedia entries discovered
 * - Save/Load functionality
 */

import type { GameStateData } from '../types/adtech';

const STORAGE_KEY = 'adtech-odyssey-save';

/**
 * Default initial game state
 */
const DEFAULT_STATE: GameStateData = {
  worlds: [],
  currentWorldIndex: 0,
  globalBudget: 10000, // Starting campaign budget: $10,000
  achievements: [],
  savedProgress: {
    worldIndex: 0,
    levelIndex: 0,
    timestamp: Date.now(),
  },
  settings: {
    volume: 0.7,
    difficulty: 'normal',
    colorblindMode: false,
    showDebug: false,
  },
};

/**
 * GameState Singleton
 * Provides centralized state management and persistence
 */
export class GameState {
  private state: GameStateData;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.state = this.loadState();
    console.log('[GameState] Initialized with budget:', this.state.globalBudget);
  }

  /**
   * Load saved state from localStorage or return default
   */
  private loadState(): GameStateData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameStateData;
        console.log('[GameState] Loaded saved progress');
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (error) {
      console.warn('[GameState] Failed to load save data:', error);
    }
    return { ...DEFAULT_STATE };
  }

  /**
   * Save current state to localStorage
   */
  save(): void {
    try {
      this.state.savedProgress.timestamp = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      console.log('[GameState] Progress saved');
    } catch (error) {
      console.error('[GameState] Failed to save progress:', error);
    }
  }

  /**
   * Reset to default state (new game)
   */
  reset(): void {
    this.state = { ...DEFAULT_STATE };
    localStorage.removeItem(STORAGE_KEY);
    console.log('[GameState] Reset to default');
    this.emit('state-reset', this.state);
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  get globalBudget(): number {
    return this.state.globalBudget;
  }

  get currentWorld(): number {
    return this.state.currentWorldIndex;
  }

  get settings() {
    return this.state.settings;
  }

  get achievements(): string[] {
    return [...this.state.achievements];
  }

  getState(): Readonly<GameStateData> {
    return this.state;
  }

  // ============================================================================
  // SETTERS & MODIFIERS
  // ============================================================================

  /**
   * Spend budget globally (affects total campaign spend)
   */
  spendBudget(amount: number): boolean {
    if (this.state.globalBudget >= amount) {
      this.state.globalBudget -= amount;
      this.emit('budget-changed', this.state.globalBudget);
      
      if (this.state.globalBudget <= 0) {
        this.emit('budget-depleted', null);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Add budget (bonuses, rewards)
   */
  addBudget(amount: number): void {
    this.state.globalBudget += amount;
    this.emit('budget-changed', this.state.globalBudget);
  }

  /**
   * Set current world index
   */
  setCurrentWorld(index: number): void {
    this.state.currentWorldIndex = index;
    this.state.savedProgress.worldIndex = index;
    this.emit('world-changed', index);
  }

  /**
   * Unlock an achievement
   */
  unlockAchievement(id: string): boolean {
    if (!this.state.achievements.includes(id)) {
      this.state.achievements.push(id);
      this.emit('achievement-unlocked', id);
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Update settings
   */
  updateSettings(partial: Partial<GameStateData['settings']>): void {
    this.state.settings = { ...this.state.settings, ...partial };
    this.emit('settings-changed', this.state.settings);
    this.save();
  }

  /**
   * Toggle debug mode
   */
  toggleDebug(): boolean {
    this.state.settings.showDebug = !this.state.settings.showDebug;
    this.emit('debug-toggled', this.state.settings.showDebug);
    return this.state.settings.showDebug;
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  /**
   * Subscribe to state changes
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from state changes
   */
  off(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }
}
