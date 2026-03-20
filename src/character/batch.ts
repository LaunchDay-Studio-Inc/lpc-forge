import { composeCharacter } from './composer.js';
import { PRESETS } from './presets.js';
import type { CharacterSpec } from './types.js';
import { sliceCharacter } from './slicer.js';
import { exportCharacterToGodot } from '../export/godot.js';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface BatchEntry {
  name: string;
  preset?: string;
  spec?: CharacterSpec;
  slice?: boolean;
  godot?: boolean;
}

export interface BatchConfig {
  characters: BatchEntry[];
  outputDir?: string;
}

export async function runBatch(
  configPath: string,
  repoRoot: string,
  outputBase: string,
): Promise<{ name: string; success: boolean; error?: string }[]> {
  const raw = await readFile(configPath, 'utf-8');
  const config: BatchConfig = JSON.parse(raw);

  // Schema validation for batch config
  if (!config || !Array.isArray(config.characters)) {
    throw new Error('Invalid batch config: must contain a "characters" array');
  }
  for (const entry of config.characters) {
    if (!entry.name || typeof entry.name !== 'string') {
      throw new Error('Invalid batch config: each entry must have a "name" string');
    }
  }

  const results: { name: string; success: boolean; error?: string }[] = [];

  for (const entry of config.characters) {
    const outDir = resolve(outputBase, entry.name);
    await mkdir(outDir, { recursive: true });

    try {
      let spec: CharacterSpec;
      if (entry.preset) {
        const preset = PRESETS[entry.preset];
        if (!preset) throw new Error(`Unknown preset: ${entry.preset}`);
        spec = preset.spec;
      } else if (entry.spec) {
        spec = entry.spec;
      } else {
        throw new Error('Each entry needs either "preset" or "spec"');
      }

      const buffer = await composeCharacter(spec, repoRoot);
      await writeFile(join(outDir, 'spritesheet.png'), buffer);

      if (entry.slice) {
        await sliceCharacter(buffer, join(outDir, 'frames'));
      }

      if (entry.godot) {
        await exportCharacterToGodot(buffer, outDir, entry.name);
      }

      results.push({ name: entry.name, success: true });
    } catch (err) {
      results.push({
        name: entry.name,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
