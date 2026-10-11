/** The eased scene state shared by the voxel field and the camera rig. */
export const sceneState = { value: 0 }

export const SCENE_NAMES = ['TERRAIN', 'DIE', 'FLOOR', 'CUBE'] as const

export function sceneName(s: number) {
  return SCENE_NAMES[Math.min(3, Math.max(0, Math.round(s)))]
}
