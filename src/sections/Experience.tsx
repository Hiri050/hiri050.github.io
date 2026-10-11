import { useLayoutEffect, useRef } from 'react'
import { experience } from '../content/experience'
import { profile } from '../content/profile'
import { useReveal } from '../lib/useReveal'
import { gsap, scrollToTarget } from '../lib/motion'
import { device } from '../lib/device'
import { SectionHead } from '../components/SectionHead'
import './experience.css'

export function Experience() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  // Oldest first, so the signal travels forward in time.
  const entries = [...experience].reverse()

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    if (device.reducedMotion) {
      el.querySelectorAll('.timeline__node').forEach((n) => n.classList.add('is-lit'))
      return
    }
    const mm = gsap.matchMedia(el)
    mm.add({ wide: '(min-width: 901px)', narrow: '(max-width: 900px)' }, (c) => {
      const wide = !!c.conditions?.wide
      const timeline = el.querySelector('.timeline')
      gsap.fromTo(
        '.timeline__fill',
        wide ? { scaleX: 0, scaleY: 1 } : { scaleY: 0, scaleX: 1 },
        {
          scaleX: 1,
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: timeline, start: 'top 75%', end: wide ? 'top 15%' : 'bottom 60%', scrub: 0.5 },
        },
      )
      // Side by side, nodes light as the fill reaches them; stacked, as each scrolls in.
      el.querySelectorAll<HTMLElement>('.timeline__node').forEach((node, i) => {
        gsap.timeline({
          scrollTrigger: {
            trigger: wide ? timeline : node,
            start: wide ? `top ${75 - i * 20}%` : 'top 70%',
            onEnter: () => node.classList.add('is-lit'),
            onLeaveBack: () => node.classList.remove('is-lit'),
          },
        })
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} id="experience" className="experience section" data-scene="2" aria-labelledby="experience-title">
      <div className="wrap">
        <SectionHead
          id="experience-title"
          index="03"
          kicker="Experience · Signal trace"
          title="Where I've shipped."
          lead="Industry roles so far, in order. The trace keeps going."
        />

        <ol className="timeline">
          <span className="timeline__line" aria-hidden="true">
            <span className="timeline__fill" />
          </span>

          {entries.map((e) => (
            <li key={e.org} className="timeline__node">
              <span className="timeline__dot" aria-hidden="true" />
              <p className="timeline__date mono">{e.date}</p>
              <article className="timeline__card">
                <header>
                  <h3 className="timeline__role">{e.role}</h3>
                  <p className="timeline__org">
                    {e.org} <span className="dim">· {e.location}</span>
                  </p>
                </header>
                <p className="timeline__summary">{e.summary}</p>
                <ul className="timeline__work">
                  {e.work.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
                {e.impact && (
                  <ul className="timeline__impact">
                    {e.impact.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                )}
                <ul className="timeline__tech" aria-label="Technologies">
                  {e.tech.map((t) => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}

          <li className="timeline__node timeline__node--next">
            <span className="timeline__dot" aria-hidden="true" />
            <p className="timeline__date mono">Next</p>
            <article className="timeline__card">
              <h3 className="timeline__role">Your team?</h3>
              <p className="timeline__summary">{profile.lookingFor}</p>
              <a
                href="#contact"
                className="btn btn--accent"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget('#contact')
                }}
              >
                Get in touch
              </a>
            </article>
          </li>
        </ol>
      </div>
    </section>
  )
}
