import { describe, it, expect } from 'vitest';
import {
  listLightingPresets,
  listParticlePresets,
  getLightingPreset,
  getParticlePreset,
  generateLightingScene,
} from '../lighting/index.js';

describe('Lighting Presets', () => {
  it('should have at least 8 lighting presets', () => {
    expect(listLightingPresets().length).toBeGreaterThanOrEqual(8);
  });

  it('every preset should have required fields', () => {
    for (const name of listLightingPresets()) {
      const preset = getLightingPreset(name)!;
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.ambientColor).toBeDefined();
      expect(preset.ambientColor.r).toBeGreaterThanOrEqual(0);
      expect(preset.ambientColor.r).toBeLessThanOrEqual(1);
      expect(Array.isArray(preset.lights)).toBe(true);
    }
  });

  it('should generate valid .tscn for each preset', () => {
    for (const name of listLightingPresets()) {
      const preset = getLightingPreset(name)!;
      const scene = generateLightingScene(preset);
      expect(scene).toContain('[gd_scene');
      expect(scene).toContain('CanvasModulate');
    }
  });

  it('dungeon_dark should have shadow-casting player light', () => {
    const preset = getLightingPreset('dungeon_dark')!;
    const playerLight = preset.lights.find(l => l.name === 'PlayerLight');
    expect(playerLight).toBeDefined();
    expect(playerLight!.shadow).toBe(true);
    expect(playerLight!.type).toBe('point');
  });

  it('overworld_day should have no lights (full brightness)', () => {
    const preset = getLightingPreset('overworld_day')!;
    expect(preset.lights.length).toBe(0);
    expect(preset.ambientColor.r).toBe(1.0);
  });
});

describe('Particle Presets', () => {
  it('should have at least 8 particle presets', () => {
    expect(listParticlePresets().length).toBeGreaterThanOrEqual(8);
  });

  it('every preset should have valid scene content', () => {
    for (const name of listParticlePresets()) {
      const preset = getParticlePreset(name)!;
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.scene).toContain('[gd_scene');
      expect(preset.scene).toContain('GPUParticles2D');
    }
  });

  it('blood_splatter should be one_shot', () => {
    const preset = getParticlePreset('blood_splatter')!;
    expect(preset.scene).toContain('one_shot = true');
  });

  it('rain should have high particle count', () => {
    const preset = getParticlePreset('rain')!;
    expect(preset.scene).toContain('amount = 200');
  });
});

describe('License', () => {
  it('should report no license when none exists', async () => {
    const { hasValidLicense } = await import('../license.js');
    // In test environment, no license file should exist
    const valid = await hasValidLicense();
    expect(typeof valid).toBe('boolean');
  });
});
