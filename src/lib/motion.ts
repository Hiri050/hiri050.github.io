import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import Lenis from 'lenis'
import { device } from './device'

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin)

export { gsap, ScrollTrigger, SplitText }

export const ease = {
  out: 'expo.out',
  inOut: 'expo.inOut',
  soft: 'power3.out',
}

export const SCRAMBLE_CHARS = '01<>/[]{}#*+-=_'

let lenis: Lenis | null = null

export function initSmoothScroll() {
  if (device.reducedMotion || lenis) return lenis
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.2 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis?.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function scrollToTarget(target: string | HTMLElement | number, immediate = false) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (el === null) return
  if (lenis) {
    lenis.scrollTo(el as HTMLElement | number, { duration: immediate ? 0 : 1.6, immediate })
  } else if (typeof el === 'number') {
    window.scrollTo({ top: el })
  } else {
    el.scrollIntoView({ behavior: device.reducedMotion || immediate ? 'auto' : 'smooth' })
  }
}

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop()
    else lenis.start()
  }
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}
