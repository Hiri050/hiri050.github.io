import { useSyncExternalStore } from 'react'

/**
 * Two kinds of shared state:
 *  - `runtime`: hot values written every frame or pointer move (pointer, scroll, stats).
 *    Plain mutable object, never triggers React renders. Read inside rAF/useFrame.
 *  - `appStore`: low-frequency UI state that React components render from.
 */

export const runtime = {
  pointer: { x: 0, y: 0, nx: 0, ny: 0, down: false, active: 0, lastMove: 0 },
  /** Target scene state from scroll position (0 terrain, 1 die, 2 floor, 3 cube). */
  sceneTarget: 0,
  /** Click shockwave on the terrain, consumed by the voxel field. */
  shock: { pending: false },
  /** 0..1: how strongly a project exhibit is hovered; the floor reacts to it. */
  exhibitHover: 0,
  /** 0..1: terrain rises from flat when the loader exits. */
  intro: 0,
  stats: { fps: 60, dpr: 1, calls: 0, triangles: 0, instances: 0, scene: 0 },
}

export interface AppState {
  booted: boolean
  sceneReady: boolean
  devMode: boolean
  menuOpen: boolean
  activeProject: string | null
  /** True while a full-screen case study covers the canvas: rendering pauses. */
  sceneHidden: boolean
  section: string
}

function createStore<T extends object>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(patch: Partial<T>) {
      const next = { ...state, ...patch }
      if (Object.keys(patch).every((k) => Object.is(state[k as keyof T], next[k as keyof T]))) return
      state = next
      listeners.forEach((l) => l())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const appStore = createStore<AppState>({
  booted: false,
  sceneReady: false,
  devMode: false,
  menuOpen: false,
  activeProject: null,
  sceneHidden: false,
  section: 'hero',
})

export function useApp<K extends keyof AppState>(key: K): AppState[K] {
  return useSyncExternalStore(
    appStore.subscribe,
    () => appStore.get()[key],
    () => appStore.get()[key],
  )
}
