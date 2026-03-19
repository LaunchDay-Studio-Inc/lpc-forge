export interface SystemFile {
  /** Relative path from project root (e.g. "scripts/inventory.gd") */
  path: string;
  content: string;
}

export interface GameSystem {
  name: string;
  description: string;
  /** Files this system generates */
  files: SystemFile[];
  /** Other systems this depends on */
  dependencies: string[];
  /** Autoloads to register in project.godot */
  autoloads: { name: string; path: string }[];
  /** Input actions to register */
  inputActions: string[];
}
