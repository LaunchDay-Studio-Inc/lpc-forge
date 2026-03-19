export interface UITheme {
  name: string;
  /** Panel background color */
  bgColor: string;
  /** Panel border color */
  borderColor: string;
  /** Button/accent color */
  accentColor: string;
  /** Text color */
  textColor: string;
  /** Button hover color */
  hoverColor: string;
  /** Disabled/inactive color */
  disabledColor: string;
  /** Border width in pixels */
  borderWidth: number;
  /** Corner radius (pixel steps for pixel-art rounded corners) */
  cornerRadius: number;
}

export interface PanelConfig {
  width: number;
  height: number;
  theme: UITheme;
  /** 9-slice border size */
  borderSlice?: number;
}

export interface ButtonConfig {
  width: number;
  height: number;
  theme: UITheme;
  states: ('normal' | 'hover' | 'pressed' | 'disabled')[];
}

export interface UIKitResult {
  panels: string[];
  buttons: string[];
  frames: string[];
  bars: string[];
  slots: string[];
  cursors: string[];
  totalAssets: number;
}

export interface PortraitResult {
  name: string;
  path: string;
  size: number;
}

export interface PropEntry {
  name: string;
  category: 'container' | 'decoration' | 'light' | 'nature' | 'sign' | 'interactive';
  description: string;
  width: number;
  height: number;
}

export interface IconEntry {
  name: string;
  category: 'weapon' | 'armor' | 'potion' | 'food' | 'key' | 'gem' | 'tool' | 'scroll' | 'misc';
  description: string;
}
