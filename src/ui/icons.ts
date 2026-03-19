import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { IconEntry } from './types.js';

function createBuffer(width: number, height: number): Buffer {
  return Buffer.alloc(width * height * 4, 0);
}

function hexToRGBA(hex: string): { r: number; g: number; b: number; alpha: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
    alpha: 255,
  };
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

const ICON_SIZE = 16;

type IconDrawFn = (buf: Buffer, w: number) => void;

const ICON_DRAW_FUNCTIONS: Record<string, { draw: IconDrawFn; entry: IconEntry }> = {
  // WEAPONS
  iron_sword: {
    draw: (buf, w) => {
      fillRect(buf, w, 7, 1, 2, 10, '#AAAAAA'); // blade
      fillRect(buf, w, 6, 0, 4, 1, '#CCCCCC');   // tip
      fillRect(buf, w, 4, 10, 8, 2, '#8B6914');  // guard
      fillRect(buf, w, 7, 12, 2, 3, '#6B4F10');  // handle
      setPixel(buf, w, 7, 15, '#FFD700');         // pommel
      setPixel(buf, w, 8, 15, '#FFD700');
    },
    entry: { name: 'Iron Sword', category: 'weapon', description: 'Basic iron sword' },
  },
  magic_staff: {
    draw: (buf, w) => {
      fillRect(buf, w, 7, 4, 2, 12, '#6B4F10');  // shaft
      fillRect(buf, w, 5, 1, 6, 4, '#7B2D8E');   // orb
      fillRect(buf, w, 6, 2, 4, 2, '#AA55CC');    // glow
      setPixel(buf, w, 7, 2, '#FFFFFF');
    },
    entry: { name: 'Magic Staff', category: 'weapon', description: 'Staff with magic orb' },
  },
  bow: {
    draw: (buf, w) => {
      // Bow curve
      for (let y = 2; y <= 13; y++) {
        const x = y <= 4 ? 4 + (4 - y) : y >= 11 ? 4 + (y - 10) : 4;
        setPixel(buf, w, x, y, '#8B6914');
      }
      // String
      for (let y = 2; y <= 13; y++) {
        setPixel(buf, w, 10, y, '#CCCCCC');
      }
    },
    entry: { name: 'Bow', category: 'weapon', description: 'Wooden bow' },
  },
  dagger: {
    draw: (buf, w) => {
      fillRect(buf, w, 7, 2, 2, 7, '#AAAAAA');
      setPixel(buf, w, 7, 1, '#CCCCCC');
      setPixel(buf, w, 8, 1, '#CCCCCC');
      fillRect(buf, w, 5, 9, 6, 1, '#8B6914');
      fillRect(buf, w, 7, 10, 2, 4, '#6B4F10');
    },
    entry: { name: 'Dagger', category: 'weapon', description: 'Short blade' },
  },

  // ARMOR
  shield: {
    draw: (buf, w) => {
      fillRect(buf, w, 3, 2, 10, 12, '#4444AA');
      fillRect(buf, w, 4, 3, 8, 10, '#5555CC');
      fillRect(buf, w, 6, 5, 4, 4, '#FFD700');    // emblem
      fillRect(buf, w, 7, 6, 2, 2, '#FFFFFF');
    },
    entry: { name: 'Shield', category: 'armor', description: 'Blue shield with emblem' },
  },
  helmet: {
    draw: (buf, w) => {
      fillRect(buf, w, 4, 4, 8, 8, '#888888');
      fillRect(buf, w, 5, 5, 6, 6, '#AAAAAA');
      fillRect(buf, w, 3, 8, 10, 2, '#888888');    // visor
      fillRect(buf, w, 5, 2, 6, 3, '#999999');     // dome
      fillRect(buf, w, 7, 1, 2, 2, '#AAAAAA');     // crest
    },
    entry: { name: 'Helmet', category: 'armor', description: 'Iron helmet' },
  },
  chestplate: {
    draw: (buf, w) => {
      fillRect(buf, w, 3, 2, 10, 12, '#888888');
      fillRect(buf, w, 4, 3, 8, 10, '#AAAAAA');
      fillRect(buf, w, 3, 2, 4, 3, '#888888');     // shoulder L
      fillRect(buf, w, 9, 2, 4, 3, '#888888');     // shoulder R
      fillRect(buf, w, 6, 6, 4, 4, '#FFD700');     // emblem
    },
    entry: { name: 'Chestplate', category: 'armor', description: 'Iron chestplate' },
  },

  // POTIONS
  health_potion: {
    draw: (buf, w) => {
      fillRect(buf, w, 5, 6, 6, 8, '#CC3333');    // bottle
      fillRect(buf, w, 6, 3, 4, 3, '#DDDDDD');    // neck
      fillRect(buf, w, 5, 3, 6, 1, '#AAAAAA');    // cap
      fillRect(buf, w, 7, 8, 2, 2, '#FF6666');     // highlight
    },
    entry: { name: 'Health Potion', category: 'potion', description: 'Red healing potion' },
  },
  mana_potion: {
    draw: (buf, w) => {
      fillRect(buf, w, 5, 6, 6, 8, '#3366CC');
      fillRect(buf, w, 6, 3, 4, 3, '#DDDDDD');
      fillRect(buf, w, 5, 3, 6, 1, '#AAAAAA');
      fillRect(buf, w, 7, 8, 2, 2, '#6699FF');
    },
    entry: { name: 'Mana Potion', category: 'potion', description: 'Blue mana potion' },
  },
  poison_potion: {
    draw: (buf, w) => {
      fillRect(buf, w, 5, 6, 6, 8, '#33AA33');
      fillRect(buf, w, 6, 3, 4, 3, '#DDDDDD');
      fillRect(buf, w, 5, 3, 6, 1, '#AAAAAA');
      fillRect(buf, w, 7, 8, 2, 2, '#66DD66');
    },
    entry: { name: 'Poison Potion', category: 'potion', description: 'Green poison' },
  },

  // FOOD
  bread: {
    draw: (buf, w) => {
      fillRect(buf, w, 3, 8, 10, 4, '#CC9933');
      fillRect(buf, w, 4, 6, 8, 3, '#DDAA44');
      fillRect(buf, w, 5, 5, 6, 2, '#CC9933');
      setPixel(buf, w, 6, 8, '#BB8822');
      setPixel(buf, w, 9, 8, '#BB8822');
    },
    entry: { name: 'Bread', category: 'food', description: 'Loaf of bread' },
  },
  apple: {
    draw: (buf, w) => {
      fillRect(buf, w, 5, 5, 6, 7, '#CC3333');
      fillRect(buf, w, 4, 7, 8, 4, '#CC3333');
      fillRect(buf, w, 7, 3, 2, 3, '#6B4F10');    // stem
      setPixel(buf, w, 9, 4, '#33AA33');            // leaf
      setPixel(buf, w, 10, 3, '#33AA33');
      setPixel(buf, w, 6, 6, '#FF6666');            // highlight
    },
    entry: { name: 'Apple', category: 'food', description: 'Red apple' },
  },

  // KEYS
  gold_key: {
    draw: (buf, w) => {
      fillRect(buf, w, 6, 2, 4, 4, '#FFD700');    // bow (ring)
      fillRect(buf, w, 7, 3, 2, 2, '#000000');     // hole
      fillRect(buf, w, 7, 6, 2, 7, '#FFD700');     // shaft
      fillRect(buf, w, 9, 11, 2, 2, '#FFD700');    // bit 1
      fillRect(buf, w, 9, 8, 2, 2, '#FFD700');     // bit 2
    },
    entry: { name: 'Gold Key', category: 'key', description: 'Ornate gold key' },
  },
  iron_key: {
    draw: (buf, w) => {
      fillRect(buf, w, 6, 2, 4, 4, '#888888');
      fillRect(buf, w, 7, 3, 2, 2, '#000000');
      fillRect(buf, w, 7, 6, 2, 7, '#888888');
      fillRect(buf, w, 9, 11, 2, 2, '#888888');
      fillRect(buf, w, 9, 8, 2, 2, '#888888');
    },
    entry: { name: 'Iron Key', category: 'key', description: 'Simple iron key' },
  },

  // GEMS
  ruby: {
    draw: (buf, w) => {
      fillRect(buf, w, 6, 4, 4, 6, '#CC2222');
      fillRect(buf, w, 5, 6, 6, 3, '#CC2222');
      setPixel(buf, w, 7, 3, '#CC2222');
      setPixel(buf, w, 8, 3, '#CC2222');
      setPixel(buf, w, 7, 10, '#CC2222');
      setPixel(buf, w, 8, 10, '#CC2222');
      fillRect(buf, w, 6, 5, 2, 2, '#FF6666');     // shine
    },
    entry: { name: 'Ruby', category: 'gem', description: 'Red gemstone' },
  },
  emerald: {
    draw: (buf, w) => {
      fillRect(buf, w, 5, 4, 6, 8, '#22AA22');
      fillRect(buf, w, 6, 3, 4, 1, '#22AA22');
      fillRect(buf, w, 6, 12, 4, 1, '#22AA22');
      fillRect(buf, w, 6, 5, 2, 2, '#66DD66');
    },
    entry: { name: 'Emerald', category: 'gem', description: 'Green gemstone' },
  },
  sapphire: {
    draw: (buf, w) => {
      fillRect(buf, w, 5, 4, 6, 8, '#2244CC');
      fillRect(buf, w, 6, 3, 4, 1, '#2244CC');
      fillRect(buf, w, 6, 12, 4, 1, '#2244CC');
      fillRect(buf, w, 6, 5, 2, 2, '#6688FF');
    },
    entry: { name: 'Sapphire', category: 'gem', description: 'Blue gemstone' },
  },

  // TOOLS
  pickaxe: {
    draw: (buf, w) => {
      // Handle (diagonal)
      for (let i = 0; i < 10; i++) {
        setPixel(buf, w, 4 + i, 5 + i, '#6B4F10');
        setPixel(buf, w, 5 + i, 5 + i, '#6B4F10');
      }
      // Head
      fillRect(buf, w, 3, 3, 8, 2, '#888888');
      setPixel(buf, w, 2, 4, '#888888');
      setPixel(buf, w, 11, 4, '#888888');
    },
    entry: { name: 'Pickaxe', category: 'tool', description: 'Mining pickaxe' },
  },

  // SCROLLS
  spell_scroll: {
    draw: (buf, w) => {
      fillRect(buf, w, 4, 3, 8, 10, '#F5E6C8');  // parchment
      fillRect(buf, w, 3, 3, 2, 10, '#D4C4A8');   // left roll
      fillRect(buf, w, 11, 3, 2, 10, '#D4C4A8');  // right roll
      // Text lines
      fillRect(buf, w, 5, 5, 6, 1, '#4A3510');
      fillRect(buf, w, 5, 7, 5, 1, '#4A3510');
      fillRect(buf, w, 5, 9, 6, 1, '#4A3510');
    },
    entry: { name: 'Spell Scroll', category: 'scroll', description: 'Magical scroll' },
  },

  // MISC
  coin: {
    draw: (buf, w) => {
      fillRect(buf, w, 5, 4, 6, 8, '#FFD700');
      fillRect(buf, w, 6, 3, 4, 1, '#FFD700');
      fillRect(buf, w, 6, 12, 4, 1, '#FFD700');
      fillRect(buf, w, 4, 6, 1, 4, '#FFD700');
      fillRect(buf, w, 11, 6, 1, 4, '#FFD700');
      fillRect(buf, w, 7, 5, 2, 6, '#CC9900');     // center mark
      setPixel(buf, w, 6, 5, '#FFEE66');            // shine
    },
    entry: { name: 'Gold Coin', category: 'misc', description: 'Gold coin currency' },
  },
  ring: {
    draw: (buf, w) => {
      fillRect(buf, w, 5, 5, 6, 6, '#FFD700');
      fillRect(buf, w, 6, 6, 4, 4, '#000000');     // hole (transparent would be better)
      fillRect(buf, w, 6, 6, 4, 4, '#00000000');
      fillRect(buf, w, 6, 4, 4, 1, '#CC2222');      // gem
    },
    entry: { name: 'Magic Ring', category: 'misc', description: 'Gold ring with red gem' },
  },
};

/** Generate all icons as individual PNGs and a combined atlas */
export async function generateAllIcons(outputDir: string): Promise<{ icons: string[]; atlas: string }> {
  const iconsDir = join(outputDir, 'icons');
  await mkdir(iconsDir, { recursive: true });

  const iconPaths: string[] = [];
  const iconBuffers: Buffer[] = [];

  for (const [name, icon] of Object.entries(ICON_DRAW_FUNCTIONS)) {
    const buf = createBuffer(ICON_SIZE, ICON_SIZE);
    icon.draw(buf, ICON_SIZE);

    const pngBuf = await sharp(buf, { raw: { width: ICON_SIZE, height: ICON_SIZE, channels: 4 } })
      .png()
      .toBuffer();

    const path = join(iconsDir, `${name}.png`);
    await sharp(pngBuf).toFile(path);
    iconPaths.push(path);
    iconBuffers.push(pngBuf);
  }

  // Generate atlas (icons in a grid)
  const count = iconBuffers.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const atlasWidth = cols * ICON_SIZE;
  const atlasHeight = rows * ICON_SIZE;

  const composites: sharp.OverlayOptions[] = [];
  for (let i = 0; i < iconBuffers.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    composites.push({
      input: iconBuffers[i],
      left: col * ICON_SIZE,
      top: row * ICON_SIZE,
    });
  }

  const atlasPath = join(iconsDir, 'icon_atlas.png');
  await sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(atlasPath);

  return { icons: iconPaths, atlas: atlasPath };
}

/** List all available icons */
export function listIcons(): IconEntry[] {
  return Object.values(ICON_DRAW_FUNCTIONS).map(i => i.entry);
}

/** Get icon count */
export function iconCount(): number {
  return Object.keys(ICON_DRAW_FUNCTIONS).length;
}
