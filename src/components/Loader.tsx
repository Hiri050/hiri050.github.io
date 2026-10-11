import { useEffect, useRef, useState } from 'react'
import { appStore, useApp } from '../lib/store'
import { device, voxelTier } from '../lib/device'
import { gsap } from '../lib/motion'
import { projects } from '../content/projects'
import { experience } from '../content/experience'
import './loader.css'

const pad = (n: number) => String(n).padStart(2, '0')

const LINES = [
  { label: 'initializing system', value: 'ok' },
  { label: 'loading projects', value: pad(projects.length) },
  { label: 'loading experience', value: pad(experience.length) },
  { label: 'compiling voxel shader', value: 'glsl' },
  { label: `uploading ${(voxelTier.grid * voxelTier.grid).toLocaleString()} voxels`, value: '1 draw' },
]

const SEEN_KEY = 'hs-booted'

export function Loader() {
  const sceneReady = useApp('sceneReady')
  const [shown, setShown] = useState(0)
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const counter = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const exiting = useRef(false)

  const fast = (() => {
    try {
      return sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
      return false
    }
  })()
  const step = device.reducedMotion || fast ? 40 : 150

  // Reveal boot lines one by one; the last two wait for the GPU.
  useEffect(() => {
    if (shown >= LINES.length) return
    const needsScene = shown >= 3
    if (needsScene && !sceneReady && device.webgl) return
    const id = window.setTimeout(() => setShown((n) => n + 1), step)
    return () => window.clearTimeout(id)
  }, [shown, sceneReady, step])

  // Never hold the page hostage: proceed after 4.5 s regardless.
  useEffect(() => {
    const id = window.setTimeout(() => setShown(LINES.length), 4500)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    const progress = shown / LINES.length
    const obj = { v: Number(counter.current?.dataset.v ?? 0) }
    gsap.to(obj, {
      v: progress * 100,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate: () => {
        if (counter.current) {
          counter.current.textContent = String(Math.round(obj.v)).padStart(3, '0')
          counter.current.dataset.v = String(obj.v)
        }
      },
    })
    if (bar.current) gsap.to(bar.current, { scaleX: progress, duration: 0.45, ease: 'power2.out' })

    if (shown === LINES.length && !exiting.current) {
      exiting.current = true
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {
        /* storage unavailable: no fast path next time */
      }
      const el = root.current
      if (!el || device.reducedMotion) {
        appStore.set({ booted: true })
        setGone(true)
        return
      }
      const tl = gsap.timeline({ delay: fast ? 0.1 : 0.35, onComplete: () => setGone(true) })
      tl.to(el.querySelector('.loader__inner'), { opacity: 0, y: -24, duration: 0.5, ease: 'power3.in' })
        .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: 'expo.inOut' }, '-=0.15')
        .add(() => appStore.set({ booted: true }), '-=0.55')
    }
  }, [shown, fast])

  if (gone) return null

  return (
    <div ref={root} className="loader" role="status" aria-live="polite" aria-label="Loading the site">
      <div className="loader__inner wrap">
        <p className="loader__brand mono">
          HS/OS <span className="dim">26.10 · cold boot</span>
        </p>
        <ol className="loader__lines mono" aria-hidden="true">
          {LINES.map((line, i) => (
            <li key={line.label} className={i < shown ? 'is-done' : i === shown ? 'is-active' : ''}>
              <span className="loader__status">{i < shown ? '[ ok ]' : i === shown ? '[ .. ]' : '[    ]'}</span>
              <span className="loader__label">{line.label}</span>
              <span className="loader__dots" />
              <span className="loader__value">{i < shown ? line.value : ''}</span>
            </li>
          ))}
        </ol>
        <div className="loader__foot">
          <span className="loader__bar">
            <span ref={bar} />
          </span>
          <span ref={counter} className="loader__count" data-v="0">
            000
          </span>
        </div>
      </div>
    </div>
  )
}
