import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { TileType } from '../map/types.js';
import { createColorTile } from '../utils/image.js';

export interface TilesetManifest {
  name: string;
  tileSize: number;
  tiles: Record<string, string>;
}

const DEFAULT_TILE_SIZE = 32;

/** Tile color definitions for procedural generation */
const TILE_COLORS: Record<string, { r: number; g: number; b: number; border?: { r: number; g: number; b: number } }> = {
  floor:    { r: 180, g: 150, b: 110, border: { r: 160, g: 130, b: 90 } },
  wall:     { r: 80,  g: 80,  b: 90,  border: { r: 60,  g: 60,  b: 70 } },
  wall_top: { r: 100, g: 100, b: 110, border: { r: 70,  g: 70,  b: 80 } },
  door:     { r: 140, g: 100, b: 60,  border: { r: 100, g: 70,  b: 40 } },
  corridor: { r: 160, g: 135, b: 100, border: { r: 140, g: 115, b: 80 } },
  water:    { r: 60,  g: 120, b: 190, border: { r: 40,  g: 100, b: 170 } },
  grass:    { r: 80,  g: 160, b: 60,  border: { r: 60,  g: 140, b: 40 } },
  tree:     { r: 30,  g: 100, b: 30,  border: { r: 20,  g: 80,  b: 20 } },
  path:     { r: 190, g: 170, b: 130, border: { r: 170, g: 150, b: 110 } },
  sand:     { r: 220, g: 200, b: 140, border: { r: 200, g: 180, b: 120 } },
  stone:    { r: 140, g: 140, b: 150, border: { r: 120, g: 120, b: 130 } },
  bridge:   { r: 150, g: 110, b: 70,  border: { r: 130, g: 90,  b: 50 } },
  void:     { r: 0,   g: 0,   b: 0 },
};

/** Generate default placeholder tiles programmatically */
export async function generateDefaultTileset(outputDir: string): Promise<TilesetManifest> {
  await mkdir(outputDir, { recursive: true });

  const manifest: TilesetManifest = {
    name: 'default',
    tileSize: DEFAULT_TILE_SIZE,
    tiles: {},
  };

  for (const [name, color] of Object.entries(TILE_COLORS)) {
    const fileName = `${name}.png`;
    const filePath = join(outputDir, fileName);

    const buffer = await createColorTile(
      DEFAULT_TILE_SIZE,
      color.r,
      color.g,
      color.b,
      name === 'void' ? 0 : 255,
      color.border,
    );

    await writeFile(filePath, buffer);
    manifest.tiles[name.toUpperCase()] = fileName;
  }

  await writeFile(
    join(outputDir, 'tileset.json'),
    JSON.stringify(manifest, null, 2),
  );

  return manifest;
}

/** Load a tileset manifest from a directory */
export async function loadTileset(tilesetDir: string): Promise<TilesetManifest> {
  const manifestPath = join(tilesetDir, 'tileset.json');

  try {
    await access(manifestPath);
  } catch {
    // Generate default tileset if it doesn't exist
    return generateDefaultTileset(tilesetDir);
  }

  const content = await readFile(manifestPath, 'utf-8');
  return JSON.parse(content) as TilesetManifest;
}

/** Map TileType enum to tile name */
export function tileTypeToName(t: TileType): string {
  const mapping: Record<number, string> = {
    [TileType.VOID]: 'VOID',
    [TileType.FLOOR]: 'FLOOR',
    [TileType.WALL]: 'WALL',
    [TileType.DOOR]: 'DOOR',
    [TileType.CORRIDOR]: 'CORRIDOR',
    [TileType.WATER]: 'WATER',
    [TileType.GRASS]: 'GRASS',
    [TileType.TREE]: 'TREE',
    [TileType.PATH]: 'PATH',
    [TileType.SAND]: 'SAND',
    [TileType.STONE]: 'STONE',
    [TileType.BRIDGE]: 'BRIDGE',
  };
  return mapping[t] ?? 'VOID';
}
