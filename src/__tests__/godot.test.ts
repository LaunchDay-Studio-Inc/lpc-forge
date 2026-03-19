import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportMapToGodot, scaffoldGodotProject } from '../export/godot.js';
import { generateDungeon } from '../map/dungeon.js';

describe('Godot Exporter', () => {
  it('should scaffold a valid Godot project', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'godot-test-'));
    try {
      await scaffoldGodotProject(tmpDir, 'TestProject');

      const projectGodot = await readFile(join(tmpDir, 'project.godot'), 'utf-8');
      expect(projectGodot).toContain('config/name="TestProject"');
      expect(projectGodot).toContain('config/features=PackedStringArray("4.6")');

      const playerGd = await readFile(join(tmpDir, 'scripts', 'player.gd'), 'utf-8');
      expect(playerGd).toContain('extends CharacterBody2D');
      expect(playerGd).toContain('move_and_slide()');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should export a map as Godot TileMapLayer', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'godot-map-'));
    try {
      const map = generateDungeon({
        width: 20,
        height: 20,
        seed: 'godot-test',
        maxRooms: 3,
      });

      await exportMapToGodot(map, tmpDir, 'test_dungeon');

      const tscn = await readFile(join(tmpDir, 'test_dungeon.tscn'), 'utf-8');
      expect(tscn).toContain('format=3');
      expect(tscn).toContain('TileMapLayer');
      expect(tscn).toContain('TileSet');

      const tres = await readFile(join(tmpDir, 'test_dungeon_tileset.tres'), 'utf-8');
      expect(tres).toContain('TileSet');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
