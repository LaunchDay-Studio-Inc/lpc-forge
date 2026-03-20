// These interfaces are currently unused but retained for potential future public API use.
// The actual export functions define their options inline.
export interface GodotExportOptions {
  characterName: string;
  outputDir: string;
  resPath?: string; // Godot res:// path prefix, default "res://"
  animationSpeed?: number; // frames per second, default 10
}

export interface TilesetExportOptions {
  mapName: string;
  outputDir: string;
  tileSize?: number;
}
