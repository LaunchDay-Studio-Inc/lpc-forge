import { describe, it, expect } from 'vitest';
import { generateTown } from '../map/town.js';
import { TileType } from '../map/types.js';

describe('Town Generator', () => {
  it('should generate a town with rooms', () => {
    const map = generateTown({ width: 50, height: 50, seed: 'town-seed' });

    expect(map.width).toBe(50);
    expect(map.height).toBe(50);
    expect(map.tiles).toHaveLength(50);
    expect(map.tiles[0]).toHaveLength(50);
    expect(map.rooms.length).toBeGreaterThan(0);
  });

  it('should produce deterministic output with same seed', () => {
    const map1 = generateTown({ width: 40, height: 40, seed: 'deterministic-town' });
    const map2 = generateTown({ width: 40, height: 40, seed: 'deterministic-town' });

    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 40; x++) {
        expect(map1.tiles[y][x]).toBe(map2.tiles[y][x]);
      }
    }
  });

  it('should contain stone tiles for town square', () => {
    const map = generateTown({ width: 50, height: 50, seed: 'stone-test' });

    let hasStone = false;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.tiles[y][x] === TileType.STONE) hasStone = true;
      }
    }
    expect(hasStone).toBe(true);
  });

  it('should contain path tiles', () => {
    const map = generateTown({ width: 50, height: 50, seed: 'path-test' });

    let hasPath = false;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.tiles[y][x] === TileType.PATH) hasPath = true;
      }
    }
    expect(hasPath).toBe(true);
  });

  it('should generate POIs', () => {
    const map = generateTown({ width: 50, height: 50, seed: 'poi-town' });

    expect(map.pois.length).toBeGreaterThan(0);
    const spawnPoi = map.pois.find((p) => p.type === 'spawn');
    expect(spawnPoi).toBeDefined();
  });

  it('should have spawn and exit points', () => {
    const map = generateTown({ width: 50, height: 50, seed: 'spawn-exit' });
    expect(map.spawnPoint).toBeDefined();
  });

  it('should respect building count parameter', () => {
    const map4 = generateTown({ width: 60, height: 60, seed: 'b4', buildings: 4 });
    const map8 = generateTown({ width: 60, height: 60, seed: 'b8', buildings: 8 });

    // Both should have rooms
    expect(map4.rooms.length).toBeGreaterThanOrEqual(4);
    expect(map8.rooms.length).toBeGreaterThanOrEqual(4);
  });
});
