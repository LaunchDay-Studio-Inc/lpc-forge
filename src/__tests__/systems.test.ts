import { describe, it, expect } from 'vitest';
import { getAllSystems, getSystem, listSystems, getSystemsInOrder } from '../systems/index.js';

describe('Game Systems', () => {
  it('should have at least 10 systems', () => {
    expect(listSystems().length).toBeGreaterThanOrEqual(10);
  });

  it('every system should have required fields', () => {
    for (const sys of getAllSystems()) {
      expect(sys.name, 'missing name').toBeTruthy();
      expect(sys.description, `${sys.name} missing description`).toBeTruthy();
      expect(sys.files.length, `${sys.name} has no files`).toBeGreaterThan(0);
      expect(Array.isArray(sys.dependencies), `${sys.name} dependencies`).toBe(true);
      expect(Array.isArray(sys.autoloads), `${sys.name} autoloads`).toBe(true);
      expect(Array.isArray(sys.inputActions), `${sys.name} inputActions`).toBe(true);
    }
  });

  it('every file should have path and content', () => {
    for (const sys of getAllSystems()) {
      for (const file of sys.files) {
        expect(file.path, `${sys.name} file missing path`).toBeTruthy();
        expect(file.content, `${sys.name}/${file.path} missing content`).toBeTruthy();
        expect(file.content.length, `${sys.name}/${file.path} empty`).toBeGreaterThan(10);
      }
    }
  });

  it('should resolve individual systems by name', () => {
    const enemy = getSystem('enemy_ai');
    expect(enemy).not.toBeNull();
    expect(enemy!.name).toBe('enemy_ai');

    const inventory = getSystem('inventory');
    expect(inventory).not.toBeNull();
    expect(inventory!.files.length).toBeGreaterThanOrEqual(3);
  });

  it('should return null for unknown systems', () => {
    expect(getSystem('nonexistent')).toBeNull();
  });

  it('dependency order should resolve deps before dependents', () => {
    const ordered = getSystemsInOrder(['loot']);
    const names = ordered.map(s => s.name);
    // loot depends on inventory, so inventory should come first
    const invIdx = names.indexOf('inventory');
    const lootIdx = names.indexOf('loot');
    expect(invIdx).toBeGreaterThanOrEqual(0);
    expect(lootIdx).toBeGreaterThan(invIdx);
  });

  it('all systems should resolve without circular deps', () => {
    const ordered = getSystemsInOrder();
    expect(ordered.length).toBe(listSystems().length);
  });

  it('autoloads should have name and path', () => {
    for (const sys of getAllSystems()) {
      for (const al of sys.autoloads) {
        expect(al.name).toBeTruthy();
        expect(al.path).toMatch(/^res:\/\//);
      }
    }
  });

  it('.gd files should start with extends', () => {
    for (const sys of getAllSystems()) {
      for (const file of sys.files) {
        if (file.path.endsWith('.gd')) {
          expect(file.content.trimStart().startsWith('extends'), `${sys.name}/${file.path}`).toBe(true);
        }
      }
    }
  });

  it('.tscn files should start with [gd_scene', () => {
    for (const sys of getAllSystems()) {
      for (const file of sys.files) {
        if (file.path.endsWith('.tscn')) {
          expect(file.content.trimStart().startsWith('[gd_scene'), `${sys.name}/${file.path}`).toBe(true);
        }
      }
    }
  });
});
