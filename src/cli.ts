#!/usr/bin/env node
import { Command } from 'commander';
import { resolve, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { IconEntry } from './ui/types.js';
import { resolveAssetRoot, ensureAssets } from './assets/manager.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolveAssetRoot(PACKAGE_ROOT);

const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('lpc-forge')
  .description('Complete 2D game asset pipeline — character compositor, map generator, Godot 4 exporter')
  .version(pkg.version);

// === CHARACTER COMMAND ===
// Hair shorthand aliases: user-friendly name → actual subcategory in sheet_definitions
const HAIR_ALIASES: Record<string, string> = {
  mohawk: 'hair_shorthawk',
  mohawk_long: 'hair_longhawk',
  shorthawk: 'hair_shorthawk',
  longhawk: 'hair_longhawk',
};

// Skin aliases for common names
const SKIN_ALIASES: Record<string, string> = {
  dark: 'brown',
  peach: 'light',
  tan: 'bronze',
};

program
  .command('character')
  .description('Generate a character spritesheet\n\n  Available presets: warrior, mage, rogue, ranger, villager, paladin, necromancer,\n  knight, barbarian, monk, thief, healer, archer, merchant, guard, skeleton, peasant\n\n  Layer syntax: --hair <style>:<color>  e.g. "plain:brown", "ponytail:blonde"\n               --armor <type>:<variant> e.g. "plate:steel", "leather:brown"\n               --weapon <type>:<variant> e.g. "sword_longsword:longsword"')
  .option('-p, --preset <name>', 'Use a preset (warrior, mage, rogue, ranger, villager, ...)')
  .option('-b, --body <type>', 'Body type (male, female, muscular, teen, child, pregnant)', 'male')
  .option('--skin <variant>', 'Skin color variant (light, amber, olive, taupe, bronze, brown, black, ...)', 'light')
  .option('--hair <style:color>', 'Hair style and color (e.g., "plain:brown", "ponytail:blonde")')
  .option('--armor <type:variant>', 'Armor type and variant (e.g., "plate:steel")')
  .option('--weapon <type:variant>', 'Weapon type and variant (e.g., "sword_longsword:longsword")')
  .option('-o, --output <path>', 'Output path', './output/character')
  .option('--slice', 'Also slice into individual frames', false)
  .option('--godot', 'Export as Godot 4 resources', false)
  .option('--list-layers', 'List all available layers and variants')
  .option('--verbose', 'Show detailed compositing information', false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    if (opts.listLayers) {
      const assetRoot = await ensureAssets(PACKAGE_ROOT);
      const { loadDefinitions, listLayers } = await import('./character/definitions.js');
      const registry = await loadDefinitions(assetRoot);
      const layers = listLayers(registry);

      for (const [category, items] of Object.entries(layers)) {
        console.log(chalk.bold.cyan(`\n${category}`));
        for (const item of items) {
          console.log(`  ${chalk.green(item.name)}: ${item.variants.slice(0, 8).join(', ')}${item.variants.length > 8 ? '...' : ''}`);
        }
      }
      return;
    }

    const assetRoot = await ensureAssets(PACKAGE_ROOT);
    const spinner = ora('Composing character...').start();

    try {
      const { composeCharacter } = await import('./character/composer.js');
      const { PRESETS } = await import('./character/presets.js');

      let spec: import('./character/types.js').CharacterSpec;

      if (opts.preset) {
        const preset = PRESETS[opts.preset];
        if (!preset) {
          spinner.fail(`Unknown preset: "${opts.preset}". Available: ${Object.keys(PRESETS).join(', ')}`);
          process.exit(1);
        }
        spec = preset.spec;
        spinner.text = `Composing ${preset.name}...`;
      } else {
        // Resolve skin alias
        const skinVariant = SKIN_ALIASES[opts.skin] ?? opts.skin;

        // Build spec from CLI options
        const layers: import('./character/types.js').CharacterLayer[] = [
          { category: 'body', subcategory: 'body', variant: skinVariant },
        ];

        if (opts.hair) {
          const [style, color] = opts.hair.split(':');
          const resolvedStyle = HAIR_ALIASES[style] ?? `hair_${style}`;
          layers.push({ category: 'hair', subcategory: resolvedStyle, variant: color || 'brown' });
        }

        if (opts.armor) {
          const [type, variant] = opts.armor.split(':');
          layers.push({ category: 'torso', subcategory: `torso_armour_${type}`, variant: variant || 'steel' });
        }

        if (opts.weapon) {
          const [type, variant] = opts.weapon.split(':');
          layers.push({ category: 'weapons', subcategory: `weapon_${type}`, variant: variant || 'default' });
        }

        spec = {
          bodyType: opts.body as 'male' | 'female',
          layers,
        };
      }

      const buffer = await composeCharacter(spec, assetRoot, { verbose: opts.verbose });
      const outputDir = resolve(opts.output);
      await mkdir(outputDir, { recursive: true });
      await writeFile(join(outputDir, 'spritesheet.png'), buffer);
      spinner.succeed(`Character spritesheet saved to ${outputDir}/spritesheet.png`);

      if (opts.verbose) {
        const { statSync } = await import('node:fs');
        const size = statSync(join(outputDir, 'spritesheet.png')).size;
        console.log(chalk.gray(`  Output size: ${(size / 1024).toFixed(1)} KB`));
      }

      if (opts.slice) {
        const sliceSpinner = ora('Slicing into frames...').start();
        const { sliceCharacter } = await import('./character/slicer.js');
        const result = await sliceCharacter(buffer, join(outputDir, 'frames'));
        sliceSpinner.succeed(`Sliced into ${result.totalFrames} frames`);
      }

      if (opts.godot) {
        const godotSpinner = ora('Exporting Godot resources...').start();
        const { exportCharacterToGodot } = await import('./export/godot.js');
        const name = opts.preset || 'character';
        await exportCharacterToGodot(buffer, outputDir, name);
        godotSpinner.succeed('Godot resources exported');
      }
    } catch (err) {
      spinner.fail(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// === BATCH COMMAND ===
program
  .command('batch')
  .description('Generate multiple characters from a JSON config')
  .argument('<config>', 'Path to batch config JSON')
  .option('-o, --output <path>', 'Output directory', './output/batch')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (configPath: string, opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;
    const { runBatch } = await import('./character/batch.js');

    const assetRoot = await ensureAssets(PACKAGE_ROOT);
    const spinner = ora('Running batch generation...').start();

    try {
      const raw = await (await import('node:fs/promises')).readFile(resolve(configPath), 'utf-8');
      const config = JSON.parse(raw);

      if (!config.characters || config.characters.length === 0) {
        spinner.warn('Batch config has no characters to generate.');
        return;
      }
    } catch (err) {
      spinner.fail(`Failed to read batch config: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }

    const results = await runBatch(resolve(configPath), assetRoot, resolve(opts.output));

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    spinner.succeed(`Batch complete: ${succeeded} succeeded, ${failed} failed`);

    for (const r of results) {
      if (r.success) {
        console.log(chalk.green(`  ✓ ${r.name}`));
      } else {
        console.log(chalk.red(`  ✗ ${r.name}: ${r.error}`));
      }
    }
  });

// === LIST COMMAND ===
program
  .command('list')
  .description('List available assets, categories, or presets')
  .option('-c, --category <name>', 'Show detailed layers for a category (e.g., body, hair, torso)')
  .option('--presets', 'Show available character presets with descriptions')
  .option('--body-type <type>', 'Filter by body type')
  .option('--json', 'Output as JSON')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;

    // --presets: show all presets
    if (opts.presets) {
      const { PRESETS } = await import('./character/presets.js');
      console.log(chalk.bold.cyan('\nAvailable Character Presets:\n'));
      for (const [key, preset] of Object.entries(PRESETS)) {
        console.log(`  ${chalk.green(key.padEnd(14))} ${preset.description} (${preset.spec.bodyType})`);
      }
      console.log(chalk.gray(`\n  Usage: lpc-forge character --preset <name>`));
      return;
    }

    const assetRoot = await ensureAssets(PACKAGE_ROOT);
    const { loadDefinitions, listLayers } = await import('./character/definitions.js');
    const registry = await loadDefinitions(assetRoot);
    const layers = listLayers(registry);

    if (opts.category) {
      // Detailed view for a specific category
      const filtered: Record<string, typeof layers[string]> = {};
      for (const [key, val] of Object.entries(layers)) {
        if (key.includes(opts.category)) {
          filtered[key] = val;
        }
      }
      if (Object.keys(filtered).length === 0) {
        console.log(chalk.yellow(`No layers found for category "${opts.category}".`));
        console.log(chalk.gray(`Available categories: ${Object.keys(layers).join(', ')}`));
        return;
      }
      if (opts.json) {
        console.log(JSON.stringify(filtered, null, 2));
      } else {
        for (const [cat, items] of Object.entries(filtered)) {
          console.log(chalk.bold.cyan(`\n${cat}`) + chalk.gray(` (${items.length} layers)`));
          for (const item of items) {
            console.log(`  ${chalk.green(item.name)}: ${item.variants.slice(0, 8).join(', ')}${item.variants.length > 8 ? `, ... (${item.variants.length} total)` : ''}`);
          }
        }
      }
    } else {
      // Default: summary view with category counts
      if (opts.json) {
        console.log(JSON.stringify(layers, null, 2));
      } else {
        console.log(chalk.bold.cyan('\nAsset Categories:\n'));
        let total = 0;
        for (const [cat, items] of Object.entries(layers)) {
          total += items.length;
          console.log(`  ${chalk.green(cat.padEnd(14))} ${items.length} layers`);
        }
        console.log(chalk.bold(`\n  Total: ${total} layers`));
        console.log(chalk.gray('\n  Use --category <name> for details, --presets for character presets'));
      }
    }
  });

// === MAP COMMAND ===
program
  .command('map')
  .description('Generate a procedural map\n\n  Types: dungeon (BSP), cave (Cellular Automata), overworld (Diamond-Square),\n         wfc (Wave Function Collapse), town (Building placement), multifloor')
  .argument('<type>', 'Map type (dungeon, cave, overworld, wfc, town, multifloor)')
  .option('-W, --width <n>', 'Map width in tiles (min: 10)', '50')
  .option('-H, --height <n>', 'Map height in tiles (min: 10)', '50')
  .option('-s, --seed <seed>', 'Random seed')
  .option('--rooms <n>', 'Number of rooms (dungeon only, min: 1)', '12')
  .option('--room-min <n>', 'Minimum room size', '5')
  .option('--room-max <n>', 'Maximum room size', '15')
  .option('--buildings <n>', 'Number of buildings (town only)', '6')
  .option('--floors <n>', 'Number of floors (multifloor only)', '3')
  .option('-o, --output <path>', 'Output path', './output/map')
  .option('--render', 'Render visual PNG preview', true)
  .option('--godot', 'Export as Godot 4 TileMap', false)
  .option('--verbose', 'Show generation details', false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (type: string, opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;
    const spinner = ora(`Generating ${type} map...`).start();

    try {
      const width = parseInt(opts.width);
      const height = parseInt(opts.height);
      const seed = opts.seed || `map-${Date.now()}`;

      // Validate minimum dimensions
      if (width < 10 || height < 10) {
        spinner.fail(`Map dimensions too small (${width}×${height}). Minimum: 10×10`);
        process.exit(1);
      }

      let map: import('./map/types.js').GeneratedMap;

      switch (type) {
        case 'dungeon': {
          const maxRooms = parseInt(opts.rooms);
          if (maxRooms < 1) {
            spinner.fail(`--rooms must be at least 1 (got ${maxRooms})`);
            process.exit(1);
          }
          const { generateDungeon } = await import('./map/dungeon.js');
          map = generateDungeon({
            width,
            height,
            seed,
            maxRooms,
            roomMinSize: parseInt(opts.roomMin),
            roomMaxSize: parseInt(opts.roomMax),
          });
          break;
        }
        case 'cave': {
          const { generateCave } = await import('./map/cellular.js');
          map = generateCave({ width, height, seed });
          break;
        }
        case 'overworld': {
          const { generateOverworld } = await import('./map/overworld.js');
          map = generateOverworld({ width, height, seed });
          break;
        }
        case 'wfc': {
          const { generateWFC } = await import('./map/wfc.js');
          map = generateWFC({ width, height, seed });
          break;
        }
        case 'town': {
          const { generateTown } = await import('./map/town.js');
          map = generateTown({
            width,
            height,
            seed,
            buildings: parseInt(opts.buildings),
          });
          break;
        }
        case 'multifloor': {
          const { generateMultiFloor } = await import('./map/multifloor.js');
          const result = await generateMultiFloor({
            floors: parseInt(opts.floors),
            width,
            height,
            seed,
          });

          const outputDir = resolve(opts.output);
          await mkdir(outputDir, { recursive: true });

          // Save all floors data
          await writeFile(join(outputDir, 'floors.json'), JSON.stringify(result, null, 2));

          // Render each floor
          if (opts.render) {
            const { generateDefaultTileset } = await import('./tileset/registry.js');
            const { renderMap } = await import('./tileset/terrain.js');
            const tilesetDir = join(outputDir, 'tileset');
            await generateDefaultTileset(tilesetDir);
            for (let i = 0; i < result.floors.length; i++) {
              await renderMap(result.floors[i], tilesetDir, join(outputDir, `floor_${i + 1}.png`));
            }
          }

          spinner.succeed(`multifloor dungeon generated (${result.floors.length} floors, seed: ${seed})`);
          console.log((await import('chalk')).default.green(`\nOutput: ${outputDir}`));
          return;
        }
        default:
          spinner.fail(`Unknown map type: ${type}. Use: dungeon, cave, overworld, wfc, town, multifloor`);
          process.exit(1);
      }

      const outputDir = resolve(opts.output);
      await mkdir(outputDir, { recursive: true });

      // Save map data as JSON
      await writeFile(join(outputDir, 'map.json'), JSON.stringify(map, null, 2));
      spinner.succeed(`${type} map generated (${width}×${height}, ${map.rooms.length} rooms, seed: ${seed})`);

      // Render visual preview
      if (opts.render) {
        const renderSpinner = ora('Rendering map preview...').start();
        const { generateDefaultTileset } = await import('./tileset/registry.js');
        const { renderMap } = await import('./tileset/terrain.js');

        const tilesetDir = join(outputDir, 'tileset');
        await generateDefaultTileset(tilesetDir);
        await renderMap(map, tilesetDir, join(outputDir, 'map.png'));
        renderSpinner.succeed('Map preview rendered');
      }

      // Godot export
      if (opts.godot) {
        const godotSpinner = ora('Exporting Godot TileMap...').start();
        const { exportMapToGodot } = await import('./export/godot.js');
        await exportMapToGodot(map, outputDir, type);
        godotSpinner.succeed('Godot TileMap exported');
      }

      console.log(chalk.green(`\nOutput: ${outputDir}`));
    } catch (err) {
      spinner.fail(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// === INIT COMMAND ===
program
  .command('init')
  .description('Scaffold a Godot project with generated assets (use --full for premium complete game)')
  .argument('<name>', 'Project name')
  .option('--character <preset>', 'Character preset', 'warrior')
  .option('--map <type>', 'Map type (dungeon, cave, overworld)', 'dungeon')
  .option('--full', 'Generate FULL premium game (all systems, SFX, UI, lighting, particles)')
  .option('--lighting <preset>', 'Lighting preset (dungeon_dark, overworld_night, cave, etc.)')
  .option('--particles <names...>', 'Particle effects to include (rain, fireflies, torch_fire, etc.)')
  .option('--systems <names...>', 'Specific game systems to include')
  .option('--no-sfx', 'Skip SFX generation')
  .option('-o, --output <path>', 'Output directory', '.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (name: string, opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    const outputDir = resolve(opts.output, name);
    const isFull = opts.full === true;

    // Premium gate check
    if (isFull) {
      const { requireLicense } = await import('./license.js');
      await requireLicense('init --full');
    }

    try {
      // 1. Scaffold Godot project
      const scaffoldSpinner = ora('Scaffolding Godot project...').start();
      const { scaffoldGodotProject, exportCharacterToGodot, exportMapToGodot } = await import('./export/godot.js');
      await scaffoldGodotProject(outputDir, name, {
        characterName: opts.character,
        mapName: opts.map,
      });
      scaffoldSpinner.succeed('Godot project scaffolded');

      // 2. Generate character
      const charSpinner = ora(`Generating ${opts.character} character...`).start();
      const { composeCharacter } = await import('./character/composer.js');
      const { PRESETS } = await import('./character/presets.js');
      const preset = PRESETS[opts.character];
      if (!preset) {
        charSpinner.fail(`Unknown preset: ${opts.character}`);
        process.exit(1);
      }
      const assetRoot = await ensureAssets(PACKAGE_ROOT);
      const charBuffer = await composeCharacter(preset.spec, assetRoot);
      await exportCharacterToGodot(charBuffer, outputDir, opts.character);
      charSpinner.succeed(`${preset.name} character generated`);

      // 3. Generate map
      const mapSpinner = ora(`Generating ${opts.map} map...`).start();
      let map: import('./map/types.js').GeneratedMap;
      const seed = `${name}-${Date.now()}`;

      switch (opts.map) {
        case 'dungeon': {
          const { generateDungeon } = await import('./map/dungeon.js');
          map = generateDungeon({ width: 50, height: 50, seed });
          break;
        }
        case 'cave': {
          const { generateCave } = await import('./map/cellular.js');
          map = generateCave({ width: 50, height: 50, seed });
          break;
        }
        case 'overworld': {
          const { generateOverworld } = await import('./map/overworld.js');
          map = generateOverworld({ width: 60, height: 60, seed });
          break;
        }
        default: {
          const { generateDungeon } = await import('./map/dungeon.js');
          map = generateDungeon({ width: 50, height: 50, seed });
        }
      }

      await exportMapToGodot(map, outputDir, opts.map);

      const { generateDefaultTileset } = await import('./tileset/registry.js');
      const { renderMap } = await import('./tileset/terrain.js');
      const tilesetDir = join(outputDir, 'tileset');
      await generateDefaultTileset(tilesetDir);
      await renderMap(map, tilesetDir, join(outputDir, 'map_preview.png'));
      mapSpinner.succeed(`${opts.map} map generated`);

      // === PREMIUM: Full game generation ===
      if (isFull) {
        // 4. Game Systems
        const sysSpinner = ora('Generating game systems...').start();
        const { writeGameSystems } = await import('./systems/writer.js');
        const sysResult = await writeGameSystems(outputDir, opts.systems);
        sysSpinner.succeed(`${sysResult.systems.length} game systems generated (${sysResult.filesWritten} files)`);

        // 5. SFX
        if (opts.sfx !== false) {
          const sfxSpinner = ora('Generating sound effects...').start();
          const { generateAllSfx } = await import('./audio/sfx-generator.js');
          const sfxResults = await generateAllSfx(outputDir);
          sfxSpinner.succeed(`${sfxResults.length} sound effects generated`);
        }

        // 6. UI Kit
        const uiSpinner = ora('Generating UI kit...').start();
        const { generateUIKit } = await import('./ui/generator.js');
        await generateUIKit(join(outputDir, 'ui'), 'medieval');
        uiSpinner.succeed('UI kit generated');

        // 7. Item Icons
        const iconsSpinner = ora('Generating item icons...').start();
        const { generateAllIcons } = await import('./ui/icons.js');
        await generateAllIcons(join(outputDir, 'icons'));
        iconsSpinner.succeed('Item icons generated');

        // 8. Props
        const propsSpinner = ora('Generating props...').start();
        const { generateAllProps } = await import('./ui/props.js');
        await generateAllProps(join(outputDir, 'props'));
        propsSpinner.succeed('Props generated');

        // 9. Portrait
        const portraitSpinner = ora('Generating character portrait...').start();
        const { extractPortrait } = await import('./ui/portrait.js');
        await extractPortrait(charBuffer, outputDir, opts.character);
        portraitSpinner.succeed('Character portrait generated');

        // 10. Lighting
        const lightingSpinner = ora('Generating lighting presets...').start();
        const { writeAllLightingPresets } = await import('./lighting/index.js');
        const lightingFiles = await writeAllLightingPresets(outputDir);
        lightingSpinner.succeed(`${lightingFiles.length} lighting presets generated`);

        // 11. Particles
        const particleSpinner = ora('Generating particle effects...').start();
        const { writeAllParticlePresets } = await import('./lighting/index.js');
        const particleFiles = await writeAllParticlePresets(outputDir);
        particleSpinner.succeed(`${particleFiles.length} particle effects generated`);

        // 12. Generate enemy characters
        const enemySpinner = ora('Generating enemy characters...').start();
        const enemyPresets = ['skeleton', 'guard', 'thief'];
        let enemyCount = 0;
        for (const enemyPreset of enemyPresets) {
          if (PRESETS[enemyPreset]) {
            const enemyBuffer = await composeCharacter(PRESETS[enemyPreset].spec, assetRoot);
            await exportCharacterToGodot(enemyBuffer, outputDir, enemyPreset, { isPlayer: false });
            enemyCount++;
          }
        }
        enemySpinner.succeed(`${enemyCount} enemy characters generated`);

        // 13. Generate NPC characters
        const npcSpinner = ora('Generating NPC characters...').start();
        const npcPresets = ['merchant', 'healer', 'guard', 'peasant'];
        let npcCount = 0;
        for (const npcPreset of npcPresets) {
          if (PRESETS[npcPreset] && npcPreset !== 'guard') {
            const npcBuffer = await composeCharacter(PRESETS[npcPreset].spec, assetRoot);
            await exportCharacterToGodot(npcBuffer, outputDir, `npc_${npcPreset}`, { isPlayer: false });
            npcCount++;
          }
        }
        npcSpinner.succeed(`${npcCount} NPC characters generated`);

        // 14. Update project.godot with autoloads and input actions
        const projectGodotPath = join(outputDir, 'project.godot');
        let projectContent = await (await import('node:fs/promises')).readFile(projectGodotPath, 'utf-8');

        // Add autoloads section
        if (sysResult.autoloads.length > 0) {
          let autoloadSection = '\n[autoload]\n\n';
          for (const al of sysResult.autoloads) {
            autoloadSection += `${al.name}="${al.path}"\n`;
          }
          // Insert before [rendering]
          projectContent = projectContent.replace('[rendering]', autoloadSection + '[rendering]');
        }

        // Add custom input actions
        const customActions = [...new Set([...sysResult.inputActions])];
        const keyMap: Record<string, number> = {
          inventory: 73,  // I
          interact: 69,   // E
          pause: 4194305,  // Escape
          quest_log: 74,  // J
        };

        for (const action of customActions) {
          const keycode = keyMap[action] ?? 0;
          if (keycode && !projectContent.includes(`${action}=`)) {
            const inputEntry = `${action}={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":${keycode},"physical_keycode":0,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)]
}\n`;
            // Insert before [rendering]
            projectContent = projectContent.replace('[rendering]', inputEntry + '\n[rendering]');
          }
        }

        await (await import('node:fs/promises')).writeFile(projectGodotPath, projectContent);

        // Print summary
        console.log(chalk.green('\n✅ Full premium project generated!\n'));
        console.log(chalk.cyan('  📂 Project:        ') + outputDir);
        console.log(chalk.cyan('  🎮 Game Systems:   ') + sysResult.systems.join(', '));
        console.log(chalk.cyan('  🔊 Sound Effects:  ') + (opts.sfx !== false ? 'All categories' : 'Skipped'));
        console.log(chalk.cyan('  🎨 UI Kit:         ') + 'Medieval theme');
        console.log(chalk.cyan('  🖼️  Icons:          ') + 'All item icons');
        console.log(chalk.cyan('  🏗️  Props:          ') + 'All prop sprites');
        console.log(chalk.cyan('  💡 Lighting:       ') + `${lightingFiles.length} presets`);
        console.log(chalk.cyan('  ✨ Particles:      ') + `${particleFiles.length} effects`);
        console.log(chalk.cyan('  ⚔️  Enemies:        ') + `${enemyCount} characters`);
        console.log(chalk.cyan('  🧑 NPCs:           ') + `${npcCount} characters`);
        console.log(chalk.cyan('  📸 Portrait:       ') + '3 sizes');
        console.log('');
        console.log(chalk.yellow('  Autoloads added to project.godot:'));
        for (const al of sysResult.autoloads) {
          console.log(chalk.gray(`    ${al.name} → ${al.path}`));
        }
        console.log('');
        console.log(chalk.yellow('  Input Actions:'));
        for (const action of customActions) {
          const keyName = Object.entries(keyMap).find(([k]) => k === action)?.[0] ?? action;
          console.log(chalk.gray(`    ${keyName} → configured`));
        }
      } else {
        // Free tier output
        console.log(chalk.green(`\n✓ Godot project created at: ${outputDir}`));
        console.log(chalk.gray(`\nGenerated assets:`));
        console.log(chalk.gray(`  • Character: sprites/${opts.character}/`));
        console.log(chalk.gray(`  • Map: ${opts.map}.tscn`));
        console.log(chalk.gray(`  • Player script: scripts/player.gd`));
        console.log('');
        console.log(chalk.yellow('  💎 Want the full game? Run:'));
        console.log(chalk.cyan('     lpc-forge init my-game --full'));
        console.log(chalk.gray('     Includes: inventory, dialog, AI, menus, SFX, lighting, particles, and more'));
      }

      console.log(chalk.gray(`\nTo use with Godot 4.6:`));
      console.log(chalk.gray(`  1. Open Godot → Import → Select ${outputDir}/project.godot`));
      console.log(chalk.gray(`  2. Run the project (F5)`));
    } catch (err) {
      console.error(chalk.red(`Failed: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
    }
  });

// === ACTIVATE COMMAND ===
program
  .command('activate')
  .description('Activate a premium license key')
  .argument('[key]', 'License key from your purchase')
  .option('--status', 'Check current license status')
  .option('--deactivate', 'Remove stored license')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (key: string | undefined, opts: any) => {
    const chalk = (await import('chalk')).default;
    const { getLicenseInfo, activateLicense, deactivateLicense } = await import('./license.js');

    if (opts.deactivate) {
      await deactivateLicense();
      console.log(chalk.green('License deactivated.'));
      return;
    }

    if (opts.status) {
      const info = await getLicenseInfo();
      if (info && info.valid) {
        console.log(chalk.green('✅ Premium license active'));
        console.log(chalk.gray(`  Key:          ${info.key}`));
        console.log(chalk.gray(`  Email:        ${info.email}`));
        console.log(chalk.gray(`  Activated:    ${info.activatedAt}`));
        console.log(chalk.gray(`  Last Verified: ${info.lastVerifiedAt}`));
      } else if (info && !info.valid) {
        console.log(chalk.red('❌ License invalid or tampered'));
        console.log(chalk.gray('  Re-activate: lpc-forge activate <key>'));
      } else {
        console.log(chalk.yellow('No active license.'));
        console.log(chalk.gray('  Purchase at: https://blueth.online/plugins/lpc-forge'));
        console.log(chalk.gray('  Activate:    lpc-forge activate <key>'));
      }
      return;
    }

    if (!key) {
      console.log(chalk.yellow('Usage: lpc-forge activate <license-key>'));
      console.log(chalk.gray('  Purchase at: https://blueth.online/plugins/lpc-forge'));
      return;
    }

    const ora = (await import('ora')).default;
    const spinner = ora('Activating license...').start();

    const result = await activateLicense(key);

    if (result.success) {
      spinner.succeed(chalk.green(result.message));
      console.log(chalk.cyan('\n  You now have access to premium features!'));
      console.log(chalk.gray('  Try: lpc-forge init my-game --full'));
    } else {
      spinner.fail(chalk.red(result.message));
    }
  });

// === LIGHTING COMMAND ===
program
  .command('lighting')
  .description('Generate lighting presets for Godot scenes')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('-p, --preset <name>', 'Specific lighting preset')
  .option('--list', 'List available lighting presets')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    if (opts.list) {
      const { listLightingPresets, getLightingPreset } = await import('./lighting/index.js');
      console.log(chalk.bold.cyan('\nAvailable Lighting Presets:\n'));
      for (const name of listLightingPresets()) {
        const preset = getLightingPreset(name)!;
        const lights = preset.lights.length > 0 ? ` (${preset.lights.length} light${preset.lights.length > 1 ? 's' : ''})` : '';
        console.log(`  ${chalk.green(name)}: ${preset.description}${lights}`);
      }
      return;
    }

    // Premium gate
    const { requireLicense } = await import('./license.js');
    await requireLicense('lighting');

    const spinner = ora('Generating lighting presets...').start();

    try {
      if (opts.preset) {
        const { getLightingPreset, generateLightingScene } = await import('./lighting/index.js');
        const preset = getLightingPreset(opts.preset);
        if (!preset) {
          spinner.fail(chalk.red(`Unknown preset: ${opts.preset}`));
          process.exit(1);
        }
        const { mkdir, writeFile } = await import('node:fs/promises');
        const outDir = resolve(opts.output, 'lighting');
        await mkdir(outDir, { recursive: true });
        const scene = generateLightingScene(preset);
        await writeFile(join(outDir, `lighting_${opts.preset}.tscn`), scene);
        spinner.succeed(chalk.green(`Lighting preset "${opts.preset}" → ${opts.output}/lighting/`));
      } else {
        const { writeAllLightingPresets } = await import('./lighting/index.js');
        const files = await writeAllLightingPresets(resolve(opts.output));
        spinner.succeed(chalk.green(`${files.length} lighting presets → ${opts.output}/lighting/`));
      }
    } catch (err) {
      spinner.fail(chalk.red('Failed'));
      console.error(err);
      process.exit(1);
    }
  });

// === PARTICLES COMMAND ===
program
  .command('particles')
  .description('Generate particle effect scenes for Godot')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('-p, --preset <name>', 'Specific particle preset')
  .option('--list', 'List available particle effects')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    if (opts.list) {
      const { listParticlePresets, getParticlePreset } = await import('./lighting/index.js');
      console.log(chalk.bold.cyan('\nAvailable Particle Effects:\n'));
      for (const name of listParticlePresets()) {
        const preset = getParticlePreset(name)!;
        console.log(`  ${chalk.green(name)}: ${preset.description}`);
      }
      return;
    }

    // Premium gate
    const { requireLicense } = await import('./license.js');
    await requireLicense('particles');

    const spinner = ora('Generating particle effects...').start();

    try {
      if (opts.preset) {
        const { getParticlePreset } = await import('./lighting/index.js');
        const preset = getParticlePreset(opts.preset);
        if (!preset) {
          spinner.fail(chalk.red(`Unknown preset: ${opts.preset}`));
          process.exit(1);
        }
        const { mkdir, writeFile } = await import('node:fs/promises');
        const outDir = resolve(opts.output, 'particles');
        await mkdir(outDir, { recursive: true });
        await writeFile(join(outDir, `${opts.preset}.tscn`), preset.scene);
        spinner.succeed(chalk.green(`Particle "${opts.preset}" → ${opts.output}/particles/`));
      } else {
        const { writeAllParticlePresets } = await import('./lighting/index.js');
        const files = await writeAllParticlePresets(resolve(opts.output));
        spinner.succeed(chalk.green(`${files.length} particle effects → ${opts.output}/particles/`));
      }
    } catch (err) {
      spinner.fail(chalk.red('Failed'));
      console.error(err);
      process.exit(1);
    }
  });

// === SFX COMMAND ===
program
  .command('sfx')
  .description('Generate 8-bit sound effects for your game')
  .option('-o, --output <path>', 'Output directory', './output/audio')
  .option('-c, --category <category>', 'Only generate sounds from this category')
  .option('--list', 'List all available SFX presets')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    if (opts.list) {
      const { getPresetsByCategory } = await import('./audio/index.js');
      const grouped = getPresetsByCategory();

      for (const [category, presets] of Object.entries(grouped)) {
        console.log(chalk.bold.cyan(`\n${category.toUpperCase()} (${presets.length})`));
        for (const preset of presets) {
          console.log(`  ${chalk.green(preset.name.toLowerCase().replaceAll(/\s+/g, '_'))}: ${preset.description}`);
        }
      }
      const total = Object.values(grouped).reduce((sum, p) => sum + p.length, 0);
      console.log(chalk.bold(`\n${total} sound effects available`));
      return;
    }

    // Premium gate
    const { requireLicense } = await import('./license.js');
    await requireLicense('sfx');

    const spinner = ora('Generating sound effects...').start();

    try {
      const { generateAllSfx } = await import('./audio/index.js');
      const results = await generateAllSfx(opts.output, {
        category: opts.category,
      });

      spinner.succeed(chalk.green(`Generated ${results.length} sound effects → ${opts.output}/sfx/`));

      // Group results by category for summary
      const byCategory: Record<string, number> = {};
      for (const r of results) {
        byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      }
      for (const [cat, count] of Object.entries(byCategory)) {
        console.log(`  ${chalk.cyan(cat)}: ${count} sounds`);
      }
    } catch (err) {
      spinner.fail(chalk.red('SFX generation failed'));
      console.error(err);
      process.exit(1);
    }
  });

// === UI KIT COMMAND ===
program
  .command('ui')
  .description('Generate pixel-art UI kit (panels, buttons, bars, slots, cursors)')
  .option('-o, --output <path>', 'Output directory', './output/ui')
  .option('-t, --theme <name>', 'Theme name (medieval, dark, nature, ice, fire, royal)', 'medieval')
  .option('--all-themes', 'Generate for ALL themes')
  .option('--list-themes', 'List available themes')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    if (opts.listThemes) {
      const { listThemes, UI_THEMES } = await import('./ui/index.js');
      console.log(chalk.bold.cyan('\nAvailable UI Themes:\n'));
      for (const name of listThemes()) {
        const t = UI_THEMES[name];
        console.log(`  ${chalk.green(name)}: ${t.name}`);
      }
      return;
    }

    // Premium gate
    const { requireLicense } = await import('./license.js');
    await requireLicense('ui');

    const spinner = ora('Generating UI kit...').start();

    try {
      const { generateUIKit, listThemes } = await import('./ui/index.js');

      if (opts.allThemes) {
        const themes = listThemes();
        let total = 0;
        for (const theme of themes) {
          const result = await generateUIKit(opts.output, theme);
          total += result.totalAssets;
          spinner.text = `Generated ${theme} theme (${result.totalAssets} assets)...`;
        }
        spinner.succeed(chalk.green(`Generated ${total} UI assets across ${themes.length} themes → ${opts.output}/ui/`));
      } else {
        const result = await generateUIKit(opts.output, opts.theme);
        spinner.succeed(chalk.green(`Generated ${result.totalAssets} UI assets (${opts.theme}) → ${opts.output}/ui/`));
        console.log(`  ${chalk.cyan('Panels')}: ${result.panels.length}`);
        console.log(`  ${chalk.cyan('Buttons')}: ${result.buttons.length}`);
        console.log(`  ${chalk.cyan('Frames')}: ${result.frames.length}`);
        console.log(`  ${chalk.cyan('Bars')}: ${result.bars.length}`);
        console.log(`  ${chalk.cyan('Slots')}: ${result.slots.length}`);
        console.log(`  ${chalk.cyan('Cursors')}: ${result.cursors.length}`);
      }
    } catch (err) {
      spinner.fail(chalk.red('UI generation failed'));
      console.error(err);
      process.exit(1);
    }
  });

// === PORTRAIT COMMAND ===
program
  .command('portrait')
  .description('Extract character portrait from a composited spritesheet')
  .requiredOption('-i, --input <path>', 'Path to character spritesheet PNG')
  .option('-n, --name <name>', 'Character name for output files', 'character')
  .option('-o, --output <path>', 'Output directory', './output')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    // Premium gate
    const { requireLicense } = await import('./license.js');
    await requireLicense('portrait');

    const { readFile } = await import('node:fs/promises');

    const spinner = ora('Extracting portrait...').start();

    try {
      const { extractPortrait } = await import('./ui/portrait.js');
      const sheetBuffer = await readFile(resolve(opts.input));
      const results = await extractPortrait(sheetBuffer, opts.output, opts.name);

      spinner.succeed(chalk.green(`Extracted ${results.length} portrait sizes → ${opts.output}/portraits/`));
      for (const r of results) {
        console.log(`  ${chalk.cyan(r.size + 'px')}: ${r.path}`);
      }
    } catch (err) {
      spinner.fail(chalk.red('Portrait extraction failed'));
      console.error(err);
      process.exit(1);
    }
  });

// === PROPS COMMAND ===
program
  .command('props')
  .description('Generate pixel-art prop sprites (chests, barrels, torches, etc.)')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('--list', 'List available props')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    if (opts.list) {
      const { listProps } = await import('./ui/props.js');
      const props = listProps();
      console.log(chalk.bold.cyan(`\nAvailable Props (${props.length}):\n`));
      for (const p of props) {
        console.log(`  ${chalk.green(p.name)} (${p.width}x${p.height}) — ${p.description}`);
      }
      return;
    }

    // Premium gate
    const { requireLicense } = await import('./license.js');
    await requireLicense('props');

    const spinner = ora('Generating props...').start();

    try {
      const { generateAllProps } = await import('./ui/props.js');
      const paths = await generateAllProps(opts.output);
      spinner.succeed(chalk.green(`Generated ${paths.length} props → ${opts.output}/props/`));
    } catch (err) {
      spinner.fail(chalk.red('Props generation failed'));
      console.error(err);
      process.exit(1);
    }
  });

// === ICONS COMMAND ===
program
  .command('icons')
  .description('Generate pixel-art item icons + atlas')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('--list', 'List available icons')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    if (opts.list) {
      const { listIcons } = await import('./ui/icons.js');
      const icons = listIcons();

      const byCategory: Record<string, IconEntry[]> = {};
      for (const i of icons) {
        if (!byCategory[i.category]) byCategory[i.category] = [];
        byCategory[i.category].push(i);
      }

      for (const [cat, items] of Object.entries(byCategory)) {
        console.log(chalk.bold.cyan(`\n${cat.toUpperCase()} (${items.length})`));
        for (const i of items) {
          console.log(`  ${chalk.green(i.name)}: ${i.description}`);
        }
      }
      console.log(chalk.bold(`\n${icons.length} icons available`));
      return;
    }

    // Premium gate
    const { requireLicense } = await import('./license.js');
    await requireLicense('icons');

    const spinner = ora('Generating icons...').start();

    try {
      const { generateAllIcons } = await import('./ui/icons.js');
      const { icons, atlas } = await generateAllIcons(opts.output);
      spinner.succeed(chalk.green(`Generated ${icons.length} icons + atlas → ${opts.output}/icons/`));
      console.log(`  ${chalk.cyan('Atlas')}: ${atlas}`);
    } catch (err) {
      spinner.fail(chalk.red('Icon generation failed'));
      console.error(err);
      process.exit(1);
    }
  });

// === SYSTEMS COMMAND ===
program
  .command('systems')
  .description('Generate GDScript game systems (enemy AI, inventory, dialog, etc.)')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('-s, --system <names...>', 'Specific systems to generate (default: all)')
  .option('--list', 'List available game systems')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    if (opts.list) {
      const { getAllSystems } = await import('./systems/index.js');
      const systems = getAllSystems();
      console.log(chalk.bold.cyan(`\nAvailable Game Systems (${systems.length}):\n`));
      for (const sys of systems) {
        const deps = sys.dependencies.length > 0 ? ` (needs: ${sys.dependencies.join(', ')})` : '';
        const autoloads = sys.autoloads.length > 0 ? ` [autoload: ${sys.autoloads.map(a => a.name).join(', ')}]` : '';
        console.log(`  ${chalk.green(sys.name)}: ${sys.description}${deps}${autoloads}`);
        console.log(`    Files: ${sys.files.map(f => f.path).join(', ')}`);
      }
      return;
    }

    // Premium gate
    const { requireLicense } = await import('./license.js');
    await requireLicense('systems');

    const spinner = ora('Generating game systems...').start();

    try {
      const { writeGameSystems } = await import('./systems/writer.js');
      const result = await writeGameSystems(resolve(opts.output), opts.system);

      spinner.succeed(chalk.green(`Generated ${result.filesWritten} files across ${result.systems.length} systems → ${opts.output}/`));
      console.log(`  ${chalk.cyan('Systems')}: ${result.systems.join(', ')}`);
      if (result.autoloads.length > 0) {
        console.log(`  ${chalk.yellow('Autoloads (add to project.godot):')}`);
        for (const al of result.autoloads) {
          console.log(`    ${al.name} = "${al.path}"`);
        }
      }
      if (result.inputActions.length > 0) {
        console.log(`  ${chalk.yellow('Input Actions (add to project settings):')}`);
        for (const action of result.inputActions) {
          console.log(`    ${action}`);
        }
      }
    } catch (err) {
      spinner.fail(chalk.red('System generation failed'));
      console.error(err);
      process.exit(1);
    }
  });

// === SETUP COMMAND ===
program
  .command('setup')
  .description('Download and install LPC sprite assets (~1.3 GB)')
  .option('--minimal', 'Download only required assets (body + definitions, ~200 MB)')
  .option('--check', 'Check if assets are installed and up to date')
  .option('--clean', 'Remove cached assets')
  .option('--path <dir>', 'Custom asset directory (also set via LPC_FORGE_ASSETS env var)')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const {
      isAssetsInstalled, getAssetDir, cleanAssets, downloadWithProgress,
    } = await import('./assets/manager.js');

    if (opts.check) {
      const status = await isAssetsInstalled();
      if (status.installed) {
        console.log(chalk.green('✅ Assets installed'));
        console.log(chalk.gray(`   Version: ${status.version}`));
        console.log(chalk.gray(`   Location: ${status.path}`));
        if (status.chunks) {
          console.log(chalk.gray(`   Chunks: ${status.chunks.join(', ')}`));
        }
      } else {
        console.log(chalk.yellow('⚠️  Assets not installed'));
        console.log(chalk.gray(`   Expected at: ${status.path}`));
        if (status.version) {
          console.log(chalk.gray(`   Found version: ${status.version} (may need update)`));
        }
        console.log(chalk.gray('\n   Run: lpc-forge setup'));
      }
      return;
    }

    if (opts.clean) {
      const dir = opts.path || getAssetDir();
      const ora = (await import('ora')).default;
      const spinner = ora('Removing cached assets...').start();
      await cleanAssets(dir);
      spinner.succeed(`Assets removed from ${dir}`);
      return;
    }

    // Download
    await downloadWithProgress({
      minimal: opts.minimal,
      path: opts.path,
    });
  });

program.parse();
