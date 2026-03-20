import type { GameSystem } from './types.js';

export function generateQuest(): GameSystem {
  const questManagerGd = `extends Node
## Quest manager autoload. Tracks active quests, objectives, and completion.

signal quest_started(quest_id: String)
signal quest_completed(quest_id: String)
signal objective_updated(quest_id: String, objective_id: String, current: int, target: int)

var active_quests: Dictionary = {}  # quest_id → quest data
var completed_quests: Array = []
var _quest_database: Dictionary = {}

func _ready() -> void:
\t_load_quest_database()

func _load_quest_database() -> void:
\t_quest_database = {
\t\t"tutorial_01": {
\t\t\t"name": "First Steps",
\t\t\t"description": "Talk to the village elder to learn about the world.",
\t\t\t"objectives": [
\t\t\t\t{"id": "talk_elder", "description": "Talk to the Elder", "type": "interact", "target": 1},
\t\t\t],
\t\t\t"rewards": {"xp": 50, "items": [{"id": "health_potion", "amount": 2}]},
\t\t},
\t\t"kill_slimes": {
\t\t\t"name": "Slime Trouble",
\t\t\t"description": "Clear the slimes threatening the village.",
\t\t\t"objectives": [
\t\t\t\t{"id": "kill_slime", "description": "Defeat Slimes", "type": "kill", "target": 5},
\t\t\t\t{"id": "return_elder", "description": "Return to the Elder", "type": "interact", "target": 1},
\t\t\t],
\t\t\t"rewards": {"xp": 150, "items": [{"id": "coin", "amount": 25}, {"id": "iron_sword", "amount": 1}]},
\t\t},
\t\t"fetch_herbs": {
\t\t\t"name": "Healing Herbs",
\t\t\t"description": "Gather herbs for the village healer.",
\t\t\t"objectives": [
\t\t\t\t{"id": "gather_herb", "description": "Collect Herbs", "type": "collect", "target": 3},
\t\t\t],
\t\t\t"rewards": {"xp": 100, "items": [{"id": "health_potion", "amount": 5}]},
\t\t},
\t}

func start_quest(quest_id: String) -> bool:
\tif active_quests.has(quest_id) or quest_id in completed_quests:
\t\treturn false
\tif not _quest_database.has(quest_id):
\t\treturn false
\tvar quest: Dictionary = _quest_database[quest_id].duplicate(true)
\tvar objectives := {}
\tfor obj in quest["objectives"]:
\t\tobjectives[obj["id"]] = 0
\tquest["progress"] = objectives
\tactive_quests[quest_id] = quest
\tquest_started.emit(quest_id)
\treturn true

func update_objective(quest_id: String, objective_id: String, amount: int = 1) -> void:
\tif not active_quests.has(quest_id):
\t\treturn
\tvar quest: Dictionary = active_quests[quest_id]
\tif not quest["progress"].has(objective_id):
\t\treturn
\tvar target := 0
\tfor obj in quest["objectives"]:
\t\tif obj["id"] == objective_id:
\t\t\ttarget = obj["target"]
\t\t\tbreak
\tvar current: int = quest["progress"][objective_id]
\tquest["progress"][objective_id] = mini(current + amount, target)
\tobjective_updated.emit(quest_id, objective_id, quest["progress"][objective_id], target)
\t_check_completion(quest_id)

func _check_completion(quest_id: String) -> void:
\tvar quest: Dictionary = active_quests[quest_id]
\tfor obj in quest["objectives"]:
\t\tvar current: int = quest["progress"].get(obj["id"], 0)
\t\tif current < obj["target"]:
\t\t\treturn
\tcompleted_quests.append(quest_id)
\t_grant_rewards(quest)
\tactive_quests.erase(quest_id)
\tquest_completed.emit(quest_id)

func _grant_rewards(quest: Dictionary) -> void:
\tvar rewards: Dictionary = quest.get("rewards", {})
\tvar inv := get_node_or_null("/root/Inventory")
\tif inv and rewards.has("items"):
\t\tfor item in rewards["items"]:
\t\t\tinv.add_item(item["id"], item.get("amount", 1))
\tif rewards.has("xp"):
\t\tvar player_node = get_node_or_null("/root/Main/Player")
\t\tif player_node and player_node.has_method("add_xp"):
\t\t\tplayer_node.add_xp(rewards["xp"])

func is_quest_active(quest_id: String) -> bool:
\treturn active_quests.has(quest_id)

func is_quest_complete(quest_id: String) -> bool:
\treturn quest_id in completed_quests

func get_quest_info(quest_id: String) -> Dictionary:
\tif active_quests.has(quest_id):
\t\treturn active_quests[quest_id]
\tif _quest_database.has(quest_id):
\t\treturn _quest_database[quest_id]
\treturn {}

func save_data() -> Dictionary:
\treturn {
\t\t"active": active_quests.duplicate(true),
\t\t"completed": completed_quests.duplicate(),
\t}

func load_data(data: Dictionary) -> void:
\tactive_quests = data.get("active", {})
\tcompleted_quests = data.get("completed", [])
`;

  const questUIGd = `extends Control
## Quest tracker UI. Shows active quests and objectives.

@onready var quest_list: VBoxContainer = $Panel/MarginContainer/VBoxContainer

func _ready() -> void:
\tQuestManager.quest_started.connect(func(_id: String) -> void: _refresh())
\tQuestManager.quest_completed.connect(func(_id: String) -> void: _refresh())
\tQuestManager.objective_updated.connect(func(_a: String, _b: String, _c: int, _d: int) -> void: _refresh())
\t_refresh()

func _refresh() -> void:
\tfor child in quest_list.get_children():
\t\tchild.queue_free()

\tif QuestManager.active_quests.is_empty():
\t\tvar empty := Label.new()
\t\tempty.text = "No active quests"
\t\tempty.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
\t\tquest_list.add_child(empty)
\t\treturn

\tfor quest_id in QuestManager.active_quests:
\t\tvar quest: Dictionary = QuestManager.active_quests[quest_id]
\t\tvar title := Label.new()
\t\ttitle.text = "◆ " + quest.get("name", quest_id)
\t\ttitle.add_theme_font_size_override("font_size", 16)
\t\tquest_list.add_child(title)

\t\tfor obj in quest["objectives"]:
\t\t\tvar current: int = quest["progress"].get(obj["id"], 0)
\t\t\tvar target: int = obj["target"]
\t\t\tvar complete := current >= target
\t\t\tvar obj_label := Label.new()
\t\t\tvar check := "✓" if complete else "○"
\t\t\tobj_label.text = "  %s %s (%d/%d)" % [check, obj["description"], current, target]
\t\t\tif complete:
\t\t\t\tobj_label.add_theme_color_override("font_color", Color(0.4, 0.8, 0.4))
\t\t\tquest_list.add_child(obj_label)

func _input(event: InputEvent) -> void:
\tif event.is_action_pressed("quest_log"):
\t\tvisible = !visible
`;

  const questUITscn = `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/quest_ui.gd" id="1"]

[node name="QuestUI" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
script = ExtResource("1")

[node name="Panel" type="PanelContainer" parent="."]
layout_mode = 1
anchors_preset = 1
anchor_left = 1.0
anchor_right = 1.0
offset_left = -240.0
offset_top = 16.0
offset_right = -16.0
offset_bottom = 300.0

[node name="MarginContainer" type="MarginContainer" parent="Panel"]
layout_mode = 2
theme_override_constants/margin_left = 8
theme_override_constants/margin_top = 8
theme_override_constants/margin_right = 8
theme_override_constants/margin_bottom = 8

[node name="VBoxContainer" type="VBoxContainer" parent="Panel/MarginContainer"]
layout_mode = 2

[node name="Title" type="Label" parent="Panel/MarginContainer/VBoxContainer"]
layout_mode = 2
text = "Quest Log"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 18
`;

  return {
    name: 'quest',
    description: 'Quest system with objectives, progress tracking, rewards, and quest log UI',
    files: [
      { path: 'scripts/quest_manager.gd', content: questManagerGd },
      { path: 'scripts/quest_ui.gd', content: questUIGd },
      { path: 'scenes/quest_ui.tscn', content: questUITscn },
    ],
    dependencies: ['inventory'],
    autoloads: [{ name: 'QuestManager', path: 'res://scripts/quest_manager.gd' }],
    inputActions: ['quest_log'],
  };
}
