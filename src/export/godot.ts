import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sliceCharacter } from '../character/slicer.js';
import { ANIMATIONS, DIRECTIONS, FRAME_SIZE } from '../character/types.js';
import type { GeneratedMap } from '../map/types.js';

export interface CharacterExportOptions {
  animationSpeed?: number;
  resPath?: string;
  isPlayer?: boolean;
}

/** Export a character spritesheet as Godot 4.6 resources */
export async function exportCharacterToGodot(
  sheetBuffer: Buffer,
  outputDir: string,
  characterName: string,
  options?: CharacterExportOptions,
): Promise<void> {
  const speed = options?.animationSpeed ?? 10;
  const resBase = options?.resPath ?? `res://sprites/${characterName}`;
  const isPlayer = options?.isPlayer ?? true;

  const spritesDir = join(outputDir, 'sprites', characterName);
  await mkdir(spritesDir, { recursive: true });

  // Slice into individual frames
  await sliceCharacter(sheetBuffer, spritesDir);

  // Save the full spritesheet too
  await writeFile(join(spritesDir, 'spritesheet.png'), sheetBuffer);

  // Generate .tres SpriteFrames resource
  const tresContent = generateSpriteFramesTres(characterName, resBase, speed);
  await writeFile(join(spritesDir, `${characterName}.tres`), tresContent);

  // Generate .tscn scene with hitbox/hurtbox/timers
  const tscnContent = generateCharacterTscn(characterName, resBase, isPlayer);
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

function generateCharacterTscn(name: string, resBase: string, isPlayer: boolean): string {
  const loadSteps = isPlayer ? 6 : 4;
  const lines: string[] = [];
  lines.push(`[gd_scene load_steps=${loadSteps} format=3]`);
  lines.push('');
  lines.push(`[ext_resource type="SpriteFrames" path="${resBase}/${name}.tres" id="1"]`);
  if (isPlayer) {
    lines.push(`[ext_resource type="Script" path="res://scripts/player.gd" id="2"]`);
  }
  lines.push('');

  // CollisionShape2D for body
  lines.push(`[sub_resource type="RectangleShape2D" id="1"]`);
  lines.push(`size = Vector2(${FRAME_SIZE / 2}, ${FRAME_SIZE / 2})`);
  lines.push('');

  // Hitbox shape
  lines.push(`[sub_resource type="RectangleShape2D" id="2"]`);
  lines.push(`size = Vector2(${FRAME_SIZE / 2}, ${FRAME_SIZE / 2})`);
  lines.push('');

  // Hurtbox shape
  lines.push(`[sub_resource type="RectangleShape2D" id="3"]`);
  lines.push(`size = Vector2(24, 32)`);
  lines.push('');

  // Root node
  lines.push(`[node name="${capitalize(name)}" type="CharacterBody2D"]`);
  if (isPlayer) {
    lines.push(`script = ExtResource("2")`);
  }
  lines.push('');

  // Sprite
  lines.push(`[node name="AnimatedSprite2D" type="AnimatedSprite2D" parent="."]`);
  lines.push(`sprite_frames = ExtResource("1")`);
  lines.push(`animation = &"idle_down"`);
  lines.push(`autoplay = "idle_down"`);
  lines.push(`offset = Vector2(0, -16)`);
  lines.push('');

  // Body collision
  lines.push(`[node name="CollisionShape2D" type="CollisionShape2D" parent="."]`);
  lines.push(`shape = SubResource("1")`);
  lines.push(`position = Vector2(0, 8)`);
  lines.push('');

  // Hitbox Area2D
  lines.push(`[node name="Hitbox" type="Area2D" parent="."]`);
  lines.push(`collision_layer = 2`);
  lines.push(`collision_mask = 0`);
  lines.push(`monitorable = true`);
  lines.push(`monitoring = false`);
  lines.push('');
  lines.push(`[node name="CollisionShape2D" type="CollisionShape2D" parent="Hitbox"]`);
  lines.push(`shape = SubResource("2")`);
  lines.push(`position = Vector2(16, 0)`);
  lines.push(`disabled = true`);
  lines.push('');

  // Hurtbox Area2D
  lines.push(`[node name="Hurtbox" type="Area2D" parent="."]`);
  lines.push(`collision_layer = 0`);
  lines.push(`collision_mask = 2`);
  lines.push(`monitorable = false`);
  lines.push(`monitoring = true`);
  lines.push('');
  lines.push(`[node name="CollisionShape2D" type="CollisionShape2D" parent="Hurtbox"]`);
  lines.push(`shape = SubResource("3")`);
  lines.push('');

  // Timers
  lines.push(`[node name="AttackTimer" type="Timer" parent="."]`);
  lines.push(`wait_time = 0.4`);
  lines.push(`one_shot = true`);
  lines.push('');
  lines.push(`[node name="HurtTimer" type="Timer" parent="."]`);
  lines.push(`wait_time = 0.5`);
  lines.push(`one_shot = true`);
  lines.push('');

  return lines.join('\n');
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
  const lines = [`[gd_resource type="TileSet" format=3]`, '', `[resource]`];
  lines.push(`tile_size = Vector2i(${tileSize}, ${tileSize})`);
  return lines.join('\n');
}

interface WallRect {
  cx: number; // center x in pixels
  cy: number; // center y in pixels
  w: number;  // width in pixels
  h: number;  // height in pixels
}

/** Merge adjacent wall tiles into larger rectangles using row-based greedy merging */
function mergeWallTiles(map: GeneratedMap, tileSize: number): WallRect[] {
  const rects: WallRect[] = [];
  const visited = Array.from({ length: map.height }, () => new Array(map.width).fill(false) as boolean[]);

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const t = map.tiles[y][x];
      // TileType.WALL = 2, TileType.TREE = 7
      if ((t !== 2 && t !== 7) || visited[y][x]) continue;

      // Extend horizontally as far as possible
      let endX = x;
      while (endX + 1 < map.width && !visited[y][endX + 1] &&
             (map.tiles[y][endX + 1] === 2 || map.tiles[y][endX + 1] === 7)) {
        endX++;
      }

      // Try to extend downward
      let endY = y;
      outer: while (endY + 1 < map.height) {
        for (let cx = x; cx <= endX; cx++) {
          if (visited[endY + 1][cx] ||
              (map.tiles[endY + 1][cx] !== 2 && map.tiles[endY + 1][cx] !== 7)) {
            break outer;
          }
        }
        endY++;
      }

      // Mark all covered tiles as visited
      for (let vy = y; vy <= endY; vy++) {
        for (let vx = x; vx <= endX; vx++) {
          visited[vy][vx] = true;
        }
      }

      const tilesW = endX - x + 1;
      const tilesH = endY - y + 1;
      rects.push({
        cx: x * tileSize + (tilesW * tileSize) / 2,
        cy: y * tileSize + (tilesH * tileSize) / 2,
        w: tilesW * tileSize,
        h: tilesH * tileSize,
      });
    }
  }

  return rects;
}

function generateMapTscn(map: GeneratedMap, mapName: string, tileSize: number): string {
  const lines: string[] = [];

  // Merge adjacent wall tiles into larger rectangles (row-based greedy merge)
  const wallRects = mergeWallTiles(map, tileSize);

  // Collect non-default wall shapes that need sub_resources
  const customShapes = wallRects.filter(r => r.w !== tileSize || r.h !== tileSize);
  // load_steps = 1 (ext tileset) + 1 (default wall shape) + custom shapes
  const loadSteps = 2 + customShapes.length;

  lines.push(`[gd_scene load_steps=${loadSteps} format=3]`);
  lines.push('');
  lines.push(`[ext_resource type="TileSet" path="res://${mapName}_tileset.tres" id="1"]`);
  lines.push('');

  // Default collision shape for single-tile walls
  lines.push(`[sub_resource type="RectangleShape2D" id="1"]`);
  lines.push(`size = Vector2(${tileSize}, ${tileSize})`);
  lines.push('');

  // Custom collision shapes for merged walls
  for (let i = 0; i < wallRects.length; i++) {
    const rect = wallRects[i];
    if (rect.w !== tileSize || rect.h !== tileSize) {
      lines.push(`[sub_resource type="RectangleShape2D" id="wall_${i}"]`);
      lines.push(`size = Vector2(${rect.w}, ${rect.h})`);
      lines.push('');
    }
  }

  lines.push(`[node name="${capitalize(mapName)}" type="Node2D"]`);
  lines.push('');

  // Ground TileMapLayer
  lines.push(`[node name="Ground" type="TileMapLayer" parent="."]`);
  lines.push(`tile_set = ExtResource("1")`);
  lines.push('');

  // Wall collision StaticBody2D with merged collision rectangles
  lines.push(`[node name="Walls" type="StaticBody2D" parent="."]`);
  lines.push(`collision_layer = 1`);
  lines.push(`collision_mask = 0`);
  lines.push('');

  for (let i = 0; i < wallRects.length; i++) {
    const rect = wallRects[i];
    lines.push(`[node name="Wall${i}" type="CollisionShape2D" parent="Walls"]`);
    lines.push(`position = Vector2(${rect.cx}, ${rect.cy})`);
    if (rect.w === tileSize && rect.h === tileSize) {
      lines.push(`shape = SubResource("1")`);
    } else {
      lines.push(`shape = SubResource("wall_${i}")`);
    }
    lines.push('');
  }

  // Spawn and exit markers
  if (map.spawnPoint) {
    lines.push(`[node name="SpawnPoint" type="Marker2D" parent="."]`);
    lines.push(`position = Vector2(${map.spawnPoint.x * tileSize + tileSize / 2}, ${map.spawnPoint.y * tileSize + tileSize / 2})`);
    lines.push('');
  }

  if (map.exitPoint) {
    lines.push(`[node name="ExitPoint" type="Marker2D" parent="."]`);
    lines.push(`position = Vector2(${map.exitPoint.x * tileSize + tileSize / 2}, ${map.exitPoint.y * tileSize + tileSize / 2})`);
    lines.push('');
  }

  // POI markers
  if (map.pois) {
    for (let i = 0; i < map.pois.length; i++) {
      const poi = map.pois[i];
      const nodeName = `POI_${poi.type}_${i}`;
      lines.push(`[node name="${nodeName}" type="Marker2D" parent="."]`);
      lines.push(`position = Vector2(${poi.x * tileSize + tileSize / 2}, ${poi.y * tileSize + tileSize / 2})`);
      const meta: Record<string, string> = { poi_type: poi.type };
      if (poi.label) meta['poi_label'] = poi.label;
      lines.push(`metadata/poi_type = "${poi.type}"`);
      if (poi.label) lines.push(`metadata/poi_label = "${poi.label}"`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/** Scaffold a complete Godot 4.6 project */
export async function scaffoldGodotProject(
  outputDir: string,
  projectName: string,
  options?: { characterName?: string; mapName?: string; viewportWidth?: number; viewportHeight?: number; spawnPoint?: { x: number; y: number } },
): Promise<void> {
  const charName = options?.characterName ?? 'player';
  const mapName = options?.mapName ?? 'dungeon';
  const vpWidth = options?.viewportWidth ?? 1280;
  const vpHeight = options?.viewportHeight ?? 720;
  const spawnX = options?.spawnPoint ? options.spawnPoint.x * 32 : 400;
  const spawnY = options?.spawnPoint ? options.spawnPoint.y * 32 : 400;

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

window/size/viewport_width=${vpWidth}
window/size/viewport_height=${vpHeight}
window/stretch/mode="canvas_items"

[input]

move_up={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":87,"physical_keycode":0,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
}
move_down={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":83,"physical_keycode":0,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
}
move_left={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":65,"physical_keycode":0,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
}
move_right={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":68,"physical_keycode":0,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
}
attack={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":32,"physical_keycode":0,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
}
interact={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":69,"physical_keycode":0,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
}

[rendering]

textures/canvas_textures/default_texture_filter=0
`;

  await writeFile(join(outputDir, 'project.godot'), projectGodot);

  // Main scene — instances map + player at spawn, adds Camera2D and HUD
  const mainTscn = `[gd_scene load_steps=4 format=3]

[ext_resource type="PackedScene" path="res://${charName}.tscn" id="1"]
[ext_resource type="PackedScene" path="res://${mapName}.tscn" id="2"]
[ext_resource type="Script" path="res://scripts/hud.gd" id="3"]

[node name="Main" type="Node2D"]

[node name="Map" parent="." instance=ExtResource("2")]

[node name="Player" parent="." instance=ExtResource("1")]
position = Vector2(${spawnX}, ${spawnY})

[node name="Camera2D" type="Camera2D" parent="Player"]
zoom = Vector2(2, 2)

[node name="HUD" type="CanvasLayer" parent="."]

[node name="HUDControl" type="Control" parent="HUD"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
script = ExtResource("3")

[node name="HealthBar" type="ProgressBar" parent="HUD/HUDControl"]
layout_mode = 1
offset_left = 16.0
offset_top = 16.0
offset_right = 216.0
offset_bottom = 32.0
value = 100.0
show_percentage = false
`;
  await writeFile(join(outputDir, 'main.tscn'), mainTscn);

  // Scripts directory
  const scriptsDir = join(outputDir, 'scripts');
  await mkdir(scriptsDir, { recursive: true });

  // State machine player script
  const playerGd = `extends CharacterBody2D

signal health_changed(new_health: int, max_health: int)
signal died

enum State { IDLE, WALK, ATTACK, HURT, DEATH }

const SPEED := 200.0
const MAX_HEALTH := 100

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var attack_timer: Timer = $AttackTimer
@onready var hurt_timer: Timer = $HurtTimer
@onready var hitbox: Area2D = $Hitbox

var state: State = State.IDLE
var direction := "down"
var health: int = MAX_HEALTH

func _ready() -> void:
\tattack_timer.timeout.connect(_on_attack_finished)
\thurt_timer.timeout.connect(_on_hurt_finished)
\thealth_changed.emit(health, MAX_HEALTH)	# Move to spawn point if available in scene
	var spawn := get_parent().find_child("SpawnPoint", true, false)
	if spawn is Marker2D:
		global_position = spawn.global_position
func _physics_process(_delta: float) -> void:
\tmatch state:
\t\tState.IDLE:
\t\t\t_process_idle()
\t\tState.WALK:
\t\t\t_process_walk()
\t\tState.ATTACK:
\t\t\tpass
\t\tState.HURT:
\t\t\tpass
\t\tState.DEATH:
\t\t\tpass

func _process_idle() -> void:
\tvar input_dir := _get_input()
\tif input_dir != Vector2.ZERO:
\t\t_set_direction(input_dir)
\t\t_change_state(State.WALK)
\t\treturn
\tif Input.is_action_just_pressed("attack"):
\t\t_change_state(State.ATTACK)
\t\treturn
\tsprite.play("idle_" + direction)

func _process_walk() -> void:
\tvar input_dir := _get_input()
\tif input_dir == Vector2.ZERO:
\t\t_change_state(State.IDLE)
\t\treturn
\tif Input.is_action_just_pressed("attack"):
\t\t_change_state(State.ATTACK)
\t\treturn
\t_set_direction(input_dir)
\tvelocity = input_dir * SPEED
\tsprite.play("walk_" + direction)
\tmove_and_slide()

func _change_state(new_state: State) -> void:
\tstate = new_state
\tmatch new_state:
\t\tState.ATTACK:
\t\t\tvelocity = Vector2.ZERO
\t\t\tvar anim := "slash_" + direction
\t\t\tif sprite.sprite_frames.has_animation(anim):
\t\t\t\tsprite.play(anim)
\t\t\thitbox.get_child(0).disabled = false
\t\t\tattack_timer.start()
\t\tState.HURT:
\t\t\tvelocity = Vector2.ZERO
\t\t\tvar anim := "hurt"
\t\t\tif sprite.sprite_frames.has_animation("hurt_down"):
\t\t\t\tanim = "hurt_down"
\t\t\tsprite.play(anim)
\t\t\thurt_timer.start()
\t\tState.DEATH:
\t\t\tvelocity = Vector2.ZERO
\t\t\tset_physics_process(false)
\t\t\tdied.emit()
\t\t_:
\t\t\tpass

func take_damage(amount: int) -> void:
\tif state == State.DEATH or state == State.HURT:
\t\treturn
\thealth = max(0, health - amount)
\thealth_changed.emit(health, MAX_HEALTH)
\tif health <= 0:
\t\t_change_state(State.DEATH)
\telse:
\t\t_change_state(State.HURT)

func _on_attack_finished() -> void:
\thitbox.get_child(0).disabled = true
\t_change_state(State.IDLE)

func _on_hurt_finished() -> void:
\t_change_state(State.IDLE)

func _get_input() -> Vector2:
\treturn Input.get_vector("move_left", "move_right", "move_up", "move_down")

func _set_direction(input_dir: Vector2) -> void:
\tif abs(input_dir.x) > abs(input_dir.y):
\t\tdirection = "right" if input_dir.x > 0 else "left"
\telse:
\t\tdirection = "down" if input_dir.y > 0 else "up"
`;
  await writeFile(join(scriptsDir, 'player.gd'), playerGd);

  // HUD script
  const hudGd = `extends Control

@onready var health_bar: ProgressBar = $HealthBar

func _ready() -> void:
\tvar player := _find_player()
\tif player:
\t\tplayer.health_changed.connect(_on_health_changed)

func _on_health_changed(new_health: int, max_health: int) -> void:
\thealth_bar.max_value = max_health
\thealth_bar.value = new_health

func _find_player() -> CharacterBody2D:
\tvar parent := get_tree().current_scene
\tif parent:
\t\tvar player := parent.find_child("Player", true, false)
\t\tif player is CharacterBody2D:
\t\t\treturn player as CharacterBody2D
\treturn null
`;
  await writeFile(join(scriptsDir, 'hud.gd'), hudGd);

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
