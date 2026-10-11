import { useEffect, useRef } from 'react'
import { appStore, useApp } from '../lib/store'
import { gsap, lockScroll, scrollToTarget } from '../lib/motion'
import { device } from '../lib/device'
import { nav, navIndex, navLabel } from '../content/nav'
import { profile } from '../content/profile'
import { ScrambleText } from './ScrambleText'
import { Magnetic } from './Magnetic'
import { LocalTime } from './LocalTime'
import './header.css'

function go(e: React.MouseEvent, id: string) {
  e.preventDefault()
  appStore.set({ menuOpen: false })
  scrollToTarget(`#${id}`)
}

export function Header() {
  const section = useApp('section')
  const menuOpen = useApp('menuOpen')
  const booted = useApp('booted')
  const compact = section !== 'hero' && section !== 'statement'
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!booted || !headerRef.current || device.reducedMotion) return
    gsap.from(headerRef.current.querySelectorAll('[data-intro]'), {
      y: -16,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.06,
      delay: 0.5,
    })
  }, [booted])

  return (
    <>
      <header ref={headerRef} className={`header ${compact ? 'is-compact' : ''}`}>
        <div className="header__inner wrap">
          <Magnetic strength={0.25}>
            <a href="#hero" className="header__mark" data-cursor="stick" data-intro onClick={(e) => go(e, 'hero')} aria-label="Back to top">
              <span aria-hidden="true">{profile.initials}</span>
            </a>
          </Magnetic>

          <p className="header__id mono" data-intro>
            <span>{profile.name}</span>
            <span className="dim">Computer Engineering · UBC</span>
          </p>

          <nav className="header__nav" aria-label="Sections">
            <ul>
              {nav.map((item, i) => (
                <li key={item.id} data-intro>
                  <a
                    href={`#${item.id}`}
                    className={`header__link mono ${section === item.id ? 'is-active' : ''}`}
                    aria-current={section === item.id ? 'location' : undefined}
                    onClick={(e) => go(e, item.id)}
                  >
                    <span className="header__link-index">{String(i + 1).padStart(2, '0')}</span>
                    <ScrambleText text={item.label} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header__now mono" aria-hidden={!compact}>
            <span className="accent">{navIndex(section)}</span>
            <span className="header__now-sep">/</span>
            <ScrambleText text={navLabel(section)} onChange />
          </div>

          <Magnetic strength={0.3}>
            <button
              className={`header__menu ${menuOpen ? 'is-open' : ''}`}
              data-cursor="stick"
              data-intro
              aria-expanded={menuOpen}
              aria-controls="menu"
              onClick={() => appStore.set({ menuOpen: !menuOpen })}
            >
              <span className="mono">{menuOpen ? 'Close' : 'Menu'}</span>
              <span className="header__burger" aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </Magnetic>
        </div>
      </header>
      <Menu open={menuOpen} />
    </>
  )
}

function Menu({ open }: { open: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const firstOpen = useRef(true)

  useEffect(() => {
    const el = root.current
    if (!el) return
    lockScroll(open)
    if (firstOpen.current && !open) return
    firstOpen.current = false

    const items = el.querySelectorAll('[data-menu-item]')
    if (device.reducedMotion) {
      gsap.set(el, { autoAlpha: open ? 1 : 0, clipPath: 'inset(0 0 0% 0)' })
    } else if (open) {
      gsap.timeline()
        .set(el, { autoAlpha: 1 })
        .fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.inOut' })
        .fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.05 }, '-=0.45')
    } else {
      gsap.timeline()
        .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut' })
        .set(el, { autoAlpha: 0 })
    }

    if (open) {
      el.querySelector<HTMLElement>('a')?.focus({ preventScroll: true })
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') appStore.set({ menuOpen: false })
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} id="menu" className="menu" role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden={!open} inert={!open}>
      <div className="menu__inner wrap">
        <ol className="menu__list">
          {nav.map((item, i) => (
            <li key={item.id} className="menu__row">
              <a href={`#${item.id}`} className="menu__link" data-menu-item onClick={(e) => go(e, item.id)}>
                <span className="menu__index mono">{String(i + 1).padStart(2, '0')}</span>
                <ScrambleText text={item.label} />
              </a>
            </li>
          ))}
        </ol>
        <div className="menu__side mono">
          <div className="menu__row">
            <p data-menu-item className="dim">Write</p>
          </div>
          <div className="menu__row">
            <a data-menu-item className="u-link" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </div>
          <div className="menu__row">
            <a data-menu-item className="u-link" href={profile.github} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          </div>
          {profile.linkedin && (
            <div className="menu__row">
              <a data-menu-item className="u-link" href={profile.linkedin} target="_blank" rel="noreferrer">
                LinkedIn ↗
              </a>
            </div>
          )}
          <div className="menu__row">
            <a data-menu-item className="u-link" href={profile.resume} target="_blank" rel="noreferrer">
              Résumé (PDF) ↗
            </a>
          </div>
          <div className="menu__row menu__time">
            <p data-menu-item className="dim">
              Vancouver <LocalTime />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
