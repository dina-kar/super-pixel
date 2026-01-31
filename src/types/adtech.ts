/**
 * AdTech Game Type Definitions
 * Central repository for all TypeScript interfaces and types used across the game
 */

// ============================================================================
// BUDGET & PRICING MODELS
// ============================================================================

export type PricingModel = 'CPM' | 'CPC' | 'CPA';

export interface BudgetConfig {
  totalBudget: number;
  pricingModel: PricingModel;
  currentSpend: number;
}

export interface BudgetState {
  remaining: number;
  spent: number;
  roas: number; // Return on Ad Spend
  impressions: number;
  clicks: number;
  conversions: number;
}

// ============================================================================
// GAME EVENTS
// ============================================================================

export type GameEventType = 
  | 'impression'
  | 'click'
  | 'conversion'
  | 'viewable-impression'
  | 'invalid-traffic'
  | 'budget-depleted';

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  value: number;
  x?: number;
  y?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// VIEWABILITY & IMPRESSIONS
// ============================================================================

export interface ViewabilityState {
  isViewable: boolean;
  percentageVisible: number;
  timeInViewport: number; // milliseconds
  lastChecked: number;
}

export interface ImpressionData {
  id: string;
  timestamp: number;
  viewable: boolean;
  percentageVisible: number;
  duration: number;
}

// ============================================================================
// INVENTORY & POWER-UPS
// ============================================================================

export type CreativeFormat = 'small' | 'big' | 'powered';

export interface InventoryItem {
  id: string;
  type: CreativeFormat;
  value: number;
  timestamp: number;
}

export interface InventoryState {
  items: InventoryItem[];
  totalValue: number;
  capacity: number;
}

// ============================================================================
// AUCTION MECHANICS
// ============================================================================

export type AuctionType = 'first-price' | 'second-price';

export interface Bid {
  bidderId: string;
  amount: number;
  timestamp: number;
}

export interface AuctionResult {
  winnerId: string;
  winAmount: number;
  auctionType: AuctionType;
  allBids: Bid[];
}

// ============================================================================
// SSP (SUPPLY-SIDE PLATFORM) TYPES
// ============================================================================

export interface FloorPriceConfig {
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number;
}

export interface FloorPriceEvent {
  price: number;
  demand: number;
  competition: number;
  timestamp: number;
}

export interface GhostBidderData {
  id: string;
  name: string;
  currentBid: number;
  maxBid: number;
  aggression: number;
}

// ============================================================================
// DSP (DEMAND-SIDE PLATFORM) TYPES
// ============================================================================

export interface BidRequestData {
  id: string;
  inventoryId: string;
  floorPrice: number;
  timestamp: number;
  userData: UserSignals;
  contextData: ContextSignals;
}

export interface UserSignals {
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'ctv';
  geo: string;
  segments: string[];
  frequency: number;
}

export interface ContextSignals {
  domain: string;
  category: string;
  viewability: number;
  adPosition: 'above-fold' | 'below-fold';
}

export interface BidResponseData {
  requestId: string;
  bidAmount: number;
  didBid: boolean;
  timestamp: number;
  responseTime: number;
}

export interface BidShadingData {
  suggestedBid: number;
  confidence: number;
  rationale: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================================================
// DMP (DATA MANAGEMENT PLATFORM) TYPES
// ============================================================================

export type DataPartyType = 'first-party' | 'third-party';

export interface DataCoinConfig {
  type: DataPartyType;
  dataType: DataType;
  value: number;
  label: string;
  expiresAtLevel?: number;
}

export interface AudienceSegmentData {
  id: string;
  name: string;
  category: DataType;
  requiredPoints: number;
  isUnlocked: boolean;
  description: string;
}

// ============================================================================
// ATTRIBUTION TRACKING
// ============================================================================

export interface Touchpoint {
  id: string;
  channel: string; // 'organic', 'paid', 'social', 'direct'
  timestamp: number;
  value: number;
  x?: number;
  y?: number;
}

export interface AttributionResult {
  model: string; // 'linear', 'time-decay', 'position-based', 'last-click'
  touchpoints: Touchpoint[];
  attributedValue: number;
  breakdown: Record<string, number>; // channel -> attributed value
}

// ============================================================================
// COOKIE & PRIVACY
// ============================================================================

export type CookieType = 'first-party' | 'third-party';

export interface CookieData {
  id: string;
  type: CookieType;
  timestamp: number;
  expiryTime: number;
  data: Record<string, any>;
}

export interface ConsentState {
  purpose1: boolean; // Store info
  purpose2: boolean; // Select ads
  purpose3: boolean; // Measure
}

// ============================================================================
// DATA COLLECTION
// ============================================================================

export type DataType = 'demographic' | 'behavioral' | 'contextual' | 'technographic';

export interface DataPoint {
  id: string;
  type: DataType;
  value: string | number;
  timestamp: number;
  source: string;
}

export interface UserProfile {
  data: DataPoint[];
  score: number;
  lastUpdated: number;
}

// ============================================================================
// PLAYER STATE
// ============================================================================

export interface PlayerState {
  x: number;
  y: number;
  format: CreativeFormat;
  velocity: { x: number; y: number };
  isJumping: boolean;
  inventory: InventoryState;
  health: number;
}

// ============================================================================
// LEVEL/SCENE STATE
// ============================================================================

export interface LevelConfig {
  name: string;
  width: number;
  height: number;
  gravity: number;
  tilemapKey?: string;
  difficulty: number;
}

export interface WorldState {
  currentWorld: number;
  currentLevel: number;
  budgetState: BudgetState;
  inventoryState: InventoryState;
  touchpoints: Touchpoint[];
  unlockedMechanics: string[];
  completedLevels: number[];
}

// ============================================================================
// NPC & DIALOGUE
// ============================================================================

export interface DialogueOption {
  text: string;
  callback: () => void;
}

export interface NPCState {
  name: string;
  x: number;
  y: number;
  dialogue: string[];
  currentDialogueIndex: number;
  isActive: boolean;
}

// ============================================================================
// ENEMY TYPES
// ============================================================================

export interface EnemyState {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  direction: 1 | -1;
}

export interface IVTBotState extends EnemyState {
  type: 'fake' | 'bot';
  detectionRadius: number;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface HUDState {
  budgetRemaining: number;
  impressions: number;
  viewability: number;
  pricingModel: PricingModel;
  isPaused: boolean;
  showTutorial: boolean;
}

export interface MenuState {
  isOpen: boolean;
  selectedOption: number;
  options: string[];
}

// ============================================================================
// GAME STATE (GLOBAL)
// ============================================================================

export interface GameStateData {
  worlds: WorldState[];
  currentWorldIndex: number;
  globalBudget: number;
  achievements: string[];
  savedProgress: {
    worldIndex: number;
    levelIndex: number;
    timestamp: number;
  };
  settings: {
    volume: number;
    difficulty: 'easy' | 'normal' | 'hard';
    colorblindMode: boolean;
    showDebug: boolean;
  };
}
