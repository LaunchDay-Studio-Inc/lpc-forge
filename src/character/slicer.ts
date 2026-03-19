import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ANIMATIONS,
  FRAME_SIZE,
  DIRECTIONS,
  type SliceResult,
} from './types.js';

export interface SliceOptions {
  animations?: string[];
  directions?: string[];
  format?: 'png' | 'webp';
}

/** Slice a universal spritesheet into individual frames */
export async function sliceCharacter(
  sheetBuffer: Buffer,
  outputDir: string,
  options?: SliceOptions,
): Promise<SliceResult> {
  const format = options?.format ?? 'png';
  const animFilter = options?.animations;
  const dirFilter = options?.directions;

  let totalFrames = 0;
  const animResults: SliceResult['animations'] = {};

  const meta = await sharp(sheetBuffer).metadata();
  const sheetWidth = meta.width!;
  const sheetHeight = meta.height!;

  for (const [animName, animInfo] of Object.entries(ANIMATIONS)) {
    if (animFilter && !animFilter.includes(animName)) continue;

    const animDir = join(outputDir, animName);
    await mkdir(animDir, { recursive: true });

    const dirEntries: { direction: string; frames: number }[] = [];

    for (let row = 0; row < animInfo.rows; row++) {
      const direction = animInfo.rows === 1 ? 'down' : DIRECTIONS[row];
      if (dirFilter && !dirFilter.includes(direction)) continue;

      for (let frame = 0; frame < animInfo.frames; frame++) {
        const left = frame * FRAME_SIZE;
        const top = (animInfo.row + row) * FRAME_SIZE;

        // Bounds check
        if (left + FRAME_SIZE > sheetWidth || top + FRAME_SIZE > sheetHeight) continue;

        const frameBuffer = await sharp(sheetBuffer)
          .extract({ left, top, width: FRAME_SIZE, height: FRAME_SIZE })
          .toFormat(format)
          .toBuffer();

        const fileName = `${direction}_${frame}.${format}`;
        await writeFile(join(animDir, fileName), frameBuffer);
        totalFrames++;
      }

      dirEntries.push({ direction, frames: animInfo.frames });
    }

    animResults[animName] = dirEntries;
  }

  // Write metadata
  const metadata = {
    frameSize: FRAME_SIZE,
    format,
    animations: Object.fromEntries(
      Object.entries(ANIMATIONS)
        .filter(([name]) => !animFilter || animFilter.includes(name))
        .map(([name, info]) => [
          name,
          {
            frames: info.frames,
            rows: info.rows,
            directions: info.rows === 1 ? ['down'] : [...DIRECTIONS],
          },
        ]),
    ),
    totalFrames,
  };

  await writeFile(join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  return {
    framesDir: outputDir,
    totalFrames,
    animations: animResults,
  };
}
