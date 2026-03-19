import type { SfxPreset } from './types.js';

// Helper: jsfxr params are [waveType, attackTime, sustainTime, sustainPunch,
//   decayTime, startFreq, minFreq, slide, deltaSlide, vibratoDepth,
//   vibratoSpeed, changeAmount, changeSpeed, squareDuty, dutySweep,
//   repeatSpeed, phaserOffset, phaserSweep, lpFilterCutoff,
//   lpFilterCutoffSweep, lpFilterResonance, hpFilterCutoff,
//   hpFilterCutoffSweep, volume]

export const SFX_PRESETS: Record<string, SfxPreset> = {
  // === COMBAT (10) ===
  sword_hit: {
    name: 'Sword Hit',
    category: 'combat',
    description: 'Metal sword striking an enemy',
    params: [1, 0, 0.1, 0.3, 0.15, 0.5, 0.2, -0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5],
  },
  sword_swing: {
    name: 'Sword Swing',
    category: 'combat',
    description: 'Sword swinging through air (miss)',
    params: [3, 0, 0.05, 0, 0.2, 0.6, 0.1, -0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, -0.3, 0, 0.1, 0, 0.4],
  },
  bow_release: {
    name: 'Bow Release',
    category: 'combat',
    description: 'Arrow fired from bow',
    params: [3, 0, 0.05, 0.2, 0.1, 0.8, 0.3, -0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.4],
  },
  arrow_hit: {
    name: 'Arrow Hit',
    category: 'combat',
    description: 'Arrow striking target',
    params: [3, 0, 0.05, 0.4, 0.1, 0.4, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 0.5],
  },
  shield_block: {
    name: 'Shield Block',
    category: 'combat',
    description: 'Attack blocked by shield',
    params: [3, 0, 0.1, 0.5, 0.2, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, -0.1, 1, 0, 0, 0, 0, 0.6],
  },
  player_hurt: {
    name: 'Player Hurt',
    category: 'combat',
    description: 'Player taking damage',
    params: [3, 0, 0.1, 0, 0.3, 0.3, 0.1, -0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5],
  },
  enemy_hurt: {
    name: 'Enemy Hurt',
    category: 'combat',
    description: 'Enemy taking damage',
    params: [3, 0, 0.08, 0, 0.25, 0.4, 0.15, -0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5],
  },
  enemy_death: {
    name: 'Enemy Death',
    category: 'combat',
    description: 'Enemy defeated/dying',
    params: [3, 0, 0.2, 0, 0.5, 0.3, 0, -0.1, -0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, -0.2, 0, 0, 0, 0.5],
  },
  critical_hit: {
    name: 'Critical Hit',
    category: 'combat',
    description: 'Critical/heavy damage strike',
    params: [1, 0, 0.15, 0.5, 0.3, 0.4, 0, -0.15, 0, 0.1, 0.2, 0, 0, 0, 0, 0, 0.2, -0.1, 1, 0, 0, 0, 0, 0.7],
  },
  explosion: {
    name: 'Explosion',
    category: 'combat',
    description: 'Bomb or magic explosion',
    params: [3, 0, 0.2, 0.3, 0.6, 0.2, 0, -0.05, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, -0.05, 1, 0, 0, 0, 0, 0.7],
  },

  // === UI (7) ===
  menu_select: {
    name: 'Menu Select',
    category: 'ui',
    description: 'Menu item selected/confirmed',
    params: [0, 0, 0.05, 0, 0.1, 0.5, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.3],
  },
  menu_hover: {
    name: 'Menu Hover',
    category: 'ui',
    description: 'Cursor moving over menu item',
    params: [0, 0, 0.03, 0, 0.05, 0.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.2],
  },
  menu_back: {
    name: 'Menu Back',
    category: 'ui',
    description: 'Going back in menu',
    params: [0, 0, 0.05, 0, 0.1, 0.5, 0, -0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.3],
  },
  menu_error: {
    name: 'Menu Error',
    category: 'ui',
    description: 'Invalid action / error buzz',
    params: [0, 0, 0.2, 0, 0.1, 0.2, 0.19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.4],
  },
  dialog_blip: {
    name: 'Dialog Blip',
    category: 'ui',
    description: 'Text appearing character by character',
    params: [0, 0, 0.01, 0, 0.02, 0.6, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.15],
  },
  dialog_advance: {
    name: 'Dialog Advance',
    category: 'ui',
    description: 'Moving to next dialog box',
    params: [0, 0, 0.04, 0, 0.08, 0.55, 0, 0.15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.25],
  },
  notification: {
    name: 'Notification',
    category: 'ui',
    description: 'Quest update or notification ping',
    params: [0, 0, 0.08, 0, 0.15, 0.6, 0, 0.1, 0, 0, 0, 0.3, 0.5, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.35],
  },

  // === MOVEMENT (5) ===
  footstep_stone: {
    name: 'Footstep Stone',
    category: 'movement',
    description: 'Walking on stone/tile',
    params: [3, 0, 0.01, 0, 0.04, 0.15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 0.3, 0, 0.25],
  },
  footstep_grass: {
    name: 'Footstep Grass',
    category: 'movement',
    description: 'Walking on grass/dirt',
    params: [3, 0, 0.02, 0, 0.05, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0, 0, 0.4, 0, 0.2],
  },
  footstep_wood: {
    name: 'Footstep Wood',
    category: 'movement',
    description: 'Walking on wooden floor',
    params: [3, 0, 0.015, 0.1, 0.04, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, 0, 0.6, 0, 0, 0.2, 0, 0.25],
  },
  door_open: {
    name: 'Door Open',
    category: 'movement',
    description: 'Opening a door',
    params: [3, 0.05, 0.2, 0, 0.3, 0.2, 0.1, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0.1, 0.8, 0, 0, 0, 0, 0.4],
  },
  door_close: {
    name: 'Door Close',
    category: 'movement',
    description: 'Closing a door',
    params: [3, 0, 0.15, 0.2, 0.2, 0.2, 0, -0.05, 0, 0, 0, 0, 0, 0, 0, 0, 0.15, -0.05, 0.9, 0, 0, 0, 0, 0.45],
  },

  // === ITEMS (8) ===
  coin_pickup: {
    name: 'Coin Pickup',
    category: 'items',
    description: 'Collecting a coin/gold',
    params: [0, 0, 0.04, 0, 0.08, 0.7, 0, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.3],
  },
  item_pickup: {
    name: 'Item Pickup',
    category: 'items',
    description: 'Picking up a general item',
    params: [0, 0, 0.05, 0, 0.1, 0.5, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.35],
  },
  potion_drink: {
    name: 'Potion Drink',
    category: 'items',
    description: 'Drinking a potion',
    params: [3, 0.1, 0.15, 0, 0.3, 0.4, 0.2, -0.1, 0, 0.05, 0.1, 0, 0, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0.4],
  },
  chest_open: {
    name: 'Chest Open',
    category: 'items',
    description: 'Opening a treasure chest',
    params: [0, 0.05, 0.1, 0.3, 0.3, 0.4, 0, 0.15, 0.01, 0, 0, 0.2, 0.3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.45],
  },
  key_pickup: {
    name: 'Key Pickup',
    category: 'items',
    description: 'Picking up a key',
    params: [0, 0, 0.06, 0.2, 0.12, 0.65, 0, 0.25, 0, 0, 0, 0.15, 0.3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.35],
  },
  equip_armor: {
    name: 'Equip Armor',
    category: 'items',
    description: 'Equipping armor/gear',
    params: [3, 0.02, 0.1, 0.2, 0.15, 0.3, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0, 0.8, 0, 0, 0, 0, 0.4],
  },
  equip_weapon: {
    name: 'Equip Weapon',
    category: 'items',
    description: 'Equipping a weapon',
    params: [1, 0.02, 0.08, 0.3, 0.1, 0.4, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.45],
  },
  inventory_move: {
    name: 'Inventory Move',
    category: 'items',
    description: 'Moving an item in inventory',
    params: [3, 0, 0.02, 0, 0.05, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0, 0, 0.2, 0, 0.2],
  },

  // === ENVIRONMENT (5) ===
  torch_ignite: {
    name: 'Torch Ignite',
    category: 'environment',
    description: 'Lighting a torch',
    params: [3, 0.05, 0.15, 0.1, 0.4, 0.3, 0, 0.05, 0, 0.1, 0.3, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.1, 0, 0, 0, 0.4],
  },
  water_splash: {
    name: 'Water Splash',
    category: 'environment',
    description: 'Stepping in water or fountain',
    params: [3, 0, 0.1, 0, 0.4, 0.15, 0, 0, 0, 0.1, 0.5, 0, 0, 0, 0, 0, 0, 0, 0.4, 0, 0, 0, 0, 0.35],
  },
  lever_pull: {
    name: 'Lever Pull',
    category: 'environment',
    description: 'Pulling a lever/switch',
    params: [0, 0.02, 0.08, 0.3, 0.1, 0.5, 0.3, -0.3, 0, 0, 0, 0, 0, 0.5, 0, 0, 0.1, 0, 1, 0, 0, 0, 0, 0.4],
  },
  stone_slide: {
    name: 'Stone Slide',
    category: 'environment',
    description: 'Stone block sliding (puzzle)',
    params: [3, 0.1, 0.3, 0, 0.2, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.1, 0.5, 0, 0, 0.1, 0, 0.5],
  },
  wind_gust: {
    name: 'Wind Gust',
    category: 'environment',
    description: 'Wind blowing effect',
    params: [3, 0.2, 0.5, 0, 0.5, 0.05, 0, 0.02, 0, 0.05, 0.1, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.05, 0, 0, 0, 0.3],
  },

  // === MAGIC (5) ===
  spell_cast: {
    name: 'Spell Cast',
    category: 'magic',
    description: 'Casting a spell',
    params: [0, 0.05, 0.1, 0.2, 0.3, 0.5, 0.2, 0.2, 0.01, 0.1, 0.3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5],
  },
  heal: {
    name: 'Heal',
    category: 'magic',
    description: 'Healing spell effect',
    params: [0, 0.1, 0.15, 0, 0.3, 0.6, 0.4, 0.1, 0.005, 0.05, 0.2, 0.1, 0.3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.4],
  },
  fire_spell: {
    name: 'Fire Spell',
    category: 'magic',
    description: 'Fire magic attack',
    params: [3, 0, 0.15, 0.3, 0.4, 0.3, 0, -0.05, 0, 0.1, 0.4, 0, 0, 0, 0, 0, 0.1, -0.05, 0.6, 0, 0, 0, 0, 0.6],
  },
  ice_spell: {
    name: 'Ice Spell',
    category: 'magic',
    description: 'Ice/frost magic',
    params: [0, 0, 0.1, 0.4, 0.3, 0.8, 0.4, -0.2, 0, 0, 0, 0, 0, 0.3, 0, 0, 0.2, 0, 0.5, 0, 0, 0.2, 0, 0.5],
  },
  teleport: {
    name: 'Teleport',
    category: 'magic',
    description: 'Teleportation/warp effect',
    params: [0, 0, 0.08, 0.2, 0.25, 0.7, 0.1, -0.4, -0.02, 0.1, 0.3, 0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 0.5],
  },

  // === FEEDBACK (5) ===
  level_up: {
    name: 'Level Up',
    category: 'feedback',
    description: 'Player leveling up fanfare',
    params: [0, 0, 0.08, 0.3, 0.3, 0.5, 0, 0.15, 0.01, 0, 0, 0.2, 0.3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5],
  },
  quest_complete: {
    name: 'Quest Complete',
    category: 'feedback',
    description: 'Quest objective completed',
    params: [0, 0, 0.1, 0.2, 0.25, 0.5, 0, 0.15, 0.01, 0, 0, 0.15, 0.25, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.45],
  },
  save_game: {
    name: 'Save Game',
    category: 'feedback',
    description: 'Game saved confirmation',
    params: [0, 0.05, 0.1, 0, 0.2, 0.6, 0.4, 0.05, 0, 0, 0, 0.1, 0.2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.3],
  },
  game_over: {
    name: 'Game Over',
    category: 'feedback',
    description: 'Player death / game over',
    params: [0, 0, 0.2, 0, 0.6, 0.3, 0.1, -0.1, -0.005, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5],
  },
  victory: {
    name: 'Victory',
    category: 'feedback',
    description: 'Battle won / victory jingle',
    params: [0, 0, 0.1, 0.3, 0.4, 0.6, 0.3, 0.1, 0.005, 0, 0, 0.15, 0.2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5],
  },
};
