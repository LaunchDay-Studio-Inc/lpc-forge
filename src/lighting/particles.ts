import type { ParticlePreset } from './types.js';

export const PARTICLE_PRESETS: Record<string, ParticlePreset> = {
  rain: {
    name: 'Rain',
    description: 'Falling rain drops across the screen',
    scene: `[gd_scene load_steps=3 format=3]

[sub_resource type="ParticleProcessMaterial" id="1"]
direction = Vector3(0, 1, 0)
spread = 5.0
gravity = Vector3(0, 600, 0)
initial_velocity_min = 200.0
initial_velocity_max = 300.0
scale_min = 0.5
scale_max = 1.5
color = Color(0.6, 0.7, 0.9, 0.4)

[sub_resource type="RectangleShape2D" id="2"]

[node name="Rain" type="GPUParticles2D"]
amount = 200
process_material = SubResource("1")
lifetime = 1.2
visibility_rect = Rect2(-640, -100, 1280, 820)
`,
  },
  snow: {
    name: 'Snow',
    description: 'Gentle snowfall with drift',
    scene: `[gd_scene load_steps=2 format=3]

[sub_resource type="ParticleProcessMaterial" id="1"]
direction = Vector3(0.2, 1, 0)
spread = 25.0
gravity = Vector3(0, 40, 0)
initial_velocity_min = 20.0
initial_velocity_max = 50.0
angular_velocity_min = -45.0
angular_velocity_max = 45.0
scale_min = 0.8
scale_max = 2.0
color = Color(0.95, 0.95, 1.0, 0.7)

[node name="Snow" type="GPUParticles2D"]
amount = 150
process_material = SubResource("1")
lifetime = 4.0
visibility_rect = Rect2(-640, -100, 1280, 820)
`,
  },
  fireflies: {
    name: 'Fireflies',
    description: 'Floating glowing fireflies for forest/night scenes',
    scene: `[gd_scene load_steps=2 format=3]

[sub_resource type="ParticleProcessMaterial" id="1"]
direction = Vector3(0, -0.3, 0)
spread = 180.0
gravity = Vector3(0, -5, 0)
initial_velocity_min = 5.0
initial_velocity_max = 15.0
angular_velocity_min = -20.0
angular_velocity_max = 20.0
scale_min = 1.0
scale_max = 3.0
color = Color(0.8, 1.0, 0.3, 0.8)

[node name="Fireflies" type="GPUParticles2D"]
amount = 20
process_material = SubResource("1")
lifetime = 5.0
visibility_rect = Rect2(-300, -300, 600, 600)
`,
  },
  torch_fire: {
    name: 'Torch Fire',
    description: 'Fire particles for torches and campfires',
    scene: `[gd_scene load_steps=2 format=3]

[sub_resource type="ParticleProcessMaterial" id="1"]
direction = Vector3(0, -1, 0)
spread = 15.0
gravity = Vector3(0, -80, 0)
initial_velocity_min = 20.0
initial_velocity_max = 40.0
scale_min = 0.5
scale_max = 2.0
color = Color(1.0, 0.6, 0.1, 0.9)
color_ramp = null

[node name="TorchFire" type="GPUParticles2D"]
amount = 30
process_material = SubResource("1")
lifetime = 0.8
visibility_rect = Rect2(-20, -40, 40, 50)
`,
  },
  dust_motes: {
    name: 'Dust Motes',
    description: 'Floating dust particles for indoor/cave scenes',
    scene: `[gd_scene load_steps=2 format=3]

[sub_resource type="ParticleProcessMaterial" id="1"]
direction = Vector3(0.1, -0.2, 0)
spread = 180.0
gravity = Vector3(0, 2, 0)
initial_velocity_min = 2.0
initial_velocity_max = 8.0
scale_min = 0.5
scale_max = 1.5
color = Color(0.9, 0.85, 0.7, 0.3)

[node name="DustMotes" type="GPUParticles2D"]
amount = 40
process_material = SubResource("1")
lifetime = 6.0
visibility_rect = Rect2(-300, -200, 600, 400)
`,
  },
  blood_splatter: {
    name: 'Blood Splatter',
    description: 'One-shot blood effect for hit impacts',
    scene: `[gd_scene load_steps=2 format=3]

[sub_resource type="ParticleProcessMaterial" id="1"]
direction = Vector3(0, -0.5, 0)
spread = 60.0
gravity = Vector3(0, 200, 0)
initial_velocity_min = 50.0
initial_velocity_max = 120.0
scale_min = 0.5
scale_max = 2.0
color = Color(0.7, 0.05, 0.05, 0.9)

[node name="BloodSplatter" type="GPUParticles2D"]
amount = 15
process_material = SubResource("1")
one_shot = true
explosiveness = 0.9
lifetime = 0.6
visibility_rect = Rect2(-30, -30, 60, 60)
`,
  },
  magic_sparkle: {
    name: 'Magic Sparkle',
    description: 'Sparkling magic effect for spells and enchantments',
    scene: `[gd_scene load_steps=2 format=3]

[sub_resource type="ParticleProcessMaterial" id="1"]
direction = Vector3(0, -1, 0)
spread = 180.0
gravity = Vector3(0, -20, 0)
initial_velocity_min = 10.0
initial_velocity_max = 30.0
angular_velocity_min = -90.0
angular_velocity_max = 90.0
scale_min = 0.5
scale_max = 2.5
color = Color(0.5, 0.7, 1.0, 0.8)

[node name="MagicSparkle" type="GPUParticles2D"]
amount = 25
process_material = SubResource("1")
lifetime = 1.0
visibility_rect = Rect2(-40, -40, 80, 80)
`,
  },
  leaves: {
    name: 'Falling Leaves',
    description: 'Drifting autumn leaves for forest scenes',
    scene: `[gd_scene load_steps=2 format=3]

[sub_resource type="ParticleProcessMaterial" id="1"]
direction = Vector3(0.4, 1, 0)
spread = 30.0
gravity = Vector3(0, 30, 0)
initial_velocity_min = 15.0
initial_velocity_max = 35.0
angular_velocity_min = -60.0
angular_velocity_max = 60.0
scale_min = 1.0
scale_max = 3.0
color = Color(0.8, 0.5, 0.2, 0.7)

[node name="FallingLeaves" type="GPUParticles2D"]
amount = 30
process_material = SubResource("1")
lifetime = 5.0
visibility_rect = Rect2(-640, -100, 1280, 820)
`,
  },
};
