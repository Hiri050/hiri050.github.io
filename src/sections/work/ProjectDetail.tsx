import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { projectBySlug, projects } from '../../content/projects'
import { profile } from '../../content/profile'
import { appStore, runtime, useApp } from '../../lib/store'
import { gsap, lockScroll, SCRAMBLE_CHARS, SplitText } from '../../lib/motion'
import { device } from '../../lib/device'
import { ProjectVisual } from './visuals'
import { BarChart, Pipeline } from './Figures'
import { Magnetic } from '../../components/Magnetic'
import './detail.css'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'problem', label: 'Problem' },
  { id: 'approach', label: 'Approach' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'technologies', label: 'Technologies' },
  { id: 'results', label: 'Results' },
  { id: 'links', label: 'Demo / GitHub' },
] as const

const HASH_PREFIX = '#/work/'

/** The clip-path that makes the overlay look exactly like the exhibit's visual. */
function clipFrom(slug: string) {
  const el = document.querySelector<HTMLElement>(`[data-visual-slug="${slug}"]`)
  const r = el?.getBoundingClientRect()
  const W = window.innerWidth
  const H = window.innerHeight
  if (!r || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) {
    const s = Math.min(W, H) * 0.2
    return `inset(${H / 2 - s}px ${W / 2 - s}px ${H / 2 - s}px ${W / 2 - s}px)`
  }
  return `inset(${r.top}px ${W - r.right}px ${H - r.bottom}px ${r.left}px)`
}

export default function ProjectDetail() {
  const requested = useApp('activeProject')
  const [slug, setSlug] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const closing = useRef(false)
  const isOpen = useRef(false)
  const [activeSection, setActiveSection] = useState<string>('overview')

  const project = slug ? projectBySlug(slug) : undefined
  const index = project ? projects.indexOf(project) : -1

  const finishClose = useCallback(() => {
    closing.current = false
    isOpen.current = false
    setSlug(null)
    lockScroll(false)
    appStore.set({ activeProject: null, sceneHidden: false })
    if (window.location.hash.startsWith(HASH_PREFIX)) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    opener.current?.focus({ preventScroll: true })
  }, [])

  const close = useCallback(() => {
    const el = root.current
    if (!el || !slug || closing.current) return
    closing.current = true
    appStore.set({ sceneHidden: false })
    if (device.reducedMotion) return finishClose()
    gsap
      .timeline({ onComplete: finishClose })
      .to(el.querySelector('.detail__scroll'), { opacity: 0, duration: 0.3, ease: 'power2.in' })
      .to(el, { clipPath: clipFrom(slug), duration: 0.85, ease: 'expo.inOut' }, 0.1)
  }, [slug, finishClose])

  // Open, or switch to another project while open.
  useEffect(() => {
    if (!requested) {
      if (slug && !closing.current) close()
      return
    }
    if (requested === slug) return
    const switching = slug !== null
    if (!switching) {
      opener.current = document.activeElement as HTMLElement
      lockScroll(true)
    }
    setSlug(requested)
    runtime.exhibitHover = 0
    if (window.location.hash !== HASH_PREFIX + requested) {
      history.pushState(null, '', HASH_PREFIX + requested)
    }
  }, [requested, slug, close])

  // Entrance animation whenever the shown project changes.
  useLayoutEffect(() => {
    const el = root.current
    if (!el || !slug) return
    const scroller = el.querySelector<HTMLElement>('.detail__scroll')
    if (scroller) scroller.scrollTop = 0
    setActiveSection('overview')
    el.querySelector<HTMLElement>('.detail__close')?.focus({ preventScroll: true })

    if (device.reducedMotion) {
      gsap.set(el, { clipPath: 'inset(0px 0px 0px 0px)' })
      isOpen.current = true
      appStore.set({ sceneHidden: true })
      return
    }

    const title = el.querySelector<HTMLElement>('.detail__title')
    const split = title ? SplitText.create(title, { type: 'lines,chars', mask: 'lines', linesClass: 'split-line' }) : null
    const switching = isOpen.current
    isOpen.current = true
    const tl = gsap.timeline({ onComplete: () => appStore.set({ sceneHidden: true }) })
    if (!switching) {
      // The overlay starts as the exact rectangle of the exhibit, then becomes the screen.
      tl.fromTo(el, { clipPath: clipFrom(slug) }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 1.05, ease: 'expo.inOut' })
      tl.fromTo(el.querySelector('.detail__visual-frame'), { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0)
    } else {
      gsap.set(el, { clipPath: 'inset(0px 0px 0px 0px)' })
      tl.fromTo(el.querySelector('.detail__scroll'), { opacity: 0 }, { opacity: 1, duration: 0.5 })
    }
    if (split) tl.from(split.chars, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.012 }, switching ? 0.05 : 0.55)
    tl.fromTo(
      el.querySelectorAll('[data-detail-fade]'),
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.06 },
      switching ? 0.1 : 0.7,
    )
    return () => {
      tl.kill()
      split?.revert()
    }
  }, [slug])

  // Keyboard: Esc closes, Tab stays inside, arrows page through projects.
  useEffect(() => {
    if (!slug) return
    const onKey = (e: KeyboardEvent) => {
      const el = root.current
      if (!el) return
      if (e.key === 'Escape') {
        e.preventDefault()
        appStore.set({ activeProject: null })
      } else if (e.key === 'Tab') {
        const items = Array.from(el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]')).filter(
          (n) => n.offsetParent !== null,
        )
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    const onPop = () => {
      if (!window.location.hash.startsWith(HASH_PREFIX)) appStore.set({ activeProject: null })
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onPop)
    }
  }, [slug])

  // Table of contents follows the reader.
  useEffect(() => {
    const el = root.current
    const scroller = el?.querySelector<HTMLElement>('.detail__scroll')
    if (!el || !scroller || !slug) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection((e.target as HTMLElement).dataset.section ?? 'overview')
        })
      },
      { root: scroller, rootMargin: '-35% 0px -55% 0px' },
    )
    el.querySelectorAll('[data-section]').forEach((s) => io.observe(s))

    // Results decode as they arrive.
    const scrambler = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting || device.reducedMotion) return
          const t = e.target as HTMLElement
          scrambler.unobserve(t)
          gsap.to(t, { duration: 1.1, scrambleText: { text: t.dataset.value ?? t.textContent ?? '', chars: SCRAMBLE_CHARS, speed: 0.5 } })
        })
      },
      { root: scroller, threshold: 1 },
    )
    el.querySelectorAll('[data-scramble]').forEach((s) => scrambler.observe(s))
    return () => {
      io.disconnect()
      scrambler.disconnect()
    }
  }, [slug])

  if (!project) return null

  const hasLinks = !!(project.links.github || project.links.demo)
  const sections = SECTIONS.map((s) => (s.id === 'links' && !hasLinks ? { ...s, label: 'Walkthrough' } : s))
  const prev = projects[(index - 1 + projects.length) % projects.length]
  const next = projects[(index + 1) % projects.length]
  const n = String(index + 1).padStart(2, '0')
  const goTo = (s: string) => appStore.set({ activeProject: s })
  const jump = (id: string) => {
    root.current?.querySelector(`#d-${id}`)?.scrollIntoView({ behavior: device.reducedMotion ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div ref={root} className="detail" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className="detail__bar wrap">
        <Magnetic strength={0.2}>
          <button className="detail__close mono" onClick={() => appStore.set({ activeProject: null })} data-cursor="stick">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M13 8H3M7 4L3 8l4 4" />
            </svg>
            Back to work <span className="dim">(Esc)</span>
          </button>
        </Magnetic>
        <p className="detail__count mono dim">
          Case study <span className="accent">{n}</span> / {String(projects.length).padStart(2, '0')}
        </p>
        <div className="detail__pager">
          <button className="detail__pager-btn" onClick={() => goTo(prev.slug)} aria-label={`Previous: ${prev.title}`} data-cursor="stick">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
          <button className="detail__pager-btn" onClick={() => goTo(next.slug)} aria-label={`Next: ${next.title}`} data-cursor="stick">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="detail__scroll" data-lenis-prevent>
        <header className="detail__hero wrap">
          <p className="detail__meta mono" data-detail-fade>
            <span className="accent">{n}</span>
            <span>{project.date}</span>
            {project.context && <span>{project.context}</span>}
          </p>
          <h1 id="detail-title" className="detail__title">
            {project.title}
          </h1>
          <div className="detail__intro">
            <p className="detail__hook" data-detail-fade>
              {project.hook}
            </p>
            <dl className="detail__facts" data-detail-fade>
              <div>
                <dt className="mono dim">Role</dt>
                <dd>{project.role}</dd>
              </div>
              {project.team && (
                <div>
                  <dt className="mono dim">Team</dt>
                  <dd>{project.team}</dd>
                </div>
              )}
              <div>
                <dt className="mono dim">Stack</dt>
                <dd>{project.tags.join(', ')}</dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="detail__visual wrap">
          <div className="detail__visual-frame">
            <ProjectVisual kind={project.visual} live />
          </div>
        </div>

        <div className="detail__body wrap">
          <nav className="detail__toc" aria-label="Case study sections">
            <ol>
              {sections.map((s, i) => (
                <li key={s.id}>
                  <button className={`detail__toc-link mono ${activeSection === s.id ? 'is-active' : ''}`} onClick={() => jump(s.id)}>
                    <span>{String(i + 1).padStart(2, '0')}</span> {s.label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <div className="detail__content">
            <Block id="overview" n={1} label="Overview">
              <p className="detail__lead">{project.overview}</p>
            </Block>

            <Block id="problem" n={2} label="Problem">
              <p className="detail__text">{project.problem}</p>
            </Block>

            <Block id="approach" n={3} label="Approach">
              <ol className="detail__steps">
                {project.approach.map((a, i) => (
                  <li key={i}>
                    <span className="mono accent">{String(i + 1).padStart(2, '0')}</span>
                    <p>{a}</p>
                  </li>
                ))}
              </ol>
            </Block>

            <Block id="engineering" n={4} label="Engineering">
              {project.pipeline && <Pipeline pipeline={project.pipeline} />}
              <div className="detail__cards">
                {project.engineering.map((e) => (
                  <article key={e.title} className="detail__card">
                    <h4>{e.title}</h4>
                    <p>{e.body}</p>
                  </article>
                ))}
              </div>
              {project.media?.some((m) => m.pixelated) && (
                <figure className="detail__gallery">
                  <div className="detail__gallery-grid">
                    {project.media
                      .filter((m) => m.pixelated)
                      .map((m) => (
                        <div key={m.src} className="detail__shot">
                          <img src={m.src} alt={m.alt} loading="lazy" decoding="async" width={640} height={480} className="is-pixelated" />
                          {m.caption && <span className="mono">{m.caption}</span>}
                        </div>
                      ))}
                  </div>
                  <figcaption className="mono dim">
                    Real frames from the engine's bit-exact C model of the GPU (gpu_sw.c), rendered from a test world. The
                    Verilog is checked against this model byte for byte.
                  </figcaption>
                </figure>
              )}
            </Block>

            <Block id="technologies" n={5} label="Technologies">
              <div className="detail__tech">
                {project.tech.map((t) => (
                  <div key={t.group}>
                    <p className="mono dim">{t.group}</p>
                    <ul>
                      {t.items.map((i) => (
                        <li key={i} className="chip">
                          {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Block>

            <Block id="results" n={6} label="Results">
              <ul className="detail__metrics">
                {project.results.map((r) => (
                  <li key={r.label}>
                    <span className="detail__metric-value" data-scramble data-value={r.value}>
                      {r.value}
                    </span>
                    <span className="detail__metric-label">{r.label}</span>
                  </li>
                ))}
              </ul>
              {project.chart && <BarChart chart={project.chart} />}
              {project.resultsNote && (
                <p className="detail__note">
                  <span className="mono accent">Note</span> {project.resultsNote}
                </p>
              )}
              {project.media
                ?.filter((m) => m.paper)
                .map((m) => (
                  <figure key={m.src} className="detail__paper">
                    <img src={m.src} alt={m.alt} loading="lazy" decoding="async" />
                    {m.caption && <figcaption className="mono dim">{m.caption}</figcaption>}
                  </figure>
                ))}
            </Block>

            <Block id="links" n={7} label={hasLinks ? 'Demo / GitHub' : 'Walkthrough'}>
              <div className="detail__links">
                {project.links.github && (
                  <a className="btn btn--accent" href={project.links.github} target="_blank" rel="noreferrer">
                    Source on GitHub ↗
                  </a>
                )}
                {project.links.demo && (
                  <a className="btn" href={project.links.demo} target="_blank" rel="noreferrer">
                    Live demo ↗
                  </a>
                )}
                {!hasLinks && (
                  <div className="detail__walkthrough">
                    <p className="detail__lead">Code, demo and design walkthrough available on request.</p>
                    <p className="detail__text">
                      I'm happy to go through the architecture, the trade-offs and what I'd do differently, live or over email.
                    </p>
                    <div className="detail__links-row">
                      <a className="btn btn--accent" href={`mailto:${profile.email}?subject=${encodeURIComponent(`Walkthrough: ${project.title}`)}`}>
                        Request a walkthrough
                      </a>
                      <a className="btn" href={profile.github} target="_blank" rel="noreferrer">
                        More on GitHub ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Block>
          </div>
        </div>

        <button className="detail__next" onClick={() => goTo(next.slug)} data-cursor="view" data-cursor-label="Next">
          <span className="wrap detail__next-inner">
            <span className="mono dim">Next case study</span>
            <span className="detail__next-title">{next.title}</span>
          </span>
        </button>
      </div>
    </div>
  )
}

function Block({ id, n, label, children }: { id: string; n: number; label: string; children: React.ReactNode }) {
  return (
    <section id={`d-${id}`} className="detail__block" data-section={id} aria-labelledby={`dh-${id}`}>
      <h2 id={`dh-${id}`} className="detail__block-head mono">
        <span className="accent">{String(n).padStart(2, '0')}</span> {label}
      </h2>
      <div className="detail__block-body">{children}</div>
    </section>
  )
}
