import { describe, it, expect } from 'vitest';
import { resolve, join } from 'node:path';
import { mkdtemp, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { runBatch } from '../character/batch.js';

const REPO_ROOT = resolve(import.meta.dirname, '../..');

describe('Batch Generation', () => {
  it('should generate multiple characters from preset config', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'batch-test-'));
    const configPath = join(tmpDir, 'config.json');
    await writeFile(
      configPath,
      JSON.stringify({
        characters: [
          { name: 'test_warrior', preset: 'warrior' },
          { name: 'test_mage', preset: 'mage' },
        ],
      }),
    );

    try {
      const results = await runBatch(configPath, REPO_ROOT, tmpDir);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      // Verify output files exist
      const warriorFiles = await readdir(join(tmpDir, 'test_warrior'));
      expect(warriorFiles).toContain('spritesheet.png');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should report errors for unknown presets', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'batch-err-'));
    const configPath = join(tmpDir, 'config.json');
    await writeFile(
      configPath,
      JSON.stringify({
        characters: [{ name: 'bad', preset: 'nonexistent' }],
      }),
    );

    try {
      const results = await runBatch(configPath, REPO_ROOT, tmpDir);
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Unknown preset');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should require either preset or spec', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'batch-nospec-'));
    const configPath = join(tmpDir, 'config.json');
    await writeFile(
      configPath,
      JSON.stringify({
        characters: [{ name: 'empty' }],
      }),
    );

    try {
      const results = await runBatch(configPath, REPO_ROOT, tmpDir);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('preset');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
