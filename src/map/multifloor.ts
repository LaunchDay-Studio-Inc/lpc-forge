import { generateDungeon } from './dungeon.js';
import type { GeneratedMap, PointOfInterest } from './types.js';

export interface MultiFloorConfig {
  floors: number;
  width: number;
  height: number;
  seed?: number | string;
}

export interface FloorConnection {
  floor: number;
  x: number;
  y: number;
  targetFloor: number;
  tx: number;
  ty: number;
}

export interface MultiFloorDungeon {
  floors: GeneratedMap[];
  connections: FloorConnection[];
}

export function generateMultiFloor(config: MultiFloorConfig): MultiFloorDungeon {
  const {
    floors: numFloors,
    width,
    height,
    seed = Date.now(),
  } = config;

  const floorCount = Math.max(2, Math.min(5, numFloors));
  const floors: GeneratedMap[] = [];
  const connections: FloorConnection[] = [];

  for (let f = 0; f < floorCount; f++) {
    const floorSeed = `${seed}-floor-${f}`;
    const map = generateDungeon({
      width,
      height,
      seed: floorSeed,
      maxRooms: Math.max(4, 10 - f), // fewer rooms on deeper floors
      roomMinSize: 5,
      roomMaxSize: 12,
    });

    // Mark entrance/exit POIs for floor connections
    if (f > 0) {
      // Entrance from previous floor (upstairs)
      const spawnRoom = map.rooms[0];
      if (spawnRoom) {
        const ex = Math.floor(spawnRoom.x + spawnRoom.width / 2);
        const ey = Math.floor(spawnRoom.y + spawnRoom.height / 2);
        map.pois.push({ x: ex, y: ey, type: 'entrance', label: `Stairs Up (Floor ${f})` });
      }
    }

    if (f < floorCount - 1) {
      // Exit to next floor (downstairs)
      const exitRoom = map.rooms[map.rooms.length - 1];
      if (exitRoom) {
        const ex = Math.floor(exitRoom.x + exitRoom.width / 2);
        const ey = Math.floor(exitRoom.y + exitRoom.height / 2);
        map.pois.push({ x: ex, y: ey, type: 'exit', label: `Stairs Down (Floor ${f + 2})` });
      }
    }

    floors.push(map);
  }

  // Build connections between floors
  for (let f = 0; f < floorCount - 1; f++) {
    const currentExit = floors[f].pois.find(
      (p) => p.type === 'exit' && p.label?.includes(`Floor ${f + 2}`),
    ) ?? floors[f].exitPoint;
    const nextEntrance = floors[f + 1].pois.find(
      (p) => p.type === 'entrance' && p.label?.includes(`Floor ${f + 1}`),
    ) ?? floors[f + 1].spawnPoint;

    if (currentExit && nextEntrance) {
      connections.push({
        floor: f,
        x: currentExit.x,
        y: currentExit.y,
        targetFloor: f + 1,
        tx: nextEntrance.x,
        ty: nextEntrance.y,
      });
    } else {
      console.warn(`Warning: Could not establish stair connection between floor ${f} and floor ${f + 1}`);
    }
  }

  return { floors, connections };
}
