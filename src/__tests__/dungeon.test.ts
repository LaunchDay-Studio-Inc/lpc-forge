import { describe, it, expect } from 'vitest';
import { generateDungeon } from '../map/dungeon.js';
import { TileType } from '../map/types.js';

describe('Dungeon Generator', () => {
  it('should generate a dungeon with rooms', () => {
    const map = generateDungeon({
      width: 50,
      height: 50,
      seed: 'test-seed',
      maxRooms: 8,
    });

    expect(map.width).toBe(50);
    expect(map.height).toBe(50);
    expect(map.tiles).toHaveLength(50);
    expect(map.tiles[0]).toHaveLength(50);
    expect(map.rooms.length).toBeGreaterThan(0);
    expect(map.rooms.length).toBeLessThanOrEqual(8);
  });

  it('should produce deterministic output with same seed', () => {
    const map1 = generateDungeon({ width: 30, height: 30, seed: 'deterministic' });
    const map2 = generateDungeon({ width: 30, height: 30, seed: 'deterministic' });

    // Same seed should produce identical maps
    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 30; x++) {
        expect(map1.tiles[y][x]).toBe(map2.tiles[y][x]);
      }
    }
  });

  it('should have spawn and exit points', () => {
    const map = generateDungeon({
      width: 50,
      height: 50,
      seed: 'spawn-test',
      maxRooms: 5,
    });

    expect(map.spawnPoint).toBeDefined();
    if (map.rooms.length > 1) {
      expect(map.exitPoint).toBeDefined();
    }

    // Spawn should be on a floor tile
    if (map.spawnPoint) {
      const tile = map.tiles[map.spawnPoint.y][map.spawnPoint.x];
      expect(tile).toBe(TileType.FLOOR);
    }
  });

  it('should have connected rooms', () => {
    const map = generateDungeon({
      width: 60,
      height: 60,
      seed: 'connected',
      maxRooms: 6,
    });

    // At least some rooms should have connections
    const connected = map.rooms.filter((r) => r.connections.length > 0);
    expect(connected.length).toBeGreaterThan(0);
  });

  it('should contain floor tiles inside rooms', () => {
    const map = generateDungeon({
      width: 40,
      height: 40,
      seed: 'floor-check',
      maxRooms: 4,
    });

    for (const room of map.rooms) {
      const cx = Math.floor(room.x + room.width / 2);
      const cy = Math.floor(room.y + room.height / 2);
      if (cx > 0 && cx < map.width - 1 && cy > 0 && cy < map.height - 1) {
        expect(map.tiles[cy][cx]).toBe(TileType.FLOOR);
      }
    }
  });
});
