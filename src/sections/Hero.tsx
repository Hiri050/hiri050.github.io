import { useEffect, useLayoutEffect, useRef } from 'react'
import { profile } from '../content/profile'
import { useApp, runtime } from '../lib/store'
import { gsap, SplitText, scrollToTarget } from '../lib/motion'
import { device, voxelTier } from '../lib/device'
import { sceneName } from '../three/sceneState'
import { Magnetic } from '../components/Magnetic'
import './hero.css'

export function Hero() {
  const booted = useApp('booted')
  const root = useRef<HTMLElement>(null)
  const readout = useRef<HTMLSpanElement>(null)

  // Intro: the terrain rises, the name assembles, the rest settles in.
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    if (device.reducedMotion) {
      runtime.intro = 1
      return
    }
    gsap.set(el.querySelectorAll('[data-hero-fade]'), { opacity: 0, y: 24 })
    const name = el.querySelector<HTMLElement>('.hero__name')
    const split = name ? SplitText.create(name, { type: 'lines,chars', mask: 'lines', linesClass: 'split-line' }) : null
    if (split) gsap.set(split.chars, { yPercent: 120 })
    if (!booted) return () => split?.revert()

    const tl = gsap.timeline({ delay: 0.15 })
    tl.to(runtime, { intro: 1, duration: 2.6, ease: 'expo.out' }, 0)
    if (split) tl.to(split.chars, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.035 }, 0.1)
    tl.to(el.querySelectorAll('[data-hero-fade]'), { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }, 0.5)
    return () => {
      tl.kill()
      split?.revert()
    }
  }, [booted])

  // Scrolling away: the copy drifts up and dissolves into the scene.
  useLayoutEffect(() => {
    const el = root.current
    if (!el || device.reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.to('.hero__content', {
        yPercent: -18,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hero__bar', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: '30% top', scrub: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  // Live technical readout: proof the background is real-time.
  useEffect(() => {
    let raf = 0
    let last = 0
    const count = (voxelTier.grid * voxelTier.grid).toLocaleString()
    const tick = (t: number) => {
      if (t - last > 250 && readout.current) {
        last = t
        const s = runtime.stats
        readout.current.textContent = `${sceneName(s.scene)} · ${count} voxels · ${s.calls || 1} draw call · ${Math.round(s.fps)} fps`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section ref={root} id="hero" className="hero" data-scene="0" aria-labelledby="hero-name">
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__content wrap">
        <div className="hero__left">
          <p className="hero__kicker mono" data-hero-fade>
            {profile.disciplines.map((d, i) => (
              <span key={d} className="hero__discipline">
                {d}
                {i < profile.disciplines.length - 1 && <span className="hero__slash">/</span>}
              </span>
            ))}
          </p>
          <h1 id="hero-name" className="hero__name" aria-label={profile.name}>
            <span className="hero__line">{profile.firstName}</span>{' '}
            <span className="hero__line">{profile.lastName}</span>
          </h1>
        </div>

        <div className="hero__right">
          <p className="hero__tagline" data-hero-fade>
            {profile.tagline}
          </p>
          <p className="hero__intro dim" data-hero-fade>
            {profile.intro}
          </p>
          <div className="hero__ctas" data-hero-fade>
            <Magnetic>
              <a
                href="#work"
                className="btn btn--accent"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget('#work')
                }}
              >
                Enter the work
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M8 2v12M3 9l5 5 5-5" />
                </svg>
              </a>
            </Magnetic>
            <Magnetic>
              <a href={profile.resume} className="btn" target="_blank" rel="noreferrer">
                Résumé
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M5 11L11 5M6 5h5v5" />
                </svg>
              </a>
            </Magnetic>
          </div>
        </div>
      </div>

      <div className="hero__bar wrap mono" data-hero-fade>
        <span className="hero__scroll">
          <i aria-hidden="true" />
          Scroll
        </span>
        <span className="hero__hint dim">
          {device.finePointer ? 'Move to sculpt · hold to raise · click to pulse' : 'Tap the terrain to pulse'}
        </span>
        <span className="hero__readout dim" aria-hidden="true">
          <span className="accent">●</span> <span ref={readout}>terrain</span>
        </span>
      </div>
    </section>
  )
}

export function Statement() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el || device.reducedMotion) return
    const text = el.querySelector<HTMLElement>('.statement__text')
    if (!text) return
    const split = SplitText.create(text, { type: 'words' })
    const ctx = gsap.context(() => {
      gsap.fromTo(
        split.words,
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: text, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
        },
      )
      gsap.from('.statement__meta > *', {
        opacity: 0,
        y: 16,
        stagger: 0.08,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 75%', once: true },
      })
    }, el)
    return () => {
      ctx.revert()
      split.revert()
    }
  }, [])

  return (
    <section ref={root} id="statement" className="statement section" data-scene="1" aria-label="Introduction">
      <div className="wrap statement__grid">
        <div className="statement__meta mono">
          <span className="accent">00</span>
          <span className="dim">Identity</span>
          <span className="dim">{profile.location}</span>
        </div>
        <p className="statement__text">{profile.statement}</p>
      </div>
    </section>
  )
}
