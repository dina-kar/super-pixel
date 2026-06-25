/**
 * StoryIntroScene - Epic Opening Story Sequence
 * 
 * Presents the game's narrative before the main menu:
 * - Kingdom of Adville backstory
 * - First-Party Data Crystal legend
 * - Emperor GAMA's rise
 * - Pixel's destiny
 * 
 * Features cinematic typography, dramatic reveals, and immersive atmosphere.
 */

import Phaser from 'phaser';

interface StoryChapter {
  title?: string;
  lines: string[];
  duration?: number;
  effect?: 'fade' | 'typewriter' | 'flash';
  accentColor?: number;
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    lines: [
      'In the beginning, there was data...',
    ],
    duration: 3000,
    effect: 'fade',
    accentColor: 0x00ff88,
  },
  {
    title: 'THE KINGDOM OF ADVILLE',
    lines: [
      'For millennia, the Kingdom of Adville flourished.',
      'A realm where messages flowed freely,',
      'reaching those who sought them most.',
      '',
      'At its heart lay the sacred relic:',
    ],
    duration: 8000,
    effect: 'typewriter',
    accentColor: 0xffd700,
  },
  {
    title: 'THE FIRST-PARTY DATA CRYSTAL',
    lines: [
      'A luminous artifact of pure user consent,',
      'connecting publishers, advertisers, and audiences',
      'in perfect harmony.',
      '',
      'With it, the Right Message reached the Right User',
      'at the Right Time... always.',
    ],
    duration: 9000,
    effect: 'typewriter',
    accentColor: 0x00ccff,
  },
  {
    lines: [
      'But darkness was rising...',
    ],
    duration: 3000,
    effect: 'flash',
    accentColor: 0xff4444,
  },
  {
    title: 'THE WALLED GARDEN',
    lines: [
      'From the shadows emerged THE WALLED GARDEN—',
      'a massive fortress controlled by the ruthless',
      '',
      '                EMPEROR GAMA',
      '       (Google · Apple · Meta · Amazon)',
      '',
      'Hungry for dominion over all data streams,',
      'GAMA shattered the sacred Crystal.',
    ],
    duration: 11000,
    effect: 'typewriter',
    accentColor: 0xff00ff,
  },
  {
    lines: [
      'Its shards scattered across the ecosystem.',
      'Messages became noise. Ads became spam.',
      'Relevance... was lost.',
    ],
    duration: 6000,
    effect: 'typewriter',
    accentColor: 0x888888,
  },
  {
    lines: [
      'The kingdom fell into chaos.',
      '',
      'Invalid Traffic Bots flooded the realm.',
      'Third-party cookies crumbled to dust.',
      'Addressability faded into memory.',
    ],
    duration: 7000,
    effect: 'typewriter',
    accentColor: 0x666666,
  },
  {
    lines: [
      'But there is hope...',
    ],
    duration: 2500,
    effect: 'fade',
    accentColor: 0x00ff88,
  },
  {
    title: 'PIXEL',
    lines: [
      'You are PIXEL—a sentient ad creative,',
      'born from the last pure impression.',
      '',
      'Small. Glowing. Determined.',
      '',
      'Your mission: traverse six treacherous worlds,',
      'collect the scattered Data Shards,',
      'master the Tech Stack,',
      'and restore ADDRESSABILITY to the kingdom.',
    ],
    duration: 12000,
    effect: 'typewriter',
    accentColor: 0x00ff88,
  },
  {
    lines: [
      'The road ahead is long.',
      'The auctions are fierce.',
      'The privacy walls are high.',
      '',
      'But you... you are the Perfect Message.',
    ],
    duration: 6000,
    effect: 'typewriter',
    accentColor: 0xffd700,
  },
  {
    lines: [
      'NOW GO.',
      '',
      'Defeat Emperor GAMA.',
      'Rebuild the Crystal.',
      'Save AdTech.',
    ],
    duration: 5000,
    effect: 'fade',
    accentColor: 0x00ff88,
  },
];

export class StoryIntroScene extends Phaser.Scene {
  // Scene state
  private currentChapterIndex: number = 0;
  private isTransitioning: boolean = false;
  private canSkip: boolean = false;
  
  // UI Elements
  private background!: Phaser.GameObjects.Graphics;
  private starsContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private contentContainer!: Phaser.GameObjects.Container;
  private contentTexts: Phaser.GameObjects.Text[] = [];
  private skipPrompt!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  
  // Typewriter state
  private typewriterTimer: Phaser.Time.TimerEvent | null = null;
  private currentLineIndex: number = 0;
  private currentCharIndex: number = 0;
  private isTyping: boolean = false;
  
  // Particles
  private dataParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'StoryIntroScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Create immersive background
    this.createBackground(width, height);
    
    // Create starfield
    this.createStarfield(width, height);
    
    // Create data particle effects
    this.createDataParticles(width, height);
    
    // Create text containers
    this.createTextContainers(width, height);
    
    // Create skip prompt
    this.createSkipPrompt(width, height);
    
    // Create progress bar
    this.createProgressBar(width, height);
    
    // Setup input
    this.setupInput();
    
    // Start the story sequence
    this.time.delayedCall(500, () => {
      this.canSkip = true;
      this.showChapter(0);
    });
  }

  /**
   * Create deep space background with gradient
   */
  private createBackground(width: number, height: number): void {
    this.background = this.add.graphics();
    
    // Deep cosmic gradient
    this.background.fillGradientStyle(
      0x000005, 0x000005,
      0x050515, 0x050515,
      1
    );
    this.background.fillRect(0, 0, width, height);
    
    // Nebula-like colored overlays
    const nebula = this.add.graphics();
    nebula.fillStyle(0x220033, 0.15);
    nebula.fillCircle(width * 0.2, height * 0.3, 300);
    nebula.fillStyle(0x002244, 0.12);
    nebula.fillCircle(width * 0.8, height * 0.7, 400);
    nebula.fillStyle(0x003322, 0.1);
    nebula.fillCircle(width * 0.5, height * 0.5, 350);
    
    // Animate nebula breathing
    this.tweens.add({
      targets: nebula,
      alpha: { from: 0.8, to: 1 },
      scale: { from: 1, to: 1.05 },
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Create animated starfield
   */
  private createStarfield(width: number, height: number): void {
    this.starsContainer = this.add.container(0, 0);
    
    // Create different star layers for parallax
    const starLayers = [
      { count: 50, size: 1, alpha: 0.3, speed: 0.1 },
      { count: 30, size: 1.5, alpha: 0.5, speed: 0.2 },
      { count: 20, size: 2, alpha: 0.7, speed: 0.3 },
      { count: 10, size: 3, alpha: 1, speed: 0.5 },
    ];
    
    starLayers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        const star = this.add.graphics();
        star.fillStyle(0xffffff, layer.alpha);
        star.fillCircle(0, 0, layer.size);
        star.setPosition(
          Phaser.Math.Between(0, width),
          Phaser.Math.Between(0, height)
        );
        star.setData('speed', layer.speed);
        star.setData('baseAlpha', layer.alpha);
        this.starsContainer.add(star);
        
        // Twinkle animation
        this.tweens.add({
          targets: star,
          alpha: layer.alpha * 0.3,
          duration: Phaser.Math.Between(1000, 3000),
          yoyo: true,
          repeat: -1,
          delay: Phaser.Math.Between(0, 2000),
          ease: 'Sine.easeInOut',
        });
      }
    });
  }

  /**
   * Create flowing data particle effects
   */
  private createDataParticles(width: number, height: number): void {
    // Create particle texture
    if (!this.textures.exists('story-particle')) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRect(0, 0, 4, 1);
      graphics.generateTexture('story-particle', 4, 1);
      graphics.destroy();
    }
    
    this.dataParticles = this.add.particles(0, height / 2, 'story-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 4000,
      speed: { min: 30, max: 80 },
      angle: { min: -10, max: 10 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.3, end: 0 },
      frequency: 150,
      blendMode: 'ADD',
      tint: 0x00ff88,
    });
    this.dataParticles.setDepth(-1);
  }

  /**
   * Create text containers for story content
   */
  private createTextContainers(width: number, height: number): void {
    // Chapter title
    this.titleText = this.add.text(width / 2, height * 0.25, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setAlpha(0);
    
    // Content container
    this.contentContainer = this.add.container(width / 2, height * 0.5);
  }

  /**
   * Create skip prompt
   */
  private createSkipPrompt(width: number, height: number): void {
    this.skipPrompt = this.add.text(width - 30, height - 30, 'Hold SPACE or ENTER to skip', {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#444466',
    });
    this.skipPrompt.setOrigin(1, 1);
    this.skipPrompt.setAlpha(0);
    
    // Fade in after delay
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: this.skipPrompt,
        alpha: 0.6,
        duration: 500,
      });
    });
  }

  /**
   * Create progress bar
   */
  private createProgressBar(_width: number, height: number): void {
    this.progressBar = this.add.graphics();
    this.progressBar.setPosition(0, height - 4);
    this.updateProgressBar();
  }

  /**
   * Update progress bar
   */
  private updateProgressBar(): void {
    const { width } = this.cameras.main;
    const progress = (this.currentChapterIndex + 1) / STORY_CHAPTERS.length;
    
    this.progressBar.clear();
    this.progressBar.fillStyle(0x333333, 0.5);
    this.progressBar.fillRect(0, 0, width, 4);
    this.progressBar.fillStyle(0x00ff88, 0.8);
    this.progressBar.fillRect(0, 0, width * progress, 4);
  }

  /**
   * Setup input handlers
   */
  private setupInput(): void {
    if (!this.input.keyboard) return;
    
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    
    // Hold to skip acceleration
    let holdTime = 0;
    const skipThreshold = 500; // ms to hold before skipping
    
    const checkSkip = () => {
      if (!this.canSkip) return;
      
      if (spaceKey.isDown || enterKey.isDown) {
        holdTime += 16;
        if (holdTime >= skipThreshold) {
          this.skipStory();
        }
      } else {
        holdTime = 0;
      }
    };
    
    this.time.addEvent({
      delay: 16,
      callback: checkSkip,
      loop: true,
    });
    
    // ESC to skip immediately
    escKey.on('down', () => {
      if (this.canSkip) {
        this.skipStory();
      }
    });
    
    // Click/tap to advance
    this.input.on('pointerdown', () => {
      if (this.canSkip && !this.isTransitioning) {
        this.advanceChapter();
      }
    });
  }

  /**
   * Show a story chapter
   */
  private showChapter(index: number): void {
    if (index >= STORY_CHAPTERS.length) {
      this.endStory();
      return;
    }
    
    this.currentChapterIndex = index;
    this.isTransitioning = true;
    this.updateProgressBar();
    
    const chapter = STORY_CHAPTERS[index];
    
    // Update particle color
    if (chapter.accentColor) {
      this.dataParticles.setParticleTint(chapter.accentColor);
    }
    
    // Clear previous content
    this.clearContent();
    
    // Show title if present
    if (chapter.title) {
      this.showTitle(chapter.title, chapter.accentColor || 0xffffff);
    }
    
    // Show content based on effect type
    const delay = chapter.title ? 1000 : 300;
    this.time.delayedCall(delay, () => {
      this.showContent(chapter);
    });
    
    // Auto-advance after duration
    const duration = chapter.duration || 5000;
    this.time.delayedCall(duration, () => {
      if (this.currentChapterIndex === index) {
        this.advanceChapter();
      }
    });
  }

  /**
   * Show chapter title with dramatic effect
   */
  private showTitle(title: string, color: number): void {
    const colorHex = '#' + color.toString(16).padStart(6, '0');
    
    this.titleText.setText(title);
    this.titleText.setColor(colorHex);
    this.titleText.setAlpha(0);
    this.titleText.setScale(0.5);
    
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      scale: 1,
      duration: 800,
      ease: 'Back.out',
    });
    
    // Glow effect
    this.titleText.setShadow(0, 0, colorHex, 15, true, true);
  }

  /**
   * Show chapter content
   */
  private showContent(chapter: StoryChapter): void {
    this.isTransitioning = false;
    
    const startY = chapter.title ? 50 : -50;
    
    // Create text objects for each line
    chapter.lines.forEach((_line, index) => {
      const text = this.add.text(0, startY + index * 28, '', {
        fontFamily: '"Courier New", monospace',
        fontSize: '15px',
        color: '#cccccc',
        align: 'center',
      });
      text.setOrigin(0.5);
      text.setAlpha(0);
      this.contentContainer.add(text);
      this.contentTexts.push(text);
    });
    
    // Apply effect
    switch (chapter.effect) {
      case 'fade':
        this.showContentFade(chapter.lines);
        break;
      case 'flash':
        this.showContentFlash(chapter.lines, chapter.accentColor || 0xffffff);
        break;
      case 'typewriter':
      default:
        this.showContentTypewriter(chapter.lines);
        break;
    }
  }

  /**
   * Fade in content
   */
  private showContentFade(lines: string[]): void {
    lines.forEach((line, index) => {
      const text = this.contentTexts[index];
      if (text) {
        text.setText(line);
        this.tweens.add({
          targets: text,
          alpha: 1,
          y: text.y + 10,
          duration: 1000,
          delay: index * 200,
          ease: 'Power2',
        });
      }
    });
  }

  /**
   * Flash in content (dramatic effect)
   */
  private showContentFlash(lines: string[], color: number): void {
    const colorHex = '#' + color.toString(16).padStart(6, '0');
    
    // Screen flash
    this.cameras.main.flash(200, 
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff,
      true
    );
    
    lines.forEach((line, index) => {
      const text = this.contentTexts[index];
      if (text) {
        text.setText(line);
        text.setColor(colorHex);
        text.setFontSize(20);
        text.setAlpha(1);
        text.setScale(1.5);
        
        this.tweens.add({
          targets: text,
          scale: 1,
          duration: 500,
          ease: 'Back.out',
        });
      }
    });
  }

  /**
   * Typewriter effect for content
   */
  private showContentTypewriter(lines: string[]): void {
    this.currentLineIndex = 0;
    this.currentCharIndex = 0;
    this.isTyping = true;
    
    // Make all text visible but empty
    this.contentTexts.forEach(text => text.setAlpha(1));
    
    this.typeNextChar(lines);
  }

  /**
   * Type next character
   */
  private typeNextChar(lines: string[]): void {
    if (!this.isTyping) return;
    
    if (this.currentLineIndex >= lines.length) {
      this.isTyping = false;
      return;
    }
    
    const currentLine = lines[this.currentLineIndex];
    const text = this.contentTexts[this.currentLineIndex];
    
    if (this.currentCharIndex < currentLine.length) {
      const char = currentLine[this.currentCharIndex];
      text.setText(text.text + char);
      this.currentCharIndex++;
      
      // Variable speed
      let delay = 20;
      if (char === '.' || char === '!' || char === '?') delay = 250;
      else if (char === ',') delay = 100;
      else if (char === ' ') delay = 10;
      else if (char === '—') delay = 150;
      
      this.typewriterTimer = this.time.delayedCall(delay, () => this.typeNextChar(lines));
    } else {
      // Next line
      this.currentLineIndex++;
      this.currentCharIndex = 0;
      this.typewriterTimer = this.time.delayedCall(50, () => this.typeNextChar(lines));
    }
  }

  /**
   * Clear current content
   */
  private clearContent(): void {
    // Stop typewriter
    this.isTyping = false;
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }
    
    // Fade out title
    this.tweens.add({
      targets: this.titleText,
      alpha: 0,
      duration: 300,
    });
    
    // Clear content texts
    this.contentTexts.forEach(text => {
      this.tweens.add({
        targets: text,
        alpha: 0,
        duration: 200,
        onComplete: () => text.destroy(),
      });
    });
    this.contentTexts = [];
  }

  /**
   * Advance to next chapter
   */
  private advanceChapter(): void {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    // Clear current and show next
    this.time.delayedCall(300, () => {
      this.showChapter(this.currentChapterIndex + 1);
    });
  }

  /**
   * Skip to end of story
   */
  private skipStory(): void {
    this.canSkip = false;
    this.isTyping = false;
    
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    
    this.endStory();
  }

  /**
   * End story and transition to main menu
   */
  private endStory(): void {
    this.canSkip = false;
    
    // Epic finale
    this.cameras.main.flash(500, 0, 255, 136);
    
    // Show game title
    const { width, height } = this.cameras.main;
    
    const gameTitle = this.add.text(width / 2, height / 2 - 50, 'SUPER PIXEL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '48px',
      color: '#00ff88',
      stroke: '#003322',
      strokeThickness: 6,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#001100',
        blur: 10,
        fill: true,
      },
    });
    gameTitle.setOrigin(0.5);
    gameTitle.setAlpha(0);
    gameTitle.setScale(0.5);
    
    const subtitle = this.add.text(width / 2, height / 2 + 20, 'THE ADTECH ODYSSEY', {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#00ccff',
      letterSpacing: 8,
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    
    // Clear previous content
    this.clearContent();
    this.titleText.setAlpha(0);
    
    // Animate title
    this.tweens.add({
      targets: gameTitle,
      alpha: 1,
      scale: 1,
      duration: 1000,
      ease: 'Back.out',
    });
    
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 600,
      delay: 500,
    });
    
    // Transition to main menu
    this.time.delayedCall(2500, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('MainMenuScene');
      });
    });
  }

  /**
   * Cleanup
   */
  shutdown(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    this.contentTexts = [];
  }
}
