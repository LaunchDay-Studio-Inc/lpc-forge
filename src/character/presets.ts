import type { CharacterPreset } from './types.js';

/**
 * Pre-built character configurations.
 * Layer paths verified against actual spritesheets/ and sheet_definitions/ contents.
 */
export const PRESETS: Record<string, CharacterPreset> = {
  warrior: {
    name: 'Warrior',
    description: 'Plate armor, longsword, chestnut hair',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'light' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'chestnut' },
        { category: 'torso', subcategory: 'torso_armour_plate', variant: 'steel' },
        { category: 'legs', subcategory: 'legs_armour', variant: 'steel' },
        { category: 'feet', subcategory: 'feet_armour', variant: 'steel' },
      ],
    },
  },
  mage: {
    name: 'Mage',
    description: 'Blue longsleeve, white hair',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'light' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'white' },
        { category: 'torso', subcategory: 'torso_clothes_longsleeve', variant: 'blue' },
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
        { category: 'feet', subcategory: 'feet_shoes_basic', variant: 'brown' },
      ],
    },
  },
  ranger: {
    name: 'Ranger',
    description: 'Green tunic, bow, chestnut hair',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'bronze' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'chestnut' },
        { category: 'torso', subcategory: 'torso_clothes_shortsleeve', variant: 'green' },
        { category: 'legs', subcategory: 'legs_pants', variant: 'brown' },
        { category: 'feet', subcategory: 'feet_boots_basic', variant: 'brown' },
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
        { category: 'torso', subcategory: 'torso_clothes_shortsleeve', variant: 'white' },
        { category: 'legs', subcategory: 'legs_pants', variant: 'brown' },
        { category: 'feet', subcategory: 'feet_shoes_basic', variant: 'brown' },
      ],
    },
  },
  paladin: {
    name: 'Paladin',
    description: 'Plate armor, shield, divine protector',
    spec: {
      bodyType: 'female',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'light' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'blonde' },
        { category: 'torso', subcategory: 'torso_armour_plate', variant: 'gold' },
        { category: 'legs', subcategory: 'legs_armour', variant: 'gold' },
        { category: 'feet', subcategory: 'feet_armour', variant: 'gold' },
        { category: 'weapons', subcategory: 'shield_crusader', variant: 'crusader' },
      ],
    },
  },
  necromancer: {
    name: 'Necromancer',
    description: 'Dark robes, white hair, staff',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'light' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'white' },
        { category: 'torso', subcategory: 'torso_clothes_robe', variant: 'black' },
        { category: 'weapons', subcategory: 'weapon_magic_gnarled', variant: 'dark' },
      ],
    },
  },
  knight: {
    name: 'Knight',
    description: 'Full plate, helm, sword',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'light' },
        { category: 'torso', subcategory: 'torso_armour_plate', variant: 'steel' },
        { category: 'legs', subcategory: 'legs_armour', variant: 'steel' },
        { category: 'feet', subcategory: 'feet_armour', variant: 'steel' },
        { category: 'arms', subcategory: 'arms_armour', variant: 'steel' },
        { category: 'headwear', subcategory: 'hat_helmet_barbuta', variant: 'steel' },
        { category: 'weapons', subcategory: 'weapon_sword_longsword', variant: 'longsword' },
      ],
    },
  },
  barbarian: {
    name: 'Barbarian',
    description: 'Muscular body, minimal armor, waraxe',
    spec: {
      bodyType: 'muscular',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'bronze' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'redhead' },
        { category: 'legs', subcategory: 'legs_fur', variant: 'base' },
        { category: 'feet', subcategory: 'feet_boots_basic', variant: 'brown' },
        { category: 'weapons', subcategory: 'weapon_blunt_waraxe', variant: 'waraxe' },
      ],
    },
  },
  monk: {
    name: 'Monk',
    description: 'Simple robes, bald, no weapon',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'olive' },
        { category: 'hair', subcategory: 'hair_buzzcut', variant: 'black' },
        { category: 'torso', subcategory: 'torso_clothes_robe', variant: 'brown' },
        { category: 'feet', subcategory: 'feet_sandals', variant: 'brown' },
      ],
    },
  },
  thief: {
    name: 'Thief',
    description: 'Dark clothes, hood, dagger',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'olive' },
        { category: 'torso', subcategory: 'torso_armour_leather', variant: 'black' },
        { category: 'legs', subcategory: 'legs_pants', variant: 'charcoal' },
        { category: 'feet', subcategory: 'feet_shoes_basic', variant: 'black' },
        { category: 'headwear', subcategory: 'hat_hood_cloth', variant: 'hood_black' },
        { category: 'weapons', subcategory: 'weapon_sword_dagger', variant: 'dagger' },
      ],
    },
  },
  healer: {
    name: 'Healer',
    description: 'White robes, staff',
    spec: {
      bodyType: 'female',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'light' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'auburn' },
        { category: 'torso', subcategory: 'torso_clothes_robe', variant: 'white' },
        { category: 'weapons', subcategory: 'weapon_magic_loop', variant: 'light' },
      ],
    },
  },
  archer: {
    name: 'Archer',
    description: 'Leather armor, bow',
    spec: {
      bodyType: 'female',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'bronze' },
        { category: 'hair', subcategory: 'hair_ponytail', variant: 'brunette' },
        { category: 'torso', subcategory: 'torso_armour_leather', variant: 'forest' },
        { category: 'legs', subcategory: 'legs_pants', variant: 'brown' },
        { category: 'feet', subcategory: 'feet_boots_basic', variant: 'brown' },
        { category: 'weapons', subcategory: 'weapon_ranged_bow_normal', variant: 'medium' },
      ],
    },
  },
  merchant: {
    name: 'Merchant',
    description: 'Fancy clothes, no weapon, hat',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'light' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'brown' },
        { category: 'torso', subcategory: 'torso_clothes_longsleeve', variant: 'maroon' },
        { category: 'legs', subcategory: 'legs_formal', variant: 'base' },
        { category: 'feet', subcategory: 'feet_shoes_basic', variant: 'brown' },
        { category: 'headwear', subcategory: 'hat_formal_tophat', variant: 'base' },
      ],
    },
  },
  guard: {
    name: 'Guard',
    description: 'Chainmail, spear, helm',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'light' },
        { category: 'hair', subcategory: 'hair_plain', variant: 'brown' },
        { category: 'torso', subcategory: 'torso_chainmail', variant: 'gray' },
        { category: 'legs', subcategory: 'legs_armour', variant: 'iron' },
        { category: 'feet', subcategory: 'feet_armour', variant: 'iron' },
        { category: 'headwear', subcategory: 'hat_helmet_mail', variant: 'iron' },
        { category: 'weapons', subcategory: 'weapon_polearm_spear', variant: 'medium' },
      ],
    },
  },
  skeleton: {
    name: 'Skeleton',
    description: 'Undead skeleton body',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body_skeleton', variant: 'skeleton' },
        { category: 'head', subcategory: 'heads_skeleton', variant: 'skeleton' },
      ],
    },
  },
  peasant: {
    name: 'Peasant',
    description: 'Ragged simple clothes, tool',
    spec: {
      bodyType: 'male',
      layers: [
        { category: 'body', subcategory: 'body', variant: 'amber' },
        { category: 'hair', subcategory: 'hair_messy1', variant: 'brown' },
        { category: 'torso', subcategory: 'torso_clothes_shortsleeve', variant: 'brown' },
        { category: 'legs', subcategory: 'legs_pants', variant: 'brown' },
        { category: 'feet', subcategory: 'feet_shoes_basic', variant: 'brown' },
        { category: 'tools', subcategory: 'tool_thrust', variant: 'hoe' },
      ],
    },
  },
};
