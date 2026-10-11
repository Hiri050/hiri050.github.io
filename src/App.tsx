import { lazy, Suspense, useEffect, useState } from 'react'
import { appStore, useApp } from './lib/store'
import { device } from './lib/device'
import { initSmoothScroll, ScrollTrigger } from './lib/motion'
import { initDirector, initPointer } from './lib/director'
import { initEasterEggs } from './lib/easterEggs'
import { projectBySlug } from './content/projects'
import { Loader } from './components/Loader'
import { Cursor } from './components/Cursor'
import { Header } from './components/Header'
import { DevHUD, ProgressRail, Toaster } from './components/Chrome'
import { Hero, Statement } from './sections/Hero'
import { About } from './sections/About'
import { Work } from './sections/work/Work'
import { Experience } from './sections/Experience'
import { Skills } from './sections/Skills'
import { Education } from './sections/Education'
import { Contact } from './sections/Contact'

// The WebGL stage and the case-study viewer are split out of the main bundle:
// text paints first, three.js streams in behind the loader.
const Stage = lazy(() => import('./three/Stage'))
const ProjectDetail = lazy(() => import('./sections/work/ProjectDetail'))

const DEEP_LINK = /^#\/work\/([\w-]+)$/

export function App() {
  const booted = useApp('booted')
  const activeProject = useApp('activeProject')
  const [detailLoaded, setDetailLoaded] = useState(false)

  useEffect(() => {
    initSmoothScroll()
    const stops = [initDirector(), initPointer(), initEasterEggs()]
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => stops.forEach((stop) => stop())
  }, [])

  // Shareable case-study links: /#/work/<slug>
  useEffect(() => {
    if (!booted) return
    const open = () => {
      const m = window.location.hash.match(DEEP_LINK)
      if (m && projectBySlug(m[1])) appStore.set({ activeProject: m[1] })
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [booted])

  useEffect(() => {
    if (activeProject) setDetailLoaded(true)
  }, [activeProject])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {device.webgl ? (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      ) : (
        <div className="stage-fallback" aria-hidden="true" />
      )}
      <div className="atmosphere" aria-hidden="true" />

      <Loader />
      <Cursor />
      <Header />
      <ProgressRail />

      <main id="main" tabIndex={-1} inert={!!activeProject}>
        <Hero />
        <Statement />
        <About />
        <Work />
        <Experience />
        <Skills />
        <Education />
        <Contact />
      </main>

      {detailLoaded && (
        <Suspense fallback={null}>
          <ProjectDetail />
        </Suspense>
      )}

      <Toaster />
      <DevHUD />
    </>
  )
}
