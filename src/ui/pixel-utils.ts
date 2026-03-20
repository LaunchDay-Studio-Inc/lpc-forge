/**
 * Shared pixel-manipulation utilities for UI generation.
 *
 * Fixes applied:
 *  - HIGH-007/008: hexToRGBA now parses an optional alpha channel from
 *    8-character hex strings instead of hard-coding 255.
 *  - MEDIUM-010/011: setPixel includes a `y >= height` bounds check.
 *  - HIGH-015: single source of truth (code deduplication).
 */

export function hexToRGBA(hex: string): { r: number; g: number; b: number; alpha: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
    alpha: h.length >= 8 ? parseInt(h.substring(6, 8), 16) : 255,
  };
}

export function setPixel(
  buf: Buffer,
  width: number,
  height: number,
  x: number,
  y: number,
  color: { r: number; g: number; b: number; alpha: number },
): void {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = (y * width + x) * 4;
  if (idx + 3 >= buf.length) return;
  buf[idx] = color.r;
  buf[idx + 1] = color.g;
  buf[idx + 2] = color.b;
  buf[idx + 3] = color.alpha;
}

export function fillRect(
  buf: Buffer,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: { r: number; g: number; b: number; alpha: number },
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(buf, width, height, x + dx, y + dy, color);
    }
  }
}
