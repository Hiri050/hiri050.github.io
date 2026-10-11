import { useEffect, useRef } from 'react'
import { gsap, SCRAMBLE_CHARS } from '../lib/motion'
import { device } from '../lib/device'

interface Props {
  text: string
  className?: string
  /** Scramble whenever `text` changes, not only on hover. */
  onChange?: boolean
}

/** Text that briefly decodes itself when its link/button is hovered or focused. */
export function ScrambleText({ text, className, onChange = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const first = useRef(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (device.reducedMotion) {
      el.textContent = text
      return
    }
    if (onChange && !first.current) {
      gsap.to(el, { duration: 0.7, scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.7 } })
    } else {
      el.textContent = text
    }
    first.current = false

    const host = el.closest<HTMLElement>('a, button') ?? el
    const run = () => {
      gsap.to(el, { duration: 0.55, overwrite: true, scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.8 } })
    }
    host.addEventListener('pointerenter', run)
    host.addEventListener('focus', run)
    return () => {
      host.removeEventListener('pointerenter', run)
      host.removeEventListener('focus', run)
    }
  }, [text, onChange])

  // Screen readers get the stable text, never the scrambling characters.
  return (
    <>
      <span ref={ref} className={className} aria-hidden="true">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </>
  )
}
