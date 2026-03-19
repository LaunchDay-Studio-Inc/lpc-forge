import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { UITheme, UIKitResult } from './types.js';
import { UI_THEMES } from './themes.js';

function hexToRGBA(hex: string): { r: number; g: number; b: number; alpha: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
    alpha: 255,
  };
}

function createPixelBuffer(
  width: number,
  height: number,
  fillColor: string,
): Buffer {
  const { r, g, b, alpha } = hexToRGBA(fillColor);
  const buf = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    buf[i * 4] = r;
    buf[i * 4 + 1] = g;
    buf[i * 4 + 2] = b;
    buf[i * 4 + 3] = alpha;
  }
  return buf;
}

function setPixel(
  buf: Buffer,
  width: number,
  x: number,
  y: number,
  color: string,
): void {
  if (x < 0 || y < 0 || x >= width) return;
  const idx = (y * width + x) * 4;
  if (idx + 3 >= buf.length) return;
  const { r, g, b, alpha } = hexToRGBA(color);
  buf[idx] = r;
  buf[idx + 1] = g;
  buf[idx + 2] = b;
  buf[idx + 3] = alpha;
}

function drawRect(
  buf: Buffer,
  width: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(buf, width, x + dx, y + dy, color);
    }
  }
}

function drawBorder(
  buf: Buffer,
  width: number,
  height: number,
  borderWidth: number,
  borderColor: string,
  cornerRadius: number,
): void {
  // Top and bottom borders
  for (let bw = 0; bw < borderWidth; bw++) {
    for (let x = cornerRadius; x < width - cornerRadius; x++) {
      setPixel(buf, width, x, bw, borderColor);
      setPixel(buf, width, x, height - 1 - bw, borderColor);
    }
  }
  // Left and right borders
  for (let bw = 0; bw < borderWidth; bw++) {
    for (let y = cornerRadius; y < height - cornerRadius; y++) {
      setPixel(buf, width, bw, y, borderColor);
      setPixel(buf, width, width - 1 - bw, y, borderColor);
    }
  }
  // Corners (pixel-art style: fill diagonal steps)
  for (let i = 0; i < cornerRadius; i++) {
    for (let bw = 0; bw < borderWidth; bw++) {
      // Top-left
      setPixel(buf, width, cornerRadius - 1 - i + bw, i, borderColor);
      // Top-right
      setPixel(buf, width, width - cornerRadius + i - bw, i, borderColor);
      // Bottom-left
      setPixel(buf, width, cornerRadius - 1 - i + bw, height - 1 - i, borderColor);
      // Bottom-right
      setPixel(buf, width, width - cornerRadius + i - bw, height - 1 - i, borderColor);
    }
  }
}

/** Generate a panel PNG */
async function generatePanel(
  theme: UITheme,
  width: number,
  height: number,
  outputPath: string,
): Promise<void> {
  const buf = createPixelBuffer(width, height, theme.bgColor);
  drawBorder(buf, width, height, theme.borderWidth, theme.borderColor, theme.cornerRadius);

  // Inner highlight (1px lighter border inside)
  const highlightColor = lightenColor(theme.borderColor, 30);
  for (let x = theme.borderWidth + theme.cornerRadius; x < width - theme.borderWidth - theme.cornerRadius; x++) {
    setPixel(buf, width, x, theme.borderWidth, highlightColor);
  }

  await sharp(buf, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);
}

/** Generate a button spritesheet (4 states stacked vertically) */
async function generateButton(
  theme: UITheme,
  width: number,
  height: number,
  outputPath: string,
): Promise<void> {
  const stateColors = [
    theme.accentColor,   // normal
    theme.hoverColor,    // hover
    darkenColor(theme.accentColor, 30), // pressed
    theme.disabledColor, // disabled
  ];
  const totalHeight = height * 4;
  const buf = createPixelBuffer(width, totalHeight, '#00000000');

  for (let state = 0; state < 4; state++) {
    const yOff = state * height;
    // Fill
    drawRect(buf, width, 1, yOff + 1, width - 2, height - 2, stateColors[state]);
    // Border
    for (let x = 1; x < width - 1; x++) {
      setPixel(buf, width, x, yOff, theme.borderColor);
      setPixel(buf, width, x, yOff + height - 1, theme.borderColor);
    }
    for (let y = 1; y < height - 1; y++) {
      setPixel(buf, width, 0, yOff + y, theme.borderColor);
      setPixel(buf, width, width - 1, yOff + y, theme.borderColor);
    }
    // Pressed state: dark top edge for "pushed in" look
    if (state === 2) {
      for (let x = 1; x < width - 1; x++) {
        setPixel(buf, width, x, yOff + 1, darkenColor(stateColors[state], 20));
      }
    }
    // Normal/hover: light bottom highlight
    if (state < 2) {
      for (let x = 2; x < width - 2; x++) {
        setPixel(buf, width, x, yOff + height - 2, lightenColor(stateColors[state], 20));
      }
    }
  }

  await sharp(buf, { raw: { width, height: totalHeight, channels: 4 } })
    .png()
    .toFile(outputPath);
}

/** Generate health/mana/xp bar (empty + full versions stacked) */
async function generateBar(
  width: number,
  height: number,
  fillColor: string,
  bgColor: string,
  borderColor: string,
  outputPath: string,
): Promise<void> {
  const totalHeight = height * 2;
  const buf = createPixelBuffer(width, totalHeight, '#00000000');

  for (let variant = 0; variant < 2; variant++) {
    const yOff = variant * height;
    // Background
    drawRect(buf, width, 1, yOff + 1, width - 2, height - 2, bgColor);
    // Fill (only for "full" variant)
    if (variant === 1) {
      drawRect(buf, width, 2, yOff + 2, width - 4, height - 4, fillColor);
    }
    // Border
    for (let x = 1; x < width - 1; x++) {
      setPixel(buf, width, x, yOff, borderColor);
      setPixel(buf, width, x, yOff + height - 1, borderColor);
    }
    for (let y = 1; y < height - 1; y++) {
      setPixel(buf, width, 0, yOff + y, borderColor);
      setPixel(buf, width, width - 1, yOff + y, borderColor);
    }
  }

  await sharp(buf, { raw: { width, height: totalHeight, channels: 4 } })
    .png()
    .toFile(outputPath);
}

/** Generate inventory slot (empty + highlighted) */
async function generateSlot(
  size: number,
  theme: UITheme,
  outputPath: string,
): Promise<void> {
  const totalHeight = size * 2;
  const buf = createPixelBuffer(size, totalHeight, '#00000000');

  for (let variant = 0; variant < 2; variant++) {
    const yOff = variant * size;
    const bgCol = variant === 0 ? darkenColor(theme.bgColor, 10) : theme.bgColor;
    drawRect(buf, size, 1, yOff + 1, size - 2, size - 2, bgCol);

    const bCol = variant === 0 ? theme.borderColor : theme.accentColor;
    for (let x = 1; x < size - 1; x++) {
      setPixel(buf, size, x, yOff, bCol);
      setPixel(buf, size, x, yOff + size - 1, bCol);
    }
    for (let y = 1; y < size - 1; y++) {
      setPixel(buf, size, 0, yOff + y, bCol);
      setPixel(buf, size, size - 1, yOff + y, bCol);
    }
  }

  await sharp(buf, { raw: { width: size, height: totalHeight, channels: 4 } })
    .png()
    .toFile(outputPath);
}

/** Generate a pixel-art cursor (16x16, 4 states: normal, click, grab, crosshair) */
async function generateCursors(
  theme: UITheme,
  outputPath: string,
): Promise<void> {
  const size = 16;
  const totalWidth = size * 4;
  const buf = createPixelBuffer(totalWidth, size, '#00000000');

  // Arrow cursor (state 0)
  const arrowPixels = [
    [0,0],[0,1],[1,1],[0,2],[1,2],[2,2],
    [0,3],[1,3],[2,3],[3,3],[0,4],[1,4],[2,4],[3,4],[4,4],
    [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],
    [0,6],[1,6],[4,6],[5,6],
    [0,7],[1,7],[5,7],[6,7],
    [6,8],[7,8],
  ];
  for (const [px, py] of arrowPixels) {
    setPixel(buf, totalWidth, px, py, theme.accentColor);
  }
  // Fill inner arrow
  const arrowFill = [
    [0,1],[0,2],[1,2],[0,3],[1,3],[2,3],
    [0,4],[1,4],[2,4],[3,4],
    [0,5],[1,5],[2,5],
    [0,6],[1,6],
  ];
  for (const [px, py] of arrowFill) {
    setPixel(buf, totalWidth, px, py, theme.textColor);
  }

  // Simple crosshair (state 3) — centered at offset 3*16
  for (let i = 2; i <= 12; i++) {
    if (i >= 6 && i <= 8) continue;
    setPixel(buf, totalWidth, 3 * size + i, 7, theme.accentColor);
    setPixel(buf, totalWidth, 3 * size + 7, i, theme.accentColor);
  }

  await sharp(buf, { raw: { width: totalWidth, height: size, channels: 4 } })
    .png()
    .toFile(outputPath);
}

function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRGBA(hex);
  return '#' + [
    Math.min(255, r + amount),
    Math.min(255, g + amount),
    Math.min(255, b + amount),
  ].map(v => v.toString(16).padStart(2, '0')).join('');
}

function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRGBA(hex);
  return '#' + [
    Math.max(0, r - amount),
    Math.max(0, g - amount),
    Math.max(0, b - amount),
  ].map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Generate a complete UI kit for a theme */
export async function generateUIKit(
  outputDir: string,
  themeName?: string,
): Promise<UIKitResult> {
  const theme = UI_THEMES[themeName ?? 'medieval'] ?? UI_THEMES.medieval;
  const uiDir = join(outputDir, 'ui', theme.name.toLowerCase().replace(/\s+/g, '_'));
  await mkdir(uiDir, { recursive: true });

  const result: UIKitResult = {
    panels: [],
    buttons: [],
    frames: [],
    bars: [],
    slots: [],
    cursors: [],
    totalAssets: 0,
  };

  // Panels: dialog box, inventory panel, tooltip, notification
  const panelSizes = [
    { name: 'dialog', w: 320, h: 96 },
    { name: 'inventory', w: 256, h: 320 },
    { name: 'tooltip', w: 192, h: 64 },
    { name: 'notification', w: 288, h: 48 },
    { name: 'large_panel', w: 384, h: 256 },
  ];
  for (const p of panelSizes) {
    const path = join(uiDir, `panel_${p.name}.png`);
    await generatePanel(theme, p.w, p.h, path);
    result.panels.push(path);
  }

  // Buttons: small, medium, large
  const buttonSizes = [
    { name: 'small', w: 64, h: 20 },
    { name: 'medium', w: 128, h: 24 },
    { name: 'large', w: 192, h: 32 },
  ];
  for (const b of buttonSizes) {
    const path = join(uiDir, `button_${b.name}.png`);
    await generateButton(theme, b.w, b.h, path);
    result.buttons.push(path);
  }

  // Frames: portrait frame, item frame
  const frameSizes = [
    { name: 'portrait', w: 80, h: 80 },
    { name: 'item', w: 48, h: 48 },
  ];
  for (const f of frameSizes) {
    const path = join(uiDir, `frame_${f.name}.png`);
    await generatePanel(theme, f.w, f.h, path);
    result.frames.push(path);
  }

  // Bars: health (red), mana (blue), xp (green)
  const barConfigs = [
    { name: 'health', fill: '#cc3333', bg: '#331111' },
    { name: 'mana', fill: '#3366cc', bg: '#111133' },
    { name: 'xp', fill: '#33cc33', bg: '#113311' },
    { name: 'stamina', fill: '#cccc33', bg: '#333311' },
  ];
  for (const b of barConfigs) {
    const path = join(uiDir, `bar_${b.name}.png`);
    await generateBar(200, 16, b.fill, b.bg, theme.borderColor, path);
    result.bars.push(path);
  }

  // Slots: inventory slot (32x32 and 48x48)
  for (const size of [32, 48]) {
    const path = join(uiDir, `slot_${size}.png`);
    await generateSlot(size, theme, path);
    result.slots.push(path);
  }

  // Cursors
  const cursorPath = join(uiDir, 'cursors.png');
  await generateCursors(theme, cursorPath);
  result.cursors.push(cursorPath);

  result.totalAssets = result.panels.length + result.buttons.length +
    result.frames.length + result.bars.length + result.slots.length + result.cursors.length;

  return result;
}

/** List available themes */
export function listThemes(): string[] {
  return Object.keys(UI_THEMES);
}

export { UI_THEMES };
