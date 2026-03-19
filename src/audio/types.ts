/** SFX preset categories for RPG games */
export type SfxCategory =
  | 'combat'
  | 'ui'
  | 'movement'
  | 'items'
  | 'environment'
  | 'magic'
  | 'feedback';

export interface SfxPreset {
  /** Display name */
  name: string;
  /** Category for organization */
  category: SfxCategory;
  /** Description of the sound */
  description: string;
  /** jsfxr parameter array — 24 numbers */
  params: number[];
}

export interface MusicTrack {
  /** Display name */
  name: string;
  /** Usage context (e.g., "town", "dungeon", "battle") */
  context: string;
  /** Filename in assets/music/ */
  filename: string;
  /** Artist credit */
  artist: string;
  /** License */
  license: string;
  /** OGA/source URL */
  sourceUrl: string;
  /** Whether it loops seamlessly */
  loops: boolean;
  /** Duration in seconds (approximate) */
  durationSeconds: number;
}

export interface SfxGenerationResult {
  name: string;
  category: SfxCategory;
  path: string;
}

export interface AudioBundle {
  sfx: SfxGenerationResult[];
  music: MusicTrack[];
}
