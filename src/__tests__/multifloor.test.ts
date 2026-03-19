import { describe, it, expect } from 'vitest';
import { generateMultiFloor } from '../map/multifloor.js';

describe('Multi-Floor Dungeon Generator', () => {
  it('should generate multiple floors', async () => {
    const result = await generateMultiFloor({
      floors: 3,
      width: 40,
      height: 40,
      seed: 'multi-test',
    });

    expect(result.floors).toHaveLength(3);
    expect(result.connections.length).toBeGreaterThan(0);
  });

  it('should clamp floors between 2 and 5', async () => {
    const result1 = await generateMultiFloor({ floors: 1, width: 30, height: 30, seed: 'clamp-low' });
    expect(result1.floors).toHaveLength(2);

    const result2 = await generateMultiFloor({ floors: 10, width: 30, height: 30, seed: 'clamp-high' });
    expect(result2.floors).toHaveLength(5);
  });

  it('each floor should be a valid map', async () => {
    const result = await generateMultiFloor({
      floors: 3,
      width: 40,
      height: 40,
      seed: 'valid-floors',
    });

    for (const floor of result.floors) {
      expect(floor.width).toBe(40);
      expect(floor.height).toBe(40);
      expect(floor.tiles).toHaveLength(40);
      expect(floor.rooms.length).toBeGreaterThan(0);
    }
  });

  it('should have connections between adjacent floors', async () => {
    const result = await generateMultiFloor({
      floors: 3,
      width: 40,
      height: 40,
      seed: 'conn-test',
    });

    // Should have at least one connection per floor boundary
    expect(result.connections.length).toBeGreaterThanOrEqual(2);

    for (const conn of result.connections) {
      expect(conn.targetFloor).toBe(conn.floor + 1);
    }
  });

  it('should produce deterministic output', async () => {
    const result1 = await generateMultiFloor({ floors: 2, width: 30, height: 30, seed: 'det' });
    const result2 = await generateMultiFloor({ floors: 2, width: 30, height: 30, seed: 'det' });

    for (let f = 0; f < 2; f++) {
      for (let y = 0; y < 30; y++) {
        for (let x = 0; x < 30; x++) {
          expect(result1.floors[f].tiles[y][x]).toBe(result2.floors[f].tiles[y][x]);
        }
      }
    }
  });

  it('should add entrance/exit POIs for floor connections', async () => {
    const result = await generateMultiFloor({
      floors: 3,
      width: 40,
      height: 40,
      seed: 'poi-floors',
    });

    // First floor should have exit POI but no entrance
    const floor0Entrance = result.floors[0].pois.filter((p) => p.type === 'entrance');
    const floor0Exit = result.floors[0].pois.filter((p) => p.type === 'exit');
    expect(floor0Entrance).toHaveLength(0);
    expect(floor0Exit.length).toBeGreaterThan(0);

    // Last floor should have entrance but no multifloor exit (may have dungeon exit)
    const lastFloor = result.floors[2];
    const lastEntrance = lastFloor.pois.filter((p) => p.type === 'entrance');
    expect(lastEntrance.length).toBeGreaterThan(0);

    // Middle floors should have both entrance and exit
    const midFloor = result.floors[1];
    const midEntrance = midFloor.pois.filter((p) => p.type === 'entrance');
    const midExit = midFloor.pois.filter((p) => p.type === 'exit');
    expect(midEntrance.length).toBeGreaterThan(0);
    expect(midExit.length).toBeGreaterThan(0);
  });
});
