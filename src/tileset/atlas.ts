import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface AtlasResult {
  imagePath: string;
  metadataPath: string;
  tilePositions: Record<string, { x: number; y: number; width: number; height: number }>;
  columns: number;
  rows: number;
}

/** Build a texture atlas from individual tile images */
export async function buildAtlas(
  tiles: Record<string, string>, // tileName → file path
  tileSize: number,
  outputPath: string,
): Promise<AtlasResult> {
  const tileEntries = Object.entries(tiles);
  const count = tileEntries.length;
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const atlasWidth = columns * tileSize;
  const atlasHeight = rows * tileSize;

  const composites: sharp.OverlayOptions[] = [];
  const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};

  for (let i = 0; i < tileEntries.length; i++) {
    const [name, filePath] = tileEntries[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = col * tileSize;
    const y = row * tileSize;

    try {
      const buf = await sharp(filePath).resize(tileSize, tileSize).png().toBuffer();
      composites.push({ input: buf, top: y, left: x });
      positions[name] = { x, y, width: tileSize, height: tileSize };
    } catch {
      // Skip missing tiles
    }
  }

  await mkdir(join(outputPath, '..'), { recursive: true });

  const atlasBuffer = await sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .composite(composites)
    .toBuffer();

  const imagePath = outputPath.endsWith('.png') ? outputPath : `${outputPath}.png`;
  const metadataPath = imagePath.replace('.png', '.json');

  await writeFile(imagePath, atlasBuffer);

  const metadata = { tileSize, columns, rows, tiles: positions };
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  return {
    imagePath,
    metadataPath,
    tilePositions: positions,
    columns,
    rows,
  };
}
