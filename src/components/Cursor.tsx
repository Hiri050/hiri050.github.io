import { useEffect, useRef } from 'react'
import { device } from '../lib/device'
import { runtime } from '../lib/store'
import './cursor.css'

type Mode = 'default' | 'link' | 'view' | 'drag' | 'stick' | 'text' | 'sculpt'

const INTERACTIVE = 'a, button, [role="button"], [role="tab"], label, select, summary'

/**
 * A dot that tracks the pointer exactly and a ring that follows with inertia.
 * Elements opt into richer states with data-cursor="view|drag|stick|text" and
 * data-cursor-label="…". Over the empty hero the ring becomes a crosshair,
 * hinting that the terrain can be sculpted.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!device.finePointer || device.reducedMotion) return
    document.documentElement.classList.add('has-cursor')

    const pos = { x: -100, y: -100 }
    const ringPos = { x: -100, y: -100, w: 36, h: 36, r: 18 }
    let mode: Mode = 'default'
    let stickEl: HTMLElement | null = null
    let visible = false
    let raf = 0

    const setMode = (next: Mode, text = '') => {
      if (label.current && label.current.textContent !== text) label.current.textContent = text
      if (next === mode) return
      root.current?.setAttribute('data-mode', next)
      mode = next
    }

    const resolve = (target: Element | null) => {
      const el = target?.closest<HTMLElement>('[data-cursor]')
      if (el) {
        const m = el.dataset.cursor as Mode
        stickEl = m === 'stick' ? el : null
        return setMode(m, el.dataset.cursorLabel ?? '')
      }
      stickEl = null
      if (target?.closest(INTERACTIVE)) return setMode('link')
      if (target?.closest('input, textarea')) return setMode('text')
      if (runtime.sceneTarget < 0.5 && target?.closest('#hero')) return setMode('sculpt')
      setMode('default')
    }

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      if (!visible) {
        visible = true
        ringPos.x = pos.x
        ringPos.y = pos.y
        root.current?.classList.add('is-visible')
      }
      resolve(e.target as Element)
    }
    const onDown = () => root.current?.classList.add('is-down')
    const onUp = () => root.current?.classList.remove('is-down')
    const onLeave = () => {
      visible = false
      root.current?.classList.remove('is-visible')
    }
    // Content scrolls under a still pointer: re-resolve what is beneath it.
    const onScroll = () => resolve(document.elementFromPoint(pos.x, pos.y))

    const tick = () => {
      let tx = pos.x
      let ty = pos.y
      let tw = mode === 'view' ? 96 : mode === 'drag' ? 72 : mode === 'link' ? 56 : mode === 'sculpt' ? 44 : 36
      let th = tw
      let tr = tw / 2
      if (stickEl) {
        const b = stickEl.getBoundingClientRect()
        tx = b.left + b.width / 2 + (pos.x - (b.left + b.width / 2)) * 0.12
        ty = b.top + b.height / 2 + (pos.y - (b.top + b.height / 2)) * 0.12
        tw = b.width + 12
        th = b.height + 12
        tr = Math.min(th / 2, 999)
      }
      const k = 0.18
      ringPos.x += (tx - ringPos.x) * k
      ringPos.y += (ty - ringPos.y) * k
      ringPos.w += (tw - ringPos.w) * 0.2
      ringPos.h += (th - ringPos.h) * 0.2
      ringPos.r += (tr - ringPos.r) * 0.2
      if (ring.current) {
        ring.current.style.transform = `translate3d(${ringPos.x - ringPos.w / 2}px, ${ringPos.y - ringPos.h / 2}px, 0)`
        ring.current.style.width = `${ringPos.w}px`
        ring.current.style.height = `${ringPos.h}px`
        ring.current.style.borderRadius = `${ringPos.r}px`
      }
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x - 3}px, ${pos.y - 3}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('scroll', onScroll)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  if (!device.finePointer || device.reducedMotion) return null

  return (
    <div ref={root} className="cursor" data-mode="default" aria-hidden="true">
      <div ref={ring} className="cursor__ring">
        <span ref={label} className="cursor__label" />
        <i className="cursor__tick cursor__tick--n" />
        <i className="cursor__tick cursor__tick--e" />
        <i className="cursor__tick cursor__tick--s" />
        <i className="cursor__tick cursor__tick--w" />
      </div>
      <div ref={dot} className="cursor__dot" />
    </div>
  )
}
