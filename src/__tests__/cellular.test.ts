import { describe, it, expect } from 'vitest';
import { generateCave } from '../map/cellular.js';
import { TileType } from '../map/types.js';

describe('Cellular Automata Cave Generator', () => {
  it('should generate a cave with floor tiles', () => {
    const map = generateCave({
      width: 40,
      height: 40,
      seed: 'cave-test',
    });

    expect(map.width).toBe(40);
    expect(map.height).toBe(40);

    // Should have some floor tiles
    let floorCount = 0;
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 40; x++) {
        if (map.tiles[y][x] === TileType.FLOOR || map.tiles[y][x] === TileType.WATER) {
          floorCount++;
        }
      }
    }
    expect(floorCount).toBeGreaterThan(0);
  });

  it('should have walls on the edges', () => {
    const map = generateCave({
      width: 30,
      height: 30,
      seed: 'edge-test',
    });

    // Top and bottom edges should be walls
    for (let x = 0; x < 30; x++) {
      expect(map.tiles[0][x]).toBe(TileType.WALL);
      expect(map.tiles[29][x]).toBe(TileType.WALL);
    }
    // Left and right edges
    for (let y = 0; y < 30; y++) {
      expect(map.tiles[y][0]).toBe(TileType.WALL);
      expect(map.tiles[y][29]).toBe(TileType.WALL);
    }
  });

  it('should be deterministic with same seed', () => {
    const map1 = generateCave({ width: 20, height: 20, seed: 42 });
    const map2 = generateCave({ width: 20, height: 20, seed: 42 });

    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        expect(map1.tiles[y][x]).toBe(map2.tiles[y][x]);
      }
    }
  });

  it('should respect config parameters', () => {
    const sparse = generateCave({
      width: 30,
      height: 30,
      seed: 'sparse',
      initialDensity: 0.7,
      iterations: 8,
    });

    const dense = generateCave({
      width: 30,
      height: 30,
      seed: 'dense',
      initialDensity: 0.3,
      iterations: 8,
    });

    // The maps should be different
    let differences = 0;
    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 30; x++) {
        if (sparse.tiles[y][x] !== dense.tiles[y][x]) differences++;
      }
    }
    expect(differences).toBeGreaterThan(0);
  });
});
