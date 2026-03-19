export interface MapConfig {
  width: number;
  height: number;
  seed?: string | number;
}

export interface DungeonConfig extends MapConfig {
  roomMinSize?: number;
  roomMaxSize?: number;
  maxRooms?: number;
  corridorWidth?: number;
}

export interface CellularConfig extends MapConfig {
  birthLimit?: number;
  deathLimit?: number;
  iterations?: number;
  initialDensity?: number;
}

export interface OverworldConfig extends MapConfig {
  biomes?: string[];
  temperature?: number;
}

export interface PointOfInterest {
  x: number;
  y: number;
  type: 'spawn' | 'treasure' | 'npc' | 'exit' | 'entrance' | 'boss';
  label?: string;
}

export enum TileType {
  VOID = 0,
  FLOOR = 1,
  WALL = 2,
  DOOR = 3,
  CORRIDOR = 4,
  WATER = 5,
  GRASS = 6,
  TREE = 7,
  PATH = 8,
  SAND = 9,
  STONE = 10,
  BRIDGE = 11,
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  id: number;
  connections: number[];
}

export interface GeneratedMap {
  width: number;
  height: number;
  tiles: TileType[][];
  rooms: Room[];
  seed: string | number;
  pois: PointOfInterest[];
  spawnPoint?: { x: number; y: number };
  exitPoint?: { x: number; y: number };
}
