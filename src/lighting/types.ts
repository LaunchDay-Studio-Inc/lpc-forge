export interface LightingPreset {
  name: string;
  description: string;
  /** Ambient color (CanvasModulate) */
  ambientColor: { r: number; g: number; b: number; a: number };
  /** Point lights to place */
  lights: LightConfig[];
}

export interface LightConfig {
  name: string;
  /** PointLight2D or DirectionalLight2D */
  type: 'point' | 'directional';
  color: { r: number; g: number; b: number; a: number };
  energy: number;
  /** For point lights: texture scale multiplier */
  textureScale?: number;
  /** For point lights: range/size */
  range?: number;
  /** Shadow enabled */
  shadow: boolean;
}

export interface ParticlePreset {
  name: string;
  description: string;
  /** GDScript content for the particle scene */
  scene: string;
}
