import { appStore, runtime } from './store'
import { ScrollTrigger } from './motion'

/**
 * Maps scroll position to (a) the target 3D scene state and (b) the current
 * section for navigation. Sections declare `data-scene="<0..3>"`; the scene
 * blends across each section boundary over about one viewport of scrolling.
 */
export function initDirector() {
  type Anchor = { id: string; top: number; value: number }
  let anchors: Anchor[] = []

  const measure = () => {
    anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).map((el) => ({
      id: el.id,
      top: el.getBoundingClientRect().top + window.scrollY,
      value: parseFloat(el.dataset.scene ?? '0'),
    }))
    update()
  }

  const update = () => {
    if (!anchors.length) return
    const vh = window.innerHeight
    const centre = window.scrollY + vh * 0.5

    let value = anchors[0].value
    for (let i = 1; i < anchors.length; i++) {
      const start = anchors[i].top - vh * 0.55
      const t = Math.min(1, Math.max(0, (centre - start) / (vh * 0.9)))
      value += (anchors[i].value - value) * t
    }
    runtime.sceneTarget = value

    const probe = window.scrollY + vh * 0.38
    let current = anchors[0].id
    for (const a of anchors) if (a.top <= probe) current = a.id
    if (appStore.get().section !== current) appStore.set({ section: current })
  }

  const ro = new ResizeObserver(() => measure())
  ro.observe(document.body)
  window.addEventListener('scroll', update, { passive: true })
  ScrollTrigger.addEventListener('refresh', measure)
  measure()

  return () => {
    ro.disconnect()
    window.removeEventListener('scroll', update)
    ScrollTrigger.removeEventListener('refresh', measure)
  }
}

const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"], [role="tab"], [data-no-shock]'

export function initPointer() {
  const p = runtime.pointer
  const onMove = (e: PointerEvent) => {
    p.x = e.clientX
    p.y = e.clientY
    p.nx = (e.clientX / window.innerWidth) * 2 - 1
    p.ny = -(e.clientY / window.innerHeight) * 2 + 1
    p.lastMove = performance.now()
  }
  const onDown = (e: PointerEvent) => {
    onMove(e)
    p.down = true
    const target = e.target as HTMLElement | null
    if (!target?.closest(INTERACTIVE) && runtime.sceneTarget < 0.5) runtime.shock.pending = true
  }
  const onUp = () => {
    p.down = false
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onDown, { passive: true })
  window.addEventListener('pointerup', onUp, { passive: true })
  window.addEventListener('pointercancel', onUp, { passive: true })
  return () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }
}
