import { useRef, useState } from 'react'
import { profile } from '../content/profile'
import { useReveal } from '../lib/useReveal'
import { toast } from '../lib/toast'
import { scrollToTarget } from '../lib/motion'
import { Magnetic } from '../components/Magnetic'
import { ScrambleText } from '../components/ScrambleText'
import { LocalTime } from '../components/LocalTime'
import './contact.css'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  useReveal(root)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      toast('Email copied to clipboard')
      window.setTimeout(() => setCopied(false), 2400)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  const links = [
    { label: 'GitHub', href: profile.github },
    profile.linkedin ? { label: 'LinkedIn', href: profile.linkedin } : null,
    { label: 'Résumé (PDF)', href: profile.resume },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <section ref={root} id="contact" className="contact" data-scene="3" aria-labelledby="contact-title">
      <div className="contact__inner wrap">
        <p className="mono contact__kicker" data-reveal>
          <span className="accent">06</span> <span className="dim">Contact · End of transmission</span>
        </p>
        <h2 id="contact-title" className="contact__title" data-split>
          Let's build something.
        </h2>

        <div className="contact__email" data-reveal>
          <Magnetic strength={0.12}>
            <a className="contact__email-link" href={`mailto:${profile.email}`} data-cursor="view" data-cursor-label="Write">
              {profile.email}
            </a>
          </Magnetic>
          <button className="contact__copy mono" onClick={copy} aria-label="Copy email address">
            <ScrambleText text={copied ? 'Copied' : 'Copy'} onChange />
          </button>
        </div>

        <ul className="contact__links" data-reveal-group>
          {links.map((l) => (
            <li key={l.label} data-reveal>
              <a className="contact__link" href={l.href} target="_blank" rel="noreferrer">
                <ScrambleText text={l.label} />
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M5 11L11 5M6 5h5v5" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <footer className="footer wrap mono">
        <span>© 2026 {profile.name}</span>
        <span className="dim">
          {profile.location} · <LocalTime />
        </span>
        <span className="dim footer__built">React · Three.js · GLSL · GSAP</span>
        <span className="dim footer__egg" title="Try it">
          ↑↑↓↓←→←→BA
        </span>
        <button className="footer__top" onClick={() => scrollToTarget('#hero')}>
          Back to top ↑
        </button>
      </footer>
    </section>
  )
}
