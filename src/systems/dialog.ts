import type { GameSystem } from './types.js';

export function generateDialog(): GameSystem {
  const dialogManagerGd = `extends Node
## Dialog manager autoload. Drives the dialog UI.
## Usage: DialogManager.start_dialog("npc_name", dialog_data)

signal dialog_started
signal dialog_ended
signal choice_made(choice_index: int)

var is_active := false
var current_dialog: Array = []
var current_index := 0
var current_speaker := ""

var _dialog_ui: Control = null

func register_ui(ui: Control) -> void:
\t_dialog_ui = ui

func start_dialog(speaker: String, dialog: Array) -> void:
\tif is_active:
\t\treturn
\tcurrent_speaker = speaker
\tcurrent_dialog = dialog
\tcurrent_index = 0
\tis_active = true
\tdialog_started.emit()
\t_show_current()

func advance() -> void:
\tif not is_active:
\t\treturn
\tvar entry: Dictionary = current_dialog[current_index]
\tif entry.has("choices"):
\t\treturn
\tcurrent_index += 1
\tif current_index >= current_dialog.size():
\t\tend_dialog()
\telse:
\t\t_show_current()

func select_choice(index: int) -> void:
\tif not is_active:
\t\treturn
\tvar entry: Dictionary = current_dialog[current_index]
\tif not entry.has("choices"):
\t\treturn
\tvar choices: Array = entry["choices"]
\tif index < 0 or index >= choices.size():
\t\treturn
\tchoice_made.emit(index)
\tvar choice: Dictionary = choices[index]
\tif choice.has("next"):
\t\tcurrent_index = choice["next"]
\t\t_show_current()
\telse:
\t\tcurrent_index += 1
\t\tif current_index >= current_dialog.size():
\t\t\tend_dialog()
\t\telse:
\t\t\t_show_current()

func end_dialog() -> void:
\tis_active = false
\tcurrent_dialog = []
\tcurrent_index = 0
\tdialog_ended.emit()
\tif _dialog_ui:
\t\t_dialog_ui.visible = false

func _show_current() -> void:
\tif _dialog_ui and _dialog_ui.has_method("show_entry"):
\t\t_dialog_ui.show_entry(current_dialog[current_index], current_speaker)
`;

  const dialogUIGd = `extends Control
## Dialog box UI. Add as child of a CanvasLayer.
## Auto-registers with DialogManager autoload.

@onready var speaker_label: Label = $Panel/MarginContainer/VBoxContainer/SpeakerLabel
@onready var text_label: RichTextLabel = $Panel/MarginContainer/VBoxContainer/TextLabel
@onready var choices_container: VBoxContainer = $Panel/MarginContainer/VBoxContainer/ChoicesContainer
@onready var continue_indicator: Label = $Panel/MarginContainer/VBoxContainer/ContinueLabel

var _char_timer: Timer
var _full_text := ""
var _current_char := 0
var _typing := false
const CHAR_DELAY := 0.03

func _ready() -> void:
\tvisible = false
\tDialogManager.register_ui(self)
\tDialogManager.dialog_started.connect(_on_dialog_started)
\tDialogManager.dialog_ended.connect(_on_dialog_ended)
\t_char_timer = Timer.new()
\t_char_timer.wait_time = CHAR_DELAY
\t_char_timer.timeout.connect(_on_char_timer)
\tadd_child(_char_timer)

func _on_dialog_started() -> void:
\tvisible = true

func _on_dialog_ended() -> void:
\tvisible = false

func show_entry(entry: Dictionary, speaker: String) -> void:
\tvisible = true
\tspeaker_label.text = entry.get("speaker", speaker)
\tchoices_container.visible = false
\tcontinue_indicator.visible = false

\tfor child in choices_container.get_children():
\t\tchild.queue_free()

\t_full_text = entry.get("text", "")
\t_current_char = 0
\ttext_label.text = ""
\t_typing = true
\t_char_timer.start()

\tif entry.has("choices"):
\t\tvar choices: Array = entry["choices"]
\t\tfor i in range(choices.size()):
\t\t\tvar btn := Button.new()
\t\t\tbtn.text = choices[i].get("text", "...")
\t\t\tbtn.pressed.connect(DialogManager.select_choice.bind(i))
\t\t\tchoices_container.add_child(btn)

func _on_char_timer() -> void:
\tif _current_char < _full_text.length():
\t\t_current_char += 1
\t\ttext_label.text = _full_text.substr(0, _current_char)
\telse:
\t\t_char_timer.stop()
\t\t_typing = false
\t\tvar entry: Dictionary = DialogManager.current_dialog[DialogManager.current_index]
\t\tif entry.has("choices"):
\t\t\tchoices_container.visible = true
\t\telse:
\t\t\tcontinue_indicator.visible = true

func _input(event: InputEvent) -> void:
\tif not visible:
\t\treturn
\tif event.is_action_pressed("ui_accept") or event.is_action_pressed("interact"):
\t\tif _typing:
\t\t\t_char_timer.stop()
\t\t\t_typing = false
\t\t\ttext_label.text = _full_text
\t\t\tvar entry: Dictionary = DialogManager.current_dialog[DialogManager.current_index]
\t\t\tif entry.has("choices"):
\t\t\t\tchoices_container.visible = true
\t\t\telse:
\t\t\t\tcontinue_indicator.visible = true
\t\telse:
\t\t\tDialogManager.advance()
`;

  const dialogUITscn = `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/dialog_ui.gd" id="1"]

[node name="DialogUI" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
visible = false
script = ExtResource("1")

[node name="Panel" type="PanelContainer" parent="."]
layout_mode = 1
anchors_preset = 12
anchor_top = 1.0
anchor_right = 1.0
anchor_bottom = 1.0
offset_left = 32.0
offset_top = -160.0
offset_right = -32.0
offset_bottom = -16.0

[node name="MarginContainer" type="MarginContainer" parent="Panel"]
layout_mode = 2
theme_override_constants/margin_left = 16
theme_override_constants/margin_top = 12
theme_override_constants/margin_right = 16
theme_override_constants/margin_bottom = 12

[node name="VBoxContainer" type="VBoxContainer" parent="Panel/MarginContainer"]
layout_mode = 2

[node name="SpeakerLabel" type="Label" parent="Panel/MarginContainer/VBoxContainer"]
layout_mode = 2
theme_override_font_sizes/font_size = 18

[node name="TextLabel" type="RichTextLabel" parent="Panel/MarginContainer/VBoxContainer"]
layout_mode = 2
custom_minimum_size = Vector2(0, 60)
fit_content = true

[node name="ChoicesContainer" type="VBoxContainer" parent="Panel/MarginContainer/VBoxContainer"]
layout_mode = 2
visible = false

[node name="ContinueLabel" type="Label" parent="Panel/MarginContainer/VBoxContainer"]
layout_mode = 2
text = "▼ Press to continue"
horizontal_alignment = 2
theme_override_font_sizes/font_size = 12
visible = false
`;

  const npcInteractGd = `extends Area2D
## Attach to an NPC's Area2D child. Set dialog_data in the inspector or via code.
## Player must be in the "player" group and press "interact" to trigger dialog.

@export var npc_name := "NPC"
@export var dialog_file := ""

var _player_in_range := false
var dialog_data: Array = []

func _ready() -> void:
\tbody_entered.connect(_on_body_entered)
\tbody_exited.connect(_on_body_exited)
\tif dialog_file != "" and FileAccess.file_exists(dialog_file):
\t\tvar file := FileAccess.open(dialog_file, FileAccess.READ)
\t\tvar json := JSON.new()
\t\tif json.parse(file.get_as_text()) == OK:
\t\t\tif not json.data is Array:
\t\t\t\tpush_error("Dialog file must contain a JSON array")
\t\t\t\treturn
\t\t\tdialog_data = json.data
\tif dialog_data.is_empty():
\t\tdialog_data = [
\t\t\t{"text": "Hello, adventurer! Welcome to our village."},
\t\t\t{"text": "Be careful out there. The dungeons are dangerous.", "choices": [
\t\t\t\t{"text": "I'll be careful.", "next": 3},
\t\t\t\t{"text": "I'm not afraid!", "next": 3},
\t\t\t]},
\t\t\t{"text": "Good luck on your journey!"},
\t\t]

func _input(event: InputEvent) -> void:
\tif _player_in_range and event.is_action_pressed("interact"):
\t\tif not DialogManager.is_active:
\t\t\tDialogManager.start_dialog(npc_name, dialog_data)

func _on_body_entered(body: Node2D) -> void:
\tif body.is_in_group("player"):
\t\t_player_in_range = true

func _on_body_exited(body: Node2D) -> void:
\tif body.is_in_group("player"):
\t\t_player_in_range = false
`;

  return {
    name: 'dialog',
    description: 'Dialog system with typing effect, speaker names, branching choices, and NPC interaction',
    files: [
      { path: 'scripts/dialog_manager.gd', content: dialogManagerGd },
      { path: 'scripts/dialog_ui.gd', content: dialogUIGd },
      { path: 'scenes/dialog_ui.tscn', content: dialogUITscn },
      { path: 'scripts/npc_interact.gd', content: npcInteractGd },
    ],
    dependencies: [],
    autoloads: [{ name: 'DialogManager', path: 'res://scripts/dialog_manager.gd' }],
    inputActions: ['interact'],
  };
}
