import type { GameSystem } from './types.js';

export function generateLoot(): GameSystem {
  const lootManagerGd = `extends Node
## Loot drop manager. Call drop_loot(position, table_name) to spawn pickups.

signal item_picked_up(item_id: String, amount: int)

var loot_tables: Dictionary = {}

func _ready() -> void:
\t_init_default_tables()

func _init_default_tables() -> void:
\tloot_tables = {
\t\t"common_enemy": [
\t\t\t{"item": "coin", "amount": [1, 5], "weight": 60},
\t\t\t{"item": "health_potion", "amount": [1, 1], "weight": 20},
\t\t\t{"item": "bread", "amount": [1, 2], "weight": 15},
\t\t\t{"item": "", "amount": [0, 0], "weight": 5},  # nothing
\t\t],
\t\t"boss": [
\t\t\t{"item": "coin", "amount": [10, 25], "weight": 40},
\t\t\t{"item": "ruby", "amount": [1, 1], "weight": 20},
\t\t\t{"item": "iron_sword", "amount": [1, 1], "weight": 15},
\t\t\t{"item": "health_potion", "amount": [2, 3], "weight": 15},
\t\t\t{"item": "spell_scroll", "amount": [1, 1], "weight": 10},
\t\t],
\t\t"chest": [
\t\t\t{"item": "coin", "amount": [5, 15], "weight": 30},
\t\t\t{"item": "health_potion", "amount": [1, 2], "weight": 25},
\t\t\t{"item": "gold_key", "amount": [1, 1], "weight": 10},
\t\t\t{"item": "ruby", "amount": [1, 1], "weight": 10},
\t\t\t{"item": "emerald", "amount": [1, 1], "weight": 10},
\t\t\t{"item": "mana_potion", "amount": [1, 2], "weight": 15},
\t\t],
\t}

func roll_loot(table_name: String) -> Array:
\tif not loot_tables.has(table_name):
\t\treturn []
\tvar table: Array = loot_tables[table_name]
\tvar total_weight := 0
\tfor entry in table:
\t\ttotal_weight += entry.get("weight", 0)

\tvar roll := randi() % total_weight
\tvar cumulative := 0
\tfor entry in table:
\t\tcumulative += entry.get("weight", 0)
\t\tif roll < cumulative:
\t\t\tvar item_id: String = entry.get("item", "")
\t\t\tif item_id == "":
\t\t\t\treturn []
\t\t\tvar amt_range: Array = entry.get("amount", [1, 1])
\t\t\tvar amount := randi_range(amt_range[0], amt_range[1])
\t\t\treturn [{"item": item_id, "amount": amount}]
\treturn []

func drop_loot(pos: Vector2, table_name: String) -> void:
\tvar drops := roll_loot(table_name)
\tfor drop in drops:
\t\t_spawn_pickup(pos, drop["item"], drop["amount"])

func _spawn_pickup(pos: Vector2, item_id: String, amount: int) -> void:
\tvar pickup := Area2D.new()
\tpickup.name = "Pickup_" + item_id
\tpickup.global_position = pos + Vector2(randf_range(-16, 16), randf_range(-16, 16))

\tvar collision := CollisionShape2D.new()
\tvar shape := CircleShape2D.new()
\tshape.radius = 12.0
\tcollision.shape = shape
\tpickup.add_child(collision)

\tvar sprite := Sprite2D.new()
\tsprite.modulate = Color(1, 1, 0.5)
\tpickup.add_child(sprite)

\tvar meta := {"item_id": item_id, "amount": amount}
\tpickup.set_meta("loot", meta)

\tpickup.body_entered.connect(func(body: Node2D) -> void:
\t\tif body.is_in_group("player"):
\t\t\tvar inv := get_node_or_null("/root/Inventory")
\t\t\tif inv and inv.has_method("add_item"):
\t\t\t\tif inv.add_item(item_id, amount):
\t\t\t\t\titem_picked_up.emit(item_id, amount)
\t\t\t\t\tpickup.queue_free()
\t)

\t# Float animation
\tvar tween := pickup.create_tween()
\ttween.set_loops()
\ttween.tween_property(pickup, "position:y", pos.y - 4, 0.5).set_trans(Tween.TRANS_SINE)
\ttween.tween_property(pickup, "position:y", pos.y + 4, 0.5).set_trans(Tween.TRANS_SINE)

\tvar scene = get_tree().current_scene
\tif scene:
\t\tscene.add_child(pickup)
`;

  return {
    name: 'loot',
    description: 'Loot drop system with weighted tables, pickup spawning, and inventory integration',
    files: [
      { path: 'scripts/loot_manager.gd', content: lootManagerGd },
    ],
    dependencies: ['inventory'],
    autoloads: [{ name: 'LootManager', path: 'res://scripts/loot_manager.gd' }],
    inputActions: [],
  };
}
