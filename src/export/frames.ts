import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sliceCharacter } from '../character/slicer.js';

/** Export a spritesheet as individual frame PNGs */
export async function exportFrames(
  sheetBuffer: Buffer,
  outputDir: string,
  options?: { animations?: string[]; format?: 'png' | 'webp' },
): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  // Save the full spritesheet
  await writeFile(join(outputDir, 'spritesheet.png'), sheetBuffer);

  // Slice into individual frames
  await sliceCharacter(sheetBuffer, outputDir, {
    format: options?.format ?? 'png',
    animations: options?.animations,
  });
}
