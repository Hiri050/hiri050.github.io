/** Small deterministic PRNG so generated artwork is identical on every load. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Cheap smooth 2D value noise for SVG artwork (not for the GPU). */
export function valueNoise2D(seed: number) {
  const rand = mulberry32(seed)
  const size = 64
  const grid = Array.from({ length: size * size }, () => rand())
  const at = (x: number, y: number) => grid[((y % size) + size) % size * size + (((x % size) + size) % size)]
  const fade = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = fade(x - xi)
    const yf = fade(y - yi)
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * xf
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * xf
    return a + (b - a) * yf
  }
}
