import type { GameSystem } from './types.js';

export function generateEnemyAI(): GameSystem {
  const enemyGd = `extends CharacterBody2D
## Enemy with patrol, chase, attack, and flee states.
## Attach to a CharacterBody2D with AnimatedSprite2D, DetectionArea (Area2D),
## and AttackArea (Area2D) children.

signal died
signal health_changed(current: int, maximum: int)

enum State { IDLE, PATROL, CHASE, ATTACK, FLEE, HURT, DEAD }

@export var speed := 80.0
@export var chase_speed := 120.0
@export var max_health := 30
@export var attack_damage := 10
@export var attack_cooldown := 1.0
@export var detection_range := 128.0
@export var attack_range := 32.0
@export var flee_health_pct := 0.2
@export var patrol_wait_time := 2.0
@export var patrol_radius := 96.0

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var detection_area: Area2D = $DetectionArea
@onready var attack_area: Area2D = $AttackArea
@onready var attack_timer: Timer = $AttackTimer
@onready var patrol_timer: Timer = $PatrolTimer

var state: State = State.IDLE
var health: int
var target: CharacterBody2D = null
var patrol_origin: Vector2
var patrol_target: Vector2
var direction := "down"
var can_attack := true

func _ready() -> void:
\thealth = max_health
\tpatrol_origin = global_position
\tpatrol_target = _random_patrol_point()

\tattack_timer.wait_time = attack_cooldown
\tattack_timer.one_shot = true
\tattack_timer.timeout.connect(_on_attack_cooldown)

\tpatrol_timer.wait_time = patrol_wait_time
\tpatrol_timer.one_shot = true
\tpatrol_timer.timeout.connect(_on_patrol_wait_done)

\tdetection_area.body_entered.connect(_on_body_entered_detection)
\tdetection_area.body_exited.connect(_on_body_exited_detection)

func _physics_process(delta: float) -> void:
\tmatch state:
\t\tState.IDLE:
\t\t\t_process_idle()
\t\tState.PATROL:
\t\t\t_process_patrol()
\t\tState.CHASE:
\t\t\t_process_chase()
\t\tState.ATTACK:
\t\t\tpass
\t\tState.FLEE:
\t\t\t_process_flee()
\t\tState.HURT, State.DEAD:
\t\t\tpass

func _process_idle() -> void:
\t_play_anim("idle")
\tif target and is_instance_valid(target):
\t\t_change_state(State.CHASE)
\telse:
\t\tif patrol_timer.is_stopped():
\t\t\tpatrol_timer.start()

func _process_patrol() -> void:
\tvar dir := (patrol_target - global_position).normalized()
\tvelocity = dir * speed
\t_update_direction(dir)
\t_play_anim("walk")
\tmove_and_slide()
\tif global_position.distance_to(patrol_target) < 8.0:
\t\tpatrol_target = _random_patrol_point()
\t\t_change_state(State.IDLE)

func _process_chase() -> void:
\tif not target or not is_instance_valid(target):
\t\ttarget = null
\t\t_change_state(State.IDLE)
\t\treturn
\tif float(health) / float(max_health) <= flee_health_pct:
\t\t_change_state(State.FLEE)
\t\treturn
\tvar dist := global_position.distance_to(target.global_position)
\tif dist <= attack_range and can_attack:
\t\t_change_state(State.ATTACK)
\t\treturn
\tvar dir := (target.global_position - global_position).normalized()
\tvelocity = dir * chase_speed
\t_update_direction(dir)
\t_play_anim("walk")
\tmove_and_slide()

func _process_flee() -> void:
\tif not target or not is_instance_valid(target):
\t\t_change_state(State.IDLE)
\t\treturn
\tvar dir := (global_position - target.global_position).normalized()
\tvelocity = dir * chase_speed
\t_update_direction(dir)
\t_play_anim("walk")
\tmove_and_slide()
\tif global_position.distance_to(target.global_position) > detection_range * 1.5:
\t\ttarget = null
\t\t_change_state(State.IDLE)

func _change_state(new_state: State) -> void:
\tstate = new_state
\tmatch new_state:
\t\tState.ATTACK:
\t\t\tvelocity = Vector2.ZERO
\t\t\tcan_attack = false
\t\t\t_play_anim("slash")
\t\t\t_deal_damage()
\t\t\tattack_timer.start()
\t\tState.HURT:
\t\t\tvelocity = Vector2.ZERO
\t\t\t_play_anim("hurt")
\t\t\tawait get_tree().create_timer(0.4).timeout
\t\t\tif state == State.HURT:
\t\t\t\t_change_state(State.CHASE if target else State.IDLE)
\t\tState.DEAD:
\t\t\tvelocity = Vector2.ZERO
\t\t\tset_physics_process(false)
\t\t\tdied.emit()
\t\t\tawait get_tree().create_timer(1.0).timeout
\t\t\tqueue_free()
\t\t_:
\t\t\tpass

func take_damage(amount: int) -> void:
\tif state == State.DEAD:
\t\treturn
\thealth = max(0, health - amount)
\thealth_changed.emit(health, max_health)
\tif health <= 0:
\t\t_change_state(State.DEAD)
\telse:
\t\t_change_state(State.HURT)

func _deal_damage() -> void:
\tfor body in attack_area.get_overlapping_bodies():
\t\tif body != self and body.has_method("take_damage"):
\t\t\tbody.take_damage(attack_damage)

func _on_attack_cooldown() -> void:
\tcan_attack = true
\tif state == State.ATTACK:
\t\t_change_state(State.CHASE if target else State.IDLE)

func _on_patrol_wait_done() -> void:
\tif state == State.IDLE and not target:
\t\t_change_state(State.PATROL)

func _on_body_entered_detection(body: Node2D) -> void:
\tif body.is_in_group("player"):
\t\ttarget = body as CharacterBody2D
\t\tif state == State.IDLE or state == State.PATROL:
\t\t\t_change_state(State.CHASE)

func _on_body_exited_detection(body: Node2D) -> void:
\tif body == target:
\t\ttarget = null

func _update_direction(dir: Vector2) -> void:
\tif abs(dir.x) > abs(dir.y):
\t\tdirection = "right" if dir.x > 0 else "left"
\telse:
\t\tdirection = "down" if dir.y > 0 else "up"

func _play_anim(base: String) -> void:
\tvar anim_name := base + "_" + direction
\tif sprite and sprite.sprite_frames and sprite.sprite_frames.has_animation(anim_name):
\t\tsprite.play(anim_name)
\telif sprite and sprite.sprite_frames and sprite.sprite_frames.has_animation(base):
\t\tsprite.play(base)

func _random_patrol_point() -> Vector2:
\tvar angle := randf() * TAU
\tvar dist := randf_range(32.0, patrol_radius)
\treturn patrol_origin + Vector2(cos(angle), sin(angle)) * dist
`;

  return {
    name: 'enemy_ai',
    description: 'Enemy AI with patrol, chase, attack, flee, and hurt states',
    files: [
      { path: 'scripts/enemy.gd', content: enemyGd },
    ],
    dependencies: [],
    autoloads: [],
    inputActions: [],
  };
}
