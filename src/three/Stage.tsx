import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { VoxelField } from './VoxelField'
import { CameraRig } from './CameraRig'
import { appStore, runtime, useApp } from '../lib/store'
import { device, maxDpr } from '../lib/device'

/**
 * Keeps the frame budget: drops render resolution when frames run long, raises it
 * back when there is headroom. Also publishes stats for developer mode and
 * signals the loader once the first frame is on screen.
 */
function Governor() {
  const gl = useThree((s) => s.gl)
  const setDpr = useThree((s) => s.setDpr)
  const invalidate = useThree((s) => s.invalidate)
  const acc = useRef({ frames: 0, time: 0, cooldown: 0, dpr: Math.min(window.devicePixelRatio, maxDpr), first: true })

  useEffect(() => {
    setDpr(acc.current.dpr)
  }, [setDpr])

  // With reduced motion the canvas renders on demand: redraw when scrolling.
  useEffect(() => {
    if (!device.reducedMotion) return
    const onScroll = () => invalidate()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [invalidate])

  useFrame((_, dt) => {
    const a = acc.current
    if (a.first) {
      a.first = false
      requestAnimationFrame(() => appStore.set({ sceneReady: true }))
    }
    a.frames++
    a.time += dt
    a.cooldown -= dt
    if (a.time >= 1) {
      const fps = a.frames / a.time
      runtime.stats.fps = fps
      a.frames = 0
      a.time = 0
      if (a.cooldown <= 0 && !device.reducedMotion) {
        if (fps < 45 && a.dpr > 0.75) {
          a.dpr = Math.max(0.75, a.dpr - 0.25)
          setDpr(a.dpr)
          a.cooldown = 2
        } else if (fps > 58 && a.dpr < Math.min(window.devicePixelRatio, maxDpr)) {
          a.dpr = Math.min(maxDpr, a.dpr + 0.25)
          setDpr(a.dpr)
          a.cooldown = 4
        }
      }
    }
    runtime.stats.dpr = a.dpr
    runtime.stats.calls = gl.info.render.calls
    runtime.stats.triangles = gl.info.render.triangles
  })
  return null
}

export default function Stage() {
  const sceneHidden = useApp('sceneHidden')
  const frameloop = sceneHidden ? 'never' : device.reducedMotion ? 'demand' : 'always'

  return (
    <Canvas
      className="stage"
      aria-hidden="true"
      linear
      flat
      frameloop={frameloop}
      dpr={1}
      camera={{ fov: 35, near: 0.1, far: 140, position: [0, 12, 25] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <VoxelField />
      <CameraRig />
      <Governor />
    </Canvas>
  )
}
