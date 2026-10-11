import { useEffect, useRef, useState } from 'react'
import { systemNodes } from '../content/skills'
import { projectBySlug } from '../content/projects'
import { profile } from '../content/profile'
import { useReveal } from '../lib/useReveal'
import { appStore } from '../lib/store'
import { gsap } from '../lib/motion'
import { device } from '../lib/device'
import { SectionHead } from '../components/SectionHead'
import './about.css'

/*
 * Floorplan geometry in a 600×600 viewBox. The core sits in the middle; each
 * subsystem is a block wired to it by a chamfered trace.
 */
const LAYOUT: Record<string, { x: number; y: number; trace: string }> = {
  hardware: { x: 40, y: 60, trace: 'M250 220 V120 L218 88 H190' },
  systems: { x: 410, y: 60, trace: 'M350 220 V120 L382 88 H410' },
  software: { x: 440, y: 272, trace: 'M380 300 H440' },
  robotics: { x: 410, y: 484, trace: 'M350 380 V480 L382 512 H410' },
  ai: { x: 40, y: 484, trace: 'M250 380 V480 L218 512 H190' },
  engineering: { x: 10, y: 272, trace: 'M220 300 H160' },
}
const NODE_W = 150
const NODE_H = 56

const PINS = Array.from({ length: 9 }, (_, i) => 236 + i * 16)

export function About() {
  const root = useRef<HTMLElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const touched = useRef(false)
  useReveal(root)

  // The system idles through its subsystems until someone takes control.
  useEffect(() => {
    if (device.reducedMotion) return
    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.35 })
    if (root.current) io.observe(root.current)
    const id = window.setInterval(() => {
      if (visible && !touched.current) setActive((a) => (a + 1) % systemNodes.length)
    }, 4200)
    return () => {
      io.disconnect()
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!panel.current || device.reducedMotion) return
    gsap.fromTo(
      panel.current.querySelectorAll('[data-panel-anim]'),
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.05, overwrite: true },
    )
  }, [active])

  const select = (i: number) => {
    touched.current = true
    setActive(i)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (active + delta + systemNodes.length) % systemNodes.length
    select(next)
    root.current?.querySelector<HTMLElement>(`#sys-tab-${systemNodes[next].id}`)?.focus()
  }

  const node = systemNodes[active]

  return (
    <section ref={root} id="about" className="about section" data-scene="1" aria-labelledby="about-title">
      <div className="wrap">
        <SectionHead
          id="about-title"
          index="01"
          kicker="About · System overview"
          title="One engineer, six subsystems."
          lead={
            <>
              I don't stop at one layer of the stack. Here is how the pieces connect. Select a block to see what it
              does, and the work that proves it.
            </>
          }
        />

        <div className="about__grid">
          <div className="about__die" data-reveal>
            <svg viewBox="0 0 600 600" className="about__svg" aria-hidden="true">
              <defs>
                <pattern id="die-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0H0V20" fill="none" stroke="rgba(236,235,232,0.05)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="0.5" y="0.5" width="599" height="599" fill="url(#die-grid)" stroke="rgba(236,235,232,0.09)" />
              {[0, 1, 2, 3].map((c) => (
                <path
                  key={c}
                  d={['M0 24 H24 V0', 'M576 0 V24 H600', 'M600 576 H576 V600', 'M24 600 V576 H0'][c]}
                  stroke="rgba(236,235,232,0.35)"
                  fill="none"
                />
              ))}

              {systemNodes.map((n, i) => (
                <g key={n.id} className={`about__trace ${i === active ? 'is-active' : ''}`}>
                  <path d={LAYOUT[n.id].trace} className="about__trace-base" />
                  <path d={LAYOUT[n.id].trace} className="about__trace-signal" pathLength={100} />
                </g>
              ))}

              <g className="about__core">
                <rect x="220" y="220" width="160" height="160" rx="2" />
                {PINS.map((p) => (
                  <g key={p}>
                    <line x1={p} y1="212" x2={p} y2="220" />
                    <line x1={p} y1="380" x2={p} y2="388" />
                    <line x1="212" y1={p} x2="220" y2={p} />
                    <line x1="380" y1={p} x2="388" y2={p} />
                  </g>
                ))}
                <text x="300" y="292" textAnchor="middle" className="about__core-mark">
                  {profile.initials}
                </text>
                <text x="300" y="320" textAnchor="middle" className="about__core-label">
                  {node.label}
                </text>
              </g>
            </svg>

            <div className="about__nodes" role="tablist" aria-label="Subsystems" onKeyDown={onKeyDown}>
              {systemNodes.map((n, i) => {
                const l = LAYOUT[n.id]
                return (
                  <button
                    key={n.id}
                    id={`sys-tab-${n.id}`}
                    role="tab"
                    aria-selected={i === active}
                    aria-controls="sys-panel"
                    tabIndex={i === active ? 0 : -1}
                    className={`about__node mono ${i === active ? 'is-active' : ''}`}
                    style={{
                      left: `${(l.x / 600) * 100}%`,
                      top: `${(l.y / 600) * 100}%`,
                      width: `${(NODE_W / 600) * 100}%`,
                      height: `${(NODE_H / 600) * 100}%`,
                    }}
                    onClick={() => select(i)}
                    onPointerEnter={() => device.finePointer && select(i)}
                  >
                    <span className="about__node-index">{String(i + 1).padStart(2, '0')}</span>
                    {n.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div ref={panel} id="sys-panel" className="about__panel" role="tabpanel" aria-labelledby={`sys-tab-${node.id}`}>
            <p className="mono dim" data-panel-anim>
              Subsystem {String(active + 1).padStart(2, '0')} / <span className="accent">{node.label}</span>
            </p>
            <h3 className="about__panel-title" data-panel-anim>
              {node.title}
            </h3>
            <p className="about__panel-body" data-panel-anim>
              {node.body}
            </p>
            <div className="about__evidence" data-panel-anim>
              <p className="mono dim">Evidence</p>
              <ul>
                {node.evidence.map((slug) => {
                  const p = projectBySlug(slug)
                  if (!p) return null
                  return (
                    <li key={slug}>
                      <button
                        className="about__evidence-link"
                        data-cursor="view"
                        data-cursor-label="Open"
                        onClick={() => appStore.set({ activeProject: slug })}
                      >
                        <span>{p.title}</span>
                        <span className="mono dim">{p.date}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
            <p className="about__looking mono" data-panel-anim>
              <span className="accent">●</span> {profile.lookingFor}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
