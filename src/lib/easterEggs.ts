import { appStore } from './store'
import { toast } from './toast'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export function toggleDevMode() {
  const on = !appStore.get().devMode
  appStore.set({ devMode: on })
  document.documentElement.toggleAttribute('data-dev', on)
  toast(on ? 'Developer mode on: per-voxel debug shading, live stats, layout grid' : 'Developer mode off')
}

export function initEasterEggs() {
  let progress = 0
  const onKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('input, textarea, [contenteditable]')) return
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0
    if (progress === KONAMI.length) {
      progress = 0
      toggleDevMode()
    }
  }
  window.addEventListener('keydown', onKey)

  const big = 'font: 600 14px/1.4 ui-monospace, monospace; color: #ecebe8; background: #070708; padding: 8px 12px;'
  const dim = 'font: 12px/1.6 ui-monospace, monospace; color: #8b8a86;'
  console.log(
    '%cHS / hello, fellow engineer.%c\n\nThe background is one instanced draw call: 4,096 voxels placed entirely in the vertex shader,\nwith block grid lines and ordered dithering borrowed from the FPGA GPU I built.\n\nTry ↑ ↑ ↓ ↓ ← → ← → B A for developer mode.\nLooking for an intern? singlahirdianshu@gmail.com',
    big,
    dim,
  )

  return () => window.removeEventListener('keydown', onKey)
}
