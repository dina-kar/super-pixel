# Transition to "The Open Web: Ascendancy" using Three.js

This document outlines the architectural and technical transition from "Super Pixel: The AdTech Odyssey" (a 2D Phaser platformer) to "The Open Web: Ascendancy" (an HD-2D isometric RPG) utilizing **Three.js** and **React Three Fiber (R3F)** to perfectly capture the provided concept art aesthetic.

## User Review Required

> [!CAUTION]
> **Complete Rendering Engine Migration**
> We are officially sunsetting Phaser 3 and migrating the renderer to **Three.js** via **React Three Fiber**. This requires a complete rewrite of the rendering layer, but allows us to achieve the stunning depth of field, bloom, and 3D voxel environments seen in the concept images.
> 
> **Architecture Decision:**
> Since the project already has React configured in `package.json`, we will use `@react-three/fiber` and `@react-three/drei`. This allows us to declaratively build 3D scenes and seamlessly overlay React components for the RPG UI (Command Menu, HP/MP bars).

---

## Technical Roadmap: HD-2D in Three.js

To replicate the concept images (16-bit 2D sprites in rich 3D environments), we will follow this specific Three.js rendering pipeline:

### 1. Camera & Perspective (The Diorama Effect)
- **Camera setup:** We will use a `PerspectiveCamera` positioned at a high angle (e.g., `[20, 20, 20]` looking at `[0, 0, 0]`) with a relatively low Field of View (FOV ~30) to flatten the perspective slightly, simulating an isometric look while maintaining depth.
- **Post-Processing (Tilt-Shift):** Using `@react-three/postprocessing`, we will apply a `DepthOfField` effect. By blurring the foreground and background based on focal distance, we create the signature "miniature diorama" look seen in the HD-2D concept images.
- **Bloom:** A `Bloom` pass will be added to make neon elements (like the Imperial Spam Bot's red lights or glowing server pillars) pop intensely against the dark sci-fi environments.

### 2. Environment Creation (Generative Voxel Asset Pipeline)
- **Generative 3D Voxel Maps:** Instead of relying on external 3D modeling software, we will write **generative Three.js code** to procedurally construct the environments. We will build an internal level-parser that takes a 2D grid array (like `[ [1,1,1], [1,0,1] ]`) and extrudes it into 3D voxel terrain using `InstancedMesh`. This allows us to rapidly build levels entirely in code while keeping performance high.
- **Materials:** We will use `MeshStandardMaterial` for the environment to allow for realistic lighting, reflections (like the polished floors in the Hegemony Core image), and dynamic shadows.
- **Lighting:** A mix of `AmbientLight` for base visibility, `DirectionalLight` for casting crisp shadows, and `PointLight`s placed near glowing objects to create localized volumetric-style lighting.

### 3. Grid-Based Movement & Combat Navigation
- **Locked to Grid:** Character movement during exploration will be locked to the tile grid (classic RPG style). A custom movement controller will handle smooth lerping from one grid coordinate `(x, z)` to the next over a set duration, ensuring the character always snaps perfectly to the voxel grid.
- **Pathfinding:** A simple A* pathfinding algorithm will be implemented to prevent walking through solid voxel walls or obstacles.

### 4. Character Sprites & Animation (The 2D Element)
To place flat 16-bit characters into the 3D world:
- **Billboarding:** We will use a Three.js `PlaneGeometry` for each character. A custom script or the `<Billboard>` component from Drei will force the plane to always face the camera on the Y-axis.
- **Pixel-Perfect Textures:** Textures loaded onto the planes must have `magFilter` and `minFilter` set to `THREE.NearestFilter` to prevent anti-aliasing and keep the pixels crisp.
- **UV Sprite Animation:** 
  - We will load character sprite sheets (e.g., an image containing idle, walk, and attack frames).
  - Instead of moving the plane, we will animate the `texture.offset.x` and `texture.offset.y` over time in a `useFrame` loop, shifting the UV coordinates to play the correct frame of the sprite sheet at 10-15 frames per second.

---

## Proposed Implementation Steps

### Phase 1: Engine Migration & Setup
Remove Phaser dependencies and install the Three.js ecosystem.
- `npm uninstall phaser`
- `npm install three @react-three/fiber @react-three/drei @react-three/postprocessing`

#### [MODIFY] [package.json](file:///c:/Users/user/Desktop/super-pixel/package.json)
#### [NEW] [src/App.tsx](file:///c:/Users/user/Desktop/super-pixel/src/App.tsx)
- Sets up the main React Canvas and UI overlay structure.

### Phase 2: Core HD-2D Systems
Build the reusable Three.js components that define the visual style.

#### [NEW] [src/components/HD2DCamera.tsx](file:///c:/Users/user/Desktop/super-pixel/src/components/HD2DCamera.tsx)
- Manages perspective and the Post-Processing pipeline (DepthOfField, Bloom).

#### [NEW] [src/components/VoxelMapGenerator.tsx](file:///c:/Users/user/Desktop/super-pixel/src/components/VoxelMapGenerator.tsx)
- Generates 3D voxel terrain using `InstancedMesh` based on 2D arrays.

#### [NEW] [src/components/SpriteAnimator.tsx](file:///c:/Users/user/Desktop/super-pixel/src/components/SpriteAnimator.tsx)
- Handles billboarding and UV offset math to animate 2D sprites in 3D space.

#### [NEW] [src/components/GridMovementController.tsx](file:///c:/Users/user/Desktop/super-pixel/src/components/GridMovementController.tsx)
- Manages grid-locked player movement, lerping position vectors securely between tiles.

### Phase 3: Act I Environment & Combat Arena
Build the first playable scene (The Inventory Wastes).

#### [NEW] [src/scenes/Act1_InventoryWastes.tsx](file:///c:/Users/user/Desktop/super-pixel/src/scenes/Act1_InventoryWastes.tsx)
- Implements the grid map for the first level.

#### [NEW] [src/components/CombatSystem.tsx](file:///c:/Users/user/Desktop/super-pixel/src/components/CombatSystem.tsx)
- State machine managing Turn-Based combat.

### Phase 4: UI Overlay
Recreate the classic JRPG UI seen in the concept images using React/Tailwind over the Three.js canvas.

#### [NEW] [src/ui/BattleMenu.tsx](file:///c:/Users/user/Desktop/super-pixel/src/ui/BattleMenu.tsx)
- Renders the Command Menu (Attack, Skill, Item) and the HP/MP status bars.

---

## Verification Plan

### Automated Tests
- Type checking with `tsc -b`.

### Manual Verification
1. Launch the dev server and verify the Three.js canvas renders the generative voxel map.
2. Ensure keyboard input moves the player character exactly one grid tile at a time.
3. Confirm the Post-Processing effects (Tilt-Shift blur) are active and creating the diorama effect.
4. Verify the 2D sprite correctly billboards (faces the camera) and cycles animation frames smoothly.
