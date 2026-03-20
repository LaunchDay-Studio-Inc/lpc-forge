import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import type { GameSystem } from './types.js';
import { getSystemsInOrder } from './index.js';

export interface WriteResult {
  systems: string[];
  filesWritten: number;
  autoloads: { name: string; path: string }[];
  inputActions: string[];
}

/** Write game system files to a Godot project directory */
export async function writeGameSystems(
  outputDir: string,
  systemNames?: string[],
): Promise<WriteResult> {
  const systems = systemNames
    ? getSystemsInOrder(systemNames)
    : getSystemsInOrder();

  let filesWritten = 0;
  const allAutoloads: { name: string; path: string }[] = [];
  const allInputActions = new Set<string>();

  const resolvedBase = resolve(outputDir);

  for (const system of systems) {
    for (const file of system.files) {
      const fullPath = join(outputDir, file.path);
      const resolvedFull = resolve(fullPath);
      if (!resolvedFull.startsWith(resolvedBase + '/') && resolvedFull !== resolvedBase) {
        throw new Error(`System file path "${file.path}" resolves outside output directory`);
      }
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, file.content);
      filesWritten++;
    }
    allAutoloads.push(...system.autoloads);
    for (const action of system.inputActions) {
      allInputActions.add(action);
    }
  }

  return {
    systems: systems.map(s => s.name),
    filesWritten,
    autoloads: allAutoloads,
    inputActions: [...allInputActions],
  };
}
