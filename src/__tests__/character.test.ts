import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { composeCharacter } from '../character/composer.js';
import { sliceCharacter } from '../character/slicer.js';
import { PRESETS } from '../character/presets.js';
import { SHEET_WIDTH, SHEET_HEIGHT, FRAME_SIZE } from '../character/types.js';
import sharp from 'sharp';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '../..');

describe('Character Compositor', () => {
  it('should compose a character from the warrior preset', async () => {
    const preset = PRESETS['warrior'];
    expect(preset).toBeDefined();

    const buffer = await composeCharacter(preset.spec, REPO_ROOT);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // Check dimensions
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(SHEET_WIDTH);
    expect(meta.height).toBe(SHEET_HEIGHT);
    expect(meta.format).toBe('png');
  });

  it('should compose a minimal character (body only)', async () => {
    const buffer = await composeCharacter(
      {
        bodyType: 'male',
        layers: [{ category: 'body', subcategory: 'body', variant: 'light' }],
      },
      REPO_ROOT,
    );

    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(SHEET_WIDTH);
    expect(meta.height).toBe(SHEET_HEIGHT);

    // Verify it's not completely transparent by checking stats
    const stats = await sharp(buffer).stats();
    const hasContent = stats.channels.some((c) => c.max > 0);
    expect(hasContent).toBe(true);
  });

  it('should slice a spritesheet into individual frames', async () => {
    const buffer = await composeCharacter(
      {
        bodyType: 'male',
        layers: [{ category: 'body', subcategory: 'body', variant: 'light' }],
      },
      REPO_ROOT,
    );

    const tmpDir = await mkdtemp(join(tmpdir(), 'lpc-test-'));
    try {
      const result = await sliceCharacter(buffer, tmpDir, {
        animations: ['walk', 'idle'],
      });

      expect(result.totalFrames).toBeGreaterThan(0);
      expect(result.animations['walk']).toBeDefined();
      expect(result.animations['idle']).toBeDefined();
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
