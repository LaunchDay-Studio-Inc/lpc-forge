#!/usr/bin/env node
import { Command } from 'commander';
import { resolve, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const program = new Command();

program
  .name('lpc-forge')
  .description('Complete 2D game asset pipeline — character compositor, map generator, Godot 4 exporter')
  .version('0.1.0');

// === CHARACTER COMMAND ===
program
  .command('character')
  .description('Generate a character spritesheet')
  .option('-p, --preset <name>', 'Use a preset (warrior, mage, rogue, ranger, villager)')
  .option('-b, --body <type>', 'Body type (male, female, muscular, teen, child, pregnant)', 'male')
  .option('--skin <variant>', 'Skin color variant', 'light')
  .option('--hair <style:color>', 'Hair style and color (e.g., "plain:brown")')
  .option('--armor <type:variant>', 'Armor type and variant')
  .option('--weapon <type:variant>', 'Weapon type and variant')
  .option('-o, --output <path>', 'Output path', './output/character')
  .option('--slice', 'Also slice into individual frames', false)
  .option('--godot', 'Export as Godot 4 resources', false)
  .option('--list-layers', 'List all available layers and variants')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    if (opts.listLayers) {
      const { loadDefinitions, listLayers } = await import('./character/definitions.js');
      const registry = await loadDefinitions(REPO_ROOT);
      const layers = listLayers(registry);

      for (const [category, items] of Object.entries(layers)) {
        console.log(chalk.bold.cyan(`\n${category}`));
        for (const item of items) {
          console.log(`  ${chalk.green(item.name)}: ${item.variants.slice(0, 8).join(', ')}${item.variants.length > 8 ? '...' : ''}`);
        }
      }
      return;
    }

    const spinner = ora('Composing character...').start();

    try {
      const { composeCharacter } = await import('./character/composer.js');
      const { PRESETS } = await import('./character/presets.js');

      let spec: import('./character/types.js').CharacterSpec;

      if (opts.preset) {
        const preset = PRESETS[opts.preset];
        if (!preset) {
          spinner.fail(`Unknown preset: ${opts.preset}. Available: ${Object.keys(PRESETS).join(', ')}`);
          process.exit(1);
        }
        spec = preset.spec;
        spinner.text = `Composing ${preset.name}...`;
      } else {
        // Build spec from CLI options
        const layers: import('./character/types.js').CharacterLayer[] = [
          { category: 'body', subcategory: 'body', variant: opts.skin },
        ];

        if (opts.hair) {
          const [style, color] = opts.hair.split(':');
          layers.push({ category: 'hair', subcategory: `hair_${style}`, variant: color || 'brown' });
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

      const buffer = await composeCharacter(spec, REPO_ROOT);
      const outputDir = resolve(opts.output);
      await mkdir(outputDir, { recursive: true });
      await writeFile(join(outputDir, 'spritesheet.png'), buffer);
      spinner.succeed(`Character spritesheet saved to ${outputDir}/spritesheet.png`);

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

    const spinner = ora('Running batch generation...').start();
    const results = await runBatch(resolve(configPath), REPO_ROOT, resolve(opts.output));

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
  .description('List available assets')
  .option('-c, --category <name>', 'Filter by category')
  .option('--body-type <type>', 'Filter by body type')
  .option('--json', 'Output as JSON')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (opts: any) => {
    const { loadDefinitions, listLayers } = await import('./character/definitions.js');
    const registry = await loadDefinitions(REPO_ROOT);
    const layers = listLayers(registry);

    if (opts.category) {
      const filtered: Record<string, typeof layers[string]> = {};
      for (const [key, val] of Object.entries(layers)) {
        if (key.includes(opts.category)) {
          filtered[key] = val;
        }
      }
      if (opts.json) {
        console.log(JSON.stringify(filtered, null, 2));
      } else {
        for (const [cat, items] of Object.entries(filtered)) {
          console.log(`\n${cat}:`);
          for (const item of items) {
            console.log(`  ${item.name}: ${item.variants.join(', ')}`);
          }
        }
      }
    } else {
      if (opts.json) {
        console.log(JSON.stringify(layers, null, 2));
      } else {
        for (const [cat, items] of Object.entries(layers)) {
          console.log(`\n${cat}:`);
          for (const item of items) {
            console.log(`  ${item.name}: ${item.variants.join(', ')}`);
          }
        }
      }
    }
  });

// === MAP COMMAND ===
program
  .command('map')
  .description('Generate a procedural map')
  .argument('<type>', 'Map type (dungeon, cave, overworld, wfc, town, multifloor)')
  .option('-W, --width <n>', 'Map width in tiles', '50')
  .option('-H, --height <n>', 'Map height in tiles', '50')
  .option('-s, --seed <seed>', 'Random seed')
  .option('--rooms <n>', 'Number of rooms (dungeon only)', '12')
  .option('--room-min <n>', 'Minimum room size', '5')
  .option('--room-max <n>', 'Maximum room size', '15')
  .option('--buildings <n>', 'Number of buildings (town only)', '6')
  .option('--floors <n>', 'Number of floors (multifloor only)', '3')
  .option('-o, --output <path>', 'Output path', './output/map')
  .option('--render', 'Render visual PNG preview', true)
  .option('--godot', 'Export as Godot 4 TileMap', false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (type: string, opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;
    const spinner = ora(`Generating ${type} map...`).start();

    try {
      const width = parseInt(opts.width);
      const height = parseInt(opts.height);
      const seed = opts.seed || `map-${Date.now()}`;

      let map: import('./map/types.js').GeneratedMap;

      switch (type) {
        case 'dungeon': {
          const { generateDungeon } = await import('./map/dungeon.js');
          map = generateDungeon({
            width,
            height,
            seed,
            maxRooms: parseInt(opts.rooms),
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
  .description('Scaffold a complete Godot project with generated assets')
  .argument('<name>', 'Project name')
  .option('--character <preset>', 'Character preset', 'warrior')
  .option('--map <type>', 'Map type (dungeon, cave, overworld)', 'dungeon')
  .option('-o, --output <path>', 'Output directory', '.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .action(async (name: string, opts: any) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    const outputDir = resolve(opts.output, name);

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
      const charBuffer = await composeCharacter(preset.spec, REPO_ROOT);
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

      // Also render a visual preview
      const { generateDefaultTileset } = await import('./tileset/registry.js');
      const { renderMap } = await import('./tileset/terrain.js');
      const tilesetDir = join(outputDir, 'tileset');
      await generateDefaultTileset(tilesetDir);
      await renderMap(map, tilesetDir, join(outputDir, 'map_preview.png'));

      mapSpinner.succeed(`${opts.map} map generated`);

      // 4. Done
      console.log(chalk.green(`\n✓ Godot project created at: ${outputDir}`));
      console.log(chalk.gray(`\nTo use with Godot 4.6:`));
      console.log(chalk.gray(`  1. Open Godot → Import → Select ${outputDir}/project.godot`));
      console.log(chalk.gray(`  2. Run the project (F5)`));
      console.log(chalk.gray(`\nGenerated assets:`));
      console.log(chalk.gray(`  • Character: sprites/${opts.character}/`));
      console.log(chalk.gray(`  • Map: ${opts.map}.tscn`));
      console.log(chalk.gray(`  • Player script: scripts/player.gd`));
    } catch (err) {
      console.error(chalk.red(`Failed: ${err instanceof Error ? err.message : String(err)}`));
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

program.parse();
