import type { GameSystem } from './types.js';

export function generateDayNight(): GameSystem {
  const dayNightGd = `extends CanvasModulate
## Day/night cycle. Add to your scene root.
## Uses CanvasModulate to tint the entire scene.

signal time_changed(hour: int, minute: int)
signal period_changed(period: String)

@export var cycle_duration := 120.0  ## Real seconds for one full day
@export var start_hour := 8

var game_hour := 8
var game_minute := 0
var _elapsed := 0.0
var _current_period := ""

const COLORS := {
\t0: Color(0.1, 0.1, 0.2),    # Midnight
\t4: Color(0.15, 0.15, 0.3),  # Late night
\t6: Color(0.6, 0.4, 0.3),    # Dawn
\t8: Color(1.0, 0.95, 0.9),   # Morning
\t12: Color(1.0, 1.0, 1.0),   # Noon
\t16: Color(1.0, 0.9, 0.8),   # Afternoon
\t18: Color(0.8, 0.5, 0.3),   # Sunset
\t20: Color(0.3, 0.2, 0.4),   # Dusk
\t22: Color(0.15, 0.12, 0.25), # Night
}

func _ready() -> void:
\tgame_hour = start_hour
\t_update_color()

func _process(delta: float) -> void:
\t_elapsed += delta
\tvar total_minutes := (_elapsed / cycle_duration) * 1440.0
\tvar raw_minutes := int(total_minutes + start_hour * 60) % 1440
\tgame_hour = raw_minutes / 60
\tgame_minute = raw_minutes % 60

\t_update_color()
\ttime_changed.emit(game_hour, game_minute)

\tvar period := _get_period()
\tif period != _current_period:
\t\t_current_period = period
\t\tperiod_changed.emit(period)

func _update_color() -> void:
\tvar hours := sorted_keys()
\tvar prev_hour := hours[hours.size() - 1]
\tvar next_hour := hours[0]

\tfor i in range(hours.size()):
\t\tif game_hour >= hours[i]:
\t\t\tprev_hour = hours[i]
\t\t\tnext_hour = hours[(i + 1) % hours.size()]

\tvar prev_color: Color = COLORS[prev_hour]
\tvar next_color: Color = COLORS[next_hour]

\tvar span := next_hour - prev_hour
\tif span <= 0:
\t\tspan += 24
\tvar progress := float(game_hour * 60 + game_minute - prev_hour * 60)
\tif progress < 0:
\t\tprogress += 1440
\tvar t := clampf(progress / float(span * 60), 0.0, 1.0)

\tcolor = prev_color.lerp(next_color, t)

func sorted_keys() -> Array:
\tvar keys: Array = COLORS.keys()
\tkeys.sort()
\treturn keys

func _get_period() -> String:
\tif game_hour >= 6 and game_hour < 8:
\t\treturn "dawn"
\telif game_hour >= 8 and game_hour < 12:
\t\treturn "morning"
\telif game_hour >= 12 and game_hour < 16:
\t\treturn "afternoon"
\telif game_hour >= 16 and game_hour < 18:
\t\treturn "evening"
\telif game_hour >= 18 and game_hour < 20:
\t\treturn "sunset"
\telif game_hour >= 20 or game_hour < 4:
\t\treturn "night"
\telse:
\t\treturn "late_night"

func get_time_string() -> String:
\treturn "%02d:%02d" % [game_hour, game_minute]

func is_night() -> bool:
\treturn game_hour >= 20 or game_hour < 6
`;

  return {
    name: 'day_night',
    description: 'Day/night cycle with smooth color transitions and time-of-day periods',
    files: [
      { path: 'scripts/day_night_cycle.gd', content: dayNightGd },
    ],
    dependencies: [],
    autoloads: [],
    inputActions: [],
  };
}
