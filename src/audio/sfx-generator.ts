import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import type { SfxPreset, SfxGenerationResult, SfxCategory } from './types.js';
import { SFX_PRESETS } from './sfx-presets.js';

const require = createRequire(import.meta.url);

/** Parameter array index to Params field mapping */
const PARAM_FIELDS = [
  'wave_type', 'p_env_attack', 'p_env_sustain', 'p_env_punch',
  'p_env_decay', 'p_base_freq', 'p_freq_limit', 'p_freq_ramp',
  'p_freq_dramp', 'p_vib_strength', 'p_vib_speed', 'p_arp_mod',
  'p_arp_speed', 'p_duty', 'p_duty_ramp', 'p_repeat_speed',
  'p_pha_offset', 'p_pha_ramp', 'p_lpf_freq', 'p_lpf_ramp',
  'p_lpf_resonance', 'p_hpf_freq', 'p_hpf_ramp', 'sound_vol',
] as const;

/**
 * Generate a WAV file from jsfxr params.
 * Uses SoundEffect + Params from jsfxr to produce a RIFFWAVE with a data URI.
 */
function generateWavBuffer(params: number[]): Buffer {
  const { Params, SoundEffect } = require('jsfxr');

  const p = new Params();
  for (let i = 0; i < params.length && i < PARAM_FIELDS.length; i++) {
    (p as Record<string, number>)[PARAM_FIELDS[i]] = params[i];
  }

  const se = new SoundEffect(p);
  const wav = se.generate();
  const dataUri: string = wav.dataURI;
  const base64Data = dataUri.split(',')[1];
  if (!base64Data) {
    throw new Error('jsfxr returned invalid data URI');
  }
  return Buffer.from(base64Data, 'base64');
}

/** Generate a single SFX to a WAV file */
export async function generateSfx(
  preset: SfxPreset,
  outputDir: string,
): Promise<SfxGenerationResult> {
  const categoryDir = join(outputDir, preset.category);
  await mkdir(categoryDir, { recursive: true });

  const filename = preset.name.toLowerCase().replaceAll(/\s+/g, '_') + '.wav';
  const outputPath = join(categoryDir, filename);

  const wavBuffer = generateWavBuffer(preset.params);
  await writeFile(outputPath, wavBuffer);

  return {
    name: preset.name,
    category: preset.category,
    path: outputPath,
  };
}

/** Generate ALL SFX presets */
export async function generateAllSfx(
  outputDir: string,
  options?: { category?: SfxCategory },
): Promise<SfxGenerationResult[]> {
  const sfxDir = join(outputDir, 'sfx');
  await mkdir(sfxDir, { recursive: true });

  const results: SfxGenerationResult[] = [];
  const entries = Object.entries(SFX_PRESETS);

  for (const [, preset] of entries) {
    if (options?.category && preset.category !== options.category) continue;
    const result = await generateSfx(preset, sfxDir);
    results.push(result);
  }

  return results;
}

/** Get presets grouped by category */
export function getPresetsByCategory(): Record<SfxCategory, SfxPreset[]> {
  const grouped = {} as Record<SfxCategory, SfxPreset[]>;

  for (const preset of Object.values(SFX_PRESETS)) {
    if (!grouped[preset.category]) {
      grouped[preset.category] = [];
    }
    grouped[preset.category].push(preset);
  }

  return grouped;
}

/** List all available SFX preset names */
export function listSfxPresets(): string[] {
  return Object.keys(SFX_PRESETS);
}
