import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  type CharacterSpec,
  type LayerDefinition,
  ANIMATIONS,
  FRAME_SIZE,
  SHEET_WIDTH,
  SHEET_HEIGHT,
  ANIMATION_FOLDER_MAP,
} from './types.js';
import { loadDefinitions, findDefinition, listLayers } from './definitions.js';

export interface ComposeOptions {
  verbose?: boolean;
}

interface ResolvedLayer {
  zPos: number;
  basePath: string; // relative to spritesheets/
  variant: string;
  animations: string[];
  customAnimation?: string;
}

/** Compose a complete character spritesheet from a CharacterSpec */
export async function composeCharacter(
  spec: CharacterSpec,
  repoRoot: string,
  options?: ComposeOptions,
): Promise<Buffer> {
  const verbose = options?.verbose ?? false;
  const registry = await loadDefinitions(repoRoot);
  const spritesDir = join(repoRoot, 'spritesheets');

  // Pre-validate all layers before compositing (Q2)
  const issues: string[] = [];
  const allLayers = listLayers(registry);

  for (const layer of spec.layers) {
    const def = findDefinition(registry, layer.category, layer.subcategory);
    if (!def) {
      // Build helpful message with available options
      const categoryLayers = allLayers[layer.category];
      if (categoryLayers && categoryLayers.length > 0) {
        const available = categoryLayers.map(l => l.name.split('/').pop()).join(', ');
        issues.push(`Unknown ${layer.category}: "${layer.subcategory}". Available: ${available}`);
      } else {
        issues.push(`Unknown ${layer.category}: "${layer.subcategory}" (no definitions found for category "${layer.category}")`);
      }
      continue;
    }

    // Validate variant exists for definitions that track variants
    if (def.variants.length > 0 && !def.variants.includes(layer.variant)) {
      const suggestions = def.variants.filter(v =>
        v.includes(layer.variant) || layer.variant.includes(v)
      );
      const hint = suggestions.length > 0
        ? ` Did you mean: ${suggestions.join(', ')}?`
        : '';
      issues.push(
        `Unknown variant "${layer.variant}" for ${def.name}. ` +
        `Available: ${def.variants.join(', ')}${hint}`,
      );
    }
  }

  if (issues.length > 0) {
    throw new Error(
      'Cannot compose character. Issues found:\n' +
      issues.map(i => `  - ${i}`).join('\n'),
    );
  }

  // Resolve all layers to concrete sprite paths
  const resolvedLayers: ResolvedLayer[] = [];

  for (const layer of spec.layers) {
    const def = findDefinition(registry, layer.category, layer.subcategory)!;

    if (verbose) {
      console.log(`  Loading: ${def.name} (variant: ${layer.variant})`);
    }

    for (const entry of def.layers) {
      // Skip custom animation layers for now (oversize attacks, etc.)
      if (entry.customAnimation) continue;

      const basePath = entry.paths[spec.bodyType];
      if (!basePath) {
        // Try to find a fallback body type
        const fallback = findFallbackBodyType(entry.paths, spec.bodyType);
        if (!fallback) {
          if (verbose) {
            console.log(`    Skipping: ${def.name} layer has no path for body type "${spec.bodyType}"`);
          }
          continue;
        }
        resolvedLayers.push({
          zPos: entry.zPos,
          basePath: fallback,
          variant: layer.variant,
          animations: def.animations,
        });
      } else {
        resolvedLayers.push({
          zPos: entry.zPos,
          basePath,
          variant: layer.variant,
          animations: def.animations,
        });
      }
    }
  }

  // Sort by zPos ascending (back to front)
  resolvedLayers.sort((a, b) => a.zPos - b.zPos);

  if (verbose) {
    console.log(`  Compositing ${resolvedLayers.length} layers (z-sorted):`);
    for (const l of resolvedLayers) {
      console.log(`    z=${l.zPos}: ${l.basePath} [${l.variant}]`);
    }
  }

  // Build and composite layers incrementally to reduce memory usage.
  // Instead of holding all layer buffers in memory, composite one at a time
  // onto an intermediate canvas and release each buffer after use.
  let canvasBuffer = await sharp({
    create: {
      width: SHEET_WIDTH,
      height: SHEET_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();

  let layerCount = 0;

  for (const layer of resolvedLayers) {
    const buffer = await buildUniversalSheet(layer, spritesDir);
    if (buffer) {
      canvasBuffer = await sharp(canvasBuffer)
        .composite([{ input: buffer, top: 0, left: 0, blend: 'over' as const }])
        .toBuffer();
      layerCount++;
    }
  }

  if (layerCount === 0) {
    throw new Error('No valid layers could be loaded. Check that assets are installed (run: lpc-forge setup).');
  }

  return canvasBuffer;
}

function findFallbackBodyType(
  paths: Record<string, string>,
  bodyType: string,
): string | null {
  // Fallback chain
  const fallbacks: Record<string, string[]> = {
    muscular: ['male'],
    pregnant: ['female'],
    teen: ['male', 'female'],
    child: ['teen', 'male'],
  };

  const chain = fallbacks[bodyType] ?? [];
  for (const fb of chain) {
    if (paths[fb]) return paths[fb];
  }
  return null;
}

/** Build a universal 832×3456 sheet from individual animation PNGs */
async function buildUniversalSheet(
  layer: ResolvedLayer,
  spritesDir: string,
): Promise<Buffer | null> {
  const composites: sharp.OverlayOptions[] = [];

  // Map animation names used in definitions to folder names
  const animationList = Object.keys(ANIMATIONS);

  for (const animName of animationList) {
    const animInfo = ANIMATIONS[animName];

    // Check if this layer supports this animation
    const defAnimNames = layer.animations.map((a) => {
      const mapped = ANIMATION_FOLDER_MAP[a];
      return mapped ?? a;
    });

    // The folder name might differ from the animation name
    const folderName = ANIMATION_FOLDER_MAP[animName] ?? animName;

    // Check if the definition lists this animation (using either name)
    const supportsAnim = layer.animations.length === 0 || // no filter = all
      layer.animations.some((a) => {
        const mapped = ANIMATION_FOLDER_MAP[a] ?? a;
        return mapped === animName || mapped === folderName || a === animName;
      });

    if (!supportsAnim) continue;

    // Convert variant name: spaces to underscores for filenames
    const variantFile = layer.variant.replace(/ /g, '_');

    // Try to find the animation PNG
    const animPath = join(spritesDir, layer.basePath, folderName, `${variantFile}.png`);

    if (!existsSync(animPath)) {
      // Also try without folder mapping
      const altPath = join(spritesDir, layer.basePath, animName, `${variantFile}.png`);
      if (existsSync(altPath)) {
        try {
          const buf = await sharp(altPath).png().toBuffer();
          composites.push({
            input: buf,
            top: animInfo.row * FRAME_SIZE,
            left: 0,
          });
        } catch (e) {
          console.warn(`Warning: Could not load sprite file: ${altPath}`, e instanceof Error ? e.message : e);
        }
      }
      continue;
    }

    try {
      const buf = await sharp(animPath).png().toBuffer();
      composites.push({
        input: buf,
        top: animInfo.row * FRAME_SIZE,
        left: 0,
      });
    } catch (e) {
      console.warn(`Warning: Could not load sprite file: ${animPath}`, e instanceof Error ? e.message : e);
    }
  }

  if (composites.length === 0) return null;

  return sharp({
    create: {
      width: SHEET_WIDTH,
      height: SHEET_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .composite(composites)
    .toBuffer();
}
