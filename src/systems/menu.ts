import type { GameSystem } from './types.js';

export function generateMenuSystem(): GameSystem {
  const mainMenuGd = `extends Control
## Main menu screen. Set as main scene or load via SceneTransition.

@onready var new_game_btn: Button = $VBoxContainer/NewGameButton
@onready var load_game_btn: Button = $VBoxContainer/LoadGameButton
@onready var settings_btn: Button = $VBoxContainer/SettingsButton
@onready var quit_btn: Button = $VBoxContainer/QuitButton
@onready var title_label: Label = $TitleLabel
@onready var save_slots: VBoxContainer = $SaveSlotsPanel/VBoxContainer

var _showing_saves := false

func _ready() -> void:
\tnew_game_btn.pressed.connect(_on_new_game)
\tload_game_btn.pressed.connect(_on_load_game)
\tsettings_btn.pressed.connect(_on_settings)
\tquit_btn.pressed.connect(_on_quit)
\t$SaveSlotsPanel.visible = false

func _on_new_game() -> void:
\tget_tree().change_scene_to_file("res://main.tscn")

func _on_load_game() -> void:
\t_showing_saves = !_showing_saves
\t$SaveSlotsPanel.visible = _showing_saves
\tif _showing_saves:
\t\t_refresh_save_slots()

func _on_settings() -> void:
\tvar settings_scene := load("res://scenes/settings_menu.tscn")
\tif settings_scene:
\t\tvar settings := settings_scene.instantiate()
\t\tadd_child(settings)

func _on_quit() -> void:
\tget_tree().quit()

func _refresh_save_slots() -> void:
\tfor child in save_slots.get_children():
\t\tchild.queue_free()
\tvar save_mgr := get_node_or_null("/root/SaveManager")
\tif not save_mgr:
\t\treturn
\t# Use save_mgr consistently instead of SaveManager global
\tfor i in range(save_mgr.MAX_SLOTS):
\t\tvar info := save_mgr.get_save_info(i)
\t\tvar btn := Button.new()
\t\tif info.is_empty():
\t\t\tbtn.text = "Slot %d — Empty" % (i + 1)
\t\t\tbtn.disabled = true
\t\telse:
\t\t\tbtn.text = "Slot %d — Lv.%d — %s" % [i + 1, info.get("level", 1), info.get("timestamp", "")]
\t\tbtn.pressed.connect(save_mgr.load_game.bind(i))
\t\tsave_slots.add_child(btn)
`;

  const mainMenuTscn = `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/main_menu.gd" id="1"]

[node name="MainMenu" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
script = ExtResource("1")

[node name="ColorRect" type="ColorRect" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
color = Color(0.1, 0.1, 0.15, 1)

[node name="TitleLabel" type="Label" parent="."]
layout_mode = 1
anchors_preset = 5
anchor_left = 0.5
anchor_right = 0.5
offset_left = -200.0
offset_top = 80.0
offset_right = 200.0
offset_bottom = 140.0
text = "My RPG"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 48

[node name="VBoxContainer" type="VBoxContainer" parent="."]
layout_mode = 1
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -100.0
offset_top = -60.0
offset_right = 100.0
offset_bottom = 60.0

[node name="NewGameButton" type="Button" parent="VBoxContainer"]
layout_mode = 2
text = "New Game"

[node name="LoadGameButton" type="Button" parent="VBoxContainer"]
layout_mode = 2
text = "Load Game"

[node name="SettingsButton" type="Button" parent="VBoxContainer"]
layout_mode = 2
text = "Settings"

[node name="QuitButton" type="Button" parent="VBoxContainer"]
layout_mode = 2
text = "Quit"

[node name="SaveSlotsPanel" type="PanelContainer" parent="."]
layout_mode = 1
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -120.0
offset_top = 80.0
offset_right = 120.0
offset_bottom = 200.0
visible = false

[node name="VBoxContainer" type="VBoxContainer" parent="SaveSlotsPanel"]
layout_mode = 2
`;

  const pauseMenuGd = `extends Control
## Pause menu. Toggle with "pause" input action.

@onready var resume_btn: Button = $Panel/VBoxContainer/ResumeButton
@onready var save_btn: Button = $Panel/VBoxContainer/SaveButton
@onready var settings_btn: Button = $Panel/VBoxContainer/SettingsButton
@onready var main_menu_btn: Button = $Panel/VBoxContainer/MainMenuButton

func _ready() -> void:
\tvisible = false
\tresume_btn.pressed.connect(_on_resume)
\tsave_btn.pressed.connect(_on_save)
\tsettings_btn.pressed.connect(_on_settings)
\tmain_menu_btn.pressed.connect(_on_main_menu)

func _input(event: InputEvent) -> void:
\tif event.is_action_pressed("pause"):
\t\ttoggle_pause()

func toggle_pause() -> void:
\tvisible = !visible
\tget_tree().paused = visible

func _on_resume() -> void:
\ttoggle_pause()

func _on_save() -> void:
\tif not has_node("/root/SaveManager"):
\t\treturn
\tvar slot := SaveManager.current_slot
\tif slot < 0:
\t\tslot = 0
\tSaveManager.save_game(slot)

func _on_settings() -> void:
\tvar settings_scene := load("res://scenes/settings_menu.tscn")
\tif settings_scene:
\t\tvar settings := settings_scene.instantiate()
\t\tadd_child(settings)

func _on_main_menu() -> void:
\tget_tree().paused = false
\tget_tree().change_scene_to_file("res://scenes/main_menu.tscn")
`;

  const pauseMenuTscn = `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/pause_menu.gd" id="1"]

[node name="PauseMenu" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
process_mode = 3
visible = false
script = ExtResource("1")

[node name="ColorRect" type="ColorRect" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
color = Color(0, 0, 0, 0.5)

[node name="Panel" type="PanelContainer" parent="."]
layout_mode = 1
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -100.0
offset_top = -80.0
offset_right = 100.0
offset_bottom = 80.0

[node name="VBoxContainer" type="VBoxContainer" parent="Panel"]
layout_mode = 2

[node name="PauseLabel" type="Label" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "PAUSED"
horizontal_alignment = 1

[node name="ResumeButton" type="Button" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "Resume"

[node name="SaveButton" type="Button" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "Save Game"

[node name="SettingsButton" type="Button" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "Settings"

[node name="MainMenuButton" type="Button" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "Main Menu"
`;

  const settingsMenuGd = `extends Control
## Settings menu with volume controls and fullscreen toggle.

@onready var master_slider: HSlider = $Panel/VBoxContainer/MasterVolume/Slider
@onready var music_slider: HSlider = $Panel/VBoxContainer/MusicVolume/Slider
@onready var sfx_slider: HSlider = $Panel/VBoxContainer/SFXVolume/Slider
@onready var fullscreen_check: CheckButton = $Panel/VBoxContainer/FullscreenCheck
@onready var back_btn: Button = $Panel/VBoxContainer/BackButton

func _ready() -> void:
\tmaster_slider.value = db_to_linear(AudioServer.get_bus_volume_db(0))
\tvar music_idx := AudioServer.get_bus_index("Music")
\tif music_idx >= 0:
\t\tmusic_slider.value = db_to_linear(AudioServer.get_bus_volume_db(music_idx))
\tvar sfx_idx := AudioServer.get_bus_index("SFX")
\tif sfx_idx >= 0:
\t\tsfx_slider.value = db_to_linear(AudioServer.get_bus_volume_db(sfx_idx))
\tfullscreen_check.button_pressed = DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN

\tmaster_slider.value_changed.connect(_on_master_changed)
\tmusic_slider.value_changed.connect(_on_music_changed)
\tsfx_slider.value_changed.connect(_on_sfx_changed)
\tfullscreen_check.toggled.connect(_on_fullscreen_toggled)
\tback_btn.pressed.connect(_on_back)

func _on_master_changed(value: float) -> void:
\tAudioServer.set_bus_volume_db(0, linear_to_db(value))

func _on_music_changed(value: float) -> void:
\tvar idx := AudioServer.get_bus_index("Music")
\tif idx >= 0:
\t\tAudioServer.set_bus_volume_db(idx, linear_to_db(value))

func _on_sfx_changed(value: float) -> void:
\tvar idx := AudioServer.get_bus_index("SFX")
\tif idx >= 0:
\t\tAudioServer.set_bus_volume_db(idx, linear_to_db(value))

func _on_fullscreen_toggled(pressed: bool) -> void:
\tif pressed:
\t\tDisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
\telse:
\t\tDisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)

func _on_back() -> void:
\tqueue_free()
`;

  const settingsMenuTscn = `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/settings_menu.gd" id="1"]

[node name="SettingsMenu" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
script = ExtResource("1")

[node name="ColorRect" type="ColorRect" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
color = Color(0, 0, 0, 0.7)

[node name="Panel" type="PanelContainer" parent="."]
layout_mode = 1
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -160.0
offset_top = -120.0
offset_right = 160.0
offset_bottom = 120.0

[node name="VBoxContainer" type="VBoxContainer" parent="Panel"]
layout_mode = 2

[node name="Title" type="Label" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "Settings"
horizontal_alignment = 1

[node name="MasterVolume" type="HBoxContainer" parent="Panel/VBoxContainer"]
layout_mode = 2

[node name="Label" type="Label" parent="Panel/VBoxContainer/MasterVolume"]
layout_mode = 2
text = "Master"
custom_minimum_size = Vector2(80, 0)

[node name="Slider" type="HSlider" parent="Panel/VBoxContainer/MasterVolume"]
layout_mode = 2
size_flags_horizontal = 3
min_value = 0.0
max_value = 1.0
step = 0.05
value = 1.0

[node name="MusicVolume" type="HBoxContainer" parent="Panel/VBoxContainer"]
layout_mode = 2

[node name="Label" type="Label" parent="Panel/VBoxContainer/MusicVolume"]
layout_mode = 2
text = "Music"
custom_minimum_size = Vector2(80, 0)

[node name="Slider" type="HSlider" parent="Panel/VBoxContainer/MusicVolume"]
layout_mode = 2
size_flags_horizontal = 3
min_value = 0.0
max_value = 1.0
step = 0.05
value = 0.8

[node name="SFXVolume" type="HBoxContainer" parent="Panel/VBoxContainer"]
layout_mode = 2

[node name="Label" type="Label" parent="Panel/VBoxContainer/SFXVolume"]
layout_mode = 2
text = "SFX"
custom_minimum_size = Vector2(80, 0)

[node name="Slider" type="HSlider" parent="Panel/VBoxContainer/SFXVolume"]
layout_mode = 2
size_flags_horizontal = 3
min_value = 0.0
max_value = 1.0
step = 0.05
value = 0.8

[node name="FullscreenCheck" type="CheckButton" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "Fullscreen"

[node name="BackButton" type="Button" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "Back"
`;

  const gameOverGd = `extends Control
## Game over screen. Show when player dies.

@onready var retry_btn: Button = $Panel/VBoxContainer/RetryButton
@onready var main_menu_btn: Button = $Panel/VBoxContainer/MainMenuButton

func _ready() -> void:
\tretry_btn.pressed.connect(_on_retry)
\tmain_menu_btn.pressed.connect(_on_main_menu)

func _on_retry() -> void:
\tget_tree().reload_current_scene()

func _on_main_menu() -> void:
\tget_tree().change_scene_to_file("res://scenes/main_menu.tscn")
`;

  const gameOverTscn = `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/game_over.gd" id="1"]

[node name="GameOver" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
visible = false
script = ExtResource("1")

[node name="ColorRect" type="ColorRect" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
color = Color(0.1, 0, 0, 0.8)

[node name="Panel" type="PanelContainer" parent="."]
layout_mode = 1
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -100.0
offset_top = -60.0
offset_right = 100.0
offset_bottom = 60.0

[node name="VBoxContainer" type="VBoxContainer" parent="Panel"]
layout_mode = 2

[node name="Label" type="Label" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "GAME OVER"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 32
theme_override_colors/font_color = Color(0.8, 0.2, 0.2, 1)

[node name="RetryButton" type="Button" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "Retry"

[node name="MainMenuButton" type="Button" parent="Panel/VBoxContainer"]
layout_mode = 2
text = "Main Menu"
`;

  return {
    name: 'menu',
    description: 'Main menu, pause menu, settings (volume + fullscreen), and game over screens',
    files: [
      { path: 'scripts/main_menu.gd', content: mainMenuGd },
      { path: 'scenes/main_menu.tscn', content: mainMenuTscn },
      { path: 'scripts/pause_menu.gd', content: pauseMenuGd },
      { path: 'scenes/pause_menu.tscn', content: pauseMenuTscn },
      { path: 'scripts/settings_menu.gd', content: settingsMenuGd },
      { path: 'scenes/settings_menu.tscn', content: settingsMenuTscn },
      { path: 'scripts/game_over.gd', content: gameOverGd },
      { path: 'scenes/game_over.tscn', content: gameOverTscn },
    ],
    dependencies: ['save_load'],
    autoloads: [],
    inputActions: ['pause'],
  };
}
