import sharp from 'sharp';

/** Create a transparent RGBA canvas of the given size */
export async function createCanvas(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
}

/** Composite multiple image buffers onto a base, all at full size */
export async function compositeLayers(
  width: number,
  height: number,
  layers: Buffer[],
): Promise<Buffer> {
  if (layers.length === 0) {
    return createCanvas(width, height);
  }

  const composites = layers.map((input) => ({
    input,
    top: 0,
    left: 0,
    blend: 'over' as const,
  }));

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .composite(composites)
    .toBuffer();
}

/** Stitch multiple images vertically into one tall image */
export async function stitchVertical(
  images: { buffer: Buffer; yOffset: number }[],
  totalWidth: number,
  totalHeight: number,
): Promise<Buffer> {
  const composites = images.map(({ buffer, yOffset }) => ({
    input: buffer,
    top: yOffset,
    left: 0,
    blend: 'over' as const,
  }));

  return sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .composite(composites)
    .toBuffer();
}

/** Extract a rectangular region from an image buffer */
export async function extractRegion(
  buffer: Buffer,
  left: number,
  top: number,
  width: number,
  height: number,
): Promise<Buffer> {
  return sharp(buffer).extract({ left, top, width, height }).png().toBuffer();
}

/** Create a solid-color tile with optional border */
export async function createColorTile(
  size: number,
  r: number,
  g: number,
  b: number,
  alpha = 255,
  borderColor?: { r: number; g: number; b: number },
): Promise<Buffer> {
  // Create the fill
  const base = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r, g, b, alpha },
    },
  })
    .png()
    .toBuffer();

  if (!borderColor) return base;

  // Overlay a 1px border by creating border lines
  const hLine = await sharp({
    create: { width: size, height: 1, channels: 4, background: { ...borderColor, alpha: 255 } },
  }).png().toBuffer();

  const vLine = await sharp({
    create: { width: 1, height: size, channels: 4, background: { ...borderColor, alpha: 255 } },
  }).png().toBuffer();

  return sharp(base)
    .composite([
      { input: hLine, top: 0, left: 0 },
      { input: hLine, top: size - 1, left: 0 },
      { input: vLine, top: 0, left: 0 },
      { input: vLine, top: 0, left: size - 1 },
    ])
    .png()
    .toBuffer();
}
