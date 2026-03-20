import type { GameSystem } from './types.js';

export function generateSaveLoad(): GameSystem {
  const saveManagerGd = `extends Node
## Save/Load manager autoload. Handles 3 save slots + auto-save.
## Usage: SaveManager.save_game(slot), SaveManager.load_game(slot)

signal game_saved(slot: int)
signal game_loaded(slot: int)

const SAVE_DIR := "user://saves/"
const AUTO_SAVE_INTERVAL := 300.0  # 5 minutes
const MAX_SLOTS := 3

var current_slot := -1
var _auto_save_timer: Timer

func _ready() -> void:
\tDirAccess.make_dir_recursive_absolute(SAVE_DIR)
\t_auto_save_timer = Timer.new()
\t_auto_save_timer.wait_time = AUTO_SAVE_INTERVAL
\t_auto_save_timer.timeout.connect(_on_auto_save)
\tadd_child(_auto_save_timer)

func start_auto_save() -> void:
\t_auto_save_timer.start()

func stop_auto_save() -> void:
\t_auto_save_timer.stop()

func save_game(slot: int) -> bool:
\tif slot < 0 or slot >= MAX_SLOTS:
\t\treturn false
\tvar save_data := _gather_save_data()
\tsave_data["slot"] = slot
\tsave_data["timestamp"] = Time.get_datetime_string_from_system()

\tvar path := SAVE_DIR + "save_%d.json" % slot
\tvar file := FileAccess.open(path, FileAccess.WRITE)
\tif not file:
\t\treturn false

\tvar json := JSON.stringify(save_data, "  ")
\tfile.store_string(json)
\tfile.close()
\tcurrent_slot = slot
\tgame_saved.emit(slot)
\treturn true

func load_game(slot: int) -> bool:
\tif slot < 0 or slot >= MAX_SLOTS:
\t\treturn false
\tvar path := SAVE_DIR + "save_%d.json" % slot
\tif not FileAccess.file_exists(path):
\t\treturn false

\tvar file := FileAccess.open(path, FileAccess.READ)
\tvar json := JSON.new()
\tif json.parse(file.get_as_text()) != OK:
\t\treturn false

\tvar save_data: Dictionary = json.data
\t_apply_save_data(save_data)
\tcurrent_slot = slot
\tgame_loaded.emit(slot)
\treturn true

func delete_save(slot: int) -> bool:
\tvar path := SAVE_DIR + "save_%d.json" % slot
\tif FileAccess.file_exists(path):
\t\tDirAccess.remove_absolute(path)
\t\treturn true
\treturn false

func has_save(slot: int) -> bool:
\tvar path := SAVE_DIR + "save_%d.json" % slot
\treturn FileAccess.file_exists(path)

func get_save_info(slot: int) -> Dictionary:
\tvar path := SAVE_DIR + "save_%d.json" % slot
\tif not FileAccess.file_exists(path):
\t\treturn {}
\tvar file := FileAccess.open(path, FileAccess.READ)
\tvar json := JSON.new()
\tif json.parse(file.get_as_text()) != OK:
\t\treturn {}
\tvar data: Dictionary = json.data
\treturn {
\t\t"slot": slot,
\t\t"timestamp": data.get("timestamp", "Unknown"),
\t\t"player_name": data.get("player_name", "Hero"),
\t\t"level": data.get("player", {}).get("level", 1),
\t\t"playtime": data.get("playtime", 0),
\t}

func get_all_save_info() -> Array:
\tvar saves := []
\tfor i in range(MAX_SLOTS):
\t\tsaves.append(get_save_info(i))
\treturn saves

func _gather_save_data() -> Dictionary:
\tvar data := {}
\tdata["player_name"] = "Hero"

\tvar player := _find_player()
\tif player:
\t\tdata["player"] = {
\t\t\t"position_x": player.global_position.x,
\t\t\t"position_y": player.global_position.y,
\t\t\t"health": player.health if "health" in player else 100,
\t\t\t"level": player.get("level") if player.get("level") != null else 1,
\t\t}
\t\tdata["scene"] = player.get_tree().current_scene.scene_file_path

\tif Engine.has_singleton("Inventory") or get_node_or_null("/root/Inventory"):
\t\tvar inv := get_node_or_null("/root/Inventory")
\t\tif inv and inv.has_method("save_data"):
\t\t\tdata["inventory"] = inv.save_data()

\treturn data

func _apply_save_data(data: Dictionary) -> void:
\tvar scene_path: String = data.get("scene", "")
\tif scene_path != "":
\t\tget_tree().change_scene_to_file(scene_path)
\t\tawait get_tree().create_timer(0.1).timeout
\t\tawait get_tree().process_frame

\tvar player := _find_player()
\tif player and data.has("player"):
\t\tvar p: Dictionary = data["player"]
\t\tplayer.global_position = Vector2(p.get("position_x", 0), p.get("position_y", 0))
\t\tif "health" in player:
\t\t\tplayer.health = p.get("health", 100)

\tif data.has("inventory"):
\t\tvar inv := get_node_or_null("/root/Inventory")
\t\tif inv and inv.has_method("load_data"):
\t\t\tinv.load_data(data["inventory"])

func _find_player() -> CharacterBody2D:
\tvar scene := get_tree().current_scene
\tif scene:
\t\tvar player := scene.find_child("Player", true, false)
\t\tif player is CharacterBody2D:
\t\t\treturn player as CharacterBody2D
\treturn null

func _on_auto_save() -> void:
\tif current_slot >= 0:
\t\tsave_game(current_slot)
`;

  return {
    name: 'save_load',
    description: 'Save/Load system with 3 slots, auto-save, JSON persistence',
    files: [
      { path: 'scripts/save_manager.gd', content: saveManagerGd },
    ],
    dependencies: [],
    autoloads: [{ name: 'SaveManager', path: 'res://scripts/save_manager.gd' }],
    inputActions: [],
  };
}
