import type { GameSystem } from './types.js';
import { generateEnemyAI } from './enemy-ai.js';
import { generateInventory } from './inventory.js';
import { generateDialog } from './dialog.js';
import { generateSaveLoad } from './save-load.js';
import { generateSceneTransition } from './scene-transition.js';
import { generateLoot } from './loot.js';
import { generateDayNight } from './day-night.js';
import { generateMenuSystem } from './menu.js';
import { generateQuest } from './quest.js';
import { generateFullHUD } from './hud-full.js';

export type { GameSystem, SystemFile } from './types.js';

const SYSTEM_GENERATORS: Record<string, () => GameSystem> = {
  enemy_ai: generateEnemyAI,
  inventory: generateInventory,
  dialog: generateDialog,
  save_load: generateSaveLoad,
  scene_transition: generateSceneTransition,
  loot: generateLoot,
  day_night: generateDayNight,
  menu: generateMenuSystem,
  quest: generateQuest,
  hud_full: generateFullHUD,
};

/** Memoization cache for system generators */
const systemCache = new Map<string, GameSystem>();

/** Get a single system by name */
export function getSystem(name: string): GameSystem | null {
  const cached = systemCache.get(name);
  if (cached) return cached;
  const gen = SYSTEM_GENERATORS[name];
  if (!gen) return null;
  const system = gen();
  systemCache.set(name, system);
  return system;
}

/** Get all systems */
export function getAllSystems(): GameSystem[] {
  return Object.values(SYSTEM_GENERATORS).map(gen => gen());
}

/** List available system names */
export function listSystems(): string[] {
  return Object.keys(SYSTEM_GENERATORS);
}

/** Get systems with resolved dependency order */
export function getSystemsInOrder(names?: string[]): GameSystem[] {
  const all = names
    ? names.map(n => getSystem(n)).filter((s): s is GameSystem => s !== null)
    : getAllSystems();

  const resolved: GameSystem[] = [];
  const seen = new Set<string>();

  function resolve(system: GameSystem): void {
    if (seen.has(system.name)) return;
    for (const dep of system.dependencies) {
      const depSystem = getSystem(dep);
      if (depSystem) resolve(depSystem);
    }
    seen.add(system.name);
    resolved.push(system);
  }

  for (const sys of all) {
    resolve(sys);
  }
  return resolved;
}
