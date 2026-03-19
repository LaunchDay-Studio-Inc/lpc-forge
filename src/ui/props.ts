import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { PropEntry } from './types.js';

function hexToRGBA(hex: string): { r: number; g: number; b: number; alpha: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
    alpha: 255,
  };
}

function createBuffer(width: number, height: number): Buffer {
  return Buffer.alloc(width * height * 4, 0); // transparent
}

function setPixel(buf: Buffer, width: number, x: number, y: number, color: string): void {
  if (x < 0 || y < 0 || x >= width) return;
  const idx = (y * width + x) * 4;
  if (idx + 3 >= buf.length) return;
  const { r, g, b, alpha } = hexToRGBA(color);
  buf[idx] = r;
  buf[idx + 1] = g;
  buf[idx + 2] = b;
  buf[idx + 3] = alpha;
}

function fillRect(buf: Buffer, w: number, x: number, y: number, rw: number, rh: number, color: string): void {
  for (let dy = 0; dy < rh; dy++) {
    for (let dx = 0; dx < rw; dx++) {
      setPixel(buf, w, x + dx, y + dy, color);
    }
  }
}

/** Generate a treasure chest prop (32x32) — open and closed states stacked */
async function generateChest(outputPath: string): Promise<void> {
  const w = 32, h = 64; // 2 states: closed (top), open (bottom)
  const buf = createBuffer(w, h);

  // Closed chest
  fillRect(buf, w, 4, 8, 24, 16, '#8B6914');    // body
  fillRect(buf, w, 4, 4, 24, 6, '#A0792A');     // lid
  fillRect(buf, w, 3, 4, 26, 1, '#6B4F10');     // top edge
  fillRect(buf, w, 3, 24, 26, 1, '#6B4F10');    // bottom edge
  fillRect(buf, w, 14, 14, 4, 4, '#C49A2A');    // lock
  fillRect(buf, w, 15, 15, 2, 2, '#FFD700');    // keyhole

  // Open chest
  fillRect(buf, w, 4, 40, 24, 16, '#8B6914');   // body
  fillRect(buf, w, 4, 32, 24, 4, '#A0792A');    // lid (raised)
  fillRect(buf, w, 8, 40, 16, 8, '#FFD700');    // gold inside
  fillRect(buf, w, 10, 42, 4, 3, '#FF4444');    // gem
  fillRect(buf, w, 18, 43, 3, 2, '#44FF44');    // gem2

  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outputPath);
}

/** Generate a barrel prop (24x32) */
async function generateBarrel(outputPath: string): Promise<void> {
  const w = 24, h = 32;
  const buf = createBuffer(w, h);

  fillRect(buf, w, 4, 4, 16, 24, '#8B6914');    // body
  fillRect(buf, w, 6, 2, 12, 2, '#A0792A');     // top rim
  fillRect(buf, w, 6, 28, 12, 2, '#6B4F10');    // bottom rim
  fillRect(buf, w, 3, 10, 18, 2, '#6B4F10');    // band top
  fillRect(buf, w, 3, 20, 18, 2, '#6B4F10');    // band bottom
  // Highlight
  fillRect(buf, w, 8, 6, 2, 20, '#A07930');

  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outputPath);
}

/** Generate a sign post (24x32) */
async function generateSign(outputPath: string): Promise<void> {
  const w = 24, h = 32;
  const buf = createBuffer(w, h);

  fillRect(buf, w, 10, 16, 4, 16, '#6B4F10');   // post
  fillRect(buf, w, 2, 2, 20, 14, '#A0792A');    // sign board
  fillRect(buf, w, 2, 2, 20, 1, '#8B6914');     // top edge
  fillRect(buf, w, 2, 15, 20, 1, '#6B4F10');    // bottom edge
  // Text lines
  fillRect(buf, w, 5, 5, 14, 1, '#4A3510');
  fillRect(buf, w, 5, 8, 10, 1, '#4A3510');
  fillRect(buf, w, 5, 11, 12, 1, '#4A3510');

  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outputPath);
}

/** Generate a torch (16x32) — 2 frame animation */
async function generateTorch(outputPath: string): Promise<void> {
  const w = 32, h = 32; // 2 frames side by side
  const buf = createBuffer(w, h);

  for (let frame = 0; frame < 2; frame++) {
    const ox = frame * 16;
    // Handle
    fillRect(buf, w, ox + 6, 12, 4, 20, '#6B4F10');
    // Fire frame 1
    if (frame === 0) {
      fillRect(buf, w, ox + 5, 4, 6, 8, '#FF6600');
      fillRect(buf, w, ox + 6, 2, 4, 4, '#FFAA00');
      fillRect(buf, w, ox + 7, 1, 2, 2, '#FFDD00');
    } else {
      fillRect(buf, w, ox + 4, 3, 8, 9, '#FF6600');
      fillRect(buf, w, ox + 5, 1, 6, 5, '#FFAA00');
      fillRect(buf, w, ox + 6, 0, 4, 3, '#FFDD00');
    }
  }

  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outputPath);
}

/** Generate a pot/vase (16x24) */
async function generatePot(outputPath: string): Promise<void> {
  const w = 16, h = 24;
  const buf = createBuffer(w, h);

  fillRect(buf, w, 4, 8, 8, 14, '#8855AA');     // body
  fillRect(buf, w, 5, 4, 6, 4, '#9966BB');      // neck
  fillRect(buf, w, 4, 4, 8, 2, '#7744AA');      // rim
  fillRect(buf, w, 3, 22, 10, 2, '#6633AA');    // base
  // Pattern
  fillRect(buf, w, 5, 12, 6, 1, '#CCAA00');
  fillRect(buf, w, 5, 16, 6, 1, '#CCAA00');

  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outputPath);
}

/** Generate a crate (24x24) */
async function generateCrate(outputPath: string): Promise<void> {
  const w = 24, h = 24;
  const buf = createBuffer(w, h);

  fillRect(buf, w, 2, 2, 20, 20, '#A0792A');    // body
  fillRect(buf, w, 2, 2, 20, 1, '#8B6914');     // edge
  fillRect(buf, w, 2, 21, 20, 1, '#6B4F10');
  fillRect(buf, w, 2, 2, 1, 20, '#8B6914');
  fillRect(buf, w, 21, 2, 1, 20, '#6B4F10');
  // Cross planks
  for (let i = 0; i < 18; i++) {
    setPixel(buf, w, 3 + i, 3 + i, '#6B4F10');
    setPixel(buf, w, 20 - i, 3 + i, '#6B4F10');
  }
  // Nails
  fillRect(buf, w, 4, 4, 2, 2, '#888888');
  fillRect(buf, w, 18, 4, 2, 2, '#888888');
  fillRect(buf, w, 4, 18, 2, 2, '#888888');
  fillRect(buf, w, 18, 18, 2, 2, '#888888');

  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outputPath);
}

/** Generate a campfire (32x32, 2 frame animation) */
async function generateCampfire(outputPath: string): Promise<void> {
  const w = 64, h = 32; // 2 frames side by side
  const buf = createBuffer(w, h);

  for (let frame = 0; frame < 2; frame++) {
    const ox = frame * 32;
    // Stones
    const stoneColor = '#666666';
    fillRect(buf, w, ox + 6, 24, 6, 4, stoneColor);
    fillRect(buf, w, ox + 20, 24, 6, 4, stoneColor);
    fillRect(buf, w, ox + 4, 20, 4, 6, stoneColor);
    fillRect(buf, w, ox + 24, 20, 4, 6, stoneColor);
    // Logs
    fillRect(buf, w, ox + 10, 22, 12, 6, '#6B4F10');
    fillRect(buf, w, ox + 8, 24, 16, 4, '#8B6914');
    // Fire
    if (frame === 0) {
      fillRect(buf, w, ox + 11, 10, 10, 12, '#FF6600');
      fillRect(buf, w, ox + 12, 6, 8, 8, '#FFAA00');
      fillRect(buf, w, ox + 13, 4, 6, 4, '#FFDD00');
    } else {
      fillRect(buf, w, ox + 10, 8, 12, 14, '#FF6600');
      fillRect(buf, w, ox + 11, 4, 10, 10, '#FFAA00');
      fillRect(buf, w, ox + 13, 2, 6, 5, '#FFDD00');
    }
  }

  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outputPath);
}

/** Generate a bookshelf (32x32) */
async function generateBookshelf(outputPath: string): Promise<void> {
  const w = 32, h = 32;
  const buf = createBuffer(w, h);

  // Frame
  fillRect(buf, w, 2, 2, 28, 28, '#6B4F10');
  fillRect(buf, w, 4, 4, 24, 24, '#8B6914');
  // Shelves
  fillRect(buf, w, 4, 12, 24, 2, '#6B4F10');
  fillRect(buf, w, 4, 20, 24, 2, '#6B4F10');
  // Books (row 1)
  fillRect(buf, w, 5, 4, 3, 8, '#CC3333');
  fillRect(buf, w, 9, 5, 3, 7, '#3366CC');
  fillRect(buf, w, 13, 4, 2, 8, '#33AA33');
  fillRect(buf, w, 16, 5, 3, 7, '#AA33AA');
  fillRect(buf, w, 20, 4, 3, 8, '#CCAA33');
  fillRect(buf, w, 24, 5, 3, 7, '#3399CC');
  // Books (row 2)
  fillRect(buf, w, 5, 14, 4, 6, '#AA3333');
  fillRect(buf, w, 10, 14, 3, 6, '#33AA33');
  fillRect(buf, w, 14, 15, 3, 5, '#3333CC');
  fillRect(buf, w, 18, 14, 4, 6, '#CC9933');
  fillRect(buf, w, 23, 15, 3, 5, '#CC33CC');
  // Books (row 3)
  fillRect(buf, w, 6, 22, 3, 6, '#993333');
  fillRect(buf, w, 10, 23, 4, 5, '#339999');
  fillRect(buf, w, 15, 22, 3, 6, '#999933');
  fillRect(buf, w, 19, 22, 4, 6, '#336699');
  fillRect(buf, w, 24, 23, 3, 5, '#993399');

  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outputPath);
}

export const PROP_GENERATORS: Record<string, { generate: (path: string) => Promise<void>; entry: PropEntry }> = {
  chest: {
    generate: generateChest,
    entry: { name: 'Treasure Chest', category: 'container', description: 'Open/closed states', width: 32, height: 32 },
  },
  barrel: {
    generate: generateBarrel,
    entry: { name: 'Barrel', category: 'container', description: 'Wooden storage barrel', width: 24, height: 32 },
  },
  sign: {
    generate: generateSign,
    entry: { name: 'Sign Post', category: 'sign', description: 'Wooden sign with text lines', width: 24, height: 32 },
  },
  torch: {
    generate: generateTorch,
    entry: { name: 'Wall Torch', category: 'light', description: '2-frame fire animation', width: 16, height: 32 },
  },
  pot: {
    generate: generatePot,
    entry: { name: 'Decorative Pot', category: 'decoration', description: 'Purple vase with pattern', width: 16, height: 24 },
  },
  crate: {
    generate: generateCrate,
    entry: { name: 'Wooden Crate', category: 'container', description: 'Reinforced crate with cross planks', width: 24, height: 24 },
  },
  campfire: {
    generate: generateCampfire,
    entry: { name: 'Campfire', category: 'light', description: '2-frame fire animation with stone ring', width: 32, height: 32 },
  },
  bookshelf: {
    generate: generateBookshelf,
    entry: { name: 'Bookshelf', category: 'decoration', description: '3-shelf bookcase with colored books', width: 32, height: 32 },
  },
};

/** Generate ALL props to a directory */
export async function generateAllProps(outputDir: string): Promise<string[]> {
  const propsDir = join(outputDir, 'props');
  await mkdir(propsDir, { recursive: true });

  const paths: string[] = [];
  for (const [name, gen] of Object.entries(PROP_GENERATORS)) {
    const path = join(propsDir, `${name}.png`);
    await gen.generate(path);
    paths.push(path);
  }
  return paths;
}

/** List available props */
export function listProps(): PropEntry[] {
  return Object.values(PROP_GENERATORS).map(g => g.entry);
}
