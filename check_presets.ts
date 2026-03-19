import { loadDefinitions, findDefinition } from './src/character/definitions.ts';

async function main() {
  const reg = await loadDefinitions('.');
  
  const presetChecks: [string, string, string][] = [
    // warrior
    ['body', 'body', 'light'],
    ['hair', 'hair_plain', 'brown'],
    ['torso', 'torso_armour_plate', 'steel'],
    ['legs', 'legs_armour', 'steel'],
    ['feet', 'feet_armour', 'steel'],
    // mage  
    ['hair', 'hair_plain', 'white'],
    ['torso', 'torso_robe', 'blue'],
    // rogue
    ['body', 'body', 'olive'],
    ['hair', 'hair_plain', 'black'],
    ['torso', 'torso_armour_leather', 'brown'],
    ['legs', 'legs_pants', 'teal'],
    ['feet', 'feet_shoes', 'brown'],
    // ranger
    ['body', 'body', 'bronze'],
    ['hair', 'hair_plain', 'chestnut'],
    ['torso', 'torso_shirt', 'green'],
    ['legs', 'legs_pants', 'brown'],
    ['feet', 'feet_boots', 'brown'],
    // villager
    ['body', 'body', 'amber'],
    ['hair', 'hair_plain', 'blonde'],
    ['torso', 'torso_shirt', 'white'],
    ['legs', 'legs_pants', 'brown'],
    ['feet', 'feet_shoes', 'brown'],
  ];
  
  for (const [cat, sub, variant] of presetChecks) {
    const def = findDefinition(reg, cat, sub);
    if (!def) {
      console.log('MISSING DEF: ' + cat + '/' + sub);
      continue;
    }
    const hasVariant = def.variants.includes(variant);
    if (hasVariant) {
      console.log(cat + '/' + sub + ':' + variant + ' → OK');
    } else {
      console.log(cat + '/' + sub + ':' + variant + ' → VARIANT NOT FOUND! Available: ' + def.variants.slice(0,15).join(', '));
    }
  }
}

main();
