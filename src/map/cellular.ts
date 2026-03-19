import { SeededRNG } from '../utils/rng.js';
import type { CellularConfig, GeneratedMap, Room } from './types.js';
import { TileType as TT, type TileType } from './types.js';

const DEFAULT_BIRTH = 4;
const DEFAULT_DEATH = 3;
const DEFAULT_ITERATIONS = 5;
const DEFAULT_DENSITY = 0.45;

/** Generate a cave map using cellular automata */
export function generateCave(config: CellularConfig): GeneratedMap {
  const {
    width,
    height,
    seed = Date.now(),
    birthLimit = DEFAULT_BIRTH,
    deathLimit = DEFAULT_DEATH,
    iterations = DEFAULT_ITERATIONS,
    initialDensity = DEFAULT_DENSITY,
  } = config;

  const rng = new SeededRNG(seed);

  // Initialize grid randomly
  let grid: boolean[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => rng.random() < initialDensity),
  );

  // Force edges to be walls
  for (let y = 0; y < height; y++) {
    grid[y][0] = true;
    grid[y][width - 1] = true;
  }
  for (let x = 0; x < width; x++) {
    grid[0][x] = true;
    grid[height - 1][x] = true;
  }

  // Run cellular automata iterations
  for (let i = 0; i < iterations; i++) {
    grid = step(grid, width, height, birthLimit, deathLimit);
  }

  // Find connected regions using flood fill
  const regionMap = new Int32Array(width * height).fill(-1);
  const regions: { id: number; cells: { x: number; y: number }[] }[] = [];
  let regionId = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!grid[y][x] && regionMap[y * width + x] === -1) {
        const cells = floodFill(grid, regionMap, x, y, width, height, regionId);
        regions.push({ id: regionId, cells });
        regionId++;
      }
    }
  }

  // Keep the largest region, or connect the largest ones
  if (regions.length > 1) {
    regions.sort((a, b) => b.cells.length - a.cells.length);

    // Connect secondary regions to the main region via tunnels
    const main = regions[0];
    for (let i = 1; i < Math.min(regions.length, 5); i++) {
      connectRegions(grid, main.cells, regions[i].cells, rng);
    }

    // Fill remaining small isolated regions
    for (let i = 5; i < regions.length; i++) {
      for (const cell of regions[i].cells) {
        grid[cell.y][cell.x] = true;
      }
    }
  }

  // Convert to tile types
  const tiles: TileType[][] = grid.map((row) =>
    row.map((wall) => (wall ? TT.WALL : TT.FLOOR)),
  );

  // Add water pools in dead-end areas
  addWaterPools(tiles, rng, width, height);

  // Find spawn and exit points
  const floorCells: { x: number; y: number }[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (tiles[y][x] === TT.FLOOR) {
        floorCells.push({ x, y });
      }
    }
  }

  const spawnPoint = floorCells.length > 0 ? floorCells[0] : undefined;
  const exitPoint = floorCells.length > 1 ? floorCells[floorCells.length - 1] : undefined;

  // Create pseudo-rooms from connected areas
  const rooms: Room[] = regions.slice(0, 5).map((r, i) => {
    const minX = Math.min(...r.cells.map((c) => c.x));
    const minY = Math.min(...r.cells.map((c) => c.y));
    const maxX = Math.max(...r.cells.map((c) => c.x));
    const maxY = Math.max(...r.cells.map((c) => c.y));
    return {
      id: i,
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      connections: [],
    };
  });

  return { width, height, tiles, rooms, seed, spawnPoint, exitPoint };
}

function step(
  grid: boolean[][],
  width: number,
  height: number,
  birthLimit: number,
  deathLimit: number,
): boolean[][] {
  const next: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Edges are always walls
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        next[y][x] = true;
        continue;
      }

      const neighbors = countNeighbors(grid, x, y, width, height);
      if (grid[y][x]) {
        // Alive cell: stays alive if enough neighbors
        next[y][x] = neighbors >= deathLimit;
      } else {
        // Dead cell: becomes alive if enough neighbors
        next[y][x] = neighbors >= birthLimit;
      }
    }
  }

  return next;
}

function countNeighbors(
  grid: boolean[][],
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        count++; // Out of bounds counts as wall
      } else if (grid[ny][nx]) {
        count++;
      }
    }
  }
  return count;
}

function floodFill(
  grid: boolean[][],
  regionMap: Int32Array,
  startX: number,
  startY: number,
  width: number,
  height: number,
  regionId: number,
): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  const stack: [number, number][] = [[startX, startY]];

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (grid[y][x]) continue;
    if (regionMap[y * width + x] !== -1) continue;

    regionMap[y * width + x] = regionId;
    cells.push({ x, y });

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return cells;
}

function connectRegions(
  grid: boolean[][],
  a: { x: number; y: number }[],
  b: { x: number; y: number }[],
  rng: SeededRNG,
): void {
  // Find closest pair of cells between regions
  const cellA = rng.pick(a);
  let bestB = b[0];
  let bestDist = Infinity;

  for (const cb of b) {
    const dist = Math.abs(cb.x - cellA.x) + Math.abs(cb.y - cellA.y);
    if (dist < bestDist) {
      bestDist = dist;
      bestB = cb;
    }
  }

  // Carve tunnel between them
  let x = cellA.x;
  let y = cellA.y;
  while (x !== bestB.x || y !== bestB.y) {
    if (x !== bestB.x) {
      x += x < bestB.x ? 1 : -1;
    } else {
      y += y < bestB.y ? 1 : -1;
    }
    if (y > 0 && y < grid.length - 1 && x > 0 && x < grid[0].length - 1) {
      grid[y][x] = false;
    }
  }
}

function addWaterPools(
  tiles: TileType[][],
  rng: SeededRNG,
  width: number,
  height: number,
): void {
  const poolCount = rng.randomInt(1, 3);
  for (let i = 0; i < poolCount; i++) {
    const cx = rng.randomInt(5, width - 5);
    const cy = rng.randomInt(5, height - 5);
    const radius = rng.randomInt(2, 4);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const ty = cy + dy;
        const tx = cx + dx;
        if (ty > 0 && ty < height - 1 && tx > 0 && tx < width - 1) {
          if (tiles[ty][tx] === TT.FLOOR) {
            tiles[ty][tx] = TT.WATER;
          }
        }
      }
    }
  }
}
