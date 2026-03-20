import type { GameSystem } from './types.js';

export function generateFullHUD(): GameSystem {
  const hudFullGd = `extends Control
## Full HUD with HP, MP, XP bars, gold counter, and minimap placeholder.

@onready var health_bar: ProgressBar = $TopLeft/VBoxContainer/HealthBar
@onready var mana_bar: ProgressBar = $TopLeft/VBoxContainer/ManaBar
@onready var xp_bar: ProgressBar = $BottomBar/XPBar
@onready var gold_label: Label = $TopRight/GoldContainer/GoldLabel
@onready var level_label: Label = $TopLeft/VBoxContainer/LevelLabel

var gold := 0

func _ready() -> void:
\tvar player := _find_player()
\tif player:
\t\t# Runtime check: GDScript has no compile-time signal verification,
\t\t# so we verify the signal exists before connecting.
\t\tif player.has_signal("health_changed"):
\t\t\tplayer.health_changed.connect(_on_health_changed)

\tvar inv := get_node_or_null("/root/Inventory")
\tif inv:
\t\tinv.item_added.connect(_on_item_changed)
\t\tinv.item_removed.connect(_on_item_changed)
\t_update_gold()

func _on_health_changed(current: int, maximum: int) -> void:
\thealth_bar.max_value = maximum
\thealth_bar.value = current

func set_mana(current: int, maximum: int) -> void:
\tmana_bar.max_value = maximum
\tmana_bar.value = current

func set_xp(current: int, required: int) -> void:
\txp_bar.max_value = required
\txp_bar.value = current

func set_level(level: int) -> void:
\tlevel_label.text = "Lv. %d" % level

func _on_item_changed(_item_id: String, _amount: int) -> void:
\t_update_gold()

func _update_gold() -> void:
\tvar inv := get_node_or_null("/root/Inventory")
\tif inv and inv.has_method("count_item"):
\t\tgold = inv.count_item("coin")
\tgold_label.text = str(gold)

func _find_player() -> CharacterBody2D:
\tvar scene := get_tree().current_scene
\tif scene:
\t\tvar player := scene.find_child("Player", true, false)
\t\tif player is CharacterBody2D:
\t\t\treturn player as CharacterBody2D
\treturn null
`;

  const hudFullTscn = `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/hud_full.gd" id="1"]

[node name="HUDFull" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
script = ExtResource("1")

[node name="TopLeft" type="Control" parent="."]
layout_mode = 1
anchors_preset = 0
offset_left = 16.0
offset_top = 16.0
offset_right = 232.0
offset_bottom = 80.0

[node name="VBoxContainer" type="VBoxContainer" parent="TopLeft"]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0

[node name="LevelLabel" type="Label" parent="TopLeft/VBoxContainer"]
layout_mode = 2
text = "Lv. 1"
theme_override_font_sizes/font_size = 14

[node name="HealthBar" type="ProgressBar" parent="TopLeft/VBoxContainer"]
layout_mode = 2
custom_minimum_size = Vector2(200, 16)
max_value = 100.0
value = 100.0
show_percentage = false

[node name="ManaBar" type="ProgressBar" parent="TopLeft/VBoxContainer"]
layout_mode = 2
custom_minimum_size = Vector2(200, 12)
max_value = 50.0
value = 50.0
show_percentage = false

[node name="TopRight" type="Control" parent="."]
layout_mode = 1
anchors_preset = 1
anchor_left = 1.0
anchor_right = 1.0
offset_left = -120.0
offset_top = 16.0
offset_right = -16.0
offset_bottom = 40.0

[node name="GoldContainer" type="HBoxContainer" parent="TopRight"]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
alignment = 2

[node name="GoldIcon" type="Label" parent="TopRight/GoldContainer"]
layout_mode = 2
text = "🪙"

[node name="GoldLabel" type="Label" parent="TopRight/GoldContainer"]
layout_mode = 2
text = "0"
theme_override_font_sizes/font_size = 16

[node name="BottomBar" type="Control" parent="."]
layout_mode = 1
anchors_preset = 12
anchor_top = 1.0
anchor_right = 1.0
anchor_bottom = 1.0
offset_left = 32.0
offset_top = -24.0
offset_right = -32.0

[node name="XPBar" type="ProgressBar" parent="BottomBar"]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
max_value = 100.0
value = 0.0
show_percentage = false
`;

  return {
    name: 'hud_full',
    description: 'Full HUD with HP, MP, XP bars, gold counter, and level display',
    files: [
      { path: 'scripts/hud_full.gd', content: hudFullGd },
      { path: 'scenes/hud_full.tscn', content: hudFullTscn },
    ],
    dependencies: ['inventory'],
    autoloads: [],
    inputActions: [],
  };
}
