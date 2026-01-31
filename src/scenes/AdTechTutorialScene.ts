/**
 * AdTechTutorialScene - Educational Content Before Each World
 * 
 * Teaches AdTech concepts through:
 * - Animated explanations
 * - Interactive diagrams
 * - Quiz questions to test understanding
 * 
 * Players must pass the quiz to proceed to the level.
 */

import Phaser from 'phaser';

interface Concept {
  title: string;
  explanation: string[];
  diagram?: string; // ASCII/emoji diagram
  example?: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface WorldTutorial {
  worldKey: string;
  worldName: string;
  worldNumber: number;
  color: number;
  concepts: Concept[];
  quiz: QuizQuestion[];
}

// Tutorial content for each world
const WORLD_TUTORIALS: Record<string, WorldTutorial> = {
  'World1_InventoryValley': {
    worldKey: 'World1_InventoryValley',
    worldName: 'Inventory Valley',
    worldNumber: 1,
    color: 0x00ff88,
    concepts: [
      {
        title: 'What is Ad Inventory?',
        explanation: [
          'Ad inventory is the space available on a website',
          'or app where ads can be displayed.',
          '',
          'Think of it like empty billboards waiting for ads!',
          '',
          'Publishers (website owners) sell this space,',
          'and advertisers buy it to show their messages.',
        ],
        diagram: '📱 [  AD SLOT  ] 📱',
        example: 'A news website might have 3 ad slots: header, sidebar, and footer.',
      },
      {
        title: 'CPM - Cost Per Mille',
        explanation: [
          'CPM = Cost Per Mille (thousand impressions)',
          '',
          'If CPM is $5, advertisers pay $5 for every',
          '1,000 times their ad is shown.',
          '',
          'This is the most common pricing model',
          'for brand awareness campaigns.',
        ],
        diagram: '👁️ × 1,000 = 💰 CPM',
        example: '$10 CPM × 50,000 impressions = $500 total cost',
      },
      {
        title: 'Impressions & Viewability',
        explanation: [
          'An IMPRESSION is counted each time an ad loads.',
          '',
          'But did the user actually SEE the ad?',
          '',
          'VIEWABILITY measures if an ad was visible:',
          '• 50% of pixels in view',
          '• For at least 1 second',
          '',
          'High viewability = better ad performance!',
        ],
        diagram: '👁️ [AD VISIBLE] ✓  vs  [AD HIDDEN] ✗',
      },
    ],
    quiz: [
      {
        question: 'What is "ad inventory"?',
        options: [
          'A warehouse for storing ads',
          'Available space on websites for displaying ads',
          'A list of all ads ever created',
          'The number of advertisers in the market',
        ],
        correctIndex: 1,
        explanation: 'Ad inventory refers to the available advertising space on websites and apps.',
      },
      {
        question: 'If CPM is $8, how much does 10,000 impressions cost?',
        options: ['$8', '$80', '$800', '$8,000'],
        correctIndex: 1,
        explanation: 'CPM = $8 per 1,000 impressions. So 10,000 impressions = $8 × 10 = $80',
      },
      {
        question: 'For an ad to be "viewable" by MRC standards, what is required?',
        options: [
          '100% of pixels visible for 5 seconds',
          '50% of pixels visible for 1 second',
          'The ad must be clicked',
          'The ad must play with sound',
        ],
        correctIndex: 1,
        explanation: 'The MRC standard requires 50% of ad pixels in view for at least 1 second.',
      },
    ],
  },
  'World2_TechStack': {
    worldKey: 'World2_TechStack',
    worldName: 'Tech Stack Towers',
    worldNumber: 2,
    color: 0x66ccff,
    concepts: [
      {
        title: 'SSP - Supply-Side Platform',
        explanation: [
          'Publishers use SSPs to SELL their ad inventory.',
          '',
          'The SSP helps publishers:',
          '• Set minimum prices (floor prices)',
          '• Connect to multiple ad buyers',
          '• Maximize revenue',
          '',
          'Think of it as the publisher\'s selling agent!',
        ],
        diagram: '📰 Publisher → [SSP] → 💰 Revenue',
      },
      {
        title: 'DSP - Demand-Side Platform',
        explanation: [
          'Advertisers use DSPs to BUY ad inventory.',
          '',
          'The DSP helps advertisers:',
          '• Find the right audiences',
          '• Bid on ad impressions',
          '• Optimize campaigns automatically',
          '',
          'Think of it as the advertiser\'s buying agent!',
        ],
        diagram: '🏢 Advertiser → [DSP] → 📱 Reach Users',
      },
      {
        title: 'Real-Time Bidding (RTB)',
        explanation: [
          'When you visit a webpage, an AUCTION happens!',
          '',
          'In just 100 milliseconds:',
          '1. SSP announces ad opportunity',
          '2. DSPs evaluate and submit bids',
          '3. Highest bidder wins',
          '4. Ad is displayed',
          '',
          'This happens billions of times daily!',
        ],
        diagram: '🔨 [AUCTION] → Bid $2.50 vs $3.00 vs $2.75 → Winner: $3.00!',
      },
      {
        title: 'Floor Price',
        explanation: [
          'Publishers set a MINIMUM BID they\'ll accept.',
          '',
          'If floor price = $2.00:',
          '• Bid $1.50 → REJECTED ❌',
          '• Bid $2.50 → ACCEPTED ✓',
          '',
          'This protects inventory value!',
        ],
        diagram: '📊 Floor: $2.00 ═══════════════',
      },
    ],
    quiz: [
      {
        question: 'Who uses an SSP (Supply-Side Platform)?',
        options: ['Advertisers', 'Publishers', 'Users', 'Search engines'],
        correctIndex: 1,
        explanation: 'Publishers use SSPs to sell their ad inventory and maximize revenue.',
      },
      {
        question: 'What is Real-Time Bidding (RTB)?',
        options: [
          'Buying ads in advance for a fixed price',
          'An instant auction for each ad impression',
          'A monthly subscription for ads',
          'Buying ads directly from publishers',
        ],
        correctIndex: 1,
        explanation: 'RTB is an instant auction that happens in ~100ms when a user loads a page.',
      },
      {
        question: 'If the floor price is $3.00, which bid wins?',
        options: [
          'No bid wins - floor too high',
          'Bid of $2.50',
          'Bid of $3.25',
          'Bid of $2.00',
        ],
        correctIndex: 2,
        explanation: 'Only bids at or above the floor price ($3.00) are considered. $3.25 > $3.00 ✓',
      },
    ],
  },
  'World3_NativeNinja': {
    worldKey: 'World3_NativeNinja',
    worldName: 'Native Ninja',
    worldNumber: 3,
    color: 0xffb24d,
    concepts: [
      {
        title: 'Native Advertising',
        explanation: [
          'Native ads MATCH the look and feel of',
          'the content around them.',
          '',
          'They blend in naturally:',
          '• Same fonts and colors',
          '• Similar format to articles',
          '• Non-disruptive experience',
          '',
          'But they MUST be labeled as "Sponsored"!',
        ],
        diagram: '📰 Article | 📰 Article | 📢 Sponsored | 📰 Article',
      },
      {
        title: 'Disclosure Requirements',
        explanation: [
          'Native ads must be TRANSPARENT.',
          '',
          'Required labels include:',
          '• "Sponsored"',
          '• "Advertisement"',
          '• "Promoted"',
          '• "Paid Content"',
          '',
          'This protects user trust!',
        ],
        diagram: '⚠️ [AD] Disclosure Required',
      },
      {
        title: 'Content vs. Advertising',
        explanation: [
          'The goal is seamless integration',
          'while maintaining transparency.',
          '',
          'Good native ads:',
          '✓ Provide value to readers',
          '✓ Match editorial quality',
          '✓ Are clearly labeled',
          '',
          'Bad native ads trick users. Don\'t do that!',
        ],
      },
    ],
    quiz: [
      {
        question: 'What makes an ad "native"?',
        options: [
          'It was created in the same country',
          'It matches the surrounding content style',
          'It uses native programming languages',
          'It only shows to local users',
        ],
        correctIndex: 1,
        explanation: 'Native ads are designed to match the look, feel, and function of the media format they appear in.',
      },
      {
        question: 'Why must native ads have disclosure labels?',
        options: [
          'To make them stand out more',
          'It\'s just a design choice',
          'To maintain transparency and user trust',
          'To increase click rates',
        ],
        correctIndex: 2,
        explanation: 'Disclosure labels ensure users know they\'re viewing paid content, maintaining trust.',
      },
    ],
  },
  'World3_VideoVolcano': {
    worldKey: 'World3_VideoVolcano',
    worldName: 'Video Volcano',
    worldNumber: 3,
    color: 0xff4444,
    concepts: [
      {
        title: 'Video Ad Formats',
        explanation: [
          'Video ads come in several forms:',
          '',
          '• PRE-ROLL: Plays before content',
          '• MID-ROLL: Plays during content',
          '• POST-ROLL: Plays after content',
          '• OUT-STREAM: Auto-plays in text content',
          '',
          'Each has different engagement rates!',
        ],
        diagram: '🎬 [PRE] → 📺 Content → [MID] → 📺 → [POST]',
      },
      {
        title: 'VAST & VPAID',
        explanation: [
          'VAST: Video Ad Serving Template',
          'A standard for serving video ads.',
          '',
          'VPAID: Video Player Ad Interface',
          'Allows interactive video ad units.',
          '',
          'These standards ensure ads play',
          'correctly across different players!',
        ],
        diagram: '📜 VAST → 🎥 Player → 📺 Ad Displays',
      },
      {
        title: 'Video Ad Metrics',
        explanation: [
          'Key video ad metrics:',
          '',
          '• VTR: View-Through Rate',
          '• Completion Rate: % who watch full ad',
          '• Quartiles: 25%, 50%, 75%, 100%',
          '• Sound On Rate: % with audio enabled',
          '',
          'Higher completion = better performance!',
        ],
        diagram: '▓▓▓▓░░░░ 50% Watched',
      },
    ],
    quiz: [
      {
        question: 'What is a "pre-roll" video ad?',
        options: [
          'An ad that plays before the main content',
          'An ad that rolls across the screen',
          'An ad shown only in the morning',
          'An ad for breakfast products',
        ],
        correctIndex: 0,
        explanation: 'Pre-roll ads play before the main video content starts.',
      },
      {
        question: 'What does VAST stand for?',
        options: [
          'Very Attractive Sales Tactic',
          'Video Ad Serving Template',
          'Visual Ad Standard Technology',
          'Video Audience Size Tracking',
        ],
        correctIndex: 1,
        explanation: 'VAST (Video Ad Serving Template) is an industry standard for video ad serving.',
      },
      {
        question: 'If 800 out of 1000 viewers watch your full 30-second ad, what is the completion rate?',
        options: ['30%', '50%', '80%', '100%'],
        correctIndex: 2,
        explanation: '800 ÷ 1000 = 0.80 = 80% completion rate.',
      },
    ],
  },
  'World3_AudioAlps': {
    worldKey: 'World3_AudioAlps',
    worldName: 'Audio Alps',
    worldNumber: 3,
    color: 0x9d4edd,
    concepts: [
      {
        title: 'Audio Advertising',
        explanation: [
          'Audio ads reach listeners through:',
          '',
          '• Podcast ads (host-read or dynamic)',
          '• Music streaming ads (Spotify, etc.)',
          '• Digital radio ads',
          '• Smart speaker ads (Alexa, etc.)',
          '',
          'Audio is intimate & highly engaging!',
        ],
        diagram: '🎧 → 🗣️ Ad → 🎵 Content → 🗣️ Ad → 🎵',
      },
      {
        title: 'Audio Ad Insertion',
        explanation: [
          'Two types of audio ad insertion:',
          '',
          '• BAKED-IN: Recorded by host,',
          '  permanent part of content',
          '',
          '• DYNAMIC: Inserted programmatically,',
          '  can be swapped and targeted',
          '',
          'Dynamic allows real-time optimization!',
        ],
        diagram: '🎙️ [Dynamic Slot] ← 📡 Real-time Targeting',
      },
      {
        title: 'Audio Ad Metrics',
        explanation: [
          'Unique audio metrics:',
          '',
          '• Listen-Through Rate (LTR)',
          '• Average Listen Duration',
          '• Skip Rate',
          '• Conversion Attribution',
          '',
          'Audio often has 90%+ completion rates!',
        ],
      },
    ],
    quiz: [
      {
        question: 'What is a "dynamic" audio ad?',
        options: [
          'An ad with exciting music',
          'An ad inserted programmatically in real-time',
          'An ad recorded by the host',
          'An ad that changes volume automatically',
        ],
        correctIndex: 1,
        explanation: 'Dynamic ads are inserted programmatically, allowing for targeting and swapping.',
      },
      {
        question: 'Which is typically a "baked-in" audio ad?',
        options: [
          'A targeted ad based on user data',
          'A host reading a sponsor message',
          'An ad that can be updated after publishing',
          'A 15-second programmatic spot',
        ],
        correctIndex: 1,
        explanation: 'Baked-in ads are recorded by the host and permanently part of the content.',
      },
      {
        question: 'Why do audio ads often have higher completion rates than video?',
        options: [
          'They are shorter',
          'Listeners often can\'t skip while hands-free',
          'Audio is more boring so people zone out',
          'Video players are broken',
        ],
        correctIndex: 1,
        explanation: 'Audio ads reach people during hands-free moments (driving, exercising), making skipping harder.',
      },
    ],
  },
  'World3_RichMediaRainbow': {
    worldKey: 'World3_RichMediaRainbow',
    worldName: 'Rich Media Rainbow',
    worldNumber: 3,
    color: 0xff6b9d,
    concepts: [
      {
        title: 'Rich Media Ads',
        explanation: [
          'Rich media ads go beyond static images:',
          '',
          '• Interactive elements (buttons, forms)',
          '• Expandable units',
          '• Video within display',
          '• Animation and effects',
          '• Games and quizzes',
          '',
          'Higher engagement, higher CPMs!',
        ],
        diagram: '📦 [Expand ↗️] → 🎮 Interactive Experience',
      },
      {
        title: 'Standard IAB Units',
        explanation: [
          'Common rich media ad sizes:',
          '',
          '• 300×250 (Medium Rectangle)',
          '• 728×90 (Leaderboard)',
          '• 160×600 (Wide Skyscraper)',
          '• 300×600 (Half Page)',
          '• 320×50 (Mobile Leaderboard)',
          '',
          'These are industry-standard sizes!',
        ],
        diagram: '📐 [300×250] [728×90] [160×600]',
      },
      {
        title: 'Engagement Metrics',
        explanation: [
          'Rich media tracks unique interactions:',
          '',
          '• Hover/dwell time',
          '• Expansion rate',
          '• Video plays within unit',
          '• Interactive engagement rate',
          '• Time spent in ad',
          '',
          'More data = better optimization!',
        ],
      },
    ],
    quiz: [
      {
        question: 'What makes an ad "rich media"?',
        options: [
          'It costs a lot of money',
          'It includes interactive or multimedia elements',
          'It\'s only shown to wealthy users',
          'It uses premium publishers only',
        ],
        correctIndex: 1,
        explanation: 'Rich media ads include interactive elements, video, animation, or other engaging features.',
      },
      {
        question: 'What is a 300×250 ad unit commonly called?',
        options: [
          'Skyscraper',
          'Leaderboard',
          'Medium Rectangle',
          'Billboard',
        ],
        correctIndex: 2,
        explanation: 'The 300×250 is called a Medium Rectangle (or Med Rec) and is one of the most popular ad sizes.',
      },
      {
        question: 'Why do rich media ads typically have higher CPMs?',
        options: [
          'They are easier to create',
          'They provide more engagement and data',
          'They load faster',
          'Publishers prefer simple ads',
        ],
        correctIndex: 1,
        explanation: 'Rich media ads command higher CPMs because they offer better engagement and more interaction data.',
      },
    ],
  },
};

// Default tutorial for worlds without specific content
const DEFAULT_TUTORIAL: WorldTutorial = {
  worldKey: 'default',
  worldName: 'Unknown World',
  worldNumber: 0,
  color: 0x888888,
  concepts: [
    {
      title: 'Welcome!',
      explanation: [
        'Get ready to learn new AdTech concepts!',
        '',
        'Pay attention to the gameplay mechanics',
        'as they represent real industry practices.',
      ],
    },
  ],
  quiz: [
    {
      question: 'Are you ready to begin?',
      options: ['Yes!', 'Absolutely!', 'Let\'s go!', 'Ready!'],
      correctIndex: 0,
      explanation: 'Great! Let\'s start the adventure!',
    },
  ],
};

export class AdTechTutorialScene extends Phaser.Scene {
  private tutorial!: WorldTutorial;
  private nextLevelKey!: string;
  
  // State
  private currentPhase: 'concepts' | 'quiz' | 'complete' = 'concepts';
  private conceptIndex: number = 0;
  private quizIndex: number = 0;
  private correctAnswers: number = 0;
  private selectedAnswer: number = -1;
  private hasAnswered: boolean = false;
  
  // UI Elements
  private contentContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private continuePrompt!: Phaser.GameObjects.Text;
  private answerButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'AdTechTutorialScene' });
  }

  init(data: { levelKey?: string }): void {
    this.nextLevelKey = data.levelKey || 'World1_InventoryValley';
    this.tutorial = WORLD_TUTORIALS[this.nextLevelKey] || DEFAULT_TUTORIAL;
    
    // Reset state
    this.currentPhase = 'concepts';
    this.conceptIndex = 0;
    this.quizIndex = 0;
    this.correctAnswers = 0;
    this.selectedAnswer = -1;
    this.hasAnswered = false;
    this.answerButtons = [];
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Background
    this.createBackground(width, height);
    
    // Header
    this.createHeader(width);
    
    // Content container
    this.contentContainer = this.add.container(width / 2, height / 2);
    
    // Progress indicator
    this.progressText = this.add.text(width / 2, 140, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);
    
    // Continue prompt
    this.continuePrompt = this.add.text(width / 2, height - 60, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#00ff88',
    }).setOrigin(0.5);
    
    // Setup input
    this.setupInput();
    
    // Start with concepts
    this.showConcept(0);
    
    // Fade in
    this.cameras.main.fadeIn(500);
  }

  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050510, 0x050510, 0x0a0a20, 0x0a0a20);
    bg.fillRect(0, 0, width, height);
    
    // Subtle grid
    bg.lineStyle(1, this.tutorial.color, 0.05);
    for (let x = 0; x < width; x += 40) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      bg.lineBetween(0, y, width, y);
    }
  }

  private createHeader(width: number): void {
    const colorHex = '#' + this.tutorial.color.toString(16).padStart(6, '0');
    
    // World badge
    this.add.text(width / 2, 50, `WORLD ${this.tutorial.worldNumber} - TRAINING`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: colorHex,
    }).setOrigin(0.5);
    
    // Title
    this.titleText = this.add.text(width / 2, 90, this.tutorial.worldName.toUpperCase(), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;
    
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    
    const handleContinue = () => {
      if (this.currentPhase === 'concepts') {
        this.advanceConcept();
      } else if (this.currentPhase === 'quiz' && this.hasAnswered) {
        this.advanceQuiz();
      } else if (this.currentPhase === 'complete') {
        this.proceedToLevel();
      }
    };
    
    spaceKey.on('down', handleContinue);
    enterKey.on('down', handleContinue);
    
    // Number keys for quiz answers
    for (let i = 1; i <= 4; i++) {
      const key = this.input.keyboard.addKey(48 + i); // 1, 2, 3, 4
      key.on('down', () => {
        if (this.currentPhase === 'quiz' && !this.hasAnswered) {
          this.selectAnswer(i - 1);
        }
      });
    }
  }

  // ============================================================================
  // CONCEPT DISPLAY
  // ============================================================================

  private showConcept(index: number): void {
    this.contentContainer.removeAll(true);
    
    const concept = this.tutorial.concepts[index];
    if (!concept) {
      this.startQuiz();
      return;
    }
    
    this.conceptIndex = index;
    this.updateProgress();
    
    // Concept title
    const title = this.add.text(0, -180, concept.title, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#' + this.tutorial.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);
    this.contentContainer.add(title);
    
    // Explanation text
    const explanationY = -120;
    concept.explanation.forEach((line, i) => {
      const text = this.add.text(0, explanationY + i * 24, line, {
        fontFamily: '"Courier New", monospace',
        fontSize: '14px',
        color: '#cccccc',
        align: 'center',
      }).setOrigin(0.5);
      this.contentContainer.add(text);
    });
    
    // Diagram if present
    if (concept.diagram) {
      const diagramY = explanationY + concept.explanation.length * 24 + 40;
      const diagramBg = this.add.graphics();
      diagramBg.fillStyle(0x1a1a2e, 0.8);
      diagramBg.fillRoundedRect(-250, diagramY - 20, 500, 50, 8);
      this.contentContainer.add(diagramBg);
      
      const diagram = this.add.text(0, diagramY, concept.diagram, {
        fontFamily: '"Courier New", monospace',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
      }).setOrigin(0.5);
      this.contentContainer.add(diagram);
    }
    
    // Example if present
    if (concept.example) {
      const exampleY = 140;
      const example = this.add.text(0, exampleY, `💡 ${concept.example}`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
        color: '#ffcc00',
        wordWrap: { width: 600 },
        align: 'center',
      }).setOrigin(0.5);
      this.contentContainer.add(example);
    }
    
    // Continue prompt
    this.continuePrompt.setText('Press SPACE to continue');
    this.tweens.add({
      targets: this.continuePrompt,
      alpha: { from: 1, to: 0.5 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private advanceConcept(): void {
    if (this.conceptIndex < this.tutorial.concepts.length - 1) {
      this.showConcept(this.conceptIndex + 1);
    } else {
      this.startQuiz();
    }
  }

  // ============================================================================
  // QUIZ DISPLAY
  // ============================================================================

  private startQuiz(): void {
    this.currentPhase = 'quiz';
    this.quizIndex = 0;
    this.correctAnswers = 0;
    this.showQuestion(0);
  }

  private showQuestion(index: number): void {
    this.contentContainer.removeAll(true);
    this.answerButtons = [];
    this.selectedAnswer = -1;
    this.hasAnswered = false;
    
    const question = this.tutorial.quiz[index];
    if (!question) {
      this.showResults();
      return;
    }
    
    this.quizIndex = index;
    this.updateProgress();
    
    // Question text
    const questionText = this.add.text(0, -150, question.question, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 600 },
      align: 'center',
    }).setOrigin(0.5);
    this.contentContainer.add(questionText);
    
    // Answer options
    question.options.forEach((option, i) => {
      const button = this.createAnswerButton(i, option, -50 + i * 60);
      this.answerButtons.push(button);
      this.contentContainer.add(button);
    });
    
    this.continuePrompt.setText('Press 1-4 to select answer');
    this.tweens.killTweensOf(this.continuePrompt);
    this.continuePrompt.setAlpha(0.7);
  }

  private createAnswerButton(index: number, text: string, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, y);
    
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-300, -20, 600, 45, 8);
    bg.lineStyle(2, 0x333333, 1);
    bg.strokeRoundedRect(-300, -20, 600, 45, 8);
    bg.setName('bg');
    container.add(bg);
    
    // Number indicator
    const number = this.add.text(-270, 0, `${index + 1}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#00ff88',
    }).setOrigin(0.5);
    container.add(number);
    
    // Option text
    const optionText = this.add.text(-230, 0, text, {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 500 },
    }).setOrigin(0, 0.5);
    optionText.setName('optionText');
    container.add(optionText);
    
    // Make interactive
    const hitArea = this.add.rectangle(0, 0, 600, 45, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      if (!this.hasAnswered) {
        this.selectAnswer(index);
      }
    });
    hitArea.on('pointerover', () => {
      if (!this.hasAnswered) {
        bg.clear();
        bg.fillStyle(0x2a2a3e, 1);
        bg.fillRoundedRect(-300, -20, 600, 45, 8);
        bg.lineStyle(2, 0x00ff88, 0.5);
        bg.strokeRoundedRect(-300, -20, 600, 45, 8);
      }
    });
    hitArea.on('pointerout', () => {
      if (!this.hasAnswered && this.selectedAnswer !== index) {
        bg.clear();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(-300, -20, 600, 45, 8);
        bg.lineStyle(2, 0x333333, 1);
        bg.strokeRoundedRect(-300, -20, 600, 45, 8);
      }
    });
    container.add(hitArea);
    
    container.setData('index', index);
    
    return container;
  }

  private selectAnswer(index: number): void {
    if (this.hasAnswered) return;
    
    this.selectedAnswer = index;
    this.hasAnswered = true;
    
    const question = this.tutorial.quiz[this.quizIndex];
    const isCorrect = index === question.correctIndex;
    
    if (isCorrect) {
      this.correctAnswers++;
    }
    
    // Update button visuals
    this.answerButtons.forEach((button, i) => {
      const bg = button.getByName('bg') as Phaser.GameObjects.Graphics;
      const optionText = button.getByName('optionText') as Phaser.GameObjects.Text;
      
      if (i === question.correctIndex) {
        // Correct answer - green
        bg.clear();
        bg.fillStyle(0x004422, 1);
        bg.fillRoundedRect(-300, -20, 600, 45, 8);
        bg.lineStyle(3, 0x00ff88, 1);
        bg.strokeRoundedRect(-300, -20, 600, 45, 8);
        optionText.setColor('#00ff88');
      } else if (i === index && !isCorrect) {
        // Wrong answer - red
        bg.clear();
        bg.fillStyle(0x440022, 1);
        bg.fillRoundedRect(-300, -20, 600, 45, 8);
        bg.lineStyle(3, 0xff4444, 1);
        bg.strokeRoundedRect(-300, -20, 600, 45, 8);
        optionText.setColor('#ff4444');
      }
    });
    
    // Show explanation - position BELOW all answer buttons
    // Options are at Y positions: -50, 10, 70, 130 (4 buttons spaced 60px apart)
    // So feedback should start at Y = 190 (after last button)
    const feedbackY = 190;
    const feedbackColor = isCorrect ? '#00ff88' : '#ff4444';
    const feedbackText = isCorrect ? '✓ CORRECT!' : '✗ INCORRECT';
    
    const feedback = this.add.text(0, feedbackY, feedbackText, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: feedbackColor,
    }).setOrigin(0.5);
    this.contentContainer.add(feedback);
    
    const explanation = this.add.text(0, feedbackY + 35, question.explanation, {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#aaaaaa',
      wordWrap: { width: 550 },
      align: 'center',
    }).setOrigin(0.5);
    this.contentContainer.add(explanation);
    
    this.continuePrompt.setText('Press SPACE to continue');
    this.tweens.add({
      targets: this.continuePrompt,
      alpha: { from: 1, to: 0.5 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private advanceQuiz(): void {
    if (this.quizIndex < this.tutorial.quiz.length - 1) {
      this.showQuestion(this.quizIndex + 1);
    } else {
      this.showResults();
    }
  }

  // ============================================================================
  // RESULTS & COMPLETION
  // ============================================================================

  private showResults(): void {
    this.currentPhase = 'complete';
    this.contentContainer.removeAll(true);
    
    const total = this.tutorial.quiz.length;
    const score = this.correctAnswers;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= 60;
    
    // Result title
    const resultText = passed ? 'TRAINING COMPLETE!' : 'KEEP PRACTICING!';
    const resultColor = passed ? '#00ff88' : '#ffcc00';
    
    const title = this.add.text(0, -100, resultText, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: resultColor,
    }).setOrigin(0.5);
    this.contentContainer.add(title);
    
    // Score
    const scoreText = this.add.text(0, -30, `Score: ${score}/${total} (${percent}%)`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.contentContainer.add(scoreText);
    
    // Message
    const message = passed
      ? 'You\'re ready to apply these concepts in the game!'
      : 'Review the concepts and try again to unlock the level.';
    
    const messageText = this.add.text(0, 30, message, {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#aaaaaa',
      wordWrap: { width: 500 },
      align: 'center',
    }).setOrigin(0.5);
    this.contentContainer.add(messageText);
    
    if (passed) {
      this.continuePrompt.setText('Press SPACE to start the level!');
    } else {
      this.continuePrompt.setText('Press SPACE to try again');
    }
    
    this.tweens.add({
      targets: this.continuePrompt,
      alpha: { from: 1, to: 0.5 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private proceedToLevel(): void {
    const passed = this.correctAnswers >= Math.ceil(this.tutorial.quiz.length * 0.6);
    
    if (passed) {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('LevelIntroScene', { levelKey: this.nextLevelKey });
      });
    } else {
      // Retry tutorial
      this.currentPhase = 'concepts';
      this.conceptIndex = 0;
      this.showConcept(0);
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private updateProgress(): void {
    if (this.currentPhase === 'concepts') {
      const total = this.tutorial.concepts.length;
      this.progressText.setText(`Concept ${this.conceptIndex + 1} of ${total}`);
    } else if (this.currentPhase === 'quiz') {
      const total = this.tutorial.quiz.length;
      this.progressText.setText(`Question ${this.quizIndex + 1} of ${total}`);
    } else {
      this.progressText.setText('');
    }
  }
}
