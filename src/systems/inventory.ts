import type { GameSystem } from './types.js';

export function generateInventory(): GameSystem {
  const inventoryManagerGd = `extends Node
## Global inventory manager — add as autoload "Inventory".
## Manages items, stacking, equip slots, and persistence.

signal inventory_changed
signal item_added(item_id: String, amount: int)
signal item_removed(item_id: String, amount: int)
signal item_equipped(slot: String, item_id: String)
signal item_unequipped(slot: String, item_id: String)

const MAX_SLOTS := 24
const MAX_STACK := 99

var items: Array[Dictionary] = []
var equipment: Dictionary = {}  # slot_name → item_id

var _item_database: Dictionary = {}

func _ready() -> void:
\titems.resize(MAX_SLOTS)
\tfor i in range(MAX_SLOTS):
\t\titems[i] = {}
\t_load_item_database()
\tequipment = {
\t\t"weapon": "",
\t\t"shield": "",
\t\t"helmet": "",
\t\t"armor": "",
\t\t"boots": "",
\t\t"ring": "",
\t\t"amulet": "",
\t}

func _load_item_database() -> void:
\t_item_database = {
\t\t"iron_sword": {"name": "Iron Sword", "type": "weapon", "icon": 0, "damage": 10, "description": "A reliable iron sword.", "stackable": false, "value": 50},
\t\t"magic_staff": {"name": "Magic Staff", "type": "weapon", "icon": 1, "damage": 8, "description": "Channels arcane energy.", "stackable": false, "value": 80},
\t\t"health_potion": {"name": "Health Potion", "type": "consumable", "icon": 2, "heal": 30, "description": "Restores 30 HP.", "stackable": true, "value": 10},
\t\t"mana_potion": {"name": "Mana Potion", "type": "consumable", "icon": 3, "mana": 25, "description": "Restores 25 MP.", "stackable": true, "value": 15},
\t\t"bread": {"name": "Bread", "type": "consumable", "icon": 4, "heal": 10, "description": "Simple bread. Heals 10 HP.", "stackable": true, "value": 3},
\t\t"gold_key": {"name": "Gold Key", "type": "key", "icon": 5, "description": "Opens golden locks.", "stackable": false, "value": 0},
\t\t"shield": {"name": "Shield", "type": "shield", "icon": 6, "defense": 5, "description": "Wooden shield.", "stackable": false, "value": 40},
\t\t"helmet": {"name": "Iron Helmet", "type": "helmet", "icon": 7, "defense": 3, "description": "Protects your head.", "stackable": false, "value": 35},
\t\t"ruby": {"name": "Ruby", "type": "gem", "icon": 8, "description": "A precious red gem.", "stackable": true, "value": 100},
\t\t"spell_scroll": {"name": "Spell Scroll", "type": "consumable", "icon": 9, "description": "Contains a magical spell.", "stackable": true, "value": 25},
\t\t"coin": {"name": "Gold Coin", "type": "currency", "icon": 10, "description": "Shiny gold coin.", "stackable": true, "value": 1},
\t}

func get_item_data(item_id: String) -> Dictionary:
\treturn _item_database.get(item_id, {})

func add_item(item_id: String, amount: int = 1) -> bool:
\tvar data := get_item_data(item_id)
\tif data.is_empty():
\t\treturn false

\tvar stackable: bool = data.get("stackable", false)

\tif stackable:
\t\tfor i in range(MAX_SLOTS):
\t\t\tif items[i].get("id", "") == item_id:
\t\t\t\tvar current: int = items[i].get("amount", 0)
\t\t\t\tvar can_add := mini(amount, MAX_STACK - current)
\t\t\t\tif can_add > 0:
\t\t\t\t\titems[i]["amount"] = current + can_add
\t\t\t\t\tamount -= can_add
\t\t\t\t\tif amount <= 0:
\t\t\t\t\t\titem_added.emit(item_id, can_add)
\t\t\t\t\t\tinventory_changed.emit()
\t\t\t\t\t\treturn true

\tfor i in range(MAX_SLOTS):
\t\tif items[i].is_empty():
\t\t\titems[i] = {"id": item_id, "amount": amount if stackable else 1}
\t\t\titem_added.emit(item_id, amount if stackable else 1)
\t\t\tinventory_changed.emit()
\t\t\treturn true

\treturn false

func remove_item(item_id: String, amount: int = 1) -> bool:
\tfor i in range(MAX_SLOTS):
\t\tif items[i].get("id", "") == item_id:
\t\t\tvar current: int = items[i].get("amount", 0)
\t\t\tif current <= amount:
\t\t\t\titems[i] = {}
\t\t\telse:
\t\t\t\titems[i]["amount"] = current - amount
\t\t\titem_removed.emit(item_id, amount)
\t\t\tinventory_changed.emit()
\t\t\treturn true
\treturn false

func has_item(item_id: String, amount: int = 1) -> int:
\tvar total := 0
\tfor i in range(MAX_SLOTS):
\t\tif items[i].get("id", "") == item_id:
\t\t\ttotal += items[i].get("amount", 0)
\treturn total >= amount

func count_item(item_id: String) -> int:
\tvar total := 0
\tfor i in range(MAX_SLOTS):
\t\tif items[i].get("id", "") == item_id:
\t\t\ttotal += items[i].get("amount", 0)
\treturn total

func equip_item(slot: String, item_id: String) -> bool:
\tif not equipment.has(slot):
\t\treturn false
\tif not has_item(item_id):
\t\treturn false
\tvar current: String = equipment[slot]
\tif current != "":
\t\tadd_item(current)
\t\titem_unequipped.emit(slot, current)
\tremove_item(item_id)
\tequipment[slot] = item_id
\titem_equipped.emit(slot, item_id)
\tinventory_changed.emit()
\treturn true

func unequip_item(slot: String) -> bool:
\tif not equipment.has(slot):
\t\treturn false
\tvar current: String = equipment[slot]
\tif current == "":
\t\treturn false
\tif add_item(current):
\t\tequipment[slot] = ""
\t\titem_unequipped.emit(slot, current)
\t\tinventory_changed.emit()
\t\treturn true
\treturn false

func get_total_stat(stat: String) -> int:
\tvar total := 0
\tfor slot in equipment:
\t\tvar item_id: String = equipment[slot]
\t\tif item_id != "":
\t\t\tvar data := get_item_data(item_id)
\t\t\ttotal += data.get(stat, 0)
\treturn total

func use_item(item_id: String) -> bool:
\tvar data := get_item_data(item_id)
\tif data.is_empty() or not has_item(item_id):
\t\treturn false
\tvar item_type: String = data.get("type", "")
\tif item_type != "consumable":
\t\treturn false
\tremove_item(item_id)
\treturn true

func save_data() -> Dictionary:
\treturn {"items": items.duplicate(true), "equipment": equipment.duplicate(true)}

func load_data(data: Dictionary) -> void:
\titems = data.get("items", [])
\tequipment = data.get("equipment", {})
\tinventory_changed.emit()
`;

  const inventoryUIGd = `extends Control
## Inventory UI panel. Add as child of a CanvasLayer.
## Requires the Inventory autoload.

@onready var grid: GridContainer = $Panel/MarginContainer/VBoxContainer/GridContainer
@onready var tooltip_label: Label = $Panel/TooltipPanel/MarginContainer/Label
@onready var tooltip_panel: PanelContainer = $Panel/TooltipPanel

var slot_scene: PackedScene
var selected_slot := -1

func _ready() -> void:
\tInventory.inventory_changed.connect(_refresh)
\ttooltip_panel.visible = false
\t_refresh()

func _refresh() -> void:
\tfor child in grid.get_children():
\t\tchild.queue_free()

\tfor i in range(Inventory.MAX_SLOTS):
\t\tvar slot := _create_slot(i)
\t\tgrid.add_child(slot)

func _create_slot(index: int) -> Button:
\tvar btn := Button.new()
\tbtn.custom_minimum_size = Vector2(48, 48)
\tbtn.toggle_mode = true

\tvar item: Dictionary = Inventory.items[index]
\tif not item.is_empty():
\t\tvar data := Inventory.get_item_data(item["id"])
\t\tbtn.text = str(item.get("amount", 1)) if item.get("amount", 1) > 1 else ""
\t\tbtn.tooltip_text = data.get("name", item["id"])
\t\tbtn.mouse_entered.connect(_on_slot_hover.bind(index))
\t\tbtn.mouse_exited.connect(_on_slot_unhover)
\telse:
\t\tbtn.text = ""
\t\tbtn.tooltip_text = "Empty"

\tbtn.pressed.connect(_on_slot_pressed.bind(index))
\treturn btn

func _on_slot_pressed(index: int) -> void:
\tif selected_slot == -1:
\t\tif not Inventory.items[index].is_empty():
\t\t\tselected_slot = index
\telif selected_slot == index:
\t\tselected_slot = -1
\telse:
\t\tvar temp: Dictionary = Inventory.items[selected_slot].duplicate(true)
\t\tInventory.items[selected_slot] = Inventory.items[index].duplicate(true)
\t\tInventory.items[index] = temp
\t\tselected_slot = -1
\t\tInventory.inventory_changed.emit()

func _on_slot_hover(index: int) -> void:
\tvar item: Dictionary = Inventory.items[index]
\tif item.is_empty():
\t\ttooltip_panel.visible = false
\t\treturn
\tvar data := Inventory.get_item_data(item["id"])
\tvar desc := data.get("name", "???") + "\\n" + data.get("description", "")
\tif data.has("damage"):
\t\tdesc += "\\nDamage: " + str(data["damage"])
\tif data.has("defense"):
\t\tdesc += "\\nDefense: " + str(data["defense"])
\tif data.has("heal"):
\t\tdesc += "\\nHeals: " + str(data["heal"])
\tdesc += "\\nValue: " + str(data.get("value", 0)) + "g"
\ttooltip_label.text = desc
\ttooltip_panel.visible = true

func _on_slot_unhover() -> void:
\ttooltip_panel.visible = false

func _input(event: InputEvent) -> void:
\tif event.is_action_pressed("inventory"):
\t\tvisible = !visible
`;

  const inventoryUITscn = `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/inventory_ui.gd" id="1"]

[node name="InventoryUI" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
visible = false
script = ExtResource("1")

[node name="Panel" type="PanelContainer" parent="."]
layout_mode = 1
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -160.0
offset_top = -200.0
offset_right = 160.0
offset_bottom = 200.0

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
text = "Inventory"
horizontal_alignment = 1

[node name="HSeparator" type="HSeparator" parent="Panel/MarginContainer/VBoxContainer"]
layout_mode = 2

[node name="GridContainer" type="GridContainer" parent="Panel/MarginContainer/VBoxContainer"]
layout_mode = 2
columns = 6

[node name="TooltipPanel" type="PanelContainer" parent="Panel"]
layout_mode = 1
anchors_preset = 1
anchor_left = 1.0
anchor_right = 1.0
offset_left = 8.0
offset_right = 208.0
offset_bottom = 120.0
visible = false

[node name="MarginContainer" type="MarginContainer" parent="Panel/TooltipPanel"]
layout_mode = 2
theme_override_constants/margin_left = 8
theme_override_constants/margin_top = 8
theme_override_constants/margin_right = 8
theme_override_constants/margin_bottom = 8

[node name="Label" type="Label" parent="Panel/TooltipPanel/MarginContainer"]
layout_mode = 2
autowrap_mode = 2
`;

  return {
    name: 'inventory',
    description: 'Grid inventory with equip slots, stacking, tooltips, and drag-swap',
    files: [
      { path: 'scripts/inventory_manager.gd', content: inventoryManagerGd },
      { path: 'scripts/inventory_ui.gd', content: inventoryUIGd },
      { path: 'scenes/inventory_ui.tscn', content: inventoryUITscn },
    ],
    dependencies: [],
    autoloads: [{ name: 'Inventory', path: 'res://scripts/inventory_manager.gd' }],
    inputActions: ['inventory'],
  };
}
