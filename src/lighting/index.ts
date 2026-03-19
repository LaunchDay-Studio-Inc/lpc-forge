import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { LightingPreset, ParticlePreset } from './types.js';
import { LIGHTING_PRESETS } from './presets.js';
import { PARTICLE_PRESETS } from './particles.js';

export type { LightingPreset, ParticlePreset } from './types.js';

/** List all lighting preset names */
export function listLightingPresets(): string[] {
  return Object.keys(LIGHTING_PRESETS);
}

/** List all particle preset names */
export function listParticlePresets(): string[] {
  return Object.keys(PARTICLE_PRESETS);
}

/** Get a lighting preset by name */
export function getLightingPreset(name: string): LightingPreset | null {
  return LIGHTING_PRESETS[name] ?? null;
}

/** Get a particle preset by name */
export function getParticlePreset(name: string): ParticlePreset | null {
  return PARTICLE_PRESETS[name] ?? null;
}

/** Generate a CanvasModulate + Light2D .tscn from a lighting preset */
export function generateLightingScene(preset: LightingPreset): string {
  const { r, g, b, a } = preset.ambientColor;
  const lines: string[] = [];
  const extCount = preset.lights.length > 0 ? 1 : 0;

  lines.push(`[gd_scene load_steps=${1 + extCount} format=3]`);
  lines.push('');

  // Light texture (use a simple gradient for PointLight2D)
  if (preset.lights.some(l => l.type === 'point')) {
    lines.push(`[sub_resource type="GradientTexture2D" id="light_tex"]`);
    lines.push(`fill = 1`);
    lines.push(`fill_from = Vector2(0.5, 0.5)`);
    lines.push(`gradient = SubResource("light_grad")`);
    lines.push('');
    lines.push(`[sub_resource type="Gradient" id="light_grad"]`);
    lines.push(`colors = PackedColorArray(1, 1, 1, 1, 1, 1, 1, 0)`);
    lines.push('');
  }

  lines.push(`[node name="Lighting" type="Node2D"]`);
  lines.push('');

  // CanvasModulate for ambient
  lines.push(`[node name="Ambient" type="CanvasModulate" parent="."]`);
  lines.push(`color = Color(${r}, ${g}, ${b}, ${a})`);
  lines.push('');

  // Lights
  for (const light of preset.lights) {
    const { r: lr, g: lg, b: lb, a: la } = light.color;
    if (light.type === 'point') {
      lines.push(`[node name="${light.name}" type="PointLight2D" parent="."]`);
      lines.push(`color = Color(${lr}, ${lg}, ${lb}, ${la})`);
      lines.push(`energy = ${light.energy}`);
      lines.push(`texture_scale = ${light.textureScale}`);
      if (light.shadow) {
        lines.push(`shadow_enabled = true`);
      }
      lines.push('');
    } else {
      lines.push(`[node name="${light.name}" type="DirectionalLight2D" parent="."]`);
      lines.push(`color = Color(${lr}, ${lg}, ${lb}, ${la})`);
      lines.push(`energy = ${light.energy}`);
      if (light.shadow) {
        lines.push(`shadow_enabled = true`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/** Write all lighting presets to an output directory */
export async function writeAllLightingPresets(outputDir: string): Promise<string[]> {
  const lightingDir = join(outputDir, 'lighting');
  await mkdir(lightingDir, { recursive: true });

  const written: string[] = [];
  for (const [key, preset] of Object.entries(LIGHTING_PRESETS)) {
    const scene = generateLightingScene(preset);
    const filename = `lighting_${key}.tscn`;
    await writeFile(join(lightingDir, filename), scene);
    written.push(filename);
  }
  return written;
}

/** Write all particle presets to an output directory */
export async function writeAllParticlePresets(outputDir: string): Promise<string[]> {
  const particleDir = join(outputDir, 'particles');
  await mkdir(particleDir, { recursive: true });

  const written: string[] = [];
  for (const [key, preset] of Object.entries(PARTICLE_PRESETS)) {
    const filename = `${key}.tscn`;
    await writeFile(join(particleDir, filename), preset.scene);
    written.push(filename);
  }
  return written;
}
