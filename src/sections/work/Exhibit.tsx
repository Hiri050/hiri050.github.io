import { useRef, useState } from 'react'
import type { Project } from '../../content/types'
import { ProjectVisual } from './visuals'
import { appStore, runtime } from '../../lib/store'
import { device } from '../../lib/device'

interface Props {
  project: Project
  index: number
  total: number
  /** On touch devices the exhibit animates while it is the one in view. */
  inView: boolean
}

export function Exhibit({ project, index, total, inView }: Props) {
  const [hover, setHover] = useState(false)
  const card = useRef<HTMLElement>(null)

  const onMove = (e: React.PointerEvent) => {
    if (!device.finePointer || device.reducedMotion || !card.current) return
    const b = card.current.getBoundingClientRect()
    const x = (e.clientX - b.left) / b.width
    const y = (e.clientY - b.top) / b.height
    card.current.style.setProperty('--rx', `${(0.5 - y) * 6}deg`)
    card.current.style.setProperty('--ry', `${(x - 0.5) * 8}deg`)
    card.current.style.setProperty('--gx', `${x * 100}%`)
    card.current.style.setProperty('--gy', `${y * 100}%`)
  }

  const onEnter = () => {
    setHover(true)
    runtime.exhibitHover = 1
  }
  const onLeave = () => {
    setHover(false)
    runtime.exhibitHover = 0
    card.current?.style.setProperty('--rx', '0deg')
    card.current?.style.setProperty('--ry', '0deg')
  }

  const open = () => appStore.set({ activeProject: project.slug })
  const n = String(index + 1).padStart(2, '0')

  return (
    <article
      ref={card}
      className={`exhibit ${hover ? 'is-hover' : ''}`}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      aria-labelledby={`exhibit-${project.slug}`}
    >
      <div className="exhibit__frame">
        <div className="exhibit__visual" data-visual-slug={project.slug}>
          <ProjectVisual kind={project.visual} live={hover || inView} />
          <span className="exhibit__glare" aria-hidden="true" />
        </div>
        <span className="exhibit__plate mono" aria-hidden="true">
          {n} / {String(total).padStart(2, '0')}
        </span>
      </div>

      <div className="exhibit__info">
        <p className="exhibit__meta mono">
          <span className="accent">{n}</span>
          <span className="dim">{project.date}</span>
          {project.context && <span className="exhibit__context">{project.context}</span>}
        </p>
        <h3 id={`exhibit-${project.slug}`} className="exhibit__title">
          {project.title}
        </h3>
        <p className="exhibit__hook">{project.hook}</p>
        <ul className="exhibit__tags" aria-label="Technologies">
          {project.tags.slice(0, 5).map((t) => (
            <li key={t} className="chip">
              {t}
            </li>
          ))}
        </ul>
        <button
          className="exhibit__open mono"
          onClick={open}
          data-cursor="view"
          data-cursor-label="Enter"
          aria-label={`Open case study: ${project.title}`}
        >
          <span>Enter case study</span>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </button>
      </div>

      {/* The whole exhibit is a click target; the real button above stays the accessible one. */}
      <button className="exhibit__hit" onClick={open} tabIndex={-1} aria-hidden="true" data-cursor="view" data-cursor-label="Enter" />
    </article>
  )
}
