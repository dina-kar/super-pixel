/**
 * LevelIntroScene - Story/Narrative Screen Before Level Start
 * 
 * Displays story context and level objectives before gameplay begins.
 * Features:
 * - Typewriter text effect for narrative
 * - Animated background with data streams
 * - Level objectives and tips
 * - Dramatic reveal of level name
 */

import Phaser from 'phaser';

interface LevelIntroConfig {
  levelKey: string;
  levelName: string;
  worldNumber: number;
  story: string[];
  objectives: string[];
  tips: string[];
  accentColor: number;
}

// Level configurations
const LEVEL_INTROS: Record<string, LevelIntroConfig> = {
  'World1_InventoryValley': {
    levelKey: 'World1_InventoryValley',
    levelName: 'INVENTORY VALLEY',
    worldNumber: 1,
    story: [
      'The year is 2024. The digital advertising ecosystem',
      'is a vast, interconnected network of data streams',
      'and server racks spanning the globe.',
      '',
      'You are PIXEL, a humble ad impression beginning',
      'your journey through the complex world of AdTech.',
      '',
      'Your mission: Navigate the Inventory Valley,',
      'collect valuable impression data, and reach',
      'the conversion goal at the end.',
      '',
      'But beware... not all traffic is what it seems.',
      'Invalid Traffic bots lurk in the shadows,',
      'and your budget is limited.',
      '',
      'Every click costs. Every impression counts.',
      'Choose your path wisely.',
    ],
    objectives: [
      '• Collect impression coins to build campaign value',
      '• Defeat enemies by clicking (jumping on them)',
      '• Find power-ups to transform your ad format',
      '• Reach the conversion flagpole to complete the level',
      '• Manage your budget - don\'t overspend!',
    ],
    tips: [
      'TIP: Text ads (small) are fast but weak',
      'TIP: Image ads (big) can break premium inventory',
      'TIP: Video ads (powered) give temporary invincibility',
      'TIP: Watch your viewability - be seen to succeed!',
    ],
    accentColor: 0x00ff88,
  },
};

export class LevelIntroScene extends Phaser.Scene {
  // Current level config
  private levelConfig!: LevelIntroConfig;
  
  // UI elements
  private background!: Phaser.GameObjects.Graphics;
  private dataStreams: Phaser.GameObjects.Graphics[] = [];
  private worldLabel!: Phaser.GameObjects.Text;
  private levelTitle!: Phaser.GameObjects.Text;
  private storyContainer!: Phaser.GameObjects.Container;
  private storyTexts: Phaser.GameObjects.Text[] = [];
  private objectivesContainer!: Phaser.GameObjects.Container;
  private skipPrompt!: Phaser.GameObjects.Text;
  private continuePrompt!: Phaser.GameObjects.Text;
  
  // Typewriter state
  private currentLineIndex: number = 0;
  private currentCharIndex: number = 0;
  private typewriterTimer: Phaser.Time.TimerEvent | null = null;
  private isTyping: boolean = false;
  private hasShownObjectives: boolean = false;
  
  // Animation state
  private canSkip: boolean = false;
  private canContinue: boolean = false;

  constructor() {
    super({ key: 'LevelIntroScene' });
  }

  init(data: { levelKey?: string }): void {
    const levelKey = data.levelKey || 'World1_InventoryValley';
    this.levelConfig = LEVEL_INTROS[levelKey] || LEVEL_INTROS['World1_InventoryValley'];
    
    // Reset state
    this.currentLineIndex = 0;
    this.currentCharIndex = 0;
    this.isTyping = false;
    this.hasShownObjectives = false;
    this.canSkip = false;
    this.canContinue = false;
    this.storyTexts = [];
    this.dataStreams = [];
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Create immersive background
    this.createBackground(width, height);
    
    // Create animated data streams
    this.createDataStreams(width, height);
    
    // Create world/level header
    this.createHeader(width);
    
    // Create story container
    this.createStoryArea(width, height);
    
    // Create objectives container (hidden initially)
    this.createObjectivesArea(width, height);
    
    // Create prompts
    this.createPrompts(width, height);
    
    // Set up input
    this.setupInput();
    
    // Start the intro sequence
    this.startIntroSequence();
  }

  /**
   * Create deep space background
   */
  private createBackground(width: number, height: number): void {
    this.background = this.add.graphics();
    
    // Deep gradient background
    this.background.fillGradientStyle(
      0x050510, 0x050510,
      0x0a0a20, 0x0a0a20,
      1
    );
    this.background.fillRect(0, 0, width, height);
    
    // Subtle grid pattern
    this.background.lineStyle(1, 0x111122, 0.2);
    for (let x = 0; x < width; x += 40) {
      this.background.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      this.background.lineBetween(0, y, width, y);
    }
    
    // Vignette effect
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.4);
    vignette.fillRect(0, 0, 100, height);
    vignette.fillRect(width - 100, 0, 100, height);
    vignette.fillRect(0, 0, width, 60);
    vignette.fillRect(0, height - 60, width, 60);
    
    // Floating particles
    this.createParticles(width, height);
  }

  /**
   * Create floating ambient particles
   */
  private createParticles(width: number, height: number): void {
    // Create particle texture
    if (!this.textures.exists('intro-particle')) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(2, 2, 2);
      graphics.generateTexture('intro-particle', 4, 4);
      graphics.destroy();
    }
    
    this.add.particles(0, 0, 'intro-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 6000,
      speed: { min: 10, max: 30 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.4, end: 0 },
      frequency: 300,
      blendMode: 'ADD',
      tint: this.levelConfig.accentColor,
    });
  }

  /**
   * Create animated data stream lines
   */
  private createDataStreams(width: number, height: number): void {
    const streamCount = 8;
    
    for (let i = 0; i < streamCount; i++) {
      const stream = this.add.graphics();
      const y = 80 + (height - 160) * (i / streamCount);
      const direction = i % 2 === 0 ? 1 : -1;
      
      // Store animation data using Phaser's data manager
      stream.setData('streamY', y);
      stream.setData('streamDirection', direction);
      stream.setData('streamSpeed', 50 + Math.random() * 100);
      stream.setData('streamOffset', Math.random() * width);
      
      stream.setAlpha(0.1 + Math.random() * 0.15);
      this.dataStreams.push(stream);
    }
    
    // Animate streams
    this.time.addEvent({
      delay: 16,
      callback: () => this.updateDataStreams(width),
      loop: true,
    });
  }

  /**
   * Update data stream animations
   */
  private updateDataStreams(width: number): void {
    const accentColor = this.levelConfig.accentColor;
    
    this.dataStreams.forEach(stream => {
      stream.clear();
      
      const y = stream.getData('streamY') as number;
      const direction = stream.getData('streamDirection') as number;
      const speed = stream.getData('streamSpeed') as number;
      let offset = stream.getData('streamOffset') as number;
      
      // Update offset
      offset += direction * speed * 0.016;
      if (offset > width) offset = 0;
      if (offset < 0) offset = width;
      stream.setData('streamOffset', offset);
      
      // Draw stream with data packets
      stream.lineStyle(1, accentColor, 0.6);
      stream.lineBetween(0, y, width, y);
      
      // Data packets
      stream.fillStyle(accentColor, 0.8);
      for (let x = offset; x < width; x += 120) {
        stream.fillRect(x, y - 2, 20, 4);
      }
    });
  }

  /**
   * Create world/level header
   */
  private createHeader(width: number): void {
    // World number badge
    const badgeX = width / 2;
    const badgeY = 80;
    
    // Badge background
    const badge = this.add.graphics();
    badge.fillStyle(this.levelConfig.accentColor, 0.2);
    badge.fillRoundedRect(badgeX - 60, badgeY - 20, 120, 40, 8);
    badge.lineStyle(2, this.levelConfig.accentColor, 0.8);
    badge.strokeRoundedRect(badgeX - 60, badgeY - 20, 120, 40, 8);
    badge.setAlpha(0);
    
    // World label
    this.worldLabel = this.add.text(badgeX, badgeY, `WORLD ${this.levelConfig.worldNumber}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ffffff',
    });
    this.worldLabel.setOrigin(0.5);
    this.worldLabel.setAlpha(0);
    
    // Level title
    this.levelTitle = this.add.text(badgeX, badgeY + 60, this.levelConfig.levelName, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '28px',
      color: `#${this.levelConfig.accentColor.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.levelTitle.setOrigin(0.5);
    this.levelTitle.setAlpha(0);
    this.levelTitle.setScale(0.5);
    
    // Animate in
    this.tweens.add({
      targets: [badge, this.worldLabel],
      alpha: 1,
      duration: 800,
      delay: 200,
      ease: 'Power2',
    });
    
    this.tweens.add({
      targets: this.levelTitle,
      alpha: 1,
      scale: 1,
      duration: 1000,
      delay: 600,
      ease: 'Back.out',
    });
  }

  /**
   * Create story text area
   */
  private createStoryArea(_width: number, _height: number): void {
    this.storyContainer = this.add.container(80, 200);
    
    // Create empty text objects for each story line
    const storyStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#aabbcc',
      lineSpacing: 4,
    };
    
    this.levelConfig.story.forEach((_, index) => {
      const text = this.add.text(0, index * 24, '', storyStyle);
      this.storyTexts.push(text);
      this.storyContainer.add(text);
    });
    
    this.storyContainer.setAlpha(0);
    
    // Fade in container
    this.tweens.add({
      targets: this.storyContainer,
      alpha: 1,
      duration: 500,
      delay: 1200,
      onComplete: () => {
        this.startTypewriter();
      },
    });
  }

  /**
   * Create objectives area (shown after story)
   */
  private createObjectivesArea(width: number, height: number): void {
    this.objectivesContainer = this.add.container(width / 2, height / 2 + 100);
    
    // Title
    const objTitle = this.add.text(0, -80, 'MISSION OBJECTIVES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: `#${this.levelConfig.accentColor.toString(16).padStart(6, '0')}`,
    });
    objTitle.setOrigin(0.5);
    this.objectivesContainer.add(objTitle);
    
    // Objectives list
    const objStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      color: '#ffffff',
      lineSpacing: 8,
    };
    
    this.levelConfig.objectives.forEach((obj, index) => {
      const objText = this.add.text(-200, -40 + index * 28, obj, objStyle);
      this.objectivesContainer.add(objText);
    });
    
    // Random tip
    const tip = Phaser.Math.RND.pick(this.levelConfig.tips);
    const tipText = this.add.text(0, 120, tip, {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#ffcc00',
      fontStyle: 'italic',
    });
    tipText.setOrigin(0.5);
    this.objectivesContainer.add(tipText);
    
    // Initially hidden
    this.objectivesContainer.setAlpha(0);
    this.objectivesContainer.setScale(0.9);
  }

  /**
   * Create skip and continue prompts
   */
  private createPrompts(width: number, height: number): void {
    // Skip prompt (during story)
    this.skipPrompt = this.add.text(width - 40, height - 40, 'SPACE to skip...', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#444466',
    });
    this.skipPrompt.setOrigin(1, 1);
    this.skipPrompt.setAlpha(0);
    
    // Continue prompt (after objectives)
    this.continuePrompt = this.add.text(width / 2, height - 60, 'Press ENTER to begin your campaign', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: `#${this.levelConfig.accentColor.toString(16).padStart(6, '0')}`,
    });
    this.continuePrompt.setOrigin(0.5);
    this.continuePrompt.setAlpha(0);
    
    // Blinking animation for continue
    this.tweens.add({
      targets: this.continuePrompt,
      alpha: { from: 1, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      paused: true,
    });
  }

  /**
   * Set up keyboard input
   */
  private setupInput(): void {
    if (!this.input.keyboard) return;
    
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    
    spaceKey.on('down', () => {
      if (this.canSkip && !this.hasShownObjectives) {
        this.skipToObjectives();
      }
    });
    
    enterKey.on('down', () => {
      if (this.canContinue) {
        this.startLevel();
      }
    });
    
    // Also allow click to continue
    this.input.on('pointerdown', () => {
      if (this.canSkip && !this.hasShownObjectives) {
        this.skipToObjectives();
      } else if (this.canContinue) {
        this.startLevel();
      }
    });
  }

  /**
   * Start the intro sequence
   */
  private startIntroSequence(): void {
    // Enable skip after a short delay
    this.time.delayedCall(1500, () => {
      this.canSkip = true;
      this.tweens.add({
        targets: this.skipPrompt,
        alpha: 0.6,
        duration: 300,
      });
    });
  }

  /**
   * Start typewriter effect for story
   */
  private startTypewriter(): void {
    this.isTyping = true;
    this.typeNextCharacter();
  }

  /**
   * Type the next character in the story
   */
  private typeNextCharacter(): void {
    if (!this.isTyping) return;
    
    const story = this.levelConfig.story;
    
    // Check if we're done with all lines
    if (this.currentLineIndex >= story.length) {
      this.finishStory();
      return;
    }
    
    const currentLine = story[this.currentLineIndex];
    const currentText = this.storyTexts[this.currentLineIndex];
    
    // Add next character
    if (this.currentCharIndex < currentLine.length) {
      const char = currentLine[this.currentCharIndex];
      currentText.setText(currentText.text + char);
      this.currentCharIndex++;
      
      // Variable typing speed
      let delay = 25;
      if (char === '.' || char === '!' || char === '?') delay = 300;
      else if (char === ',') delay = 150;
      else if (char === ' ') delay = 15;
      
      this.typewriterTimer = this.time.delayedCall(delay, () => this.typeNextCharacter());
    } else {
      // Move to next line
      this.currentLineIndex++;
      this.currentCharIndex = 0;
      
      // Small pause between lines
      this.typewriterTimer = this.time.delayedCall(100, () => this.typeNextCharacter());
    }
  }

  /**
   * Skip to objectives
   */
  private skipToObjectives(): void {
    // Stop typewriter
    this.isTyping = false;
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    
    // Fill in remaining text instantly
    this.levelConfig.story.forEach((line, index) => {
      if (this.storyTexts[index]) {
        this.storyTexts[index].setText(line);
      }
    });
    
    // Transition to objectives
    this.showObjectives();
  }

  /**
   * Finish story and show objectives
   */
  private finishStory(): void {
    this.isTyping = false;
    
    // Brief pause then show objectives
    this.time.delayedCall(1000, () => {
      this.showObjectives();
    });
  }

  /**
   * Show objectives screen
   */
  private showObjectives(): void {
    if (this.hasShownObjectives) return;
    this.hasShownObjectives = true;
    
    // Hide skip prompt
    this.tweens.add({
      targets: this.skipPrompt,
      alpha: 0,
      duration: 200,
    });
    
    // Fade out story
    this.tweens.add({
      targets: this.storyContainer,
      alpha: 0,
      y: this.storyContainer.y - 30,
      duration: 500,
    });
    
    // Show objectives
    this.tweens.add({
      targets: this.objectivesContainer,
      alpha: 1,
      scale: 1,
      duration: 600,
      delay: 300,
      ease: 'Back.out',
      onComplete: () => {
        this.showContinuePrompt();
      },
    });
  }

  /**
   * Show continue prompt
   */
  private showContinuePrompt(): void {
    this.canContinue = true;
    
    this.tweens.add({
      targets: this.continuePrompt,
      alpha: 1,
      duration: 300,
    });
    
    // Start blinking
    const blink = this.tweens.getTweensOf(this.continuePrompt)[0];
    if (blink) {
      blink.resume();
    }
  }

  /**
   * Start the actual level
   */
  private startLevel(): void {
    this.canContinue = false;
    
    // Epic transition
    this.cameras.main.flash(300, 0, 255, 136);
    
    this.tweens.add({
      targets: this.levelTitle,
      scale: 3,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
    });
    
    this.cameras.main.fadeOut(800, 0, 0, 0);
    
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(this.levelConfig.levelKey);
    });
  }

  /**
   * Clean up
   */
  shutdown(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    this.dataStreams = [];
    this.storyTexts = [];
  }
}
