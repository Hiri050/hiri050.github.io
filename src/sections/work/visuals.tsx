import { useEffect, useMemo, useRef, useState } from 'react'
import type { VisualKind } from '../../content/types'
import { projectBySlug } from '../../content/projects'
import { mulberry32, valueNoise2D } from '../../lib/random'
import { device } from '../../lib/device'
import './visuals.css'

/*
 * One generative artwork per project. Each is drawn from what the project does,
 * not decoration: GPU scan bands over voxel terrain, 128 cipher cores, real QLIKE
 * scores, a LiDAR sweep with an MPCC horizon, and so on. All are deterministic.
 * `live` runs the animation (hover on desktop, in-view on touch).
 */

interface VisualProps {
  live: boolean
}

const VB = '0 0 400 300'

/* ---------------- voxel engine ---------------- */

function VoxelArt({ live }: VisualProps) {
  const cols = useMemo(() => {
    const n = valueNoise2D(7)
    const N = 11
    const w = 28
    const h = 14
    const hz = 8
    const out: { d: [string, string, string]; shade: number; key: string; order: number }[] = []
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const H = Math.max(1, Math.round(n(i * 0.33, j * 0.33) * 9 - 1))
        const x = (i - j) * (w / 2) + 200
        const y = (i + j) * (h / 2) + 70
        const top = y - H * hz
        const T = `M${x} ${top}L${x + w / 2} ${top + h / 2}L${x} ${top + h}L${x - w / 2} ${top + h / 2}Z`
        const L = `M${x - w / 2} ${top + h / 2}L${x} ${top + h}L${x} ${y + h}L${x - w / 2} ${y + h / 2}Z`
        const R = `M${x + w / 2} ${top + h / 2}L${x} ${top + h}L${x} ${y + h}L${x + w / 2} ${y + h / 2}Z`
        out.push({ d: [T, L, R], shade: H / 8, key: `${i}-${j}`, order: i + j })
      }
    }
    return out.sort((a, b) => a.order - b.order)
  }, [])

  return (
    <svg viewBox={VB} className={`viz viz--voxel ${live ? 'is-live' : ''}`} preserveAspectRatio="xMidYMid slice">
      {cols.map((c) => {
        const top = 10 + c.shade * 200
        return (
          <g key={c.key}>
            <path d={c.d[1]} fill={`rgb(${top * 0.32},${top * 0.32},${top * 0.33})`} />
            <path d={c.d[2]} fill={`rgb(${top * 0.5},${top * 0.5},${top * 0.5})`} />
            <path d={c.d[0]} fill={`rgb(${top},${top * 0.985},${top * 0.95})`} stroke="rgba(7,7,8,0.55)" strokeWidth="0.6" />
          </g>
        )
      })}
      <g className="viz-voxel__band">
        <rect x="0" y="0" width="400" height="26" fill="rgba(255,106,43,0.1)" />
        <line x1="0" x2="400" y1="26" y2="26" stroke="var(--accent)" strokeWidth="1" />
      </g>
      <text x="16" y="284" className="viz__label">
        span GPU · 16-row bands · 1 px/clk
      </text>
    </svg>
  )
}

/* ---------------- terra ai ---------------- */

function marchingSquares(field: number[][], level: number, cell: number) {
  const segs: string[] = []
  const rows = field.length
  const cols = field[0].length
  const lerp = (a: number, b: number) => (level - a) / (b - a)
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const a = field[y][x]
      const b = field[y][x + 1]
      const c = field[y + 1][x + 1]
      const d = field[y + 1][x]
      const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0)
      if (idx === 0 || idx === 15) continue
      const top = [(x + lerp(a, b)) * cell, y * cell]
      const right = [(x + 1) * cell, (y + lerp(b, c)) * cell]
      const bottom = [(x + lerp(d, c)) * cell, (y + 1) * cell]
      const left = [x * cell, (y + lerp(a, d)) * cell]
      const pairs: Record<number, number[][][]> = {
        1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]],
        5: [[left, top], [bottom, right]], 6: [[top, bottom]], 7: [[left, top]], 8: [[left, top]],
        9: [[top, bottom]], 10: [[top, right], [left, bottom]], 11: [[top, right]], 12: [[left, right]],
        13: [[bottom, right]], 14: [[left, bottom]],
      }
      for (const [p, q] of pairs[idx]) segs.push(`M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`)
    }
  }
  return segs.join('')
}

function TerraArt({ live }: VisualProps) {
  const contours = useMemo(() => {
    const n = valueNoise2D(21)
    const cell = 8
    const field: number[][] = []
    for (let y = 0; y <= 300 / cell; y++) {
      const row: number[] = []
      for (let x = 0; x <= 400 / cell; x++) {
        row.push(n(x * 0.09, y * 0.09) * 0.7 + n(x * 0.21 + 5, y * 0.21) * 0.3)
      }
      field.push(row)
    }
    return [0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78].map((l) => ({ level: l, d: marchingSquares(field, l, cell) }))
  }, [])

  return (
    <svg viewBox={VB} className={`viz viz--terra ${live ? 'is-live' : ''}`} preserveAspectRatio="xMidYMid slice">
      {contours.map((c, i) => (
        <path
          key={c.level}
          d={c.d}
          fill="none"
          stroke={i === 2 ? 'var(--accent)' : `rgba(236,235,232,${0.12 + i * 0.07})`}
          strokeWidth={i === 2 ? 1.2 : 0.8}
          className={i === 2 ? 'viz-terra__flood' : undefined}
        />
      ))}
      <path className="viz-terra__flight" d="M30 250 C 110 180, 150 230, 220 140 S 330 70, 372 48" fill="none" />
      <circle cx="372" cy="48" r="4" fill="var(--accent)" />
      <g transform="translate(232 112)">
        <rect width="132" height="44" rx="3" fill="rgba(7,7,8,0.85)" stroke="rgba(236,235,232,0.2)" />
        <text x="10" y="18" className="viz__label viz__label--bright">
          gemini → focus_region()
        </text>
        <text x="10" y="33" className="viz__label">
          slope · TPI · D8 flow
        </text>
      </g>
      <text x="16" y="284" className="viz__label">
        contours · flood level highlighted
      </text>
    </svg>
  )
}

/* ---------------- volatility ---------------- */

function VolatilityArt({ live }: VisualProps) {
  const project = projectBySlug('volatility')
  const data = project?.chart?.data ?? []
  const max = Math.max(...data.map((d) => d.value))
  const series = useMemo(() => {
    const r = mulberry32(3)
    let v = 0.2
    const pts: string[] = []
    for (let i = 0; i <= 100; i++) {
      const shock = r() > 0.95 ? r() * 0.5 : 0
      v = Math.max(0.08, v * 0.9 + 0.02 + shock + (r() - 0.5) * 0.04)
      pts.push(`${i * 4},${Math.max(44, 80 - v * 46).toFixed(1)}`)
    }
    return pts.join(' ')
  }, [])

  return (
    <svg viewBox={VB} className={`viz viz--vol ${live ? 'is-live' : ''}`} preserveAspectRatio="xMidYMid slice">
      <polyline points={series} fill="none" stroke="rgba(236,235,232,0.18)" strokeWidth="1" />
      {data.map((d, i) => {
        const y = 92 + i * 20
        const w = (d.value / max) * 196
        return (
          <g key={d.label} className="viz-vol__row" style={{ ['--i' as string]: i }}>
            <text x="16" y={y + 9} className={`viz__label ${d.highlight ? 'viz__label--accent' : ''}`}>
              {d.label}
            </text>
            <rect x="138" y={y} width={w} height="11" className="viz-vol__bar" fill={d.highlight ? 'var(--accent)' : 'rgba(236,235,232,0.28)'} />
            <text x={144 + w} y={y + 9} className="viz__label">
              {d.value.toFixed(3)}
            </text>
          </g>
        )
      })}
      <line x1={138 + (0.19 / max) * 196} x2={138 + (0.19 / max) * 196} y1="86" y2="276" stroke="rgba(236,235,232,0.4)" strokeDasharray="2 3" />
      <text x="16" y="28" className="viz__label viz__label--bright">
        QLIKE · out-of-sample · lower is better
      </text>
    </svg>
  )
}

/* ---------------- arc4 ---------------- */

function Arc4Art({ live }: VisualProps) {
  const cells = useMemo(() => {
    const r = mulberry32(11)
    return Array.from({ length: 128 }, (_, i) => ({ i, delay: r() * 1.6, dur: 0.5 + r() * 1.2 }))
  }, [])
  const hex = useMemo(() => {
    const r = mulberry32(5)
    return Array.from({ length: 64 }, () => Math.floor(r() * 256).toString(16).padStart(2, '0')).join(' ')
  }, [])
  const FOUND = 77

  return (
    <svg viewBox={VB} className={`viz viz--arc4 ${live ? 'is-live' : ''}`} preserveAspectRatio="xMidYMid slice">
      {cells.map((c) => {
        const x = 24 + (c.i % 16) * 22.5
        const y = 46 + Math.floor(c.i / 16) * 22.5
        const found = c.i === FOUND
        return (
          <rect
            key={c.i}
            x={x}
            y={y}
            width="17"
            height="17"
            className={found ? 'viz-arc4__found' : 'viz-arc4__core'}
            style={found ? undefined : { animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }}
          />
        )
      })}
      <text x="24" y="32" className="viz__label viz__label--bright">
        128 cores · early-abort PRGA
      </text>
      <g className="viz-arc4__stream">
        <text x="24" y="250" className="viz__label">
          {hex} {hex}
        </text>
      </g>
      <text x="24" y="276" className="viz__label">
        <tspan className="viz__label--accent">■ key found</tspan> · 5.74M keys/s
      </text>
    </svg>
  )
}

/* ---------------- f1tenth ---------------- */

const TRACK = 'M70 150 C 70 70, 140 50, 200 62 S 330 40, 338 110 S 300 170, 330 214 S 260 268, 190 250 S 70 236, 70 150 Z'

function F1Art({ live }: VisualProps) {
  const path = useRef<SVGPathElement>(null)
  const car = useRef<SVGGElement>(null)
  const opp = useRef<SVGCircleElement>(null)
  const horizon = useRef<SVGPolylineElement>(null)
  const [static0] = useState(0.18)

  useEffect(() => {
    const p = path.current
    if (!p) return
    const len = p.getTotalLength()
    let s = static0 * len
    let raf = 0
    let last = performance.now()
    const place = () => {
      const at = (d: number) => p.getPointAtLength(((d % len) + len) % len)
      const a = at(s)
      const b = at(s + 2)
      const heading = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
      car.current?.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${heading})`)
      const o = at(s + 60 + Math.sin(s * 0.01) * 6)
      opp.current?.setAttribute('cx', String(o.x))
      opp.current?.setAttribute('cy', String(o.y))
      const pts: string[] = []
      for (let k = 4; k <= 80; k += 6) {
        const q = at(s + k)
        const off = Math.sin((k / 80) * Math.PI) * 9
        pts.push(`${q.x + off * 0.4},${q.y - off * 0.6}`)
      }
      horizon.current?.setAttribute('points', pts.join(' '))
    }
    place()
    if (!live || device.reducedMotion) return
    const tick = (t: number) => {
      s += (t - last) * 0.07
      last = t
      place()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame((t) => {
      last = t
      tick(t)
    })
    return () => cancelAnimationFrame(raf)
  }, [live, static0])

  const rays = Array.from({ length: 19 }, (_, i) => -90 + i * 10)

  return (
    <svg viewBox={VB} className={`viz viz--f1 ${live ? 'is-live' : ''}`} preserveAspectRatio="xMidYMid slice">
      <path d={TRACK} fill="none" stroke="rgba(236,235,232,0.08)" strokeWidth="34" strokeLinejoin="round" />
      <path ref={path} d={TRACK} fill="none" stroke="rgba(236,235,232,0.35)" strokeWidth="1" strokeDasharray="3 5" />
      <polyline ref={horizon} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <circle ref={opp} r="5" fill="rgba(236,235,232,0.85)" />
      <g ref={car}>
        <g className="viz-f1__lidar">
          {rays.map((a) => (
            <line key={a} x1="0" y1="0" x2={Math.cos((a * Math.PI) / 180) * 46} y2={Math.sin((a * Math.PI) / 180) * 46} />
          ))}
        </g>
        <rect x="-8" y="-4.5" width="16" height="9" rx="2" fill="var(--accent)" />
      </g>
      <text x="16" y="284" className="viz__label">
        MPCC horizon · LiDAR sweep · TTC guard
      </text>
    </svg>
  )
}

/* ---------------- chess ---------------- */

const PIECES: [number, number, string][] = [
  [0, 4, '♚'], [1, 5, '♟'], [1, 6, '♟'], [2, 2, '♞'], [3, 3, '♟'], [2, 7, '♟'],
  [4, 4, '♙'], [5, 2, '♘'], [6, 5, '♙'], [6, 6, '♙'], [7, 6, '♔'], [5, 5, '♗'], [7, 0, '♖'],
]

function ChessArt({ live }: VisualProps) {
  const S = 26
  const ox = 150
  const oy = 44
  return (
    <svg viewBox={VB} className={`viz viz--chess ${live ? 'is-live' : ''}`} preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 64 }, (_, i) => {
        const r = Math.floor(i / 8)
        const c = i % 8
        return <rect key={i} x={ox + c * S} y={oy + r * S} width={S} height={S} fill={(r + c) % 2 ? 'rgba(236,235,232,0.07)' : 'rgba(236,235,232,0.02)'} />
      })}
      <rect x={ox} y={oy} width={S * 8} height={S * 8} fill="none" stroke="rgba(236,235,232,0.25)" />
      {PIECES.map(([r, c, g]) => (
        <text key={`${r}${c}`} x={ox + c * S + S / 2} y={oy + r * S + S * 0.74} textAnchor="middle" className="viz-chess__piece">
          {g}
        </text>
      ))}
      <path
        d={`M${ox + 2 * S + S / 2} ${oy + 5 * S + S / 2} L${ox + 3 * S + S / 2} ${oy + 3 * S + S / 2 + 6}`}
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        markerEnd="url(#chess-arrow)"
        className="viz-chess__arrow"
      />
      <defs>
        <marker id="chess-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
        </marker>
      </defs>
      <g transform={`translate(${ox - 30} ${oy})`}>
        <rect width="12" height={S * 8} fill="rgba(236,235,232,0.08)" />
        <rect width="12" height={S * 8} className="viz-chess__eval" fill="var(--text)" />
      </g>
      <text x="16" y="60" className="viz__label viz__label--bright">
        eval
      </text>
      <text x="16" y="76" className="viz__label">
        NN vs heuristic
      </text>
      <text x="16" y="284" className="viz__label">
        shared alpha-beta engine · swappable evaluators
      </text>
    </svg>
  )
}

/* ---------------- finance ---------------- */

function FinanceArt({ live }: VisualProps) {
  const candles = useMemo(() => {
    const r = mulberry32(42)
    let p = 160
    return Array.from({ length: 30 }, (_, i) => {
      const o = p
      p += (r() - 0.46) * 16
      const c = p
      const hi = Math.min(o, c) - r() * 9
      const lo = Math.max(o, c) + r() * 9
      return { i, o, c, hi, lo }
    })
  }, [])

  return (
    <svg viewBox={VB} className={`viz viz--fin ${live ? 'is-live' : ''}`} preserveAspectRatio="xMidYMid slice">
      <line x1="16" x2="250" y1="118" y2="118" stroke="var(--accent)" strokeDasharray="4 4" strokeWidth="1" />
      <line x1="16" x2="250" y1="196" y2="196" stroke="var(--accent)" strokeDasharray="4 4" strokeWidth="1" opacity="0.6" />
      {candles.map((k) => {
        const x = 22 + k.i * 7.6
        const up = k.c < k.o
        return (
          <g key={k.i} className="viz-fin__candle" style={{ animationDelay: `${k.i * 0.04}s` }}>
            <line x1={x} x2={x} y1={k.hi} y2={k.lo} stroke="rgba(236,235,232,0.5)" />
            <rect
              x={x - 2.6}
              y={Math.min(k.o, k.c)}
              width="5.2"
              height={Math.max(1.5, Math.abs(k.c - k.o))}
              fill={up ? 'var(--text)' : 'transparent'}
              stroke="var(--text)"
              strokeWidth="0.8"
            />
          </g>
        )
      })}
      <g className="viz-fin__chat">
        <rect x="262" y="60" width="122" height="34" rx="10" fill="rgba(236,235,232,0.08)" />
        <text x="274" y="81" className="viz__label">
          what pattern is this?
        </text>
        <rect x="262" y="104" width="122" height="54" rx="10" fill="rgba(255,106,43,0.12)" stroke="rgba(255,106,43,0.5)" />
        <text x="274" y="124" className="viz__label viz__label--accent">
          LLaVA
        </text>
        <text x="274" y="140" className="viz__label viz__label--bright">
          resistance retest
        </text>
        <rect x="262" y="168" width="90" height="30" rx="10" fill="rgba(236,235,232,0.08)" />
        <text x="274" y="187" className="viz__label">
          ◉ voice · whisper
        </text>
      </g>
      <text x="16" y="284" className="viz__label">
        chat · chart vision · speech · live prices
      </text>
    </svg>
  )
}

/* ---------------- baccarat ---------------- */

const SEG: Record<string, [number, number, number, number]> = {
  a: [6, 0, 36, 6], b: [42, 6, 6, 38], c: [42, 50, 6, 38], d: [6, 88, 36, 6],
  e: [0, 50, 6, 38], f: [0, 6, 6, 38], g: [6, 44, 36, 6],
}
const DIGITS: Record<number, string> = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
}

function SevenSeg({ x, y, digit }: { x: number; y: number; digit: number }) {
  const on = DIGITS[digit]
  return (
    <g transform={`translate(${x} ${y})`}>
      {Object.entries(SEG).map(([k, [sx, sy, w, h]]) => (
        <rect key={k} x={sx} y={sy} width={w} height={h} rx="2" fill={on.includes(k) ? 'var(--accent)' : 'rgba(236,235,232,0.06)'} />
      ))}
    </g>
  )
}

function BaccaratArt({ live }: VisualProps) {
  const [hand, setHand] = useState([8, 6])
  useEffect(() => {
    if (!live || device.reducedMotion) return
    const r = mulberry32(Date.now() & 0xffff)
    const id = window.setInterval(() => setHand([Math.floor(r() * 10), Math.floor(r() * 10)]), 900)
    return () => window.clearInterval(id)
  }, [live])
  const winner = hand[0] === hand[1] ? 'TIE' : hand[0] > hand[1] ? 'PLAYER' : 'BANKER'

  return (
    <svg viewBox={VB} className={`viz viz--bac ${live ? 'is-live' : ''}`} preserveAspectRatio="xMidYMid slice">
      {[0, 1].map((side) => (
        <g key={side} transform={`translate(${side ? 222 : 52} 54)`}>
          <rect width="126" height="150" rx="6" fill="rgba(7,7,8,0.6)" stroke="rgba(236,235,232,0.18)" />
          <text x="14" y="24" className="viz__label viz__label--bright">
            {side ? 'BANKER' : 'PLAYER'}
          </text>
          <SevenSeg x={39} y={40} digit={hand[side]} />
        </g>
      ))}
      <g transform="translate(52 226)">
        {Array.from({ length: 10 }, (_, i) => (
          <circle key={i} cx={8 + i * 30} cy="8" r="4" fill={i < 3 && winner === 'PLAYER' ? 'var(--accent)' : i > 6 && winner === 'BANKER' ? 'var(--accent)' : (i === 4 || i === 5) && winner === 'TIE' ? 'var(--accent)' : 'rgba(236,235,232,0.12)'} />
        ))}
      </g>
      <text x="16" y="284" className="viz__label">
        FSM + datapath · mod-10 scoring · 2,744 cases
      </text>
    </svg>
  )
}

const ART: Record<VisualKind, (p: VisualProps) => React.JSX.Element> = {
  voxel: VoxelArt,
  terra: TerraArt,
  volatility: VolatilityArt,
  arc4: Arc4Art,
  f1tenth: F1Art,
  chess: ChessArt,
  finance: FinanceArt,
  baccarat: BaccaratArt,
}

export function ProjectVisual({ kind, live }: { kind: VisualKind; live: boolean }) {
  const Art = ART[kind]
  return <Art live={live && !device.reducedMotion} />
}
