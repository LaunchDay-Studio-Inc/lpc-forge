import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { GeneratedMap } from '../map/types.js';
import { loadTileset, tileTypeToName, type TilesetManifest } from './registry.js';

/** Render a GeneratedMap into a visual PNG */
export async function renderMap(
  map: GeneratedMap,
  tilesetDir: string,
  outputPath: string,
): Promise<void> {
  const manifest = await loadTileset(tilesetDir);
  const tileSize = manifest.tileSize;
  const canvasWidth = map.width * tileSize;
  const canvasHeight = map.height * tileSize;

  // Pre-load all tile images
  const tileBuffers: Record<string, Buffer> = {};
  for (const [name, fileName] of Object.entries(manifest.tiles)) {
    try {
      const buf = await readFile(join(tilesetDir, fileName));
      tileBuffers[name] = buf;
    } catch {
      // Skip missing tiles
    }
  }

  // Build composites for each tile
  const composites: sharp.OverlayOptions[] = [];

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tileType = map.tiles[y][x];
      const tileName = tileTypeToName(tileType);
      const buf = tileBuffers[tileName];

      if (buf) {
        composites.push({
          input: buf,
          top: y * tileSize,
          left: x * tileSize,
        });
      }
    }
  }

  // Sharp has a practical limit on composites, batch if needed
  await mkdir(join(outputPath, '..'), { recursive: true });

  // If map is large, render in row strips
  if (composites.length > 5000) {
    await renderInStrips(map, tileBuffers, tileSize, canvasWidth, canvasHeight, outputPath);
    return;
  }

  const result = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .composite(composites)
    .toBuffer();

  await writeFile(outputPath, result);
}

async function renderInStrips(
  map: GeneratedMap,
  tileBuffers: Record<string, Buffer>,
  tileSize: number,
  canvasWidth: number,
  canvasHeight: number,
  outputPath: string,
): Promise<void> {
  const stripHeight = 10; // rows per strip
  const strips: Buffer[] = [];

  for (let startRow = 0; startRow < map.height; startRow += stripHeight) {
    const endRow = Math.min(startRow + stripHeight, map.height);
    const stripPixelH = (endRow - startRow) * tileSize;
    const composites: sharp.OverlayOptions[] = [];

    for (let y = startRow; y < endRow; y++) {
      for (let x = 0; x < map.width; x++) {
        const tileName = tileTypeToName(map.tiles[y][x]);
        const buf = tileBuffers[tileName];
        if (buf) {
          composites.push({
            input: buf,
            top: (y - startRow) * tileSize,
            left: x * tileSize,
          });
        }
      }
    }

    const stripBuf = await sharp({
      create: {
        width: canvasWidth,
        height: stripPixelH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .composite(composites)
      .toBuffer();

    strips.push(stripBuf);
  }

  // Stitch strips vertically
  const stitchComposites = strips.map((buf, i) => ({
    input: buf,
    top: i * stripHeight * tileSize,
    left: 0,
  }));

  const final = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .composite(stitchComposites)
    .toBuffer();

  await writeFile(outputPath, final);
}
