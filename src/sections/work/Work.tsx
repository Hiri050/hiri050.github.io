import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { archive, projects } from '../../content/projects'
import { useReveal } from '../../lib/useReveal'
import { gsap, ScrollTrigger } from '../../lib/motion'
import { device } from '../../lib/device'
import { SectionHead } from '../../components/SectionHead'
import { Exhibit } from './Exhibit'
import './work.css'

const DESKTOP = '(min-width: 961px) and (hover: hover)'

export function Work() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const [current, setCurrent] = useState(0)
  const [pinned, setPinned] = useState(false)
  useReveal(root)

  // Desktop: the gallery is pinned and scrolls sideways, like walking a hall.
  useLayoutEffect(() => {
    const t = track.current
    const s = stage.current
    if (!t || !s || device.reducedMotion) return
    const mm = gsap.matchMedia()
    mm.add(DESKTOP, () => {
      setPinned(true)
      const distance = () => t.scrollWidth - window.innerWidth
      const tween = gsap.to(t, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: s,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`
            setCurrent(Math.min(projects.length - 1, Math.round(self.progress * (projects.length - 1))))
          },
        },
      })
      // Exhibits come forward as they reach the centre of the hall.
      t.querySelectorAll<HTMLElement>('.exhibit').forEach((el) => {
        gsap.fromTo(
          el.querySelector('.exhibit__frame'),
          { scale: 0.9, opacity: 0.45 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left 95%', end: 'left 35%', scrub: true },
          },
        )
      })
      return () => setPinned(false)
    })
    return () => mm.revert()
  }, [])

  // Touch/narrow: a native swipe carousel; track which exhibit is centred.
  useEffect(() => {
    const t = track.current
    if (!t || pinned) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setCurrent(Number((e.target as HTMLElement).dataset.index))
        })
      },
      { root: t, threshold: 0.6 },
    )
    t.querySelectorAll('[data-index]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pinned])

  const step = (dir: 1 | -1) => {
    const t = track.current
    const slot = t?.querySelector<HTMLElement>('.work__slot')
    if (!t || !slot) return
    t.scrollBy({ left: dir * (slot.offsetWidth + parseFloat(getComputedStyle(t).columnGap || '0')), behavior: device.reducedMotion ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    // Pin spacing changes page height; let the scene director re-measure.
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => window.clearTimeout(id)
  }, [pinned])

  return (
    <section ref={root} id="work" className="work section" data-scene="2" aria-labelledby="work-title">
      <div className="wrap">
        <SectionHead
          id="work-title"
          index="02"
          kicker="Work · Selected exhibits"
          title="Things I've built."
          lead="Eight projects, from the gate level up. Each one opens into a full case study: the problem, the approach, the engineering, and the results."
        />
      </div>

      <div ref={stage} className={`work__stage ${pinned ? 'is-pinned' : ''}`}>
        <div ref={track} className="work__track" role="list">
          {projects.map((p, i) => (
            <div key={p.slug} className="work__slot" role="listitem" data-index={i}>
              <Exhibit project={p} index={i} total={projects.length} inView={!pinned && current === i} />
            </div>
          ))}
          <div className="work__slot work__slot--end" aria-hidden="true">
            <p className="mono dim">End of hall</p>
            <p className="work__end-title">More below: the archive.</p>
          </div>
        </div>

        <div className="work__hud wrap mono">
          <span aria-hidden="true">
            <span className="accent">{String(current + 1).padStart(2, '0')}</span>
            <span className="dim"> / {String(projects.length).padStart(2, '0')}</span>
          </span>
          <span className="work__progress" aria-hidden="true">
            <span ref={bar} />
          </span>
          {pinned ? (
            <span className="dim" aria-hidden="true">
              Scroll to walk the hall
            </span>
          ) : (
            <span className="work__arrows">
              <span className="dim work__swipe" aria-hidden="true">
                {device.coarsePointer ? 'Swipe to browse' : 'Browse'}
              </span>
              <button className="work__arrow" onClick={() => step(-1)} aria-label="Previous project" disabled={current === 0}>
                ←
              </button>
              <button className="work__arrow" onClick={() => step(1)} aria-label="Next project" disabled={current === projects.length - 1}>
                →
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="wrap work__archive">
        <div className="work__archive-head" data-reveal>
          <p className="mono">
            <span className="accent">02.1</span> <span className="dim">Archive · smaller builds</span>
          </p>
        </div>
        <ul className="archive" data-reveal-group>
          {archive.map((a) => (
            <li key={a.title} className="archive__row" data-reveal tabIndex={0}>
              <span className="archive__date mono dim">{a.date}</span>
              <span className="archive__title">
                {a.title}
                {a.status === 'in-progress' && <span className="archive__status mono">In progress</span>}
              </span>
              <span className="archive__tags mono dim">{a.tags.join(' · ')}</span>
              <span className="archive__summary dim">{a.summary}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
