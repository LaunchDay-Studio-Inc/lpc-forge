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
    artist: 'Various Artists (OGA)',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/town-theme-rpg',
    loops: true,
    durationSeconds: 60,
  },
  {
    name: 'Dungeon Ambience',
    context: 'dungeon',
    filename: 'dungeon_ambience.ogg',
    artist: 'Various Artists (OGA)',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/dungeon-ambience',
    loops: true,
    durationSeconds: 90,
  },
  {
    name: 'Battle Theme',
    context: 'battle',
    filename: 'battle_theme.ogg',
    artist: 'Various Artists (OGA)',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/battle-theme-rpg',
    loops: true,
    durationSeconds: 75,
  },
  {
    name: 'Overworld',
    context: 'overworld',
    filename: 'overworld.ogg',
    artist: 'Various Artists (OGA)',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/overworld-theme-rpg',
    loops: true,
    durationSeconds: 90,
  },
  {
    name: 'Boss Battle',
    context: 'boss',
    filename: 'boss_battle.ogg',
    artist: 'Various Artists (OGA)',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/boss-battle-theme',
    loops: true,
    durationSeconds: 90,
  },
  {
    name: 'Menu Theme',
    context: 'menu',
    filename: 'menu_theme.ogg',
    artist: 'Various Artists (OGA)',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/menu-theme-rpg',
    loops: true,
    durationSeconds: 60,
  },
  {
    name: 'Victory Fanfare',
    context: 'victory',
    filename: 'victory_fanfare.ogg',
    artist: 'Various Artists (OGA)',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/victory-fanfare',
    loops: false,
    durationSeconds: 8,
  },
  {
    name: 'Game Over',
    context: 'gameover',
    filename: 'game_over.ogg',
    artist: 'Various Artists (OGA)',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/game-over-theme',
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
