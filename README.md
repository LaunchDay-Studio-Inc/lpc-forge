# LPC Forge

**Complete 2D game asset pipeline** — character compositor, procedural map generator, and Godot 4.6 exporter. Built on [Liberated Pixel Cup](https://lpc.opengameart.org) sprites.

A headless Node.js CLI toolkit that composes LPC character spritesheets, generates procedural dungeon/overworld maps, and exports everything as Godot 4.6.1-ready assets.

By [LaunchDay Studio](https://blueth.online) | [Discord](https://discord.gg/bJDGXc4DvW) | [GitHub](https://github.com/LaunchDay-Studio-Inc/lpc-forge)

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/LaunchDay-Studio-Inc/lpc-forge.git
cd lpc-forge
npm install
npm run build

# Generate a full Godot project with character + dungeon
npx lpc-forge init my-rpg

# Or use tsx for development
npx tsx src/cli.ts init my-rpg
```

## Features

- **Character Compositor** — Compose multi-layer LPC character spritesheets from CLI (body, hair, armor, weapons, etc.)
- **Procedural Maps** — Generate dungeons (BSP), caves (cellular automata), overworlds (multi-biome), and WFC terrain
- **Godot 4.6 Export** — Output `.tscn` scenes, `.tres` SpriteFrames, and a ready-to-run player controller
- **Frame Slicer** — Split universal spritesheets into individual 64×64 animation frames
- **Seeded RNG** — All generation is reproducible with seeds
- **Zero Browser Dependencies** — Pure Node.js with `sharp` for image processing

## CLI Reference

### `lpc-forge character`

Generate a character spritesheet.

```bash
# Use a preset
lpc-forge character --preset warrior -o ./output/warrior

# Custom character
lpc-forge character --body male --skin light --hair plain:brown --armor plate:steel

# List all available layers
lpc-forge character --list-layers

# Generate + slice + export to Godot
lpc-forge character --preset mage --slice --godot -o ./output/mage
```

**Options:**
| Flag | Description | Default |
|------|------------|---------|
| `-p, --preset <name>` | Use a preset (`warrior`, `mage`, `rogue`, `ranger`, `villager`) | — |
| `-b, --body <type>` | Body type (`male`, `female`, `muscular`, `teen`, `child`, `pregnant`) | `male` |
| `--skin <variant>` | Skin color | `light` |
| `--hair <style:color>` | Hair style and color | — |
| `--armor <type:variant>` | Armor type and variant | — |
| `--weapon <type:variant>` | Weapon type and variant | — |
| `-o, --output <path>` | Output directory | `./output/character` |
| `--slice` | Slice into individual frames | `false` |
| `--godot` | Export as Godot 4 resources | `false` |
| `--list-layers` | List available layers | — |

### `lpc-forge list`

List available assets and variants.

```bash
lpc-forge list
lpc-forge list --category hair
lpc-forge list --json
```

### `lpc-forge map <type>`

Generate a procedural map.

```bash
# Dungeon with BSP algorithm
lpc-forge map dungeon -W 60 -H 60 --rooms 10 -s my-seed

# Cave with cellular automata
lpc-forge map cave -W 50 -H 50

# Multi-biome overworld
lpc-forge map overworld -W 80 -H 80

# Wave Function Collapse
lpc-forge map wfc -W 40 -H 40

# Export as Godot TileMap
lpc-forge map dungeon --godot -o ./output/dungeon
```

**Options:**
| Flag | Description | Default |
|------|------------|---------|
| `-W, --width <n>` | Map width in tiles | `50` |
| `-H, --height <n>` | Map height in tiles | `50` |
| `-s, --seed <seed>` | Random seed | auto |
| `--rooms <n>` | Number of rooms (dungeon) | `12` |
| `--room-min <n>` | Minimum room size | `5` |
| `--room-max <n>` | Maximum room size | `15` |
| `--render` | Render PNG preview | `true` |
| `--godot` | Export as Godot TileMap | `false` |

### `lpc-forge init <name>`

Scaffold a complete Godot 4.6 project with generated assets.

```bash
lpc-forge init my-rpg --character warrior --map dungeon
```

This generates:
- `project.godot` — Godot 4.6 project file
- Character sprite frames + `.tres` SpriteFrames resource
- Map `.tscn` scene with TileMapLayer
- `scripts/player.gd` — Basic WASD movement + animation controller

## Character Presets

| Preset | Body | Layers |
|--------|------|--------|
| `warrior` | male | Body, plain hair, plate armor, plate legs/feet |
| `mage` | male | Body, white hair, blue robe |
| `rogue` | female | Body, black hair, leather armor, pants, shoes |
| `ranger` | male | Body, chestnut hair, green shirt, pants, boots |
| `villager` | female | Body, blonde hair, white shirt, pants, shoes |

## How It Works

### Character Compositing

1. Parse `sheet_definitions/*.json` to build a layer registry
2. Resolve each layer to sprite paths per body type and variant
3. For each layer, load individual animation PNGs and stitch into an 832×3456 universal sheet
4. Sort layers by `zPos` (ascending = back to front)
5. Composite all layers using `sharp.composite()` with alpha blending
6. Output the final PNG (optionally slice into frames)

### Map Generation

- **BSP Dungeon** — Recursively partition space, place rooms in leaves, connect via corridors
- **Cellular Automata** — Random initialization + birth/death rules → natural caves
- **Overworld** — Layered noise heightmap + moisture → biome classification + villages + paths
- **WFC** — Wave Function Collapse with configurable adjacency rules

## Using with Godot 4.6

1. Run `lpc-forge init my-game`
2. Open Godot 4.6 → Import → Select `my-game/project.godot`
3. Press F5 to run — WASD to move the character

The generated `scripts/player.gd` handles input, animation switching, and movement.

## Asset Credits

All sprite assets are from the [Liberated Pixel Cup](https://lpc.opengameart.org) project. **You must credit the original artists when using LPC sprites in your project.**

See [CREDITS.csv](CREDITS.csv) for full attribution of all sprites in the `spritesheets/` directory.

Licenses used by LPC assets:
- [CC-BY-SA 3.0/4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- [CC-BY 3.0/4.0](https://creativecommons.org/licenses/by/4.0/)
- [OGA-BY 3.0](https://static.opengameart.org/OGA-BY-3.0.txt)
- [GPL 2.0/3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)
- [CC0](https://creativecommons.org/public-domain/cc0/)

## License

Our code (`src/`) is [MIT](LICENSE) licensed. LPC art assets retain their original licenses — see [CREDITS.csv](CREDITS.csv).

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## Links

- **Website:** [blueth.online](https://blueth.online)
- **Discord:** [discord.gg/bJDGXc4DvW](https://discord.gg/bJDGXc4DvW)
- **GitHub:** [github.com/LaunchDay-Studio-Inc/lpc-forge](https://github.com/LaunchDay-Studio-Inc/lpc-forge)
- **LPC on OpenGameArt:** [opengameart.org](https://opengameart.org/content/lpc-collection)
