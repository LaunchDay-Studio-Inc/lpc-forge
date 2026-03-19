import { describe, it, expect } from 'vitest';
import { SFX_PRESETS } from '../audio/sfx-presets.js';
import { getPresetsByCategory, listSfxPresets } from '../audio/sfx-generator.js';
import { MUSIC_CATALOG, listMusicContexts } from '../audio/music-catalog.js';

describe('SFX Presets', () => {
  it('should have at least 40 presets', () => {
    expect(Object.keys(SFX_PRESETS).length).toBeGreaterThanOrEqual(40);
  });

  it('every preset should have 24 params', () => {
    for (const [name, preset] of Object.entries(SFX_PRESETS)) {
      expect(preset.params.length, `${name} should have 24 params`).toBe(24);
    }
  });

  it('every preset should have required fields', () => {
    for (const [name, preset] of Object.entries(SFX_PRESETS)) {
      expect(preset.name, `${name} missing name`).toBeTruthy();
      expect(preset.category, `${name} missing category`).toBeTruthy();
      expect(preset.description, `${name} missing description`).toBeTruthy();
    }
  });

  it('should cover all 7 categories', () => {
    const categories = new Set(Object.values(SFX_PRESETS).map((p) => p.category));
    expect(categories.size).toBe(7);
    expect(categories).toContain('combat');
    expect(categories).toContain('ui');
    expect(categories).toContain('movement');
    expect(categories).toContain('items');
    expect(categories).toContain('environment');
    expect(categories).toContain('magic');
    expect(categories).toContain('feedback');
  });

  it('getPresetsByCategory should group correctly', () => {
    const grouped = getPresetsByCategory();
    const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    expect(total).toBe(Object.keys(SFX_PRESETS).length);
  });

  it('listSfxPresets should return all preset keys', () => {
    const list = listSfxPresets();
    expect(list.length).toBe(Object.keys(SFX_PRESETS).length);
  });
});

describe('Music Catalog', () => {
  it('should have at least 8 tracks', () => {
    expect(MUSIC_CATALOG.length).toBeGreaterThanOrEqual(8);
  });

  it('every track should have required fields', () => {
    for (const track of MUSIC_CATALOG) {
      expect(track.name).toBeTruthy();
      expect(track.context).toBeTruthy();
      expect(track.filename).toBeTruthy();
      expect(track.license).toBeTruthy();
    }
  });

  it('should cover essential contexts', () => {
    const contexts = listMusicContexts();
    expect(contexts).toContain('town');
    expect(contexts).toContain('dungeon');
    expect(contexts).toContain('battle');
    expect(contexts).toContain('overworld');
    expect(contexts).toContain('menu');
  });
});
