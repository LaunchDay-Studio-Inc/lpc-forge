<div align="center">

# ⚔️ LPC Forge

**The complete 2D RPG asset pipeline.**

Character compositor · Procedural maps · Godot 4.6 export · One command.

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-21+-green.svg)](https://nodejs.org)
[![Godot](https://img.shields.io/badge/Godot-4.6+-purple.svg)](https://godotengine.org)
[![Discord](https://img.shields.io/discord/1234567890?color=5865F2&label=Discord&logo=discord&logoColor=white)](https://discord.gg/bJDGXc4DvW)

[Website](https://blueth.online) · [Discord](https://discord.gg/bJDGXc4DvW) · [Report Bug](https://github.com/LaunchDay-Studio-Inc/lpc-forge/issues)

---

**Stop spending weeks on placeholder art.** Generate production-ready characters, dungeons, towns, and overworlds — then export directly to Godot with a working player controller, state machine, and HUD. All in one command.

</div>

## ✨ What You Get

```bash
npx lpc-forge init my-rpg
```

That single command generates:

| Output | What's Inside |
|--------|--------------|
| 🧙 **Character** | Multi-layer spritesheet (body + hair + armor + weapon), sliced animation frames |
| 🗺️ **Dungeon Map** | BSP rooms, corridors, doors, spawn/treasure/boss POIs |
| 🎮 **Godot 4.6 Project** | `project.godot`, player state machine, hitbox/hurtbox, camera follow, health HUD |
| ▶️ **Press F5** | Literally just press play. WASD movement, attack animation, collision — it works. |

## 🚀 Quick Start

```bash
# Install
git clone https://github.com/LaunchDay-Studio-Inc/lpc-forge.git
cd lpc-forge
npm install && npm run build

# Generate a full playable Godot project
npx lpc-forge init my-rpg

# Open in Godot 4.6 → Press F5 → Play
```

<details>
<summary><b>📦 Using without cloning (npx)</b></summary>

```bash
# Coming soon to npm
npx lpc-forge init my-rpg
```

</details>

## 🧙 Character Compositor

Compose multi-layer LPC character spritesheets from 17 built-in presets or fully custom specs.

```bash
# Use a preset
lpc-forge character --preset paladin -o ./output/paladin

# Custom character with specific layers
lpc-forge character --body female --skin light --hair plain:blonde --armor plate:gold

# Generate + slice into frames + export for Godot
lpc-forge character --preset necromancer --slice --godot -o ./output/necromancer

# See all available layers and variants
lpc-forge character --list-layers
```

### Built-in Presets

| Preset | Description | Body |
|--------|------------|------|
| `warrior` | Plate armor, sword ready | Male |
| `mage` | Blue robes, arcane wielder | Male |
| `rogue` | Leather armor, shadow dancer | Female |
| `ranger` | Green tunic, forest scout | Male |
| `villager` | Simple clothes, peaceful life | Female |
| `paladin` | Heavy plate, divine protector | Female |
| `necromancer` | Dark robes, death magic | Male |
| `knight` | Full plate, helm, champion | Male |
| `barbarian` | Minimal armor, raw power | Male |
| `monk` | Simple robes, inner peace | Male |
| `thief` | Dark clothes, hood, shadows | Male |
| `healer` | White robes, restoration | Female |
| `archer` | Leather armor, precision | Female |
| `merchant` | Fancy clothes, trader | Male |
| `guard` | Chainmail, town protector | Male |
| `skeleton` | Undead warrior | Male |
| `peasant` | Ragged clothes, humble | Male |

### Batch Generation

Generate an entire party from a JSON config:

```bash
lpc-forge batch examples/party.json -o ./output/party
```

```json
{
  "characters": [
    { "name": "hero", "preset": "warrior", "slice": true, "godot": true },
    { "name": "companion", "preset": "mage", "slice": true, "godot": true },
    { "name": "npc-merchant", "preset": "merchant" },
    { "name": "enemy-skeleton", "preset": "skeleton" }
  ]
}
```

## 🗺️ Procedural Map Generator

Six map types with seeded RNG for reproducible results.

```bash
# BSP Dungeon — rooms, corridors, doors
lpc-forge map dungeon -W 60 -H 60 --rooms 12 -s myseed --render

# Natural Caves — cellular automata
lpc-forge map cave -W 50 -H 50 --render

# Multi-Biome Overworld — forests, deserts, lakes, villages, roads
lpc-forge map overworld -W 80 -H 80 --render

# Wave Function Collapse — pattern-based terrain
lpc-forge map wfc -W 40 -H 40 --render

# Town — buildings, roads, market square, optional walls
lpc-forge map town -W 60 -H 60 --buildings 8 --render

# Multi-Floor Dungeon — connected floors with stairs
lpc-forge map multifloor --floors 3 -W 50 -H 50 --render
```

### Points of Interest

Every generated map includes automatic POI placement:

| POI Type | Description | Visual |
|----------|------------|--------|
| 🟢 Spawn | Player start position | Green circle |
| 💎 Treasure | Loot locations | Yellow diamond |
| 🔵 NPC | Character placement | Blue square |
| 🚪 Exit | Floor exit / stairs | Red circle |
| 💀 Boss | Boss encounter room | Red X |

POIs are included in the exported `map.json` and as `Marker2D` nodes in Godot exports.

## 🎮 Godot 4.6 Export

Not just assets — **a playable game scaffold.**

```bash
lpc-forge init my-rpg --character paladin --map dungeon
```

### What gets generated:

```
my-rpg/
├── project.godot              # Godot 4.6 project (open this)
├── main.tscn                  # Main scene — map + player + camera + HUD
├── scripts/
│   ├── player.gd              # Full state machine (idle/walk/attack/hurt/death)
│   └── hud.gd                 # Health bar UI
├── sprites/
│   └── paladin/
│       ├── spritesheet.png    # Composed character sheet
│       ├── paladin.tres       # SpriteFrames resource
│       └── paladin.tscn       # Character scene with collision
├── dungeon.tscn               # TileMapLayer scene with wall collision
├── tileset/
│   └── terrain.tres           # TileSet resource
└── map_preview.png            # Map preview image
```

### Player Controller Features

The generated `player.gd` includes:

- **State machine** — IDLE, WALK, ATTACK, HURT, DEATH states
- **4-directional movement** — WASD with proper animation switching
- **Combat system** — Hitbox/Hurtbox Area2D nodes for attack detection
- **Health system** — `take_damage()`, `health_changed` signal, death handling
- **Camera follow** — Smooth Camera2D attached to player
- **HUD** — ProgressBar health display connected via signals

### Map Scene Features

- **TileMapLayer** — Uses Godot 4.6's modern tile system (not deprecated TileMap)
- **Wall collision** — StaticBody2D with CollisionShape2D on wall tiles
- **POI markers** — Marker2D nodes with metadata for spawn, treasure, NPCs, exits

## 📖 CLI Reference

| Command | Description |
|---------|------------|
| `lpc-forge character` | Generate a character spritesheet |
| `lpc-forge batch <config>` | Batch generate from JSON config |
| `lpc-forge map <type>` | Generate a map (dungeon/cave/overworld/wfc/town/multifloor) |
| `lpc-forge list` | Browse available sprites and variants |
| `lpc-forge init <name>` | Scaffold a complete Godot 4.6 project |

<details>
<summary><b>Full options reference</b></summary>

### Character Options

| Flag | Description | Default |
|------|------------|---------|
| `-p, --preset <name>` | Use a built-in preset | — |
| `-b, --body <type>` | Body type (male, female, muscular, teen, child, pregnant) | `male` |
| `--skin <variant>` | Skin color | `light` |
| `--hair <style:color>` | Hair style and color | — |
| `--armor <type:variant>` | Armor type and variant | — |
| `--weapon <type:variant>` | Weapon type and variant | — |
| `-o, --output <path>` | Output directory | `./output/character` |
| `--slice` | Slice into individual frames | `false` |
| `--godot` | Export as Godot 4 resources | `false` |
| `--list-layers` | List all available layers | — |

### Map Options

| Flag | Description | Default |
|------|------------|---------|
| `-W, --width <n>` | Map width in tiles | `50` |
| `-H, --height <n>` | Map height in tiles | `50` |
| `-s, --seed <seed>` | Random seed (reproducible) | auto |
| `--rooms <n>` | Room count (dungeon) | `12` |
| `--room-min <n>` | Min room size | `5` |
| `--room-max <n>` | Max room size | `15` |
| `--buildings <n>` | Building count (town) | `6` |
| `--floors <n>` | Floor count (multifloor) | `3` |
| `--render` | Render PNG preview | `true` |
| `--godot` | Export as Godot TileMap | `false` |

</details>

## ⚙️ How It Works

### Character Pipeline
1. Parse `sheet_definitions/*.json` → build layer registry
2. Resolve layers to sprite paths per body type and variant
3. Load individual animation PNGs → stitch into 832×3456 universal sheet
4. Sort layers by `zPos` (back to front)
5. Composite with `sharp` alpha blending → final spritesheet
6. Optionally slice into 64×64 frames and/or export to Godot

### Map Algorithms
- **BSP Dungeon** — Binary Space Partitioning → rooms in leaves → corridor connections
- **Cellular Automata** — Random init + birth/death rules → organic caves
- **Overworld** — Layered noise heightmap + moisture → biome classification + villages + roads
- **WFC** — Wave Function Collapse with configurable adjacency constraints
- **Town** — Central square + building placement + road network + optional walls
- **Multi-Floor** — Stacked dungeon floors with stair connections between levels

## 🎨 Asset Credits & Licensing

### Code License

This project is licensed under **[GPL-3.0-or-later](LICENSE)** — inherited from the upstream [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator).

You are free to use, modify, and distribute this software. If you distribute modified versions, you must also distribute the source code under GPL-3.0.

**Using LPC Forge as a tool to generate assets for your game does NOT make your game GPL.** The GPL applies to the tool's source code, not to the output it produces.

### Art Asset Licenses

All sprite assets in the `spritesheets/` directory are from the [Liberated Pixel Cup](https://lpc.opengameart.org) project — a collaborative effort by dozens of artists on [OpenGameArt.org](https://opengameart.org).

The art uses a mix of open licenses:

| License | Attribution Required | Share-Alike | DRM OK |
|---------|---------------------|-------------|--------|
| [CC0](https://creativecommons.org/public-domain/cc0/) | ❌ No | ❌ No | ✅ Yes |
| [CC-BY 3.0/4.0](https://creativecommons.org/licenses/by/4.0/) | ✅ Yes | ❌ No | ⚠️ Unclear |
| [CC-BY-SA 3.0/4.0](https://creativecommons.org/licenses/by-sa/4.0/) | ✅ Yes | ✅ Yes | ⚠️ Unclear |
| [OGA-BY 3.0](https://static.opengameart.org/OGA-BY-3.0.txt) | ✅ Yes | ❌ No | ✅ Yes |
| [GPL 2.0/3.0](https://www.gnu.org/licenses/gpl-3.0.en.html) | ✅ Yes | ✅ Yes | ✅ Yes |

**All licenses allow commercial use.** Yes, you can sell games that use LPC sprites.

### How to Credit

If you use LPC Forge output in your game, you **must** credit the original artists. The easiest way:

1. Include the [CREDITS.csv](CREDITS.csv) file with your game
2. Add a credits screen or file with this text:

> Sprites created using [LPC Forge](https://github.com/LaunchDay-Studio-Inc/lpc-forge), built on art from the [Liberated Pixel Cup](https://lpc.opengameart.org) project.
>
> Character sprites by: Johannes Sjölund (wulax), Michael Whitlock (bigbeargames), Matthew Krohn (makrohn), Nila122, David Conway Jr. (JaidynReiman), Carlo Enrico Victoria (Nemisys), Thane Brimhall (pennomi), laetissima, bluecarrot16, Luke Mehl, Benjamin K. Smith (BenCreating), MuffinElZangano, Durrani, kheftel, Stephen Challener (Redshrike), William.Thompsonj, Marcel van de Steeg (MadMarcel), TheraHedwig, Evert, Pierre Vigier (pvigier), Eliza Wyatt (ElizaWy), Sander Frenken (castelonia), dalonedrau, Lanea Zimmerman (Sharm), Manuel Riecke (MrBeast), Barbara Riviera, Joe White, Mandi Paugh, Shaun Williams, Daniel Eddeland (daneeklu), Emilio J. Sanchez-Sierra, drjamgo, gr3yh47, tskaufma, Fabzy, Yamilian, Skorpio, Tuomo Untinen (reemax), Tracy, thecilekli, LordNeo, Stafford McIntyre, PlatForge project, DCSS authors, DarkwallLKE, Charles Sanchez (CharlesGabriel), Radomir Dopieralski, macmanmatty, Cobra Hubbard (BlueVortexGames), Inboxninja, kcilds/Rocetti/Eredah, Napsio (Vitruvian Studio), The Foreman, AntumDeluge
>
> Licensed under CC-BY-SA 3.0 / CC-BY 3.0 / OGA-BY 3.0 / GPL 3.0 / CC0.
> Full credits: [CREDITS.csv](https://github.com/LaunchDay-Studio-Inc/lpc-forge/blob/master/CREDITS.csv)

### Original Project Credits

LPC Forge is built on the [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator), originally created by [@Gaurav0](https://github.com/Gaurav0), maintained by [@sanderfrenken](https://github.com/sanderfrenken), with major art contributions by [@jrconway3](https://github.com/jrconway3), [@bluecarrot16](https://github.com/bluecarrot16), and [@ElizaWy](https://github.com/ElizaWy).

The Liberated Pixel Cup was introduced by Bart Kelsey and Chris Webber, originally sponsored by Creative Commons, Mozilla, and the Free Software Foundation as a competition on [OpenGameArt.org](https://opengameart.org).

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

- 🐛 [Report bugs](https://github.com/LaunchDay-Studio-Inc/lpc-forge/issues)
- 💡 [Request features](https://github.com/LaunchDay-Studio-Inc/lpc-forge/issues)
- 🎨 [Add presets](CONTRIBUTING.md)

## 🔗 Links

- **Website:** [blueth.online](https://blueth.online)
- **Discord:** [discord.gg/bJDGXc4DvW](https://discord.gg/bJDGXc4DvW)
- **LPC Project:** [lpc.opengameart.org](https://lpc.opengameart.org)
- **OpenGameArt:** [opengameart.org](https://opengameart.org/content/lpc-collection)

---

<div align="center">

Built with ❤️ by [LaunchDay Studio](https://blueth.online)

**If LPC Forge saves you time, [⭐ star the repo](https://github.com/LaunchDay-Studio-Inc/lpc-forge) and tell a friend.**

</div>
