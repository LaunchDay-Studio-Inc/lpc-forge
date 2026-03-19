import { describe, it, expect } from 'vitest';
import { PRESETS } from '../character/presets.js';

const EXPECTED_PRESETS = [
  'warrior', 'mage', 'rogue', 'ranger', 'villager',
  'paladin', 'necromancer', 'knight', 'barbarian', 'monk',
  'thief', 'healer', 'archer', 'merchant', 'guard',
  'skeleton', 'peasant',
];

describe('Character Presets', () => {
  it('should have all 17 expected presets', () => {
    for (const name of EXPECTED_PRESETS) {
      expect(PRESETS[name], `Missing preset: ${name}`).toBeDefined();
    }
    expect(Object.keys(PRESETS)).toHaveLength(EXPECTED_PRESETS.length);
  });

  it('each preset should have name, description, and valid spec', () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.spec).toBeDefined();
      expect(preset.spec.bodyType).toBeTruthy();
      expect(preset.spec.layers.length).toBeGreaterThan(0);
    }
  });

  it('each layer in every preset should have category, subcategory, variant', () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      for (const layer of preset.spec.layers) {
        expect(layer.category, `${key}: missing layer category`).toBeTruthy();
        expect(layer.subcategory, `${key}: missing layer subcategory`).toBeTruthy();
        expect(layer.variant, `${key}: missing layer variant`).toBeTruthy();
      }
    }
  });

  it('all presets should have unique names', () => {
    const names = Object.values(PRESETS).map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('paladin should have gold armor and shield', () => {
    const paladin = PRESETS['paladin'];
    expect(paladin.spec.bodyType).toBe('female');
    const armorLayer = paladin.spec.layers.find((l) => l.subcategory === 'torso_armour_plate');
    expect(armorLayer?.variant).toBe('gold');
    const shieldLayer = paladin.spec.layers.find((l) => l.subcategory === 'shield_crusader');
    expect(shieldLayer).toBeDefined();
  });

  it('skeleton should use body_skeleton', () => {
    const skeleton = PRESETS['skeleton'];
    const bodyLayer = skeleton.spec.layers.find((l) => l.subcategory === 'body_skeleton');
    expect(bodyLayer).toBeDefined();
  });

  it('barbarian should use muscular body type', () => {
    expect(PRESETS['barbarian'].spec.bodyType).toBe('muscular');
  });
});
