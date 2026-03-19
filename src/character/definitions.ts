import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LayerDefinition, LayerEntry } from './types.js';

export interface DefinitionRegistry {
  /** All parsed definitions keyed by "category/subcategory" */
  definitions: Map<string, LayerDefinition>;
  /** All categories (body, hair, torso, etc.) */
  categories: string[];
}

/** Recursively read all JSON definitions from sheet_definitions/ */
export async function loadDefinitions(repoRoot: string): Promise<DefinitionRegistry> {
  const defsDir = join(repoRoot, 'sheet_definitions');
  const definitions = new Map<string, LayerDefinition>();

  const categories = await readdir(defsDir);
  for (const category of categories) {
    const categoryPath = join(defsDir, category);
    const s = await stat(categoryPath);
    if (!s.isDirectory()) continue;
    await loadCategoryDefinitions(categoryPath, category, definitions);
  }

  return {
    definitions,
    categories: [...new Set([...definitions.values()].map((d) => d.name))],
  };
}

async function loadCategoryDefinitions(
  dirPath: string,
  categoryPrefix: string,
  definitions: Map<string, LayerDefinition>,
): Promise<void> {
  const entries = await readdir(dirPath);
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const s = await stat(fullPath);

    if (s.isDirectory()) {
      // Recurse into subdirectories
      await loadCategoryDefinitions(fullPath, categoryPrefix, definitions);
    } else if (entry.endsWith('.json') && !entry.startsWith('meta_')) {
      try {
        const def = await parseDefinitionFile(fullPath, categoryPrefix);
        if (def) {
          definitions.set(def.name, def);
        }
      } catch {
        // Skip invalid JSON files
      }
    }
  }
}

async function parseDefinitionFile(
  filePath: string,
  category: string,
): Promise<LayerDefinition | null> {
  const content = await readFile(filePath, 'utf-8');
  const json = JSON.parse(content);

  if (!json.name) return null;

  // Extract layer entries (layer_1, layer_2, etc.)
  const layers: LayerEntry[] = [];
  for (let i = 1; i <= 20; i++) {
    const layerKey = `layer_${i}`;
    const layerData = json[layerKey];
    if (!layerData) break;

    const paths: Record<string, string> = {};
    const bodyTypes = ['male', 'muscular', 'female', 'pregnant', 'teen', 'child'];
    for (const bt of bodyTypes) {
      if (layerData[bt]) {
        paths[bt] = layerData[bt];
      }
    }

    layers.push({
      zPos: layerData.zPos ?? 0,
      paths,
      customAnimation: layerData.custom_animation,
    });
  }

  if (layers.length === 0) return null;

  // Derive a subcategory key from the filename
  const fileName = filePath.split('/').pop()!.replace('.json', '');

  return {
    name: `${category}/${fileName}`,
    priority: json.priority ?? 0,
    layers,
    variants: json.variants ?? [],
    animations: json.animations ?? [],
    matchBodyColor: json.match_body_color ?? false,
    typeName: json.type_name,
  };
}

/** List all available layers grouped by category */
export function listLayers(registry: DefinitionRegistry): Record<string, { name: string; variants: string[] }[]> {
  const result: Record<string, { name: string; variants: string[] }[]> = {};

  for (const [key, def] of registry.definitions) {
    const category = key.split('/')[0];
    if (!result[category]) result[category] = [];
    result[category].push({
      name: key,
      variants: def.variants,
    });
  }

  return result;
}

/** Find a definition by searching category and subcategory patterns */
export function findDefinition(
  registry: DefinitionRegistry,
  category: string,
  subcategory: string,
): LayerDefinition | undefined {
  // Try exact key match first
  const exactKey = `${category}/${subcategory}`;
  if (registry.definitions.has(exactKey)) {
    return registry.definitions.get(exactKey);
  }

  // Try partial matching
  for (const [key, def] of registry.definitions) {
    if (key.startsWith(category + '/') && key.includes(subcategory)) {
      return def;
    }
  }

  // Try matching by type_name
  for (const [, def] of registry.definitions) {
    if (def.typeName === subcategory) {
      return def;
    }
  }

  return undefined;
}
