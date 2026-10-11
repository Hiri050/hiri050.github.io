import { useRef, useState } from 'react'
import { education } from '../content/education'
import { useReveal } from '../lib/useReveal'
import { SectionHead } from '../components/SectionHead'
import './education.css'

const AREAS = Array.from(new Set(education.coursework.map((c) => c.area)))

export function Education() {
  const root = useRef<HTMLElement>(null)
  const [area, setArea] = useState<string | null>(null)
  useReveal(root)

  return (
    <section ref={root} id="education" className="education section" data-scene="2" aria-labelledby="education-title">
      <div className="wrap">
        <SectionHead id="education-title" index="05" kicker="Education" title={education.school} />

        <div className="edu">
          <div className="edu__degree" data-reveal-group>
            <p className="edu__mark" data-reveal aria-hidden="true">
              {education.short}
            </p>
            <div className="edu__facts" data-reveal>
              <p className="edu__degree-name">{education.degree}</p>
              <p className="mono dim">
                {education.location} · <span className="accent">{education.expected}</span>
              </p>
            </div>
            <ul className="edu__highlights" data-reveal>
              {education.highlights.map((h) => (
                <li key={h.label}>
                  <span className="edu__hl-value">{h.value}</span>
                  <span className="dim">{h.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="edu__courses">
            <div className="edu__courses-head" data-reveal>
              <p className="mono dim">Relevant coursework</p>
              <div className="edu__areas" role="group" aria-label="Highlight by area">
                {AREAS.map((a) => (
                  <button
                    key={a}
                    className={`edu__area mono ${area === a ? 'is-active' : ''}`}
                    aria-pressed={area === a}
                    onPointerEnter={() => setArea(a)}
                    onPointerLeave={() => setArea(null)}
                    onFocus={() => setArea(a)}
                    onBlur={() => setArea(null)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <ol className="edu__list" data-reveal-group>
              {education.coursework.map((c, i) => (
                <li key={c.name} className={`edu__course ${area && area !== c.area ? 'is-dim' : ''} ${area === c.area ? 'is-on' : ''}`} data-reveal>
                  <span className="mono dim">{String(i + 1).padStart(2, '0')}</span>
                  <span className="edu__course-name">{c.name}</span>
                  <span className="mono dim edu__course-area">{c.area}</span>
                </li>
              ))}
            </ol>

            <div className="edu__certs" data-reveal-group>
              <p className="mono dim" data-reveal>
                Certifications
              </p>
              {education.certifications.map((c) => (
                <div key={c.code} className="edu__cert" data-reveal>
                  <span>{c.name}</span>
                  <span className="mono dim">{c.code}</span>
                  <span className={`mono ${c.status === 'In progress' ? 'edu__cert--progress' : 'accent'}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
