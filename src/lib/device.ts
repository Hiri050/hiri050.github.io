/** Capability snapshot taken once at startup. Decides how much work the scene does. */

const mq = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches

function hasWebGL2() {
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}

const nav = typeof navigator !== 'undefined' ? navigator : undefined
const cores = nav?.hardwareConcurrency ?? 8
const memory = (nav as Navigator & { deviceMemory?: number })?.deviceMemory ?? 8

export const device = {
  reducedMotion: mq('(prefers-reduced-motion: reduce)'),
  coarsePointer: mq('(pointer: coarse)'),
  finePointer: mq('(hover: hover) and (pointer: fine)'),
  smallScreen: mq('(max-width: 820px)'),
  webgl: hasWebGL2(),
  lowPower: cores <= 4 || memory <= 4,
}

/**
 * Voxel budget. The field is a g×g grid that reassembles into an m×m×m cube in the
 * final scene, so g² must equal m³: 64² = 16³ (4096) or 27² = 9³ (729).
 */
export const voxelTier =
  device.smallScreen || device.lowPower ? { grid: 27, cube: 9 } : { grid: 64, cube: 16 }

export const maxDpr = device.smallScreen ? 1.5 : 1.75
