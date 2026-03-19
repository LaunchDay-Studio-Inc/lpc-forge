import type { MusicTrack } from './types.js';

/**
 * Curated music tracks for RPG games.
 * All tracks are CC0 or CC-BY licensed from OpenGameArt.org.
 * Source files are stored in assets/music/
 */
export const MUSIC_CATALOG: MusicTrack[] = [
  {
    name: 'Town Theme',
    context: 'town',
    filename: 'town_theme.ogg',
    artist: 'See CREDITS.md',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org',
    loops: true,
    durationSeconds: 60,
  },
  {
    name: 'Dungeon Ambience',
    context: 'dungeon',
    filename: 'dungeon_ambience.ogg',
    artist: 'See CREDITS.md',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org',
    loops: true,
    durationSeconds: 90,
  },
  {
    name: 'Battle Theme',
    context: 'battle',
    filename: 'battle_theme.ogg',
    artist: 'See CREDITS.md',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org',
    loops: true,
    durationSeconds: 75,
  },
  {
    name: 'Overworld',
    context: 'overworld',
    filename: 'overworld.ogg',
    artist: 'See CREDITS.md',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org',
    loops: true,
    durationSeconds: 90,
  },
  {
    name: 'Boss Battle',
    context: 'boss',
    filename: 'boss_battle.ogg',
    artist: 'See CREDITS.md',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org',
    loops: true,
    durationSeconds: 90,
  },
  {
    name: 'Menu Theme',
    context: 'menu',
    filename: 'menu_theme.ogg',
    artist: 'See CREDITS.md',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org',
    loops: true,
    durationSeconds: 60,
  },
  {
    name: 'Victory Fanfare',
    context: 'victory',
    filename: 'victory_fanfare.ogg',
    artist: 'See CREDITS.md',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org',
    loops: false,
    durationSeconds: 8,
  },
  {
    name: 'Game Over',
    context: 'gameover',
    filename: 'game_over.ogg',
    artist: 'See CREDITS.md',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org',
    loops: false,
    durationSeconds: 6,
  },
];

/** Get tracks by context */
export function getMusicByContext(context: string): MusicTrack[] {
  return MUSIC_CATALOG.filter((t) => t.context === context);
}

/** List all music contexts */
export function listMusicContexts(): string[] {
  return [...new Set(MUSIC_CATALOG.map((t) => t.context))];
}
