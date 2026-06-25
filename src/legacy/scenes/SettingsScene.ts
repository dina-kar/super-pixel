/**
 * SettingsScene - Game Settings Menu
 * 
 * Allows players to adjust:
 * - Sound volume
 * - Difficulty level
 * - Colorblind mode
 * - Debug mode
 */

import Phaser from 'phaser';
import { gameState } from '../main';

interface SettingOption {
  key: string;
  label: string;
  type: 'slider' | 'toggle' | 'select';
  value: number | boolean | string;
  options?: string[];
  min?: number;
  max?: number;
}

export class SettingsScene extends Phaser.Scene {
  private settingItems: Phaser.GameObjects.Container[] = [];
  private selectedIndex: number = 0;
  private backButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Background
    this.createBackground(width, height);
    
    // Title
    this.add.text(width / 2, 80, 'SETTINGS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px',
      color: '#00ff88',
      stroke: '#003322',
      strokeThickness: 4,
    }).setOrigin(0.5);
    
    // Create settings
    this.createSettings(width, height);
    
    // Back button
    this.createBackButton(width, height);
    
    // Input
    this.setupInput();
    
    // Fade in
    this.cameras.main.fadeIn(300);
  }

  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a3e, 0x1a1a3e);
    bg.fillRect(0, 0, width, height);
    
    // Grid
    bg.lineStyle(1, 0x333333, 0.2);
    for (let x = 0; x < width; x += 40) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      bg.lineBetween(0, y, width, y);
    }
  }

  private createSettings(width: number, _height: number): void {
    const settings: SettingOption[] = [
      {
        key: 'volume',
        label: 'Sound Volume',
        type: 'slider',
        value: gameState.settings.volume,
        min: 0,
        max: 1,
      },
      {
        key: 'difficulty',
        label: 'Difficulty',
        type: 'select',
        value: gameState.settings.difficulty,
        options: ['easy', 'normal', 'hard'],
      },
      {
        key: 'colorblindMode',
        label: 'Colorblind Mode',
        type: 'toggle',
        value: gameState.settings.colorblindMode,
      },
      {
        key: 'showDebug',
        label: 'Debug Mode',
        type: 'toggle',
        value: gameState.settings.showDebug,
      },
    ];

    const startY = 180;
    const spacing = 80;

    settings.forEach((setting, index) => {
      const container = this.add.container(width / 2, startY + index * spacing);
      
      // Label
      const label = this.add.text(-200, 0, setting.label, {
        fontFamily: '"Courier New", monospace',
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0, 0.5);
      container.add(label);
      
      // Value display/control
      if (setting.type === 'slider') {
        const sliderBg = this.add.graphics();
        sliderBg.fillStyle(0x333333, 1);
        sliderBg.fillRoundedRect(80, -10, 200, 20, 5);
        container.add(sliderBg);
        
        const sliderFill = this.add.graphics();
        sliderFill.fillStyle(0x00ff88, 1);
        sliderFill.fillRoundedRect(80, -10, 200 * (setting.value as number), 20, 5);
        sliderFill.setName('sliderFill');
        container.add(sliderFill);
        
        const valueText = this.add.text(300, 0, `${Math.round((setting.value as number) * 100)}%`, {
          fontFamily: '"Courier New", monospace',
          fontSize: '14px',
          color: '#00ff88',
        }).setOrigin(0, 0.5);
        valueText.setName('valueText');
        container.add(valueText);
        
      } else if (setting.type === 'toggle') {
        const toggleBg = this.add.graphics();
        toggleBg.fillStyle(setting.value ? 0x00ff88 : 0x333333, 1);
        toggleBg.fillRoundedRect(80, -12, 60, 24, 12);
        toggleBg.setName('toggleBg');
        container.add(toggleBg);
        
        const toggleKnob = this.add.graphics();
        toggleKnob.fillStyle(0xffffff, 1);
        toggleKnob.fillCircle(setting.value ? 130 : 90, 0, 10);
        toggleKnob.setName('toggleKnob');
        container.add(toggleKnob);
        
        const valueText = this.add.text(160, 0, setting.value ? 'ON' : 'OFF', {
          fontFamily: '"Courier New", monospace',
          fontSize: '14px',
          color: setting.value ? '#00ff88' : '#666666',
        }).setOrigin(0, 0.5);
        valueText.setName('valueText');
        container.add(valueText);
        
      } else if (setting.type === 'select') {
        const options = setting.options || [];
        const currentIndex = options.indexOf(setting.value as string);
        
        const leftArrow = this.add.text(80, 0, '◀', {
          fontFamily: '"Courier New", monospace',
          fontSize: '16px',
          color: '#00ff88',
        }).setOrigin(0.5).setName('leftArrow');
        container.add(leftArrow);
        
        const valueText = this.add.text(180, 0, (setting.value as string).toUpperCase(), {
          fontFamily: '"Courier New", monospace',
          fontSize: '16px',
          color: '#ffffff',
        }).setOrigin(0.5);
        valueText.setName('valueText');
        container.add(valueText);
        
        const rightArrow = this.add.text(280, 0, '▶', {
          fontFamily: '"Courier New", monospace',
          fontSize: '16px',
          color: '#00ff88',
        }).setOrigin(0.5).setName('rightArrow');
        container.add(rightArrow);
        
        container.setData('optionIndex', currentIndex);
      }
      
      container.setData('setting', setting);
      container.setData('index', index);
      this.settingItems.push(container);
    });
    
    this.updateSelection();
  }

  private createBackButton(width: number, height: number): void {
    this.backButton = this.add.text(width / 2, height - 80, '← BACK TO MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#666666',
    }).setOrigin(0.5);
    
    this.backButton.setInteractive({ useHandCursor: true });
    this.backButton.on('pointerover', () => {
      this.selectedIndex = this.settingItems.length;
      this.updateSelection();
    });
    this.backButton.on('pointerdown', () => this.goBack());
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;
    
    const cursors = this.input.keyboard.createCursorKeys();
    const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    
    cursors.up.on('down', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    
    cursors.down.on('down', () => {
      this.selectedIndex = Math.min(this.settingItems.length, this.selectedIndex + 1);
      this.updateSelection();
    });
    
    cursors.left.on('down', () => this.adjustSetting(-1));
    cursors.right.on('down', () => this.adjustSetting(1));
    
    enterKey.on('down', () => {
      if (this.selectedIndex === this.settingItems.length) {
        this.goBack();
      } else {
        this.toggleSetting();
      }
    });
    
    escKey.on('down', () => this.goBack());
  }

  private updateSelection(): void {
    this.settingItems.forEach((container, index) => {
      const isSelected = index === this.selectedIndex;
      container.setAlpha(isSelected ? 1 : 0.6);
      
      if (isSelected) {
        container.setScale(1.05);
      } else {
        container.setScale(1);
      }
    });
    
    // Back button
    if (this.selectedIndex === this.settingItems.length) {
      this.backButton.setColor('#00ff88');
      this.backButton.setScale(1.1);
    } else {
      this.backButton.setColor('#666666');
      this.backButton.setScale(1);
    }
  }

  private adjustSetting(direction: number): void {
    if (this.selectedIndex >= this.settingItems.length) return;
    
    const container = this.settingItems[this.selectedIndex];
    const setting = container.getData('setting') as SettingOption;
    
    if (setting.type === 'slider') {
      const newValue = Phaser.Math.Clamp(
        (setting.value as number) + direction * 0.1,
        setting.min || 0,
        setting.max || 1
      );
      setting.value = Math.round(newValue * 10) / 10;
      
      // Update visuals
      const sliderFill = container.getByName('sliderFill') as Phaser.GameObjects.Graphics;
      const valueText = container.getByName('valueText') as Phaser.GameObjects.Text;
      
      if (sliderFill) {
        sliderFill.clear();
        sliderFill.fillStyle(0x00ff88, 1);
        sliderFill.fillRoundedRect(80, -10, 200 * (setting.value as number), 20, 5);
      }
      if (valueText) {
        valueText.setText(`${Math.round((setting.value as number) * 100)}%`);
      }
      
      // Save
      gameState.updateSettings({ [setting.key]: setting.value });
      
    } else if (setting.type === 'select') {
      const options = setting.options || [];
      let optionIndex = container.getData('optionIndex') as number;
      optionIndex = Phaser.Math.Wrap(optionIndex + direction, 0, options.length);
      setting.value = options[optionIndex];
      container.setData('optionIndex', optionIndex);
      
      const valueText = container.getByName('valueText') as Phaser.GameObjects.Text;
      if (valueText) {
        valueText.setText((setting.value as string).toUpperCase());
      }
      
      // Save
      gameState.updateSettings({ [setting.key]: setting.value });
    }
  }

  private toggleSetting(): void {
    if (this.selectedIndex >= this.settingItems.length) return;
    
    const container = this.settingItems[this.selectedIndex];
    const setting = container.getData('setting') as SettingOption;
    
    if (setting.type === 'toggle') {
      setting.value = !setting.value;
      
      const toggleBg = container.getByName('toggleBg') as Phaser.GameObjects.Graphics;
      const toggleKnob = container.getByName('toggleKnob') as Phaser.GameObjects.Graphics;
      const valueText = container.getByName('valueText') as Phaser.GameObjects.Text;
      
      if (toggleBg) {
        toggleBg.clear();
        toggleBg.fillStyle(setting.value ? 0x00ff88 : 0x333333, 1);
        toggleBg.fillRoundedRect(80, -12, 60, 24, 12);
      }
      if (toggleKnob) {
        toggleKnob.clear();
        toggleKnob.fillStyle(0xffffff, 1);
        toggleKnob.fillCircle(setting.value ? 130 : 90, 0, 10);
      }
      if (valueText) {
        valueText.setText(setting.value ? 'ON' : 'OFF');
        valueText.setColor(setting.value ? '#00ff88' : '#666666');
      }
      
      // Save
      gameState.updateSettings({ [setting.key]: setting.value });
    }
  }

  private goBack(): void {
    this.cameras.main.fadeOut(300);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
