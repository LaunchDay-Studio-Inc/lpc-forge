import { SeededRNG } from '../utils/rng.js';
import type { MapConfig, GeneratedMap, Room, PointOfInterest } from './types.js';
import { TileType as TT, type TileType } from './types.js';

export interface TownConfig extends MapConfig {
  buildings?: number;
  hasWall?: boolean;
  marketSize?: number;
}

const DEFAULT_BUILDINGS = 6;
const DEFAULT_MARKET_SIZE = 8;

export function generateTown(config: TownConfig): GeneratedMap {
  const {
    width,
    height,
    seed = Date.now(),
    buildings = DEFAULT_BUILDINGS,
    hasWall = false,
    marketSize = DEFAULT_MARKET_SIZE,
  } = config;

  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 10 || height < 10) {
    throw new Error(`Invalid map dimensions: ${width}×${height} (minimum 10×10)`);
  }

  const rng = new SeededRNG(seed);
  const numBuildings = Math.max(4, Math.min(8, buildings));

  // Initialize grid with grass
  const tiles: TileType[][] = Array.from({ length: height }, () =>
    Array(width).fill(TT.GRASS),
  );

  // Place trees around the perimeter
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y < 3 || y >= height - 3 || x < 3 || x >= width - 3) {
        if (rng.random() < 0.6) tiles[y][x] = TT.TREE;
      }
    }
  }

  // Town wall (optional)
  if (hasWall) {
    const wMargin = 5;
    for (let x = wMargin; x < width - wMargin; x++) {
      tiles[wMargin][x] = TT.WALL;
      tiles[height - wMargin - 1][x] = TT.WALL;
    }
    for (let y = wMargin; y < height - wMargin; y++) {
      tiles[y][wMargin] = TT.WALL;
      tiles[y][width - wMargin - 1] = TT.WALL;
    }
    // Gate openings
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);
    tiles[wMargin][midX] = TT.DOOR;
    tiles[wMargin][midX + 1] = TT.DOOR;
    tiles[height - wMargin - 1][midX] = TT.DOOR;
    tiles[height - wMargin - 1][midX + 1] = TT.DOOR;
    tiles[midY][wMargin] = TT.DOOR;
    tiles[midY + 1][wMargin] = TT.DOOR;
    tiles[midY][width - wMargin - 1] = TT.DOOR;
    tiles[midY + 1][width - wMargin - 1] = TT.DOOR;
  }

  // Central town square
  const sqSize = Math.min(marketSize, Math.floor(Math.min(width, height) / 4));
  const sqX = Math.floor(width / 2 - sqSize / 2);
  const sqY = Math.floor(height / 2 - sqSize / 2);

  for (let dy = 0; dy < sqSize; dy++) {
    for (let dx = 0; dx < sqSize; dx++) {
      if (sqY + dy >= 0 && sqY + dy < height && sqX + dx >= 0 && sqX + dx < width) {
        tiles[sqY + dy][sqX + dx] = TT.STONE;
      }
    }
  }

  // Market stalls in the square (small 2x2 structures)
  const stallCount = Math.min(4, Math.floor(sqSize / 3));
  for (let s = 0; s < stallCount; s++) {
    const sx = sqX + 1 + s * 2 + s;
    const sy = sqY + 1;
    if (sx + 1 < sqX + sqSize - 1 && sy + 1 < sqY + sqSize - 1) {
      tiles[sy][sx] = TT.WALL;
      tiles[sy][sx + 1] = TT.WALL;
      tiles[sy + 1][sx] = TT.FLOOR;
      tiles[sy + 1][sx + 1] = TT.FLOOR;
    }
  }

  // Place buildings around the square
  const rooms: Room[] = [];
  const buildingPositions: { x: number; y: number; w: number; h: number }[] = [];

  const zones = [
    { baseX: sqX - 10, baseY: sqY - 10 }, // top-left
    { baseX: sqX + sqSize + 2, baseY: sqY - 10 }, // top-right
    { baseX: sqX - 10, baseY: sqY + sqSize + 2 }, // bottom-left
    { baseX: sqX + sqSize + 2, baseY: sqY + sqSize + 2 }, // bottom-right
    { baseX: sqX - 10, baseY: sqY }, // left
    { baseX: sqX + sqSize + 2, baseY: sqY }, // right
    { baseX: sqX, baseY: sqY - 10 }, // top
    { baseX: sqX, baseY: sqY + sqSize + 2 }, // bottom
  ];

  for (let b = 0; b < numBuildings && b < zones.length; b++) {
    const zone = zones[b];
    const bw = rng.randomInt(4, 7);
    const bh = rng.randomInt(4, 6);
    const bx = Math.max(6, Math.min(width - bw - 3, zone.baseX + rng.randomInt(0, 3)));
    const by = Math.max(6, Math.min(height - bh - 3, zone.baseY + rng.randomInt(0, 3)));

    // Check for overlap
    const overlaps = buildingPositions.some(
      (bp) =>
        bx < bp.x + bp.w + 1 &&
        bx + bw + 1 > bp.x &&
        by < bp.y + bp.h + 1 &&
        by + bh + 1 > bp.y,
    );
    if (overlaps) continue;

    buildingPositions.push({ x: bx, y: by, w: bw, h: bh });

    // Draw building: walls on edges, floor inside
    for (let dy = 0; dy < bh; dy++) {
      for (let dx = 0; dx < bw; dx++) {
        const ty = by + dy;
        const tx = bx + dx;
        if (ty >= 0 && ty < height && tx >= 0 && tx < width) {
          if (dy === 0 || dy === bh - 1 || dx === 0 || dx === bw - 1) {
            tiles[ty][tx] = TT.WALL;
          } else {
            tiles[ty][tx] = TT.FLOOR;
          }
        }
      }
    }

    // Door on the south wall
    const doorX = bx + Math.floor(bw / 2);
    if (by + bh - 1 < height) {
      tiles[by + bh - 1][doorX] = TT.DOOR;
    }

    rooms.push({
      id: rooms.length,
      x: bx,
      y: by,
      width: bw,
      height: bh,
      connections: [],
    });
  }

  // Roads connecting buildings to the town square center
  const sqCenterX = sqX + Math.floor(sqSize / 2);
  const sqCenterY = sqY + Math.floor(sqSize / 2);

  for (const bp of buildingPositions) {
    const doorX = bp.x + Math.floor(bp.w / 2);
    const doorY = bp.y + bp.h;
    carvePath(tiles, doorX, doorY, sqCenterX, sqCenterY, width, height);
  }

  // Connect rooms sequentially
  for (let i = 0; i < rooms.length - 1; i++) {
    rooms[i].connections.push(rooms[i + 1].id);
    rooms[i + 1].connections.push(rooms[i].id);
  }

  // POIs
  const pois: PointOfInterest[] = [];
  pois.push({ x: sqCenterX, y: sqCenterY, type: 'spawn', label: 'Town Square' });

  for (let i = 0; i < rooms.length && i < 3; i++) {
    const r = rooms[i];
    pois.push({
      x: r.x + Math.floor(r.width / 2),
      y: r.y + Math.floor(r.height / 2),
      type: 'npc',
      label: `Shopkeeper ${i + 1}`,
    });
  }

  if (rooms.length > 0) {
    const lastRoom = rooms[rooms.length - 1];
    pois.push({
      x: lastRoom.x + 1,
      y: lastRoom.y + 1,
      type: 'treasure',
      label: 'Town Treasury',
    });
  }

  return {
    width,
    height,
    tiles,
    rooms,
    seed,
    pois,
    spawnPoint: { x: sqCenterX, y: sqCenterY },
  };
}

function carvePath(
  tiles: TileType[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  height: number,
): void {
  let x = x1;
  let y = y1;
  while (x !== x2 || y !== y2) {
    if (x !== x2) {
      x += x < x2 ? 1 : -1;
    } else {
      y += y < y2 ? 1 : -1;
    }
    if (y >= 0 && y < height && x >= 0 && x < width) {
      if (tiles[y][x] === TT.GRASS || tiles[y][x] === TT.TREE) {
        tiles[y][x] = TT.PATH;
      }
    }
  }
}
