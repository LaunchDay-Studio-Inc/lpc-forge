import type { CharacterPreset } from './types.js';

/**
 * Pre-built character configurations.
 * Layer paths verified against actual spritesheets/ and sheet_definitions/ contents.
 */
export const PRESETS: Record<string, CharacterPreset> = {
  warrior: {
    name: 'Warrior',
    description: 'Plate armor, longsword, brown hair',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'light' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'brown' },
        { category: 'torso', subcategory: 'torso_armour_plate', variant: 'steel' },
        { category: 'legs', subcategory: 'legs_armour', variant: 'steel' },
        { category: 'feet', subcategory: 'feet_armour', variant: 'steel' },
      ],
    },
  },
  mage: {
    name: 'Mage',
    description: 'Blue robe, white hair',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'light' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'white' },
        { category: 'torso', subcategory: 'torso_robe', variant: 'blue' },
      ],
    },
  },
  rogue: {
    name: 'Rogue',
    description: 'Leather armor, dark hair',
    spec: {
      bodyType: 'female',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'olive' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'black' },
        { category: 'torso', subcategory: 'torso_armour_leather', variant: 'brown' },
        { category: 'legs', subcategory: 'legs_pants', variant: 'teal' },
        { category: 'feet', subcategory: 'feet_shoes', variant: 'brown' },
      ],
    },
  },
  ranger: {
    name: 'Ranger',
    description: 'Green tunic, bow, brown hair',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'bronze' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'chestnut' },
        { category: 'torso', subcategory: 'torso_shirt', variant: 'green' },
        { category: 'legs', subcategory: 'legs_pants', variant: 'brown' },
        { category: 'feet', subcategory: 'feet_boots', variant: 'brown' },
      ],
    },
  },
  villager: {
    name: 'Villager',
    description: 'Simple clothes, no weapon',
    spec: {
      bodyType: 'female',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'amber' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'blonde' },
        { category: 'torso', subcategory: 'torso_shirt', variant: 'white' },
        { category: 'legs', subcategory: 'legs_pants', variant: 'brown' },
        { category: 'feet', subcategory: 'feet_shoes', variant: 'brown' },
      ],
    },
  },
};
