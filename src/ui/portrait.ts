import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { PortraitResult } from './types.js';
import { FRAME_SIZE, ANIMATIONS, DIRECTIONS } from '../character/types.js';

/**
 * Extract a portrait from a character spritesheet.
 * Uses the first frame of the idle_down animation, cropping the head/torso area.
 * Output sizes: 64x64 (1x), 128x128 (2x), 256x256 (4x)
 */
export async function extractPortrait(
  sheetBuffer: Buffer,
  outputDir: string,
  characterName: string,
): Promise<PortraitResult[]> {
  const portraitDir = join(outputDir, 'portraits');
  await mkdir(portraitDir, { recursive: true });

  // idle animation row for "down" direction
  // idle starts at row 22, down direction is row index 2 (0=up, 1=left, 2=down, 3=right)
  const idleAnim = ANIMATIONS.idle;
  const downDirIndex = DIRECTIONS.indexOf('down');
  const idleDownRow = idleAnim.row + downDirIndex;

  // First frame of idle_down
  const frameX = 0;
  const frameY = idleDownRow * FRAME_SIZE;

  // Crop the character frame
  const frame = await sharp(sheetBuffer)
    .extract({
      left: frameX,
      top: frameY,
      width: FRAME_SIZE,
      height: FRAME_SIZE,
    })
    .toBuffer();

  // Crop to head+upper body area (top 40px of the 64x64 frame, with some horizontal trim)
  // LPC characters have heads roughly at y=0..24, torso at y=24..40
  const portraitCrop = await sharp(frame)
    .extract({
      left: 12,
      top: 0,
      width: 40,
      height: 44,
    })
    .toBuffer();

  const results: PortraitResult[] = [];

  // Generate multiple sizes
  const sizes = [
    { suffix: '1x', size: 64 },
    { suffix: '2x', size: 128 },
    { suffix: '4x', size: 256 },
  ];

  for (const { suffix, size } of sizes) {
    const outputPath = join(portraitDir, `${characterName}_portrait_${suffix}.png`);
    await sharp(portraitCrop)
      .resize(size, size, {
        kernel: sharp.kernel.nearest, // Preserve pixel art
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(outputPath);

    results.push({ name: `${characterName}_${suffix}`, path: outputPath, size });
  }

  return results;
}

/**
 * Extract portraits for ALL presets at once.
 * Requires the character compositor to generate sheets first.
 */
export async function extractAllPortraits(
  outputDir: string,
): Promise<PortraitResult[]> {
  // This is a convenience wrapper — actual batch portrait extraction
  // requires compositing each preset first, which is handled by the CLI command
  const portraitDir = join(outputDir, 'portraits');
  await mkdir(portraitDir, { recursive: true });
  return [];
}
