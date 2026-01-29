 Here is a comprehensive **`plan.md`** file structured for an AI coding agent to build **Super Pixel: The AdTech Odyssey** incrementally.

```markdown
# Super Pixel: The AdTech Odyssey - Development Plan
## AI Coding Agent Instructions

**Project Type:** 2D Platformer Educational Game  
**Tech Stack:** Phaser 3 (v3.70+) + TypeScript + Vite + Tailwind CSS  
**Target:** Web (Chrome/Edge/Firefox/Safari)  
**Resolution:** 1280x720 (16:9), responsive scaling

---

## Phase 0: Project Scaffold & Tooling
**Objective:** Initialize project structure with hot-reload dev environment

### Prompt 0.1: Initialize Vite + Phaser + TypeScript
Create a new Vite project with TypeScript template. Install Phaser 3.70 or later. Set up the folder structure:
```
/src
  /scenes          (Game worlds)
  /components      (AdTech mechanic classes)
  /entities        (Player, enemies, NPCs)
  /ui              (HTML overlay components)
  /types           (TypeScript interfaces)
  /assets          (Static assets)
    /sprites
    /tilemaps     (Tiled JSON exports)
    /audio
```

Configure `vite.config.ts` with proper asset handling and dev server settings. Create `tsconfig.json` with strict mode enabled.

### Prompt 0.2: HTML Overlay Setup
Create `index.html` with:
- Fullscreen canvas container for Phaser
- Absolute positioned overlay div (`#ui-layer`) for HUD elements (Budget meter, CPM counter, Attribution timeline)
- Tailwind CDN inclusion for styling HUD elements
- Loading screen div that hides when Phaser signals ready

### Prompt 0.3: Base Scene Architecture
Create `BaseAdTechScene.ts` abstract class extending `Phaser.Scene` with:
- `budgetSystem: BudgetManager` (handles CPM/CPC/CPA calculations)
- `viewabilityTracker: ViewabilityEngine` (checks if game objects are in viewport)
- `attributionModel: AttributionTracker` (tracks touchpoints for World 6)
- Abstract method `setupAdTechMechanics()`
- Debug mode toggle (F1 key) showing hitboxes and data flows

---

## Phase 1: Core Engine & World 1 (Inventory Valley)
**Objective:** Implement basic platforming + foundational AdTech metrics (CPM, CPC, Viewability)

### Prompt 1.1: Player Entity - "Pixel"
Create `entities/Player.ts`:
- Sprite: 32x32 white square (placeholder) with glow effect
- Physics: Arcade physics, 800px/sec max speed, jump velocity 600
- States: `small` (text ad), `big` (image ad), `powered` (video ad) - Mario-style power-up system
- Methods: `collectImpression()`, `registerClick(cost: number)`, `convert()`
- Property: `inventory: InventoryManager` tracking collected items

### Prompt 1.2: Budget Manager System
Create `components/BudgetManager.ts`:
```typescript
interface BudgetConfig {
  totalBudget: number;
  pricingModel: 'CPM' | 'CPC' | 'CPA';
  currentSpend: number;
}

class BudgetManager extends Phaser.Events.EventEmitter {
  // CPM: Cost per 1000 impressions (distance traveled)
  // CPC: Cost per click (action button presses)
  // CPA: Cost per conversion (flagpole touches)
  calculateSpend(event: GameEvent): void
  getRemainingBudget(): number
  getROAS(): number // Return on Ad Spend
}
```

### Prompt 1.3: Viewability Engine
Create `components/ViewabilityEngine.ts`:
- Monitors game objects against camera viewport
- Implements MRC standard: 50% of object visible for 1+ second = viewable impression
- Emits `viewable-impression` event with coordinates
- Visual debug overlay: Green rectangle when viewable, red when not

### Prompt 1.4: World 1 Scene - Inventory Valley
Create `scenes/World1_InventoryValley.ts`:
- Extends BaseAdTechScene
- Tilemap: 3-level platformer using "grassland" aesthetic with billboard platforms
- Mechanics:
  - **Ad Slots:** Fixed-width platforms (128px) vs flexible platforms (stretchable)
  - **CPM Counter:** Every 1000 pixels traveled = 1 CPM unit, deduct from budget
  - **Click Stream:** Enemies require "click" (spacebar) to defeat, cost CPC from budget
  - **Conversion Zone:** Golden flagpole at end, triggers conversion event
  
### Prompt 1.5: UI Overlay - World 1 HUD
Create `ui/World1HUD.ts`:
- HTML/Tailwind component showing:
  - Budget remaining (progress bar)
  - Current pricing model toggle (CPM/CPC/CPA buttons)
  - Viewability percentage (live)
  - Impression counter (rolling 1000s)

---

## Phase 2: AdTech Entities & Power-ups
**Objective:** Implement creative format transformations and inventory types

### Prompt 2.1: Creative Format Power-ups
Create `entities/powerups/`:
- `TextMushroom.ts`: Basic form, small hitbox, fast
- `ImageFlower.ts`: Medium form, can break "premium inventory" blocks (gold bricks)
- `VideoStar.ts`: Invincibility + auto-plays through enemies, limited duration (15s)
- RichMediaBox.ts (for World 3): Expandable hitbox on key hold

### Prompt 2.2: Inventory Block Types
Create `entities/blocks/`:
- `PremiumInventory.ts`: Gold blocks, high yield (100 pts), requires Image/Video form to break
- `RemnantInventory.ts`: Brown blocks, low yield (10 pts), breakable by any form
- `LongTailPlatform.ts`: Moving platforms (unpredictable movement patterns)

### Prompt 2.3: The Ad Server Gate
Create `entities/AdServerGate.ts`:
- Checkpoint system representing First-Party vs Third-Party ad servers
- Visual: Server rack gateway with data pipes
- Logic: Validates collected impressions before allowing progress

---

## Phase 3: World 2 - The Tech Stack Towers (DSP/SSP/DMP)
**Objective:** Vertical level design, auction mechanics introduction, data collection

### Prompt 3.1: SSP Tower Mechanics
Create `components/SSPAuction.ts`:
- Floor price visualization: Horizontal line across screen
- Player must jump above floor price line to register as "valid bid"
- Dynamic floor pricing: Line moves up/down based on "competition" (random NPC bidders shown as ghosts)

### Prompt 3.2: DSP Bidder System
Create `components/DSPBidder.ts`:
- 100-millisecond decision window (visual countdown)
- Bid request popup showing user data (geolocation, device type)
- Player presses UP to bid, DOWN to pass
- Bid shading AI: Suggests bid price between floor and estimated value

### Prompt 3.3: DMP Data Collection
Create `components/DMPSystem.ts`:
- 1st-Party Data coins: Gold, permanent collection
- 3rd-Party Data coins: Silver, disappear after 3rd level (cookie deprecation simulation)
- Data taxonomy: Coins categorized (Demographic, Behavioral, Contextual)
- Profile building: UI shows "User Profile" filling up as coins collected

### Prompt 3.4: World 2 Scene - Tech Stack Towers
- Vertical scrolling level (Mario-style tower)
- Three zones:
  1. **SSP Zone:** Ascending with floor price barriers
  2. **DSP Zone:** Falling with bid decision gates
  3. **DMP Zone:** Horizontal maze with data collection
- NPCs: S.S. Peter (robot helper), Debbie DSP (floating AI companion)

---

## Phase 4: World 3 - Multimedia Mediums
**Objective:** Format-specific mechanics (Native, Video, Audio, Rich Media)

### Prompt 4.1: Native Ninja Mechanics
Create `scenes/World3_NativeNinja.ts`:
- Stealth mechanic: Player must match background color to pass "editorial content" zones
- Disclosure Badge meter: Must maintain minimum "Ad Disclosure" visibility or level fails (transparency compliance)
- Blend mode: Phaser.BlendModes.MULTIPLY for camouflage effect

### Prompt 4.2: Video Volcano
Create `scenes/World3_VideoVolcano.ts`:
- VAST protocol simulation: Platforms appear in sequence (preroll, midroll, postroll)
- Streaming buffer zones: Pause platforms where player must wait (loading simulation)
- Skip button: Appears after 5 seconds, grants bonus if waited full 30s

### Prompt 4.3: Audio Alps
Create `scenes/World3_AudioAlps.ts`:
- Rhythm-based platforms: Only visible/usable on audio beat (use Phaser.Sound for metronome)
- Companion banners: Static platforms that appear alongside audio path
- Frequency visualization: Background reacts to BGM frequency data

### Prompt 4.4: Rich Media Rainbow
- Expandable platforms: Start small, expand on player proximity (scroll expansion)
- Interstitial doors: Full-screen transition minigames between sections
- Gamified blocks: Breakout-style mini-game within the level to unlock path

---

## Phase 5: World 4 - The Auction Arena
**Objective:** Real-time bidding mechanics, auction types, pricing strategies

### Prompt 5.1: Auction Mechanics Engine
Create `components/AuctionEngine.ts`:
```typescript
type AuctionType = 'first-price' | 'second-price';

class AuctionEngine {
  startAuction(item: InventorySlot, bidders: AIBidder[]);
  calculateWinner(bids: number[], type: AuctionType): BidResult;
  // Second-price: Winner pays second-highest + $0.01
  // First-price: Winner pays exact bid
}
```

### Prompt 5.2: Bid Shading AI
Create `components/BidShading.ts`:
- Visual prediction line showing optimal bid range
- Risk meter: High bid = win but low profit, Low bid = lose but save budget
- Machine learning visualization: Line adjusts based on previous wins/losses

### Prompt 5.3: Waterfall vs Header Bidding
Create `mechanics/Waterfall.ts`:
- Sequential platform activation (Waterfall): Platforms appear one by one, if missed, next one spawns
- Parallel platform activation (Header Bidding): All platforms visible simultaneously, must choose best one quickly

### Prompt 5.4: World 4 Scene - Auction Arena
- Colosseum aesthetic with digital screens showing bid prices
- Three sub-levels:
  1. Second-Price Stadium: Observe opponent bids, optimize shading
  2. First-Price Forge: Exact payment risk management
  3. Header Bidding Heights: Parallel platform navigation

---

## Phase 6: World 5 - Identity & Privacy Citadel
**Objective:** Cookie deprecation, Universal IDs, Privacy Sandbox, Consent Management

### Prompt 6.1: Cookie Lifecycle System
Create `components/CookieSystem.ts`:
- 3rd-Party Cookie platforms: Visible but flickering (unstable), disappear permanently after player leaves screen (deprecation)
- 1st-Party Cookie platforms: Solid, persistent, save checkpoint progress
- Cookie sync animations: Visual lines connecting platforms when "syncing"

### Prompt 6.2: Universal ID Bridge
Create `entities/UniversalIDBridge.ts`:
- Connects separate device islands (Mobile Island to Desktop Island)
- Persistent across scene transitions (if player collects UID in World 5, available in World 6)
- Visual: Rainbow bridge effect

### Prompt 6.3: Consent Management Platform (CMP)
Create `components/ConsentManager.ts`:
- Consent gates block paths with popup (styled as TCF 2.0 consent string)
- Player must toggle "Purposes" (checkboxes) to proceed:
  - Purpose 1: Store info (enables saving)
  - Purpose 2: Select ads (enables targeting)
  - Purpose 3: Measure (enables analytics)
- If rejected: Level becomes harder (less data = generic platforms)

### Prompt 6.4: Privacy Sandbox Mechanics
- Differential privacy fog: Screen gets noisy/pixelated when collecting too much data too fast
- FLoC (Federated Learning of Cohorts): Group with AI players instead of individual tracking
- Clean Room: Cooperative puzzle where player matches encrypted patterns without seeing raw data

### Prompt 6.5: Enemies - IVT Detection
Create `entities/enemies/IVTBots.ts`:
- Invalid Traffic bots: Fake platforms that look solid but player falls through
- Bot detection visualization: "Verify-Bot" companion highlights real vs fake platforms

---

## Phase 7: World 6 - Attribution Castle
**Objective:** Attribution models, time-decay, multi-touch tracking

### Prompt 7.1: Attribution Models Engine
Create `components/AttributionModels.ts`:
```typescript
interface Touchpoint {
  channel: string;
  timestamp: number;
  value: number;
}

class AttributionEngine {
  calculateLinear(touchpoints: Touchpoint[]): AttributionResult;
  calculateTimeDecay(touchpoints: Touchpoint[], halfLife: number): AttributionResult;
  calculatePositionBased(touchpoints: Touchpoint[]): AttributionResult; // 40/20/40
  calculateLastClick(touchpoints: Touchpoint[]): AttributionResult;
}
```

### Prompt 7.2: Temporal Level Design
Create `scenes/World6_AttributionCastle.ts`:
- Time-travel mechanic: Player can rewind 5 seconds to place "ghost" touchpoints
- Visual timeline at top: Shows all touchpoints in chronological order
- Color-coded paths: Each jump leaves colored trail representing channel (Organic=blue, Paid=red, Social=green)

### Prompt 7.3: Attribution Windows
- Countdown timers on platforms: Must reach conversion flag within 7-day, 30-day, or 90-day window
- Window visualization: Clock face on HUD showing attribution window shrinking

### Prompt 7.4: Multi-Touch Boss
- Boss requires hitting 4 different "channel switches" before final blow (teaching multi-touch necessity)
- Last-click only mode: Boss regenerates health if only final hit matters (demonstrating model limitation)

---

## Phase 8: Final World - The Walled Garden
**Objective:** GAMA ecosystem, data independence, final synthesis

### Prompt 8.1: Four Garden Zones
Create `scenes/FinalWorld_WalledGarden.ts` with 4 distinct sub-maps:
1. **Search Garden:** Vertical bamboo forest with intent-based platforms (appear only when searched for)
2. **Social Garden:** Network graph platforms connected by "friend" lines, viral mechanics
3. **Retail Garden:** Shopping cart platforms, SKU-based obstacles
4. **App Garden:** Walled castle with drawbridges (in-app vs web barriers)

### Prompt 8.2: Emperor GAMA Boss Battle
Create `entities/bosses/EmperorGAMA.ts`:
- Four-phase battle using mechanics from all worlds:
  - Phase 1: **Data Silo Shield** - Must use Universal IDs to break
  - Phase 2: **Auction Manipulation** - Bid against GAMA's inflated bids
  - Phase 3: **Privacy Attack** - Dodge GDPR compliance beams while maintaining consent
  - Phase 4: **Attribution Hijack** - GAMA claims all conversions; player must prove multi-touch

### Prompt 8.3: Ending & Data Crystal Reassembly
- Cutscene: First-Party Data Crystal reassembly animation
- Victory metrics: Show total ROAS, Viewability average, Attribution model efficiency
- New Game+: Unlock "Agency Mode" simulation

---

## Phase 9: UI/UX, Audio & Polish
**Objective:** Professional presentation, educational tooltips, audio design

### Prompt 9.1: Educational Tooltip System
Create `ui/EducationalTooltip.ts`:
- Context-sensitive help: Hover over "Floor Price" mechanic → tooltip explains "SSP Floor Pricing"
- AdOps Guides: Interactive ? blocks that pause game and show diagram (e.g., "How Header Bidding Works")
- Glossary: Accessible menu defining all AdTech terms encountered

### Prompt 9.2: Audio Implementation
- BGM: 8-bit chiptune for Worlds 1-2, shifting to modern synthwave for World 6
- SFX:
  - `coin.wav`: CPM impression collection
  - `bid_win.wav`: Successful auction bid
  - `conversion_chime.wav`: Level complete (attribution success)
  - `privacy_shield.wav`: Consent granted

### Prompt 9.3: Responsive & Accessibility
- Mobile touch controls: Virtual D-pad and action buttons for tablets
- Colorblind modes: Patterns instead of colors for data taxonomy (coins)
- Pause menu: "AdTech Encyclopedia" searchable database

### Prompt 9.4: Save System
- LocalStorage implementation:
  - Save collected Data Shards (progress)
  - Save unlocked Attribution Models
  - Save high scores (lowest CPA campaigns)

---

## File Structure Reference

```
src/
├── main.ts                 (Entry point, Phaser config)
├── scenes/
│   ├── Boot.ts
│   ├── World1_InventoryValley.ts
│   ├── World2_TechStack.ts
│   ├── World3_Multimedia.ts
│   ├── World4_AuctionArena.ts
│   ├── World5_PrivacyCitadel.ts
│   ├── World6_AttributionCastle.ts
│   ├── FinalWorld_WalledGarden.ts
│   └── UIManager.ts        (HTML overlay coordination)
├── entities/
│   ├── Player.ts
│   ├── NPC.ts
│   ├── blocks/
│   │   ├── PremiumInventory.ts
│   │   └── RemnantInventory.ts
│   ├── powerups/
│   │   ├── TextMushroom.ts
│   │   ├── ImageFlower.ts
│   │   └── VideoStar.ts
│   └── enemies/
│       ├── IVTBots.ts
│       └── EmperorGAMA.ts
├── components/
│   ├── BudgetManager.ts
│   ├── ViewabilityEngine.ts
│   ├── AuctionEngine.ts
│   ├── AttributionModels.ts
│   ├── CookieSystem.ts
│   └── DMPSystem.ts
├── ui/
│   ├── HUD.ts
│   ├── EducationalTooltip.ts
│   └── Modals.ts
└── types/
    └── adtech.d.ts         (TypeScript interfaces)
```

---

## Implementation Notes for Agent

1. **Physics Tuning:** Use arcade physics with these constants:
   - Gravity: 1000
   - Player drag: 500 (for snappy platforming)
   - Tilemap collision: 32x32 grid

2. **State Management:** Use Phaser's built-in DataManager (`this.data`) for scene-local state, but use a global `GameState` singleton for:
   - Total budget spent across worlds
   - Unlocked mechanics
   - Encyclopedia entries

3. **Asset Pipeline:** Use placeholder colored rectangles for all sprites initially. Do not implement real art until Phase 9.

4. **Testing Milestones:**
   - Phase 1 Complete: Player can jump, collect 1000 impressions, trigger conversion
   - Phase 3 Complete: Power-up state machine works (small→big→powered)
   - Phase 5 Complete: Auction bid logic correctly calculates second-price outcomes
   - Phase 7 Complete: Attribution timeline accurately distributes credit across touchpoints

5. **Code Quality:**
   - All classes must have JSDoc comments explaining the AdTech concept they model
   - Use EventEmitter for loose coupling between components (e.g., BudgetManager emits `budget-depleted` rather than directly killing player)
   - Implement `destroy()` methods for all custom components to prevent memory leaks

**Begin with Phase 0, then proceed sequentially. Do not skip phases. Each phase builds on previous mechanics.**
```

This plan.md provides granular, executable instructions while maintaining the educational narrative arc of the AdTech Book. Each phase produces a playable milestone, allowing for iterative testing and refinement.
