import type { LightingPreset } from './types.js';

export const LIGHTING_PRESETS: Record<string, LightingPreset> = {
  dungeon_dark: {
    name: 'Dungeon Dark',
    description: 'Near-total darkness with torch light radius. Classic dungeon crawler.',
    ambientColor: { r: 0.08, g: 0.06, b: 0.12, a: 1 },
    lights: [
      {
        name: 'PlayerLight',
        type: 'point',
        color: { r: 1.0, g: 0.85, b: 0.6, a: 1 },
        energy: 1.2,
        textureScale: 2.0,
        range: 200,
        shadow: true,
      },
    ],
  },
  dungeon_torch: {
    name: 'Dungeon Torchlit',
    description: 'Dim ambient with warm torch lighting. Moody but visible.',
    ambientColor: { r: 0.15, g: 0.12, b: 0.2, a: 1 },
    lights: [
      {
        name: 'PlayerLight',
        type: 'point',
        color: { r: 1.0, g: 0.9, b: 0.7, a: 1 },
        energy: 0.8,
        textureScale: 1.5,
        range: 160,
        shadow: true,
      },
      {
        name: 'TorchLight',
        type: 'point',
        color: { r: 1.0, g: 0.7, b: 0.3, a: 1 },
        energy: 1.0,
        textureScale: 1.0,
        range: 120,
        shadow: false,
      },
    ],
  },
  overworld_day: {
    name: 'Overworld Day',
    description: 'Bright natural daylight. No modulation needed.',
    ambientColor: { r: 1.0, g: 1.0, b: 1.0, a: 1 },
    lights: [],
  },
  overworld_sunset: {
    name: 'Overworld Sunset',
    description: 'Warm orange sunset atmosphere.',
    ambientColor: { r: 0.95, g: 0.75, b: 0.55, a: 1 },
    lights: [
      {
        name: 'SunLight',
        type: 'directional',
        color: { r: 1.0, g: 0.6, b: 0.3, a: 1 },
        energy: 0.4,
        textureScale: 1.0,
        shadow: false,
      },
    ],
  },
  overworld_night: {
    name: 'Overworld Night',
    description: 'Dark blue night sky with moonlight.',
    ambientColor: { r: 0.15, g: 0.15, b: 0.3, a: 1 },
    lights: [
      {
        name: 'PlayerLight',
        type: 'point',
        color: { r: 0.9, g: 0.9, b: 1.0, a: 1 },
        energy: 0.6,
        textureScale: 2.0,
        range: 180,
        shadow: true,
      },
      {
        name: 'MoonLight',
        type: 'directional',
        color: { r: 0.6, g: 0.65, b: 0.9, a: 1 },
        energy: 0.3,
        textureScale: 1.0,
        shadow: false,
      },
    ],
  },
  cave: {
    name: 'Cave',
    description: 'Very dark with cold blue-green ambient. Only nearby light.',
    ambientColor: { r: 0.05, g: 0.08, b: 0.1, a: 1 },
    lights: [
      {
        name: 'PlayerLight',
        type: 'point',
        color: { r: 0.8, g: 0.9, b: 1.0, a: 1 },
        energy: 1.0,
        textureScale: 1.5,
        range: 140,
        shadow: true,
      },
    ],
  },
  indoor_warm: {
    name: 'Indoor Warm',
    description: 'Cozy firelit interior. Warm ambient with gentle shadows.',
    ambientColor: { r: 0.4, g: 0.3, b: 0.2, a: 1 },
    lights: [
      {
        name: 'RoomLight',
        type: 'point',
        color: { r: 1.0, g: 0.85, b: 0.6, a: 1 },
        energy: 0.9,
        textureScale: 2.5,
        range: 250,
        shadow: false,
      },
    ],
  },
  boss_arena: {
    name: 'Boss Arena',
    description: 'Dramatic dark red/purple ambient with intense center light.',
    ambientColor: { r: 0.12, g: 0.05, b: 0.1, a: 1 },
    lights: [
      {
        name: 'ArenaLight',
        type: 'point',
        color: { r: 0.8, g: 0.3, b: 0.5, a: 1 },
        energy: 1.5,
        textureScale: 3.0,
        range: 300,
        shadow: true,
      },
      {
        name: 'PlayerLight',
        type: 'point',
        color: { r: 1.0, g: 0.9, b: 0.8, a: 1 },
        energy: 0.7,
        textureScale: 1.5,
        range: 150,
        shadow: true,
      },
    ],
  },
};
