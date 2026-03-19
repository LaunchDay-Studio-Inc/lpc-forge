import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sliceCharacter } from '../character/slicer.js';
import { ANIMATIONS, DIRECTIONS, FRAME_SIZE } from '../character/types.js';
import type { GeneratedMap } from '../map/types.js';
import { tileTypeToName } from '../tileset/registry.js';

/** Export a character spritesheet as Godot 4.6 resources */
export async function exportCharacterToGodot(
  sheetBuffer: Buffer,
  outputDir: string,
  characterName: string,
  options?: { animationSpeed?: number; resPath?: string },
): Promise<void> {
  const speed = options?.animationSpeed ?? 10;
  const resBase = options?.resPath ?? `res://sprites/${characterName}`;

  const spritesDir = join(outputDir, 'sprites', characterName);
  await mkdir(spritesDir, { recursive: true });

  // Slice into individual frames
  await sliceCharacter(sheetBuffer, spritesDir);

  // Save the full spritesheet too
  await writeFile(join(spritesDir, 'spritesheet.png'), sheetBuffer);

  // Generate .tres SpriteFrames resource
  const tresContent = generateSpriteFramesTres(characterName, resBase, speed);
  await writeFile(join(spritesDir, `${characterName}.tres`), tresContent);

  // Generate .tscn scene
  const tscnContent = generateCharacterTscn(characterName, resBase);
  await writeFile(join(outputDir, `${characterName}.tscn`), tscnContent);
}

function generateSpriteFramesTres(
  name: string,
  resBase: string,
  speed: number,
): string {
  const lines: string[] = [];
  const extResources: string[] = [];
  let extId = 1;
  const extIdMap: Record<string, number> = {};

  // Collect all frame paths and assign ext_resource IDs
  for (const [animName, animInfo] of Object.entries(ANIMATIONS)) {
    const directions = animInfo.rows === 1 ? ['down'] : [...DIRECTIONS];
    for (const dir of directions) {
      for (let f = 0; f < animInfo.frames; f++) {
        const path = `${resBase}/${animName}/${dir}_${f}.png`;
        extIdMap[path] = extId;
        extResources.push(
          `[ext_resource type="Texture2D" path="${path}" id="${extId}"]`,
        );
        extId++;
      }
    }
  }

  lines.push(`[gd_resource type="SpriteFrames" load_steps=${extId} format=3]`);
  lines.push('');
  lines.push(...extResources);
  lines.push('');
  lines.push('[resource]');

  // Build animations array
  const anims: string[] = [];

  for (const [animName, animInfo] of Object.entries(ANIMATIONS)) {
    const directions = animInfo.rows === 1 ? ['down'] : [...DIRECTIONS];
    for (const dir of directions) {
      const gdAnimName = `${animName}_${dir}`;
      const frames: string[] = [];

      for (let f = 0; f < animInfo.frames; f++) {
        const path = `${resBase}/${animName}/${dir}_${f}.png`;
        const id = extIdMap[path];
        frames.push(`{
"duration": 1.0,
"texture": ExtResource("${id}")
}`);
      }

      const loop = animName === 'walk' || animName === 'idle' || animName === 'run' || animName === 'combat_idle';

      anims.push(`{
"frames": [${frames.join(', ')}],
"loop": ${loop},
"name": &"${gdAnimName}",
"speed": ${speed}.0
}`);
    }
  }

  lines.push(`animations = [${anims.join(', ')}]`);
  return lines.join('\n');
}

function generateCharacterTscn(name: string, resBase: string): string {
  return `[gd_scene load_steps=3 format=3]

[ext_resource type="SpriteFrames" path="${resBase}/${name}.tres" id="1"]

[sub_resource type="RectangleShape2D" id="1"]
size = Vector2(32, 32)

[node name="${capitalize(name)}" type="CharacterBody2D"]

[node name="AnimatedSprite2D" type="AnimatedSprite2D" parent="."]
sprite_frames = ExtResource("1")
animation = &"idle_down"
autoplay = "idle_down"
offset = Vector2(0, -16)

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]
shape = SubResource("1")
position = Vector2(0, 8)
`;
}

/** Export a generated map as Godot 4.6 TileMapLayer scene */
export async function exportMapToGodot(
  map: GeneratedMap,
  outputDir: string,
  mapName: string,
  options?: { tileSize?: number },
): Promise<void> {
  const tileSize = options?.tileSize ?? 32;

  await mkdir(outputDir, { recursive: true });

  // Generate tileset .tres
  const tilesetContent = generateTilesetTres(tileSize);
  await writeFile(join(outputDir, `${mapName}_tileset.tres`), tilesetContent);

  // Generate map .tscn
  const tscnContent = generateMapTscn(map, mapName, tileSize);
  await writeFile(join(outputDir, `${mapName}.tscn`), tscnContent);
}

function generateTilesetTres(tileSize: number): string {
  // Define tile IDs matching TileType enum
  const tiles = [
    { id: 0, name: 'void', color: '000000' },
    { id: 1, name: 'floor', color: 'b4966e' },
    { id: 2, name: 'wall', color: '50505a' },
    { id: 3, name: 'door', color: '8c6440' },
    { id: 4, name: 'corridor', color: 'a08764' },
    { id: 5, name: 'water', color: '3c78be' },
    { id: 6, name: 'grass', color: '50a03c' },
    { id: 7, name: 'tree', color: '1e641e' },
    { id: 8, name: 'path', color: 'beaa82' },
    { id: 9, name: 'sand', color: 'dcc88c' },
    { id: 10, name: 'stone', color: '8c8c96' },
    { id: 11, name: 'bridge', color: '966e46' },
  ];

  const lines = [`[gd_resource type="TileSet" format=3]`, '', `[resource]`];
  lines.push(`tile_size = Vector2i(${tileSize}, ${tileSize})`);

  // For a simple colored tileset, we'll define it to be used with the map
  // Users can replace with actual sprite-based tilesets
  return lines.join('\n');
}

function generateMapTscn(map: GeneratedMap, mapName: string, tileSize: number): string {
  const lines: string[] = [];
  lines.push(`[gd_scene load_steps=2 format=3]`);
  lines.push('');
  lines.push(`[ext_resource type="TileSet" path="res://${mapName}_tileset.tres" id="1"]`);
  lines.push('');
  lines.push(`[node name="${capitalize(mapName)}" type="Node2D"]`);
  lines.push('');

  // Ground layer
  lines.push(`[node name="Ground" type="TileMapLayer" parent="."]`);
  lines.push(`tile_set = ExtResource("1")`);

  // Encode tile data - Godot 4 uses PackedInt32Array format
  // Each tile is encoded as: x | (y << 16), source_id, atlas_coords, alternative_tile
  const tileData: number[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tileType = map.tiles[y][x];
      // Store coordinates and tile type for Godot
      tileData.push(x, y, 0); // x, y, source
      tileData.push(tileType, 0, 0); // atlas_x, atlas_y, alternative
    }
  }

  lines.push('');

  // Add markers for spawn and exit
  if (map.spawnPoint) {
    lines.push(`[node name="SpawnPoint" type="Marker2D" parent="."]`);
    lines.push(`position = Vector2(${map.spawnPoint.x * tileSize}, ${map.spawnPoint.y * tileSize})`);
    lines.push('');
  }

  if (map.exitPoint) {
    lines.push(`[node name="ExitPoint" type="Marker2D" parent="."]`);
    lines.push(`position = Vector2(${map.exitPoint.x * tileSize}, ${map.exitPoint.y * tileSize})`);
    lines.push('');
  }

  return lines.join('\n');
}

/** Scaffold a complete Godot 4.6 project */
export async function scaffoldGodotProject(
  outputDir: string,
  projectName: string,
): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  // project.godot
  const projectGodot = `; Engine configuration file.
; It's best edited using the editor UI and not directly,
; but it can also be edited because it's a plain text file.

config_version=5

[application]

config/name="${projectName}"
config/features=PackedStringArray("4.6")
run/main_scene="res://main.tscn"
config/icon="res://icon.svg"

[display]

window/size/viewport_width=1280
window/size/viewport_height=720
window/stretch/mode="canvas_items"

[rendering]

textures/canvas_textures/default_texture_filter=0
`;

  await writeFile(join(outputDir, 'project.godot'), projectGodot);

  // Main scene
  const mainTscn = `[gd_scene format=3]

[node name="Main" type="Node2D"]
`;
  await writeFile(join(outputDir, 'main.tscn'), mainTscn);

  // Player script
  const scriptsDir = join(outputDir, 'scripts');
  await mkdir(scriptsDir, { recursive: true });

  const playerGd = `extends CharacterBody2D

const SPEED = 200.0

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D

var direction := "down"
var is_moving := false

func _physics_process(delta: float) -> void:
\tvar input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
\tvelocity = input_dir * SPEED

\tif input_dir != Vector2.ZERO:
\t\tis_moving = true
\t\tif abs(input_dir.x) > abs(input_dir.y):
\t\t\tdirection = "right" if input_dir.x > 0 else "left"
\t\telse:
\t\t\tdirection = "down" if input_dir.y > 0 else "up"
\telse:
\t\tis_moving = false

\tvar anim_name = ("walk_" if is_moving else "idle_") + direction
\tif sprite.sprite_frames.has_animation(anim_name):
\t\tsprite.play(anim_name)

\tmove_and_slide()
`;

  await writeFile(join(scriptsDir, 'player.gd'), playerGd);

  // Simple SVG icon
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
  <rect width="128" height="128" rx="16" fill="#478cbf"/>
  <text x="64" y="80" text-anchor="middle" font-size="48" fill="white" font-family="sans-serif">LPC</text>
</svg>`;

  await writeFile(join(outputDir, 'icon.svg'), iconSvg);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
