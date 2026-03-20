import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { IconEntry } from './types.js';
import { hexToRGBA, setPixel, fillRect } from './pixel-utils.js';

function createBuffer(width: number, height: number): Buffer {
  return Buffer.alloc(width * height * 4, 0);
}

const ICON_SIZE = 16;

type IconDrawFn = (buf: Buffer, w: number) => void;

const ICON_DRAW_FUNCTIONS: Record<string, { draw: IconDrawFn; entry: IconEntry }> = {
  // WEAPONS
  iron_sword: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 7, 1, 2, 10, hexToRGBA('#AAAAAA')); // blade
      fillRect(buf, w, ICON_SIZE, 6, 0, 4, 1, hexToRGBA('#CCCCCC'));   // tip
      fillRect(buf, w, ICON_SIZE, 4, 10, 8, 2, hexToRGBA('#8B6914'));  // guard
      fillRect(buf, w, ICON_SIZE, 7, 12, 2, 3, hexToRGBA('#6B4F10'));  // handle
      setPixel(buf, w, ICON_SIZE, 7, 15, hexToRGBA('#FFD700'));         // pommel
      setPixel(buf, w, ICON_SIZE, 8, 15, hexToRGBA('#FFD700'));
    },
    entry: { name: 'Iron Sword', category: 'weapon', description: 'Basic iron sword' },
  },
  magic_staff: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 7, 4, 2, 12, hexToRGBA('#6B4F10'));  // shaft
      fillRect(buf, w, ICON_SIZE, 5, 1, 6, 4, hexToRGBA('#7B2D8E'));   // orb
      fillRect(buf, w, ICON_SIZE, 6, 2, 4, 2, hexToRGBA('#AA55CC'));    // glow
      setPixel(buf, w, ICON_SIZE, 7, 2, hexToRGBA('#FFFFFF'));
    },
    entry: { name: 'Magic Staff', category: 'weapon', description: 'Staff with magic orb' },
  },
  bow: {
    draw: (buf, w) => {
      // Bow curve
      for (let y = 2; y <= 13; y++) {
        const x = y <= 4 ? 4 + (4 - y) : y >= 11 ? 4 + (y - 10) : 4;
        setPixel(buf, w, ICON_SIZE, x, y, hexToRGBA('#8B6914'));
      }
      // String
      for (let y = 2; y <= 13; y++) {
        setPixel(buf, w, ICON_SIZE, 10, y, hexToRGBA('#CCCCCC'));
      }
    },
    entry: { name: 'Bow', category: 'weapon', description: 'Wooden bow' },
  },
  dagger: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 7, 2, 2, 7, hexToRGBA('#AAAAAA'));
      setPixel(buf, w, ICON_SIZE, 7, 1, hexToRGBA('#CCCCCC'));
      setPixel(buf, w, ICON_SIZE, 8, 1, hexToRGBA('#CCCCCC'));
      fillRect(buf, w, ICON_SIZE, 5, 9, 6, 1, hexToRGBA('#8B6914'));
      fillRect(buf, w, ICON_SIZE, 7, 10, 2, 4, hexToRGBA('#6B4F10'));
    },
    entry: { name: 'Dagger', category: 'weapon', description: 'Short blade' },
  },

  // ARMOR
  shield: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 3, 2, 10, 12, hexToRGBA('#4444AA'));
      fillRect(buf, w, ICON_SIZE, 4, 3, 8, 10, hexToRGBA('#5555CC'));
      fillRect(buf, w, ICON_SIZE, 6, 5, 4, 4, hexToRGBA('#FFD700'));    // emblem
      fillRect(buf, w, ICON_SIZE, 7, 6, 2, 2, hexToRGBA('#FFFFFF'));
    },
    entry: { name: 'Shield', category: 'armor', description: 'Blue shield with emblem' },
  },
  helmet: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 4, 4, 8, 8, hexToRGBA('#888888'));
      fillRect(buf, w, ICON_SIZE, 5, 5, 6, 6, hexToRGBA('#AAAAAA'));
      fillRect(buf, w, ICON_SIZE, 3, 8, 10, 2, hexToRGBA('#888888'));    // visor
      fillRect(buf, w, ICON_SIZE, 5, 2, 6, 3, hexToRGBA('#999999'));     // dome
      fillRect(buf, w, ICON_SIZE, 7, 1, 2, 2, hexToRGBA('#AAAAAA'));     // crest
    },
    entry: { name: 'Helmet', category: 'armor', description: 'Iron helmet' },
  },
  chestplate: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 3, 2, 10, 12, hexToRGBA('#888888'));
      fillRect(buf, w, ICON_SIZE, 4, 3, 8, 10, hexToRGBA('#AAAAAA'));
      fillRect(buf, w, ICON_SIZE, 3, 2, 4, 3, hexToRGBA('#888888'));     // shoulder L
      fillRect(buf, w, ICON_SIZE, 9, 2, 4, 3, hexToRGBA('#888888'));     // shoulder R
      fillRect(buf, w, ICON_SIZE, 6, 6, 4, 4, hexToRGBA('#FFD700'));     // emblem
    },
    entry: { name: 'Chestplate', category: 'armor', description: 'Iron chestplate' },
  },

  // POTIONS
  health_potion: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 5, 6, 6, 8, hexToRGBA('#CC3333'));    // bottle
      fillRect(buf, w, ICON_SIZE, 6, 3, 4, 3, hexToRGBA('#DDDDDD'));    // neck
      fillRect(buf, w, ICON_SIZE, 5, 3, 6, 1, hexToRGBA('#AAAAAA'));    // cap
      fillRect(buf, w, ICON_SIZE, 7, 8, 2, 2, hexToRGBA('#FF6666'));     // highlight
    },
    entry: { name: 'Health Potion', category: 'potion', description: 'Red healing potion' },
  },
  mana_potion: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 5, 6, 6, 8, hexToRGBA('#3366CC'));
      fillRect(buf, w, ICON_SIZE, 6, 3, 4, 3, hexToRGBA('#DDDDDD'));
      fillRect(buf, w, ICON_SIZE, 5, 3, 6, 1, hexToRGBA('#AAAAAA'));
      fillRect(buf, w, ICON_SIZE, 7, 8, 2, 2, hexToRGBA('#6699FF'));
    },
    entry: { name: 'Mana Potion', category: 'potion', description: 'Blue mana potion' },
  },
  poison_potion: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 5, 6, 6, 8, hexToRGBA('#33AA33'));
      fillRect(buf, w, ICON_SIZE, 6, 3, 4, 3, hexToRGBA('#DDDDDD'));
      fillRect(buf, w, ICON_SIZE, 5, 3, 6, 1, hexToRGBA('#AAAAAA'));
      fillRect(buf, w, ICON_SIZE, 7, 8, 2, 2, hexToRGBA('#66DD66'));
    },
    entry: { name: 'Poison Potion', category: 'potion', description: 'Green poison' },
  },

  // FOOD
  bread: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 3, 8, 10, 4, hexToRGBA('#CC9933'));
      fillRect(buf, w, ICON_SIZE, 4, 6, 8, 3, hexToRGBA('#DDAA44'));
      fillRect(buf, w, ICON_SIZE, 5, 5, 6, 2, hexToRGBA('#CC9933'));
      setPixel(buf, w, ICON_SIZE, 6, 8, hexToRGBA('#BB8822'));
      setPixel(buf, w, ICON_SIZE, 9, 8, hexToRGBA('#BB8822'));
    },
    entry: { name: 'Bread', category: 'food', description: 'Loaf of bread' },
  },
  apple: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 5, 5, 6, 7, hexToRGBA('#CC3333'));
      fillRect(buf, w, ICON_SIZE, 4, 7, 8, 4, hexToRGBA('#CC3333'));
      fillRect(buf, w, ICON_SIZE, 7, 3, 2, 3, hexToRGBA('#6B4F10'));    // stem
      setPixel(buf, w, ICON_SIZE, 9, 4, hexToRGBA('#33AA33'));            // leaf
      setPixel(buf, w, ICON_SIZE, 10, 3, hexToRGBA('#33AA33'));
      setPixel(buf, w, ICON_SIZE, 6, 6, hexToRGBA('#FF6666'));            // highlight
    },
    entry: { name: 'Apple', category: 'food', description: 'Red apple' },
  },

  // KEYS
  gold_key: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 6, 2, 4, 4, hexToRGBA('#FFD700'));    // bow (ring)
      fillRect(buf, w, ICON_SIZE, 7, 3, 2, 2, hexToRGBA('#000000'));     // hole
      fillRect(buf, w, ICON_SIZE, 7, 6, 2, 7, hexToRGBA('#FFD700'));     // shaft
      fillRect(buf, w, ICON_SIZE, 9, 11, 2, 2, hexToRGBA('#FFD700'));    // bit 1
      fillRect(buf, w, ICON_SIZE, 9, 8, 2, 2, hexToRGBA('#FFD700'));     // bit 2
    },
    entry: { name: 'Gold Key', category: 'key', description: 'Ornate gold key' },
  },
  iron_key: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 6, 2, 4, 4, hexToRGBA('#888888'));
      fillRect(buf, w, ICON_SIZE, 7, 3, 2, 2, hexToRGBA('#000000'));
      fillRect(buf, w, ICON_SIZE, 7, 6, 2, 7, hexToRGBA('#888888'));
      fillRect(buf, w, ICON_SIZE, 9, 11, 2, 2, hexToRGBA('#888888'));
      fillRect(buf, w, ICON_SIZE, 9, 8, 2, 2, hexToRGBA('#888888'));
    },
    entry: { name: 'Iron Key', category: 'key', description: 'Simple iron key' },
  },

  // GEMS
  ruby: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 6, 4, 4, 6, hexToRGBA('#CC2222'));
      fillRect(buf, w, ICON_SIZE, 5, 6, 6, 3, hexToRGBA('#CC2222'));
      setPixel(buf, w, ICON_SIZE, 7, 3, hexToRGBA('#CC2222'));
      setPixel(buf, w, ICON_SIZE, 8, 3, hexToRGBA('#CC2222'));
      setPixel(buf, w, ICON_SIZE, 7, 10, hexToRGBA('#CC2222'));
      setPixel(buf, w, ICON_SIZE, 8, 10, hexToRGBA('#CC2222'));
      fillRect(buf, w, ICON_SIZE, 6, 5, 2, 2, hexToRGBA('#FF6666'));     // shine
    },
    entry: { name: 'Ruby', category: 'gem', description: 'Red gemstone' },
  },
  emerald: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 5, 4, 6, 8, hexToRGBA('#22AA22'));
      fillRect(buf, w, ICON_SIZE, 6, 3, 4, 1, hexToRGBA('#22AA22'));
      fillRect(buf, w, ICON_SIZE, 6, 12, 4, 1, hexToRGBA('#22AA22'));
      fillRect(buf, w, ICON_SIZE, 6, 5, 2, 2, hexToRGBA('#66DD66'));
    },
    entry: { name: 'Emerald', category: 'gem', description: 'Green gemstone' },
  },
  sapphire: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 5, 4, 6, 8, hexToRGBA('#2244CC'));
      fillRect(buf, w, ICON_SIZE, 6, 3, 4, 1, hexToRGBA('#2244CC'));
      fillRect(buf, w, ICON_SIZE, 6, 12, 4, 1, hexToRGBA('#2244CC'));
      fillRect(buf, w, ICON_SIZE, 6, 5, 2, 2, hexToRGBA('#6688FF'));
    },
    entry: { name: 'Sapphire', category: 'gem', description: 'Blue gemstone' },
  },

  // TOOLS
  pickaxe: {
    draw: (buf, w) => {
      // Handle (diagonal)
      for (let i = 0; i < 10; i++) {
        setPixel(buf, w, ICON_SIZE, 4 + i, 5 + i, hexToRGBA('#6B4F10'));
        setPixel(buf, w, ICON_SIZE, 5 + i, 5 + i, hexToRGBA('#6B4F10'));
      }
      // Head
      fillRect(buf, w, ICON_SIZE, 3, 3, 8, 2, hexToRGBA('#888888'));
      setPixel(buf, w, ICON_SIZE, 2, 4, hexToRGBA('#888888'));
      setPixel(buf, w, ICON_SIZE, 11, 4, hexToRGBA('#888888'));
    },
    entry: { name: 'Pickaxe', category: 'tool', description: 'Mining pickaxe' },
  },

  // SCROLLS
  spell_scroll: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 4, 3, 8, 10, hexToRGBA('#F5E6C8'));  // parchment
      fillRect(buf, w, ICON_SIZE, 3, 3, 2, 10, hexToRGBA('#D4C4A8'));   // left roll
      fillRect(buf, w, ICON_SIZE, 11, 3, 2, 10, hexToRGBA('#D4C4A8'));  // right roll
      // Text lines
      fillRect(buf, w, ICON_SIZE, 5, 5, 6, 1, hexToRGBA('#4A3510'));
      fillRect(buf, w, ICON_SIZE, 5, 7, 5, 1, hexToRGBA('#4A3510'));
      fillRect(buf, w, ICON_SIZE, 5, 9, 6, 1, hexToRGBA('#4A3510'));
    },
    entry: { name: 'Spell Scroll', category: 'scroll', description: 'Magical scroll' },
  },

  // MISC
  coin: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 5, 4, 6, 8, hexToRGBA('#FFD700'));
      fillRect(buf, w, ICON_SIZE, 6, 3, 4, 1, hexToRGBA('#FFD700'));
      fillRect(buf, w, ICON_SIZE, 6, 12, 4, 1, hexToRGBA('#FFD700'));
      fillRect(buf, w, ICON_SIZE, 4, 6, 1, 4, hexToRGBA('#FFD700'));
      fillRect(buf, w, ICON_SIZE, 11, 6, 1, 4, hexToRGBA('#FFD700'));
      fillRect(buf, w, ICON_SIZE, 7, 5, 2, 6, hexToRGBA('#CC9900'));     // center mark
      setPixel(buf, w, ICON_SIZE, 6, 5, hexToRGBA('#FFEE66'));            // shine
    },
    entry: { name: 'Gold Coin', category: 'misc', description: 'Gold coin currency' },
  },
  ring: {
    draw: (buf, w) => {
      fillRect(buf, w, ICON_SIZE, 5, 5, 6, 6, hexToRGBA('#FFD700'));
      fillRect(buf, w, ICON_SIZE, 6, 6, 4, 4, hexToRGBA('#000000'));     // hole (transparent would be better)
      fillRect(buf, w, ICON_SIZE, 6, 6, 4, 4, hexToRGBA('#00000000'));
      fillRect(buf, w, ICON_SIZE, 6, 4, 4, 1, hexToRGBA('#CC2222'));      // gem
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
