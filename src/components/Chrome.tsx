import { useEffect, useRef, useState } from 'react'
import { appStore, runtime, useApp } from '../lib/store'
import { scrollToTarget } from '../lib/motion'
import { onToast } from '../lib/toast'
import { nav } from '../content/nav'
import { sceneName } from '../three/sceneState'
import './chrome.css'

/** Vertical scroll progress with one tick per section (desktop). */
export function ProgressRail() {
  const section = useApp('section')
  const fill = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      if (fill.current) fill.current.style.transform = `scaleY(${p})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <nav className={`rail ${section === 'hero' ? 'is-hidden' : ''}`} aria-label="Section progress">
      <span className="rail__track" aria-hidden="true">
        <span ref={fill} className="rail__fill" />
      </span>
      <ol>
        {nav.map((item) => (
          <li key={item.id}>
            <button
              className={`rail__tick ${section === item.id ? 'is-active' : ''}`}
              onClick={() => scrollToTarget(`#${item.id}`)}
              aria-label={`Go to ${item.label}`}
              aria-current={section === item.id ? 'location' : undefined}
            >
              <span className="rail__label mono">{item.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Toaster() {
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null)
  useEffect(() => {
    let timer = 0
    const off = onToast((text) => {
      setMsg({ text, id: Date.now() })
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setMsg(null), 3200)
    })
    return () => {
      off()
      window.clearTimeout(timer)
    }
  }, [])
  return (
    <div className="toaster" role="status" aria-live="polite">
      {msg && (
        <p key={msg.id} className="toast mono">
          <span className="accent">●</span> {msg.text}
        </p>
      )}
    </div>
  )
}

/** Live render stats, shown in developer mode (Konami code). */
export function DevHUD() {
  const devMode = useApp('devMode')
  const ref = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (!devMode) return
    let raf = 0
    const tick = () => {
      const s = runtime.stats
      if (ref.current) {
        ref.current.textContent = [
          appStore.get().sceneHidden ? `fps      paused` : `fps        ${s.fps.toFixed(0).padStart(4)}`,
          `dpr        ${s.dpr.toFixed(2).padStart(4)}`,
          `voxels     ${String(s.instances).padStart(4)}`,
          `draw calls ${String(s.calls).padStart(4)}`,
          `triangles  ${String(s.triangles).padStart(6)}`,
          `scene      ${s.scene.toFixed(2)} ${sceneName(s.scene)}`,
          `pointer    ${runtime.pointer.nx.toFixed(2)}, ${runtime.pointer.ny.toFixed(2)}`,
          `section    #${appStore.get().section}`,
        ].join('\n')
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [devMode])

  if (!devMode) return null
  return (
    <>
      <div className="dev-grid" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <aside className="dev-hud" aria-label="Developer stats">
        <p className="mono accent">dev mode · ↑↑↓↓←→←→BA to exit</p>
        <pre ref={ref} />
      </aside>
    </>
  )
}
