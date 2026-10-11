import { useEffect, useMemo, useRef, useState } from 'react'
import { skillGroups, skills } from '../content/skills'
import { projectBySlug } from '../content/projects'
import type { SkillGroupId } from '../content/types'
import { useReveal } from '../lib/useReveal'
import { appStore } from '../lib/store'
import { mulberry32 } from '../lib/random'
import { device } from '../lib/device'
import { gsap } from '../lib/motion'
import { SectionHead } from '../components/SectionHead'
import './skills.css'

type V3 = [number, number, number]

/** Cluster hubs on the six axes of an octahedron. */
const HUB_DIR: Record<SkillGroupId, V3> = {
  hardware: [-1, 0, 0],
  systems: [0, 0, 1],
  software: [1, 0, 0],
  robotics: [0, 1, 0],
  ai: [0, 0, -1],
  quant: [0, -1, 0],
}

const norm = (v: V3): V3 => {
  const l = Math.hypot(...v) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

interface Node {
  id: string
  label: string
  hub: boolean
  groups: SkillGroupId[]
  pos: V3
}

function buildGraph() {
  const r = mulberry32(9)
  const nodes: Node[] = skillGroups.map((g) => ({ id: `hub-${g.id}`, label: g.label, hub: true, groups: [g.id], pos: HUB_DIR[g.id] }))
  for (const s of skills) {
    // Skills that serve several disciplines sit between their hubs.
    const sum: V3 = [0, 0, 0]
    for (const g of s.groups) for (let k = 0; k < 3; k++) sum[k] += HUB_DIR[g][k]
    const jitter: V3 = [(r() - 0.5) * 0.9, (r() - 0.5) * 0.9, (r() - 0.5) * 0.9]
    const dir = norm([sum[0] + jitter[0], sum[1] + jitter[1], sum[2] + jitter[2]])
    const radius = s.groups.length > 1 ? 0.45 + r() * 0.2 : 0.6 + r() * 0.38
    nodes.push({ id: s.name, label: s.name, hub: false, groups: s.groups, pos: [dir[0] * radius, dir[1] * radius, dir[2] * radius] })
  }
  const edges: [number, number][] = []
  nodes.forEach((n, i) => {
    if (n.hub) return
    n.groups.forEach((g) => edges.push([i, skillGroups.findIndex((h) => h.id === g)]))
  })
  return { nodes, edges }
}

export function Skills() {
  const root = useRef<HTMLElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const { nodes, edges } = useMemo(buildGraph, [])
  const [hovered, setHovered] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const focus = hovered ?? pinned
  const [group, setGroup] = useState<SkillGroupId | null>(null)
  const state = useRef({ ay: 0.6, ax: -0.35, vy: 0, dragging: false, lastX: 0, lastY: 0, hovered: null as string | null })
  useReveal(root)

  useEffect(() => {
    state.current.hovered = focus
  }, [focus])

  // Selecting a cluster turns the constellation to face it.
  useEffect(() => {
    if (!group) return
    const [x, y, z] = HUB_DIR[group]
    const targetY = Math.atan2(-x, z)
    const targetX = Math.atan2(y, Math.hypot(x, z)) * 0.9
    const s = state.current
    let dy = targetY - s.ay
    dy = Math.atan2(Math.sin(dy), Math.cos(dy))
    gsap.to(s, { ay: s.ay + dy, ax: targetX, duration: device.reducedMotion ? 0 : 1.4, ease: 'expo.inOut' })
  }, [group])

  useEffect(() => {
    const el = svg.current
    if (!el) return
    const nodeEls = Array.from(el.querySelectorAll<SVGGElement>('[data-node]'))
    const edgeEls = Array.from(el.querySelectorAll<SVGLineElement>('[data-edge]'))
    const projected = nodes.map(() => ({ x: 0, y: 0, z: 0, s: 1 }))
    let raf = 0
    let visible = false
    let last = performance.now()

    const draw = () => {
      const s = state.current
      const cy = Math.cos(s.ay)
      const sy = Math.sin(s.ay)
      const cx = Math.cos(s.ax)
      const sx = Math.sin(s.ax)
      const R = 245
      const f = 3.2
      nodes.forEach((n, i) => {
        const [x, y, z] = n.pos
        const x1 = x * cy + z * sy
        const z1 = -x * sy + z * cy
        const y2 = y * cx - z1 * sx
        const z2 = y * sx + z1 * cx
        const k = f / (f - z2)
        const p = projected[i]
        p.x = 300 + x1 * R * k
        p.y = 270 - y2 * R * k
        p.z = z2
        p.s = k
      })
      nodeEls.forEach((g, i) => {
        const p = projected[i]
        const depth = (p.z + 1) / 2
        g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.s.toFixed(3)})`)
        g.style.opacity = String(0.28 + depth * 0.72)
        // Only the near side of the sphere is labelled, so names don't pile up.
        const front = p.z > 0.28 ? '1' : '0'
        if (g.dataset.front !== front) g.dataset.front = front
      })
      edgeEls.forEach((l, i) => {
        const [a, b] = edges[i]
        l.setAttribute('x1', projected[a].x.toFixed(1))
        l.setAttribute('y1', projected[a].y.toFixed(1))
        l.setAttribute('x2', projected[b].x.toFixed(1))
        l.setAttribute('y2', projected[b].y.toFixed(1))
      })
    }

    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      const s = state.current
      if (!s.dragging && !s.hovered && !device.reducedMotion) s.ay += dt * 0.07 + s.vy
      s.vy *= 0.92
      draw()
      raf = visible ? requestAnimationFrame(tick) : 0
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    })
    io.observe(el)
    draw()

    const onDown = (e: PointerEvent) => {
      const s = state.current
      s.dragging = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      const s = state.current
      if (!s.dragging) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.ay += dx * 0.006
      s.ax = Math.max(-1.2, Math.min(1.2, s.ax + dy * 0.006))
      s.vy = dx * 0.0008
      if (device.reducedMotion) draw()
    }
    const onUp = () => {
      state.current.dragging = false
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [nodes, edges])

  const hoveredSkill = focus ? skills.find((s) => s.name === focus) : undefined
  const isLit = (n: Node) => {
    if (focus) {
      if (n.id === focus) return true
      if (n.hub && hoveredSkill?.groups.includes(n.groups[0])) return true
      return false
    }
    if (group) return n.groups.includes(group)
    return true
  }
  const edgeLit = ([a, b]: [number, number]) => {
    if (focus) return nodes[a].id === focus
    if (group) return nodes[b].groups[0] === group
    return false
  }

  const activeGroup = skillGroups.find((g) => g.id === group)
  const groupSkills = group ? skills.filter((s) => s.groups.includes(group)) : []

  return (
    <section ref={root} id="skills" className="skills section" data-scene="2" aria-labelledby="skills-title">
      <div className="wrap">
        <SectionHead
          id="skills-title"
          index="04"
          kicker="Skills · Constellation"
          title="What connects to what."
          lead="Every skill here links to a place I used it. Skills that serve several disciplines sit between their clusters. Drag to turn it."
        />

        <div className="skills__grid">
          <div className="skills__panel" data-reveal>
            <div className="skills__filters" role="group" aria-label="Filter by discipline">
              <button className={`skills__filter mono ${group === null ? 'is-active' : ''}`} aria-pressed={group === null} onClick={() => { setGroup(null); setPinned(null) }}>
                All
              </button>
              {skillGroups.map((g) => (
                <button
                  key={g.id}
                  className={`skills__filter mono ${group === g.id ? 'is-active' : ''}`}
                  aria-pressed={group === g.id}
                  onClick={() => { setGroup(group === g.id ? null : g.id); setPinned(null) }}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="skills__info" aria-live="polite">
              {hoveredSkill ? (
                <>
                  <p className="mono dim">{hoveredSkill.groups.map((g) => skillGroups.find((x) => x.id === g)?.label).join(' · ')}</p>
                  <h3 className="skills__info-title">{hoveredSkill.name}</h3>
                  {hoveredSkill.usedIn.length > 0 ? (
                    <ul className="skills__used">
                      {hoveredSkill.usedIn.map((slug) => (
                        <li key={slug}>
                          <button className="skills__used-link" onClick={() => appStore.set({ activeProject: slug })}>
                            <span className="accent">→</span> {projectBySlug(slug)?.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="dim">Used across coursework and day-to-day work.</p>
                  )}
                </>
              ) : activeGroup ? (
                <>
                  <p className="mono dim">{groupSkills.length} skills</p>
                  <h3 className="skills__info-title">{activeGroup.label}</h3>
                  <p className="dim">{activeGroup.blurb}.</p>
                  <ul className="skills__chips">
                    {groupSkills.map((s) => (
                      <li key={s.name}>
                        <button className="chip" onClick={() => setPinned(s.name)} onPointerEnter={() => setHovered(s.name)} onPointerLeave={() => setHovered(null)}>
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="mono dim">
                    {skills.length} skills · {skillGroups.length} clusters
                  </p>
                  <h3 className="skills__info-title">{device.finePointer ? 'Hover a node.' : 'Tap a node.'}</h3>
                  <p className="dim">
                    {device.finePointer ? 'Click one to pin it, or pick' : 'Or pick'} a cluster to turn the constellation toward it.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="skills__stage" data-reveal data-cursor="drag" data-cursor-label="Drag">
            <svg ref={svg} viewBox="0 0 600 540" className="skills__svg" role="img" aria-label="Skill constellation. The full list follows in text.">
              <g>
                {edges.map((e, i) => (
                  <line key={i} data-edge className={`skills__edge ${edgeLit(e) ? 'is-lit' : ''}`} />
                ))}
              </g>
              <g>
                {nodes.map((n) => (
                  <g
                    key={n.id}
                    data-node
                    className={`skills__node ${n.hub ? 'is-hub' : ''} ${isLit(n) ? 'is-lit' : 'is-dim'} ${focus === n.id ? 'is-hover' : ''}`}
                    onPointerEnter={() => !n.hub && setHovered(n.id)}
                    onPointerLeave={() => setHovered(null)}
                    onClick={() => (n.hub ? setGroup(n.groups[0]) : setPinned(pinned === n.id ? null : n.id))}
                  >
                    <circle r={n.hub ? 18 : 12} className="skills__hit" />
                    <circle r={n.hub ? 5 : 2.6} className="skills__dot" />
                    <text x={n.hub ? 10 : 7} y={n.hub ? 4 : 3.5} className="skills__label">
                      {n.hub ? n.label.toUpperCase() : n.label}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>

        <div className="sr-only">
          {skillGroups.map((g) => (
            <div key={g.id}>
              <h3>{g.label}</h3>
              <ul>
                {skills
                  .filter((s) => s.groups.includes(g.id))
                  .map((s) => (
                    <li key={s.name}>
                      {s.name}
                      {s.usedIn.length > 0 && `: used in ${s.usedIn.map((u) => projectBySlug(u)?.title).join(', ')}`}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
