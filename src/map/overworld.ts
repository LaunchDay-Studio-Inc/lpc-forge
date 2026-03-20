import { SeededRNG } from '../utils/rng.js';
import type { OverworldConfig, GeneratedMap, Room, PointOfInterest } from './types.js';
import { TileType as TT, type TileType } from './types.js';

/** Generate an overworld map with biomes */
export function generateOverworld(config: OverworldConfig): GeneratedMap {
  const {
    width,
    height,
    seed = Date.now(),
    temperature = 0.5,
  } = config;

  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 10 || height < 10) {
    throw new Error(`Invalid map dimensions: ${width}×${height} (minimum 10×10)`);
  }

  const rng = new SeededRNG(seed);

  // Generate heightmap using diamond-square
  const heightMap = generateNoiseMap(width, height, rng, 4);
  const moistureMap = generateNoiseMap(width, height, rng, 3);

  // Assign biomes based on height + moisture
  const tiles: TileType[][] = Array.from({ length: height }, () =>
    Array(width).fill(TT.GRASS),
  );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const h = heightMap[y][x];
      const m = moistureMap[y][x];

      tiles[y][x] = classifyBiome(h, m, temperature);
    }
  }

  // Place villages at suitable locations
  const villages = placeVillages(tiles, rng, width, height);

  // Generate paths connecting villages
  for (let i = 0; i < villages.length - 1; i++) {
    carvePath(tiles, villages[i], villages[i + 1], width, height);
  }

  // Add bridges where paths cross water
  addBridges(tiles, width, height);

  // Convert villages to rooms
  const rooms: Room[] = villages.map((v, i) => ({
    id: i,
    x: v.x - 2,
    y: v.y - 2,
    width: 5,
    height: 5,
    connections: [],
  }));

  // Update connections
  for (let i = 0; i < rooms.length - 1; i++) {
    rooms[i].connections.push(rooms[i + 1].id);
    rooms[i + 1].connections.push(rooms[i].id);
  }

  // Generate POIs
  const pois: PointOfInterest[] = [];

  if (villages[0]) {
    pois.push({ x: villages[0].x, y: villages[0].y, type: 'spawn', label: 'Spawn' });
  }

  // NPCs near villages
  for (let i = 0; i < villages.length; i++) {
    pois.push({ x: villages[i].x + 1, y: villages[i].y, type: 'npc', label: `Village NPC ${i + 1}` });
  }

  // Treasure at forest edges
  for (let y = 2; y < height - 2; y += 10) {
    for (let x = 2; x < width - 2; x += 10) {
      if (tiles[y][x] === TT.TREE && tiles[y + 1]?.[x] === TT.GRASS) {
        pois.push({ x, y: y + 1, type: 'treasure', label: 'Forest Treasure' });
        break;
      }
    }
    if (pois.filter(p => p.type === 'treasure').length >= 3) break;
  }

  return {
    width,
    height,
    tiles,
    rooms,
    seed,
    pois,
    spawnPoint: villages[0],
    exitPoint: villages.length > 1 ? villages[villages.length - 1] : undefined,
  };
}

function classifyBiome(h: number, m: number, temp: number): TileType {
  // Deep water
  if (h < 0.25) return TT.WATER;
  // Beach/sand
  if (h < 0.3) return TT.SAND;
  // Mountains/stone
  if (h > 0.8) return TT.STONE;
  // Forest (mid height + high moisture)
  if (h > 0.35 && h < 0.7 && m > 0.55) return TT.TREE;
  // Plains/grass
  if (m < 0.4 && temp > 0.3) return TT.GRASS;
  // Default grass
  return TT.GRASS;
}

/** Simple multi-octave noise using seeded RNG and interpolation */
function generateNoiseMap(
  width: number,
  height: number,
  rng: SeededRNG,
  octaves: number,
): number[][] {
  const map: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(0),
  );

  for (let octave = 0; octave < octaves; octave++) {
    const scale = Math.pow(2, octave + 2);
    const amplitude = 1 / Math.pow(2, octave);
    const gridW = Math.ceil(width / scale) + 2;
    const gridH = Math.ceil(height / scale) + 2;

    // Generate random grid points
    const grid: number[][] = Array.from({ length: gridH }, () =>
      Array.from({ length: gridW }, () => rng.random()),
    );

    // Bilinear interpolation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gx = x / scale;
        const gy = y / scale;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        const fx = gx - x0;
        const fy = gy - y0;

        const v00 = grid[y0]?.[x0] ?? 0;
        const v10 = grid[y0]?.[x1] ?? 0;
        const v01 = grid[y1]?.[x0] ?? 0;
        const v11 = grid[y1]?.[x1] ?? 0;

        const top = v00 + (v10 - v00) * fx;
        const bottom = v01 + (v11 - v01) * fx;
        const value = top + (bottom - top) * fy;

        map[y][x] += value * amplitude;
      }
    }
  }

  // Normalize to 0-1
  let min = Infinity;
  let max = -Infinity;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map[y][x] < min) min = map[y][x];
      if (map[y][x] > max) max = map[y][x];
    }
  }

  const range = max - min || 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      map[y][x] = (map[y][x] - min) / range;
    }
  }

  return map;
}

function placeVillages(
  tiles: TileType[][],
  rng: SeededRNG,
  width: number,
  height: number,
): { x: number; y: number }[] {
  const villages: { x: number; y: number }[] = [];
  const minDist = Math.min(width, height) / 4;
  const attempts = 100;

  for (let i = 0; i < attempts && villages.length < 4; i++) {
    const x = rng.randomInt(5, width - 5);
    const y = rng.randomInt(5, height - 5);

    // Must be on grass
    if (tiles[y][x] !== TT.GRASS) continue;

    // Check minimum distance from other villages
    const tooClose = villages.some(
      (v) => Math.abs(v.x - x) + Math.abs(v.y - y) < minDist,
    );
    if (tooClose) continue;

    villages.push({ x, y });

    // Mark village area
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const ty = y + dy;
        const tx = x + dx;
        if (ty >= 0 && ty < height && tx >= 0 && tx < width) {
          if (tiles[ty][tx] === TT.GRASS) {
            tiles[ty][tx] = TT.FLOOR;
          }
        }
      }
    }
  }

  return villages;
}

function carvePath(
  tiles: TileType[][],
  from: { x: number; y: number },
  to: { x: number; y: number },
  width: number,
  height: number,
): void {
  let x = from.x;
  let y = from.y;

  while (x !== to.x || y !== to.y) {
    if (x !== to.x) {
      x += x < to.x ? 1 : -1;
    } else {
      y += y < to.y ? 1 : -1;
    }

    if (y >= 0 && y < height && x >= 0 && x < width) {
      if (tiles[y][x] === TT.GRASS || tiles[y][x] === TT.SAND) {
        tiles[y][x] = TT.PATH;
      }
    }
  }
}

function addBridges(tiles: TileType[][], width: number, height: number): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (tiles[y][x] !== TT.WATER) continue;

      // Check if a path enters from one side and exits the other
      const pathH =
        (tiles[y][x - 1] === TT.PATH || tiles[y][x - 1] === TT.FLOOR) &&
        (tiles[y][x + 1] === TT.PATH || tiles[y][x + 1] === TT.FLOOR);
      const pathV =
        (tiles[y - 1]?.[x] === TT.PATH || tiles[y - 1]?.[x] === TT.FLOOR) &&
        (tiles[y + 1]?.[x] === TT.PATH || tiles[y + 1]?.[x] === TT.FLOOR);

      if (pathH || pathV) {
        tiles[y][x] = TT.BRIDGE;
      }
    }
  }
}
