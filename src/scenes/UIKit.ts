import Phaser from 'phaser';

/**
 * UIKit — minimal reusable building blocks for menus and HUDs.
 *
 * Each factory returns a Phaser GameObject (or composite) with hover,
 * press, and sound feedback already wired in. The kit emits scene events
 * ('uikit:hover', 'uikit:click') instead of calling AudioManager
 * directly, so it stays decoupled. Scenes do:
 *
 *   this.events.on('uikit:hover', () => audio.playSFX(AUDIO.SFX.MENU_HOVER));
 *   this.events.on('uikit:click', () => audio.playSFX(AUDIO.SFX.MENU_CLICK));
 *
 * This is a Phase-1 kit — flat, retro, matches the existing style. The
 * Phase-2 modern reskin will swap implementations behind the same API.
 */

const PRESS_DURATION = 100;

export interface TextButtonOptions {
  scene: Phaser.Scene;
  x: number;
  y: number;
  label: string;
  fontSize?: string;
  /** Text color when idle. */
  idleColor?: string;
  /** Text color on hover. */
  hoverColor?: string;
  /** How much the button shrinks on press (0..1, default 0.95). */
  pressScale?: number;
  onClick: () => void;
  /** Optional predicate — if it returns false, click is suppressed (still
   *  animates so the user gets feedback that the button exists). */
  isEnabled?: () => boolean;
}

export function makeTextButton(opts: TextButtonOptions): Phaser.GameObjects.Text {
  const {
    scene, x, y, label,
    fontSize = '20px',
    idleColor = '#ffff00',
    hoverColor = '#ffffff',
    pressScale = 0.95,
    onClick,
    isEnabled,
  } = opts;

  const text = scene.add
    .text(x, y, label, {
      fontFamily: '"Press Start 2P"',
      fontSize,
      color: idleColor,
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  text.setInteractive({ useHandCursor: true });

  text.on('pointerover', () => {
    scene.events.emit('uikit:hover');
    if (!isEnabled || isEnabled()) text.setColor(hoverColor);
  });

  text.on('pointerout', () => {
    text.setColor(idleColor);
  });

  text.on('pointerdown', () => {
    scene.events.emit('uikit:click');
    scene.tweens.add({
      targets: text,
      scaleX: pressScale,
      scaleY: pressScale,
      duration: PRESS_DURATION,
      yoyo: true,
      onComplete: () => {
        if (!isEnabled || isEnabled()) onClick();
      },
    });
  });

  return text;
}

export interface RectButton {
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  /** Plays the press animation; the caller's onClick has already been invoked. */
  pressAnimation(): void;
}

export interface RectButtonOptions {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fontSize?: string;
  onClick: () => void;
  /** Hook fired on hover so the caller can color-shift the background. */
  onHover?: () => void;
  /** Hook fired on hover-out (for restoring idle color). */
  onHoverOut?: () => void;
}

/**
 * Square/rectangle button with a label. Used for the table-selection
 * grid where the caller wants full control of the fill color (because
 * "selected" vs "unselected" colors are app-specific).
 */
export function makeRectButton(opts: RectButtonOptions): RectButton {
  const {
    scene, x, y, width, height, label,
    fontSize = '24px', onClick, onHover, onHoverOut,
  } = opts;

  const background = scene.add.rectangle(x, y, width, height, 0x333333);
  background.setStrokeStyle(3, 0xffffff);
  background.setInteractive({ useHandCursor: true });

  const text = scene.add
    .text(x, y, label, {
      fontFamily: '"Press Start 2P"',
      fontSize,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  const playPressAnim = () => {
    scene.tweens.add({
      targets: [background, text],
      scaleX: 0.9,
      scaleY: 0.9,
      duration: PRESS_DURATION,
      yoyo: true,
      ease: 'Quad.easeInOut',
    });
  };

  background.on('pointerover', () => {
    scene.events.emit('uikit:hover');
    onHover?.();
  });
  background.on('pointerout', () => {
    onHoverOut?.();
  });
  background.on('pointerdown', () => {
    scene.events.emit('uikit:click');
    playPressAnim();
    onClick();
  });

  return { background, label: text, pressAnimation: playPressAnim };
}

export interface IconButtonOptions {
  scene: Phaser.Scene;
  x: number;
  y: number;
  emoji: string;
  fontSize?: string;
  onClick: () => void;
  /** Returns true if this icon represents the currently selected option. */
  isSelected: () => boolean;
}

/**
 * Emoji icon button used for the input-mode toggle. Selected/unselected
 * styling is handled in updateVisual() so callers can refresh after a
 * state change.
 */
export interface IconButton {
  text: Phaser.GameObjects.Text;
  refresh(): void;
}

export function makeIconButton(opts: IconButtonOptions): IconButton {
  const { scene, x, y, emoji, fontSize = '32px', onClick, isSelected } = opts;

  const icon = scene.add
    .text(x, y, emoji, { fontFamily: 'Arial', fontSize, color: '#ffffff' })
    .setOrigin(0.5);
  icon.setInteractive({ useHandCursor: true });

  const refresh = () => {
    if (isSelected()) {
      icon.setAlpha(1.0);
      icon.setTint(0xffffff);
      icon.setScale(1.0);
    } else {
      icon.setAlpha(0.3);
      icon.setTint(0x888888);
      icon.setScale(1.0);
    }
  };

  icon.on('pointerover', () => {
    scene.events.emit('uikit:hover');
    if (!isSelected()) icon.setScale(1.1);
  });
  icon.on('pointerout', () => {
    if (!isSelected()) icon.setScale(1.0);
  });
  icon.on('pointerdown', () => {
    scene.events.emit('uikit:click');
    onClick();
    refresh();
  });

  refresh();
  return { text: icon, refresh };
}
