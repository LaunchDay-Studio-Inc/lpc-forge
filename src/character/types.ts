export interface LayerDefinition {
  name: string;
  priority: number;
  layers: LayerEntry[];
  variants: string[];
  animations: string[];
  matchBodyColor?: boolean;
  typeName?: string;
}

export interface LayerEntry {
  zPos: number;
  paths: Record<string, string>; // bodyType → base path
  customAnimation?: string;
}

export interface CharacterSpec {
  bodyType: 'male' | 'female' | 'muscular' | 'teen' | 'child' | 'pregnant';
  layers: CharacterLayer[];
  animations?: string[];
}

export interface CharacterLayer {
  category: string;
  subcategory: string;
  variant: string;
}

export interface CharacterPreset {
  name: string;
  description: string;
  spec: CharacterSpec;
}

export interface SliceResult {
  framesDir: string;
  totalFrames: number;
  animations: Record<string, { direction: string; frames: number }[]>;
}

export const FRAME_SIZE = 64;

export const SHEET_WIDTH = 832; // 13 frames wide
export const SHEET_HEIGHT = 3456; // 54 rows

// Animation definitions derived from the existing constants.js
// row = starting row index, rows = number of direction rows, frames = frames per direction
export const ANIMATIONS: Record<string, { frames: number; rows: number; row: number }> = {
  spellcast:    { frames: 7,  rows: 4, row: 0 },
  thrust:       { frames: 8,  rows: 4, row: 4 },
  walk:         { frames: 9,  rows: 4, row: 8 },
  slash:        { frames: 6,  rows: 4, row: 12 },
  shoot:        { frames: 13, rows: 4, row: 16 },
  hurt:         { frames: 6,  rows: 1, row: 20 },
  climb:        { frames: 6,  rows: 1, row: 21 },
  idle:         { frames: 2,  rows: 4, row: 22 },
  jump:         { frames: 5,  rows: 4, row: 26 },
  sit:          { frames: 3,  rows: 4, row: 30 },
  emote:        { frames: 3,  rows: 4, row: 34 },
  run:          { frames: 8,  rows: 4, row: 38 },
  combat_idle:  { frames: 2,  rows: 4, row: 42 },
  backslash:    { frames: 13, rows: 4, row: 46 },
  halfslash:    { frames: 6,  rows: 4, row: 50 },
};

// Folder name mapping (animation name → actual folder name in spritesheets)
export const ANIMATION_FOLDER_MAP: Record<string, string> = {
  combat: 'combat_idle',
  '1h_slash': 'backslash',
  '1h_backslash': 'backslash',
  '1h_halfslash': 'halfslash',
};

// Direction order (top to bottom rows in each animation)
export const DIRECTIONS = ['up', 'left', 'down', 'right'] as const;
export type Direction = typeof DIRECTIONS[number];
