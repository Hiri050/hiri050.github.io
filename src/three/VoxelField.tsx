import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { voxelFragment, voxelVertex } from './shaders'
import { device, voxelTier } from '../lib/device'
import { appStore, runtime } from '../lib/store'
import { sceneState } from './sceneState'

const BG = new THREE.Color().setRGB(7 / 255, 7 / 255, 8 / 255)
const ACCENT = new THREE.Color().setRGB(1.0, 0.416, 0.169)
const FIELD_WIDTH = 40

export function VoxelField() {
  const { grid, cube } = voxelTier
  const count = grid * grid

  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1)
    box.translate(0, 0.5, 0)
    const g = new THREE.InstancedBufferGeometry()
    g.index = box.index
    g.setAttribute('position', box.getAttribute('position'))
    g.setAttribute('normal', box.getAttribute('normal'))
    g.setAttribute('uv', box.getAttribute('uv'))
    const index = new Float32Array(count)
    for (let i = 0; i < count; i++) index[i] = i
    g.setAttribute('aIndex', new THREE.InstancedBufferAttribute(index, 1))
    g.instanceCount = count
    return g
  }, [count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: voxelVertex,
        fragmentShader: voxelFragment,
        uniforms: {
          uTime: { value: 8 },
          uState: { value: 0 },
          uGrid: { value: grid },
          uCube: { value: cube },
          uCell: { value: FIELD_WIDTH / grid },
          uCubeCell: { value: 7.2 / cube },
          uPointer: { value: new THREE.Vector4(0, 0, 0, 0) },
          uShock: { value: new THREE.Vector4(0, 0, 99, 0) },
          uCubeRot: { value: new THREE.Matrix3() },
          uHover: { value: 0 },
          uIntro: { value: 0 },
          uBg: { value: BG },
          uAccent: { value: ACCENT },
          uCamPos: { value: new THREE.Vector3() },
          uFogNear: { value: 18 },
          uFogFar: { value: 62 },
          uDebug: { value: 0 },
        },
      }),
    [grid, cube],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  const scratch = useRef({
    raycaster: new THREE.Raycaster(),
    ndc: new THREE.Vector2(),
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -2),
    hit: new THREE.Vector3(),
    euler: new THREE.Euler(),
    m4: new THREE.Matrix4(),
  })

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const u = material.uniforms
    const s = scratch.current
    const p = runtime.pointer

    if (!device.reducedMotion) u.uTime.value += dt

    // Ease toward the scroll-driven scene state; snap when motion is reduced.
    const target = runtime.sceneTarget
    sceneState.value = device.reducedMotion
      ? target
      : sceneState.value + (target - sceneState.value) * (1 - Math.exp(-dt * 2.4))
    u.uState.value = sceneState.value

    // Pointer → world position on the terrain plane.
    s.ndc.set(p.nx, p.ny)
    s.raycaster.setFromCamera(s.ndc, state.camera)
    if (s.raycaster.ray.intersectPlane(s.plane, s.hit)) {
      const pv = u.uPointer.value as THREE.Vector4
      const k = 1 - Math.exp(-dt * 10)
      pv.x += (s.hit.x - pv.x) * k
      pv.y += (s.hit.z - pv.y) * k
      const recent = performance.now() - p.lastMove < 1600
      const presenceTarget = recent && sceneState.value < 0.6 ? 1 : 0
      pv.z += (presenceTarget - pv.z) * (1 - Math.exp(-dt * 3))
      pv.w += ((p.down ? 1 : 0) - pv.w) * (1 - Math.exp(-dt * 4))
    }

    const shock = u.uShock.value as THREE.Vector4
    if (runtime.shock.pending) {
      runtime.shock.pending = false
      const pv = u.uPointer.value as THREE.Vector4
      shock.set(pv.x, pv.y, 0, 1)
    } else {
      shock.z += dt
    }

    const t = u.uTime.value as number
    s.euler.set(0.42 + p.ny * 0.22, t * 0.2 + p.nx * 0.55, 0.12)
    s.m4.makeRotationFromEuler(s.euler)
    ;(u.uCubeRot.value as THREE.Matrix3).setFromMatrix4(s.m4)

    u.uHover.value += (runtime.exhibitHover - u.uHover.value) * (1 - Math.exp(-dt * 5))
    u.uIntro.value = runtime.intro
    ;(u.uCamPos.value as THREE.Vector3).copy(state.camera.position)
    u.uDebug.value = appStore.get().devMode ? 1 : 0

    runtime.stats.instances = count
    runtime.stats.scene = sceneState.value
  })

  return <mesh geometry={geometry} material={material} frustumCulled={false} />
}
