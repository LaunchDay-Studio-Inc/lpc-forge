<div align="center">

# ⚔️ LPC Forge

**Generate a complete 2D RPG from one command.**

Characters · Maps · Enemy AI · Inventory · Dialog · Menus · SFX · Lighting · Particles · Godot 4.6

[![Latest Release](https://img.shields.io/github/v/release/LaunchDay-Studio-Inc/lpc-forge?style=flat-square&color=orange&label=Release)](https://github.com/LaunchDay-Studio-Inc/lpc-forge/releases/latest)
[![npm](https://img.shields.io/npm/v/lpc-forge?style=flat-square&color=red&label=npm)](https://www.npmjs.com/package/lpc-forge)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Godot](https://img.shields.io/badge/Godot-4.6+-478CBF?style=flat-square&logo=godotengine&logoColor=white)](https://godotengine.org)
[![CI](https://img.shields.io/github/actions/workflow/status/LaunchDay-Studio-Inc/lpc-forge/ci.yml?style=flat-square&label=CI)](https://github.com/LaunchDay-Studio-Inc/lpc-forge/actions)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/bJDGXc4DvW)

[🌐 Website](https://blueth.online/products/lpc-forge) · [💰 Get Premium ($10)](https://launchday.gumroad.com/l/lpc-forge-premium) · [💬 Discord](https://discord.gg/bJDGXc4DvW) · [🐛 Report Bug](https://github.com/LaunchDay-Studio-Inc/lpc-forge/issues) · [📋 Changelog](https://github.com/LaunchDay-Studio-Inc/lpc-forge/releases)

</div>

---

## What is LPC Forge?

LPC Forge generates **playable 2D RPG projects** for [Godot 4.6](https://godotengine.org) using [Liberated Pixel Cup](https://lpc.opengameart.org/) assets. Not just sprites — complete game projects with working systems you can customize.

**Free tier** gives you characters, maps, and a basic playable project.
**Premium** ($10) gives you the full RPG game kit — inventory, dialog, enemy AI, menus, save/load, sound effects, lighting, particles, and more. All from one command.

```bash
# Free — character + map + basic project
lpc-forge init my-rpg

# Premium — complete playable RPG
lpc-forge init my-rpg --full
```

Open in Godot → Press F5 → **Play.**

---

## 🚀 Quick Start

### Option 1: npm (recommended)

```bash
npm install -g lpc-forge
lpc-forge init my-rpg
```

### Option 2: Clone from source

```bash
git clone https://github.com/LaunchDay-Studio-Inc/lpc-forge.git
cd lpc-forge
npm install && npm run build
npx lpc-forge init my-rpg
```

Then open in **Godot 4.6** → Import → Select `my-rpg/project.godot` → Press **F5**.

> **Requirements:** Node.js 18+ · Godot 4.6+ (for playing generated projects)

---

## 📸 Gallery

<div align="center">

| Characters | Maps | UI Kit |
|:---:|:---:|:---:|
| ![Characters](https://blueth.online/images/lpc-forge/warrior-spritesheet.png) | ![Maps](https://blueth.online/images/lpc-forge/dungeon-map.png) | ![UI Kit](https://blueth.online/images/lpc-forge/ui-kit.png) |
| 30+ presets with walk, attack, idle animations | Dungeons, caves, overworld, towns | Panels, bars, buttons, frames, slots |

| Item Icons | Particles | Godot Project |
|:---:|:---:|:---:|
| ![Icons](https://blueth.online/images/lpc-forge/icons-atlas.png) | ![Particles](https://blueth.online/images/lpc-forge/particles-preview.png) | ![Godot](https://blueth.online/images/lpc-forge/godot-project.png) |
| 20 RPG item icons | 8 particle effects | Press F5 and play |

</div>

👉 **[See the full interactive showcase →](https://blueth.online/products/lpc-forge)**

---

## 🆓 Free vs 💎 Premium

| Feature | Free | Premium ($10) |
|---------|:----:|:-------------:|
| **Character Compositor** (17 presets, custom specs) | ✅ | ✅ |
| **Map Generation** (dungeon, cave, overworld, town, WFC, multifloor) | ✅ | ✅ |
| **Godot Project Scaffold** (player controller, hitbox, camera, HUD) | ✅ | ✅ |
| **Batch Character Generation** | ✅ | ✅ |
| **Enemy AI** (patrol, chase, attack, flee, boss patterns) | — | ✅ |
| **Inventory System** (grid UI, equip, stack, drag-drop, tooltips) | — | ✅ |
| **Dialog System** (text box, choices, portraits, typing effect) | — | ✅ |
| **Menu System** (main, pause, settings, game over, credits) | — | ✅ |
| **Save/Load** (JSON, 3 slots, auto-save) | — | ✅ |
| **Scene Transitions** (doors, stairs, fade, area loading) | — | ✅ |
| **Loot & Drop System** (drop tables, item pickup, XP/gold drops) | — | ✅ |
| **Quest Tracker** (objectives, markers, completion) | — | ✅ |
| **Day/Night Cycle** (time-of-day modulation, lamp auto-on) | — | ✅ |
| **Full HUD** (HP, MP, XP, gold, minimap, hotbar, buffs) | — | ✅ |
| **Sound Effects** (45 procedural SFX: combat, UI, movement, magic) | — | ✅ |
| **Music Catalog** (curated CC0 BGM tracks for every scene type) | — | ✅ |
| **UI Kit** (panels, buttons, frames, tooltips, medieval theme) | — | ✅ |
| **Item Icons** (swords, potions, scrolls, armor, food, keys) | — | ✅ |
| **Props** (chests, barrels, torches, signs, wells, fences) | — | ✅ |
| **Character Portraits** (auto-cropped, 3 sizes) | — | ✅ |
| **Lighting Presets** (8 presets: dungeon, overworld, cave, boss arena) | — | ✅ |
| **Particle Effects** (8 effects: rain, snow, fireflies, fire, magic) | — | ✅ |
| **Enemy Characters** (skeleton, guard, thief — full spritesheets) | — | ✅ |
| **NPC Characters** (merchant, healer, peasant — full spritesheets) | — | ✅ |
| **Autoload Wiring** (systems auto-registered in project.godot) | — | ✅ |
| **Input Actions** (inventory, interact, pause, quest log pre-configured) | — | ✅ |

### 💎 Get Premium

```bash
# 1. Purchase at https://launchday.gumroad.com/l/lpc-forge-premium
# 2. Activate your license key
lpc-forge activate <your-license-key>

# 3. Generate a complete RPG
lpc-forge init my-rpg --full
```

**$10 · One-time · Unlimited projects · No subscription**

---

## 📖 Commands

### Free Commands

```bash
# Character compositor
lpc-forge character --preset paladin -o ./output
lpc-forge character --body female --hair plain:blonde --armor plate:gold
lpc-forge character --list-layers

# Batch generation
lpc-forge batch --presets warrior,mage,rogue -o ./output

# Map generation
lpc-forge map --type dungeon --width 50 --height 50 -o ./output
lpc-forge map --type overworld --seed "my-world" -o ./output

# List all presets
lpc-forge list

# Project scaffold (free tier)
lpc-forge init my-rpg --character warrior --map dungeon
```

### Premium Commands

```bash
# Full RPG project (all systems, all assets)
lpc-forge init my-rpg --full

# Individual premium generators
lpc-forge systems --list                          # Preview (free)
lpc-forge systems -o ./output                     # Generate (premium)
lpc-forge sfx --list                              # Preview (free)
lpc-forge sfx -o ./output                         # Generate (premium)
lpc-forge ui --list-themes                        # Preview (free)
lpc-forge ui -o ./output                          # Generate (premium)
lpc-forge lighting --list                         # Preview (free)
lpc-forge lighting -o ./output                    # Generate (premium)
lpc-forge particles --list                        # Preview (free)
lpc-forge particles -o ./output                   # Generate (premium)
lpc-forge icons -o ./output                       # Generate (premium)
lpc-forge props -o ./output                       # Generate (premium)
lpc-forge portrait --character warrior -o ./output # Generate (premium)

# License management
lpc-forge activate <key>          # Activate license
lpc-forge activate --status       # Check license status
lpc-forge activate --deactivate   # Remove license
```

---

## 📁 What `init --full` Generates

```
my-rpg/
├── project.godot                    # Pre-configured with autoloads + input actions
├── sprites/
│   ├── warrior/                     # Player character (8-dir, all animations)
│   ├── skeleton/                    # Enemy character
│   ├── guard/                       # Enemy character
│   ├── thief/                       # Enemy character
│   ├── npc_merchant/                # NPC character
│   ├── npc_healer/                  # NPC character
│   └── npc_peasant/                 # NPC character
├── scripts/
│   ├── player.gd                    # State machine player controller
│   ├── enemy_ai.gd                  # Patrol/chase/attack FSM
│   ├── inventory_manager.gd         # Grid inventory system (autoload)
│   ├── inventory_ui.gd              # Drag-drop inventory UI
│   ├── dialog_manager.gd            # Dialog system (autoload)
│   ├── dialog_box.gd                # Text box with typing effect
│   ├── save_manager.gd              # Save/load system (autoload)
│   ├── scene_manager.gd             # Scene transitions (autoload)
│   ├── loot_manager.gd              # Drop tables and item pickup (autoload)
│   ├── quest_manager.gd             # Quest tracker (autoload)
│   ├── day_night.gd                 # Day/night cycle (autoload)
│   ├── menu_manager.gd              # Menu system (autoload)
│   ├── hud.gd                       # Full HUD (autoload)
│   └── game_config.gd               # Global game constants
├── dungeon.tscn                     # Generated dungeon map
├── tileset/                         # Terrain tiles
├── ui/                              # UI kit (panels, buttons, frames)
├── icons/                           # Item icon sprites
├── props/                           # Prop sprites
├── portraits/                       # Character portraits (3 sizes)
├── lighting/                        # 8 lighting preset scenes
├── particles/                       # 8 particle effect scenes
├── sfx/                             # 45 sound effects (.wav)
├── music/                           # BGM tracks catalog
└── map_preview.png                  # Map overview image
```

**Open in Godot → Press F5 → Walk around, fight enemies, open inventory, talk to NPCs.**

---

## 🗺️ Map Types

| Type | Algorithm | Features |
|------|-----------|----------|
| `dungeon` | BSP (Binary Space Partition) | Rooms, corridors, doors, spawn/treasure/boss POIs |
| `cave` | Cellular Automata | Organic caverns, varied openness |
| `overworld` | Multi-octave noise | Biomes, rivers, mountains, forests |
| `town` | District-based | Houses, shops, roads, town square |
| `wfc` | Wave Function Collapse | Pattern-based, highly varied |
| `multifloor` | Stacked BSP | Multi-level dungeons with stairs |

```bash
lpc-forge map --type dungeon --width 60 --height 60 --seed "my-dungeon" -o ./output
```

---

## 🎭 Character Presets

| Preset | Layers | Style |
|--------|--------|-------|
| `warrior` | Plate armor, longsword, brown hair | Classic RPG fighter |
| `mage` | Robe, staff, white hair | Spellcaster |
| `rogue` | Leather armor, dagger, black hair | Stealth class |
| `ranger` | Leather, bow, green hood | Ranged fighter |
| `paladin` | Gold plate, greatsword, blonde hair | Holy knight |
| `necromancer` | Dark robe, skull staff, bald | Dark magic |
| `cleric` | White robe, mace, brown hair | Healer |
| `barbarian` | Fur armor, battleaxe, red hair | Berserker |
| `monk` | Simple clothes, bo staff, shaved head | Martial arts |
| `bard` | Fancy clothes, lute, curly hair | Support class |
| ...and 7 more | | |

```bash
lpc-forge list          # See all presets
```

---

## 🛠️ Tech Stack

- **Runtime:** [Node.js](https://nodejs.org) 18+
- **Game Engine:** [Godot 4.6](https://godotengine.org)
- **Assets:** [Liberated Pixel Cup](https://lpc.opengameart.org/) (CC-BY-SA 3.0/4.0)
- **Maps:** [rot.js](https://ondras.github.io/rot.js/) algorithms (BSP, cellular automata, noise)
- **Images:** [Sharp](https://sharp.pixelplumbing.com/) for compositing
- **Audio:** [Tone.js](https://tonejs.github.io/) for procedural SFX synthesis
- **Website:** [Next.js](https://nextjs.org) 16 + [Tailwind CSS](https://tailwindcss.com) v4 — [blueth.online](https://blueth.online)
- **CI:** GitHub Actions

---

## 📜 License & Credits

### Tool License

LPC Forge (the CLI tool) is licensed under **[GPL-3.0-or-later](LICENSE)**.

### Asset Licenses

Character sprites use [Liberated Pixel Cup](https://lpc.opengameart.org/) assets under **CC-BY-SA 3.0** and **CC-BY-SA 4.0**. Full artist credits in [CREDITS.csv](CREDITS.csv).

Premium assets include curated content from [OpenGameArt.org](https://opengameart.org) under CC0/CC-BY-SA licenses. When distributing games made with LPC Forge, include the generated `CREDITS.md` file.

### Premium License

LPC Forge Premium is sold at **[blueth.online](https://blueth.online/products/lpc-forge)**. One-time purchase, unlimited projects, no subscription.

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome for the open-source core — character presets, map algorithms, export improvements.

Premium features (systems, SFX, UI, lighting, particles) are maintained by [LaunchDay Studio](https://launchdaystudio.com).

---

## 🔗 Links

| | |
|---|---|
| 🌐 **Website** | [blueth.online/products/lpc-forge](https://blueth.online/products/lpc-forge) |
| 💬 **Discord** | [discord.gg/bJDGXc4DvW](https://discord.gg/bJDGXc4DvW) |
| 📦 **npm** | [npmjs.com/package/lpc-forge](https://www.npmjs.com/package/lpc-forge) |
| 📋 **Changelog** | [Releases](https://github.com/LaunchDay-Studio-Inc/lpc-forge/releases) |
| 🐛 **Issues** | [Bug Reports](https://github.com/LaunchDay-Studio-Inc/lpc-forge/issues) |
| 📖 **LPC Wiki** | [lpc.opengameart.org](https://lpc.opengameart.org/) |
| 🎮 **Godot Engine** | [godotengine.org](https://godotengine.org) |
| 📚 **Docs** | [blueth.online/docs](https://blueth.online/docs) |

---

<div align="center">

**Made by [LaunchDay Studio](https://launchdaystudio.com) 🚀**

*Stop spending weeks on placeholder art. Start building your game.*

</div>
