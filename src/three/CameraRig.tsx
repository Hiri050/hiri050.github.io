import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from '../lib/store'
import { device } from '../lib/device'
import { sceneState } from './sceneState'

type Key = { pos: [number, number, number]; look: [number, number, number] }

/** One camera pose per scene state; the rig blends between neighbours. */
const KEYS: Key[] = [
  { pos: [-2.5, 13.5, 28], look: [-4.5, 2.2, 0] }, // terrain: field sits right of the headline
  { pos: [0, 36, 12], look: [0, 0, 0.6] }, // die: near top-down, far enough to sit behind text
  { pos: [0, 5.4, 27], look: [0, -0.8, -6] }, // floor: low and quiet
  { pos: [-4, 6.4, 21], look: [-5.6, 4.4, 0] }, // cube: right of the closing headline
]

const smooth = (t: number) => t * t * (3 - 2 * t)

export function CameraRig() {
  const size = useThree((s) => s.size)
  const v = useRef({
    pos: new THREE.Vector3(),
    look: new THREE.Vector3(),
    a: new THREE.Vector3(),
    b: new THREE.Vector3(),
    parallax: new THREE.Vector2(),
  })

  useFrame((state, dt) => {
    const s = Math.min(3, Math.max(0, sceneState.value))
    const k = Math.min(2, Math.floor(s))
    const t = smooth(s - k)
    const A = KEYS[k]
    const B = KEYS[k + 1]
    const r = v.current

    r.pos.set(...A.pos).lerp(r.b.set(...B.pos), t)
    r.look.set(...A.look).lerp(r.a.set(...B.look), t)

    // Portrait screens: pull back along the view direction so the subject fits.
    const aspect = size.width / size.height
    if (aspect < 1) {
      const pull = 1 + (1 - aspect) * 0.9
      r.pos.sub(r.look).multiplyScalar(pull).add(r.look)
      r.look.x *= 0.2
      r.pos.x *= 0.2
      // In the closing scene the cube sits above the headline rather than behind it.
      const cubeWeight = smooth(Math.max(0, s - 2))
      r.look.y -= cubeWeight * 4.2
      r.pos.y -= cubeWeight * 2
    }

    if (!device.reducedMotion) {
      const p = runtime.pointer
      const k2 = 1 - Math.exp(-Math.min(dt, 0.05) * 2.5)
      r.parallax.x += (p.nx - r.parallax.x) * k2
      r.parallax.y += (p.ny - r.parallax.y) * k2
      r.pos.x += r.parallax.x * 1.6
      r.pos.y += r.parallax.y * 0.9
    }

    state.camera.position.copy(r.pos)
    state.camera.lookAt(r.look)
  })

  return null
}
