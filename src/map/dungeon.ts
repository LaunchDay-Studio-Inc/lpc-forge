import { SeededRNG } from '../utils/rng.js';
import type { DungeonConfig, GeneratedMap, Room, TileType, PointOfInterest } from './types.js';
import { TileType as TT } from './types.js';

const DEFAULT_ROOM_MIN = 5;
const DEFAULT_ROOM_MAX = 15;
const DEFAULT_MAX_ROOMS = 12;
const DEFAULT_CORRIDOR_WIDTH = 1;

/** Generate a dungeon using BSP (Binary Space Partition) */
export function generateDungeon(config: DungeonConfig): GeneratedMap {
  const {
    width,
    height,
    seed = Date.now(),
    roomMinSize = DEFAULT_ROOM_MIN,
    roomMaxSize = DEFAULT_ROOM_MAX,
    maxRooms = DEFAULT_MAX_ROOMS,
    corridorWidth = DEFAULT_CORRIDOR_WIDTH,
  } = config;

  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 10 || height < 10) {
    throw new Error(`Invalid map dimensions: ${width}×${height} (minimum 10×10)`);
  }

  const rng = new SeededRNG(seed);

  // Initialize grid with walls
  const tiles: TileType[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => TT.WALL),
  );

  const rooms: Room[] = [];

  // BSP tree structure
  interface BSPNode {
    x: number;
    y: number;
    w: number;
    h: number;
    left?: BSPNode;
    right?: BSPNode;
    room?: Room;
  }

  // Create BSP tree
  function splitNode(node: BSPNode, depth: number): void {
    if (depth <= 0 || rooms.length >= maxRooms) return;

    const minSize = roomMinSize + 4; // minimum partition size
    const canSplitH = node.h >= minSize * 2;
    const canSplitV = node.w >= minSize * 2;

    if (!canSplitH && !canSplitV) return;

    let splitHorizontally: boolean;
    if (canSplitH && canSplitV) {
      splitHorizontally = rng.random() < 0.5;
    } else {
      splitHorizontally = canSplitH;
    }

    if (splitHorizontally) {
      const split = rng.randomInt(minSize, node.h - minSize);
      node.left = { x: node.x, y: node.y, w: node.w, h: split };
      node.right = { x: node.x, y: node.y + split, w: node.w, h: node.h - split };
    } else {
      const split = rng.randomInt(minSize, node.w - minSize);
      node.left = { x: node.x, y: node.y, w: split, h: node.h };
      node.right = { x: node.x + split, y: node.y, w: node.w - split, h: node.h };
    }

    splitNode(node.left, depth - 1);
    splitNode(node.right, depth - 1);
  }

  // Place rooms in leaf nodes
  function placeRooms(node: BSPNode): void {
    if (rooms.length >= maxRooms) return;

    if (!node.left && !node.right) {
      // Leaf node — place a room
      const rw = rng.randomInt(roomMinSize, Math.min(roomMaxSize, node.w - 2));
      const rh = rng.randomInt(roomMinSize, Math.min(roomMaxSize, node.h - 2));

      if (rw > node.w - 2 || rh > node.h - 2) return; // BSP node too small for a room

      const maxOffX = Math.max(1, node.w - rw - 1);
      const maxOffY = Math.max(1, node.h - rh - 1);
      const offX = rng.randomInt(1, maxOffX);
      const offY = rng.randomInt(1, maxOffY);
      const rx = node.x + offX;
      const ry = node.y + offY;

      const room: Room = {
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        id: rooms.length,
        connections: [],
      };
      node.room = room;
      rooms.push(room);

      // Carve room
      for (let dy = 0; dy < rh; dy++) {
        for (let dx = 0; dx < rw; dx++) {
          const ty = ry + dy;
          const tx = rx + dx;
          if (ty > 0 && ty < height - 1 && tx > 0 && tx < width - 1) {
            tiles[ty][tx] = TT.FLOOR;
          }
        }
      }
      return;
    }

    if (node.left) placeRooms(node.left);
    if (node.right) placeRooms(node.right);
  }

  // Connect rooms via corridors
  function connectRooms(node: BSPNode): void {
    if (!node.left || !node.right) return;

    connectRooms(node.left);
    connectRooms(node.right);

    const leftRoom = findRoom(node.left);
    const rightRoom = findRoom(node.right);
    if (!leftRoom || !rightRoom) return;

    carveCorridor(leftRoom, rightRoom, corridorWidth);
  }

  function findRoom(node: BSPNode): Room | null {
    if (node.room) return node.room;
    if (node.left) {
      const r = findRoom(node.left);
      if (r) return r;
    }
    if (node.right) return findRoom(node.right);
    return null;
  }

  function carveCorridor(a: Room, b: Room, cw: number): void {
    const ax = Math.floor(a.x + a.width / 2);
    const ay = Math.floor(a.y + a.height / 2);
    const bx = Math.floor(b.x + b.width / 2);
    const by = Math.floor(b.y + b.height / 2);

    a.connections.push(b.id);
    b.connections.push(a.id);

    // L-shaped corridor
    if (rng.random() < 0.5) {
      carveHorizontalCorridor(ax, bx, ay, cw);
      carveVerticalCorridor(ay, by, bx, cw);
    } else {
      carveVerticalCorridor(ay, by, ax, cw);
      carveHorizontalCorridor(ax, bx, by, cw);
    }
  }

  function carveHorizontalCorridor(x1: number, x2: number, y: number, cw: number): void {
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    for (let x = startX; x <= endX; x++) {
      for (let w = 0; w < cw; w++) {
        const ty = y + w;
        if (ty > 0 && ty < height - 1 && x > 0 && x < width - 1) {
          if (tiles[ty][x] === TT.WALL) {
            tiles[ty][x] = TT.CORRIDOR;
          }
        }
      }
    }
  }

  function carveVerticalCorridor(y1: number, y2: number, x: number, cw: number): void {
    const startY = Math.min(y1, y2);
    const endY = Math.max(y1, y2);
    for (let y = startY; y <= endY; y++) {
      for (let w = 0; w < cw; w++) {
        const tx = x + w;
        if (y > 0 && y < height - 1 && tx > 0 && tx < width - 1) {
          if (tiles[y][tx] === TT.WALL) {
            tiles[y][tx] = TT.CORRIDOR;
          }
        }
      }
    }
  }

  // Build BSP tree
  const maxDepth = Math.ceil(Math.log2(maxRooms)) + 1;
  const root: BSPNode = { x: 0, y: 0, w: width, h: height };
  splitNode(root, maxDepth);
  placeRooms(root);
  connectRooms(root);

  // Place doors at room-corridor junctions
  placeDoors(tiles, rooms, width, height);

  // Set spawn and exit
  const spawnRoom = rooms[0];
  const exitRoom = rooms[rooms.length - 1];

  const spawnPoint = spawnRoom
    ? { x: Math.floor(spawnRoom.x + spawnRoom.width / 2), y: Math.floor(spawnRoom.y + spawnRoom.height / 2) }
    : undefined;
  const exitPoint = exitRoom && exitRoom !== spawnRoom
    ? { x: Math.floor(exitRoom.x + exitRoom.width / 2), y: Math.floor(exitRoom.y + exitRoom.height / 2) }
    : undefined;

  // Generate POIs
  const pois: PointOfInterest[] = [];

  if (spawnPoint) {
    pois.push({ x: spawnPoint.x, y: spawnPoint.y, type: 'spawn', label: 'Player Spawn' });
  }
  if (exitPoint) {
    pois.push({ x: exitPoint.x, y: exitPoint.y, type: 'exit', label: 'Exit' });
  }

  // Boss in last room if > 5 rooms
  if (rooms.length > 5 && exitRoom) {
    const bx = Math.floor(exitRoom.x + exitRoom.width / 2) + 1;
    const by = Math.floor(exitRoom.y + exitRoom.height / 2) + 1;
    if (bx > 0 && bx < width && by > 0 && by < height) {
      pois.push({ x: bx, y: by, type: 'boss', label: 'Boss' });
    }
  }

  // Treasure in 30% of rooms
  for (let i = 1; i < rooms.length - 1; i++) {
    if (rng.random() < 0.3) {
      const room = rooms[i];
      const tx = room.x + rng.randomInt(1, room.width - 2);
      const ty = room.y + rng.randomInt(1, room.height - 2);
      pois.push({ x: tx, y: ty, type: 'treasure', label: `Treasure ${i}` });
    }
  }

  // NPC in 20% of rooms
  for (let i = 1; i < rooms.length - 1; i++) {
    if (rng.random() < 0.2) {
      const room = rooms[i];
      const nx = room.x + rng.randomInt(1, room.width - 2);
      const ny = room.y + rng.randomInt(1, room.height - 2);
      pois.push({ x: nx, y: ny, type: 'npc', label: `NPC ${i}` });
    }
  }

  return {
    width,
    height,
    tiles,
    rooms,
    seed,
    pois,
    spawnPoint,
    exitPoint,
  };
}

function placeDoors(
  tiles: TileType[][],
  rooms: Room[],
  width: number,
  height: number,
): void {
  for (const room of rooms) {
    // Check edges of each room for corridor adjacency
    for (let x = room.x; x < room.x + room.width; x++) {
      checkDoor(tiles, x, room.y - 1, width, height);
      checkDoor(tiles, x, room.y + room.height, width, height);
    }
    for (let y = room.y; y < room.y + room.height; y++) {
      checkDoor(tiles, room.x - 1, y, width, height);
      checkDoor(tiles, room.x + room.width, y, width, height);
    }
  }
}

function checkDoor(
  tiles: TileType[][],
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return;
  if (tiles[y][x] !== TT.CORRIDOR) return;

  // Check if this corridor tile is adjacent to a floor tile (room)
  const hasFloor =
    tiles[y - 1]?.[x] === TT.FLOOR ||
    tiles[y + 1]?.[x] === TT.FLOOR ||
    tiles[y]?.[x - 1] === TT.FLOOR ||
    tiles[y]?.[x + 1] === TT.FLOOR;

  if (hasFloor) {
    tiles[y][x] = TT.DOOR;
  }
}
