import { useLayoutEffect, type RefObject } from 'react'
import { gsap, SplitText } from './motion'
import { device } from './device'

/**
 * Declarative scroll reveals inside a section:
 *   [data-reveal]          fades/rises in (children of [data-reveal-group] stagger)
 *   [data-split]           headline splits into masked lines, characters rise
 *   [data-rule]            hairline draws from the left
 * Everything renders fully visible when motion is reduced.
 */
export function useReveal(scope: RefObject<HTMLElement | null>, enabled = true) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root || !enabled || device.reducedMotion) return

    const splits: SplitText[] = []
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
        const split = SplitText.create(el, { type: 'lines,chars', mask: 'lines', linesClass: 'split-line' })
        splits.push(split)
        gsap.from(split.chars, {
          yPercent: 115,
          duration: 1.1,
          ease: 'expo.out',
          stagger: { each: 0.018, from: 'start' },
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })

      root.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
        gsap.from(group.querySelectorAll(':scope > [data-reveal]'), {
          y: 36,
          opacity: 0,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: group, start: 'top 86%', once: true },
        })
      })

      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        if (el.parentElement?.hasAttribute('data-reveal-group')) return
        gsap.from(el, {
          y: 36,
          opacity: 0,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })

      root.querySelectorAll<HTMLElement>('[data-rule]').forEach((el) => {
        gsap.from(el, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1.4,
          ease: 'expo.inOut',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        })
      })
    }, root)

    return () => {
      ctx.revert()
      splits.forEach((s) => s.revert())
    }
  }, [scope, enabled])
}
