import { SeededRNG } from '../utils/rng.js';
import type { MapConfig, GeneratedMap, Room } from './types.js';
import { TileType as TT, type TileType } from './types.js';

export interface WFCTileDef {
  name: string;
  tile: TileType;
  weight: number;
  /** Which tiles are allowed in each direction [up, right, down, left] */
  adjacency: [string[], string[], string[], string[]];
}

/** Default terrain adjacency rules */
export const DEFAULT_WFC_TILES: WFCTileDef[] = [
  {
    name: 'grass',
    tile: TT.GRASS,
    weight: 4,
    adjacency: [
      ['grass', 'tree', 'path', 'sand'],
      ['grass', 'tree', 'path', 'sand'],
      ['grass', 'tree', 'path', 'sand'],
      ['grass', 'tree', 'path', 'sand'],
    ],
  },
  {
    name: 'tree',
    tile: TT.TREE,
    weight: 2,
    adjacency: [
      ['grass', 'tree'],
      ['grass', 'tree'],
      ['grass', 'tree'],
      ['grass', 'tree'],
    ],
  },
  {
    name: 'water',
    tile: TT.WATER,
    weight: 2,
    adjacency: [
      ['water', 'sand'],
      ['water', 'sand'],
      ['water', 'sand'],
      ['water', 'sand'],
    ],
  },
  {
    name: 'sand',
    tile: TT.SAND,
    weight: 1,
    adjacency: [
      ['grass', 'sand', 'water', 'path'],
      ['grass', 'sand', 'water', 'path'],
      ['grass', 'sand', 'water', 'path'],
      ['grass', 'sand', 'water', 'path'],
    ],
  },
  {
    name: 'path',
    tile: TT.PATH,
    weight: 1,
    adjacency: [
      ['grass', 'path', 'sand', 'stone'],
      ['grass', 'path', 'sand', 'stone'],
      ['grass', 'path', 'sand', 'stone'],
      ['grass', 'path', 'sand', 'stone'],
    ],
  },
  {
    name: 'stone',
    tile: TT.STONE,
    weight: 1,
    adjacency: [
      ['stone', 'grass', 'path'],
      ['stone', 'grass', 'path'],
      ['stone', 'grass', 'path'],
      ['stone', 'grass', 'path'],
    ],
  },
];

interface WFCConfig extends MapConfig {
  tiles?: WFCTileDef[];
  maxRetries?: number;
}

/** Generate a map using Wave Function Collapse */
export function generateWFC(config: WFCConfig): GeneratedMap {
  const {
    width,
    height,
    seed = Date.now(),
    tiles: tileDefs = DEFAULT_WFC_TILES,
    maxRetries = 10,
  } = config;

  const rng = new SeededRNG(seed);
  const tileNames = tileDefs.map((t) => t.name);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = tryCollapse(width, height, tileDefs, tileNames, rng);
    if (result) {
      return {
        width,
        height,
        tiles: result,
        rooms: [],
        seed,
      };
    }
  }

  // Fallback: fill with grass
  const fallback: TileType[][] = Array.from({ length: height }, () =>
    Array(width).fill(TT.GRASS),
  );
  return { width, height, tiles: fallback, rooms: [], seed };
}

function tryCollapse(
  width: number,
  height: number,
  tileDefs: WFCTileDef[],
  tileNames: string[],
  rng: SeededRNG,
): TileType[][] | null {
  // Each cell has a set of possible tile indices
  const grid: Set<number>[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => new Set(tileDefs.map((_, i) => i))),
  );

  const totalCells = width * height;
  for (let step = 0; step < totalCells; step++) {
    // Find cell with lowest entropy (fewest possibilities)
    let minEntropy = Infinity;
    let minCells: { x: number; y: number }[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const size = grid[y][x].size;
        if (size <= 1) continue;
        if (size < minEntropy) {
          minEntropy = size;
          minCells = [{ x, y }];
        } else if (size === minEntropy) {
          minCells.push({ x, y });
        }
      }
    }

    if (minCells.length === 0) break; // All collapsed

    // Pick random cell among minimum entropy
    const cell = rng.pick(minCells);

    // Collapse: pick one tile weighted by weight
    const possible = [...grid[cell.y][cell.x]];
    const weights = possible.map((i) => tileDefs[i].weight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = rng.randomFloat(0, totalWeight);
    let chosen = possible[0];
    for (let i = 0; i < possible.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosen = possible[i];
        break;
      }
    }

    grid[cell.y][cell.x] = new Set([chosen]);

    // Propagate constraints
    if (!propagate(grid, cell.x, cell.y, width, height, tileDefs, tileNames)) {
      return null; // Contradiction
    }
  }

  // Convert to tile types
  const result: TileType[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const possible = [...grid[y][x]];
      if (possible.length === 0) return TT.VOID;
      return tileDefs[possible[0]].tile;
    }),
  );

  return result;
}

function propagate(
  grid: Set<number>[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  tileDefs: WFCTileDef[],
  tileNames: string[],
): boolean {
  const stack: [number, number][] = [[startX, startY]];
  // Directions: [dy, dx, dirIndex, oppositeIndex]
  const dirs: [number, number, number, number][] = [
    [-1, 0, 0, 2], // up
    [0, 1, 1, 3],  // right
    [1, 0, 2, 0],  // down
    [0, -1, 3, 1], // left
  ];

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    const currentPossible = grid[cy][cx];

    for (const [dy, dx, dirIdx, oppIdx] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const neighborPossible = grid[ny][nx];
      if (neighborPossible.size <= 1 && grid[ny][nx].size > 0) continue;

      // Compute allowed tiles for neighbor based on current cell
      const allowed = new Set<number>();
      for (const tileIdx of currentPossible) {
        const adjNames = tileDefs[tileIdx].adjacency[dirIdx];
        for (const name of adjNames) {
          const idx = tileNames.indexOf(name);
          if (idx !== -1 && neighborPossible.has(idx)) {
            // Also check reverse: neighbor must allow current tile in opposite direction
            if (tileDefs[idx].adjacency[oppIdx].includes(tileDefs[tileIdx].name)) {
              allowed.add(idx);
            }
          }
        }
      }

      if (allowed.size === 0) return false; // Contradiction

      if (allowed.size < neighborPossible.size) {
        grid[ny][nx] = allowed;
        stack.push([nx, ny]);
      }
    }
  }

  return true;
}
