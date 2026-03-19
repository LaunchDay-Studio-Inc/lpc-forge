import type { GameSystem } from './types.js';

export function generateSceneTransition(): GameSystem {
  const transitionGd = `extends CanvasLayer
## Scene transition autoload. Provides fade transitions between scenes.
## Usage: SceneTransition.change_scene("res://scenes/dungeon.tscn")

signal transition_started
signal transition_midpoint
signal transition_finished

@onready var color_rect: ColorRect = $ColorRect
@onready var anim_player: AnimationPlayer = $AnimationPlayer

var _target_scene := ""
var _is_transitioning := false

func _ready() -> void:
\tcolor_rect.color = Color.BLACK
\tcolor_rect.visible = false

func change_scene(scene_path: String, duration := 0.5) -> void:
\tif _is_transitioning:
\t\treturn
\t_is_transitioning = true
\t_target_scene = scene_path
\ttransition_started.emit()

\tcolor_rect.visible = true
\tcolor_rect.modulate.a = 0.0

\tvar tween := create_tween()
\ttween.tween_property(color_rect, "modulate:a", 1.0, duration)
\ttween.tween_callback(_on_fade_out_done)

func _on_fade_out_done() -> void:
\ttransition_midpoint.emit()
\tget_tree().change_scene_to_file(_target_scene)
\tawait get_tree().tree_changed
\tawait get_tree().process_frame

\tvar tween := create_tween()
\ttween.tween_property(color_rect, "modulate:a", 0.0, 0.5)
\ttween.tween_callback(_on_fade_in_done)

func _on_fade_in_done() -> void:
\tcolor_rect.visible = false
\t_is_transitioning = false
\ttransition_finished.emit()
`;

  const transitionTscn = `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/scene_transition.gd" id="1"]

[node name="SceneTransition" type="CanvasLayer"]
layer = 100
script = ExtResource("1")

[node name="ColorRect" type="ColorRect" parent="."]
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
color = Color(0, 0, 0, 1)
visible = false

[node name="AnimationPlayer" type="AnimationPlayer" parent="."]
`;

  const doorTriggerGd = `extends Area2D
## Door/portal trigger. Place in your scene and set target_scene + spawn_point.

@export var target_scene: String = ""
@export var spawn_position := Vector2(400, 400)
@export var require_interact := false

var _player_in_range := false

func _ready() -> void:
\tbody_entered.connect(_on_body_entered)
\tbody_exited.connect(_on_body_exited)

func _on_body_entered(body: Node2D) -> void:
\tif body.is_in_group("player"):
\t\t_player_in_range = true
\t\tif not require_interact and target_scene != "":
\t\t\tSceneTransition.change_scene(target_scene)

func _on_body_exited(body: Node2D) -> void:
\tif body.is_in_group("player"):
\t\t_player_in_range = false

func _input(event: InputEvent) -> void:
\tif _player_in_range and require_interact and event.is_action_pressed("interact"):
\t\tif target_scene != "":
\t\t\tSceneTransition.change_scene(target_scene)
`;

  return {
    name: 'scene_transition',
    description: 'Scene transitions with fade effect and door/portal triggers',
    files: [
      { path: 'scripts/scene_transition.gd', content: transitionGd },
      { path: 'scenes/scene_transition.tscn', content: transitionTscn },
      { path: 'scripts/door_trigger.gd', content: doorTriggerGd },
    ],
    dependencies: [],
    autoloads: [{ name: 'SceneTransition', path: 'res://scenes/scene_transition.tscn' }],
    inputActions: ['interact'],
  };
}
