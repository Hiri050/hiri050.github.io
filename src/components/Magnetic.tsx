import { cloneElement, useEffect, useRef, type ReactElement, type Ref } from 'react'
import { gsap } from '../lib/motion'
import { device } from '../lib/device'

interface Props {
  children: ReactElement<{ ref?: Ref<HTMLElement> }>
  /** Fraction of the pointer offset the element follows. */
  strength?: number
}

/** Pulls its child toward the pointer while hovered, then settles back. */
export function Magnetic({ children, strength = 0.32 }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !device.finePointer || device.reducedMotion) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect()
      xTo((e.clientX - (b.left + b.width / 2)) * strength)
      yTo((e.clientY - (b.top + b.height / 2)) * strength)
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [strength])

  return cloneElement(children, { ref })
}
