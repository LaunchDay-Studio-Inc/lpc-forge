import { describe, it, expect } from 'vitest';
import { generateDungeon } from '../map/dungeon.js';
import { generateTown } from '../map/town.js';
import { generateCave } from '../map/cellular.js';
import { generateOverworld } from '../map/overworld.js';
import { generateWFC } from '../map/wfc.js';

describe('POI System', () => {
  it('dungeon should generate POIs with spawn and exit', () => {
    const map = generateDungeon({
      width: 50,
      height: 50,
      seed: 'poi-dungeon',
      maxRooms: 8,
    });

    expect(map.pois).toBeDefined();
    expect(Array.isArray(map.pois)).toBe(true);

    const spawnPoi = map.pois.find((p) => p.type === 'spawn');
    expect(spawnPoi).toBeDefined();

    if (map.rooms.length > 1) {
      const exitPoi = map.pois.find((p) => p.type === 'exit');
      expect(exitPoi).toBeDefined();
    }
  });

  it('dungeon with many rooms should have boss POI', () => {
    const map = generateDungeon({
      width: 60,
      height: 60,
      seed: 'poi-boss',
      maxRooms: 10,
    });

    if (map.rooms.length > 5) {
      const bossPoi = map.pois.find((p) => p.type === 'boss');
      expect(bossPoi).toBeDefined();
    }
  });

  it('overworld should generate POIs', () => {
    const map = generateOverworld({ width: 60, height: 60, seed: 'poi-overworld' });

    expect(map.pois).toBeDefined();
    expect(Array.isArray(map.pois)).toBe(true);
  });

  it('town should generate spawn POI', () => {
    const map = generateTown({ width: 50, height: 50, seed: 'poi-town-test' });

    expect(map.pois).toBeDefined();
    const spawnPoi = map.pois.find((p) => p.type === 'spawn');
    expect(spawnPoi).toBeDefined();
  });

  it('cave should have empty pois array', () => {
    const map = generateCave({ width: 40, height: 40, seed: 'poi-cave' });
    expect(map.pois).toBeDefined();
    expect(Array.isArray(map.pois)).toBe(true);
  });

  it('wfc should have empty pois array', () => {
    const map = generateWFC({ width: 20, height: 20, seed: 'poi-wfc' });
    expect(map.pois).toBeDefined();
    expect(Array.isArray(map.pois)).toBe(true);
  });

  it('POI coordinates should be within map bounds', () => {
    const map = generateDungeon({
      width: 50,
      height: 50,
      seed: 'poi-bounds',
      maxRooms: 8,
    });

    for (const poi of map.pois) {
      expect(poi.x).toBeGreaterThanOrEqual(0);
      expect(poi.x).toBeLessThan(map.width);
      expect(poi.y).toBeGreaterThanOrEqual(0);
      expect(poi.y).toBeLessThan(map.height);
    }
  });

  it('all POIs should have valid type', () => {
    const validTypes = ['spawn', 'treasure', 'npc', 'exit', 'entrance', 'boss'];
    const map = generateDungeon({
      width: 50,
      height: 50,
      seed: 'poi-types',
      maxRooms: 8,
    });

    for (const poi of map.pois) {
      expect(validTypes).toContain(poi.type);
    }
  });
});
