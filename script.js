/* ╔══════════════════════════════════════════════════════════════╗
   ║  Hirdianshu Singla — Portfolio v2                           ║
   ║  Cinematic · 3D Tilt · Magnetic · Typing · Scroll-Sync     ║
   ╚══════════════════════════════════════════════════════════════╝ */
;(function () {
  'use strict'

  const root = document.documentElement
  const $ = (s, p = document) => p.querySelector(s)
  const $$ = (s, p = document) => [...p.querySelectorAll(s)]

  /* ═══════════════════════════════════════
     1. THEME TOGGLE
     ═══════════════════════════════════════ */
  const themeBtn = $('#themeToggle')
  const saved = localStorage.getItem('theme')
  if (saved === 'light') root.classList.add('light')
  else if (!saved && matchMedia('(prefers-color-scheme:light)').matches) root.classList.add('light')

  themeBtn?.addEventListener('click', () => {
    root.classList.toggle('light')
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark')
  })

  /* ═══════════════════════════════════════
     2. FOOTER YEAR
     ═══════════════════════════════════════ */
  const yearEl = $('#year')
  if (yearEl) yearEl.textContent = new Date().getFullYear()

  /* ═══════════════════════════════════════
     3. HEADER SCROLL EFFECT
     ═══════════════════════════════════════ */
  const hdr = $('#hdr')
  const btt = $('#btt')

  function onScroll() {
    const y = window.scrollY
    hdr?.classList.toggle('scrolled', y > 50)
    btt?.classList.toggle('show', y > 500)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  /* ═══════════════════════════════════════
     4. BACK TO TOP
     ═══════════════════════════════════════ */
  btt?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })

  /* ═══════════════════════════════════════
     5. MOBILE NAV
     ═══════════════════════════════════════ */
  const burger = $('#burger')
  const mob = $('#mob')

  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('open')
    mob?.classList.toggle('open', open)
    burger.setAttribute('aria-expanded', open)
    document.body.style.overflow = open ? 'hidden' : ''
  })

  $$('.mob__links a').forEach(link => {
    link.addEventListener('click', () => {
      burger?.classList.remove('open')
      mob?.classList.remove('open')
      burger?.setAttribute('aria-expanded', 'false')
      document.body.style.overflow = ''
    })
  })

  /* ═══════════════════════════════════════
     6. ACTIVE NAV HIGHLIGHTING
     ═══════════════════════════════════════ */
  const sections = $$('section[id]')
  const navLinks = $$('.hdr__link')

  function highlightNav() {
    let current = ''
    const offset = 160
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - offset) current = sec.id
    })
    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`)
    })
  }
  window.addEventListener('scroll', highlightNav, { passive: true })
  highlightNav()

  /* ═══════════════════════════════════════
     7. SMOOTH ANCHOR SCROLLING
     ═══════════════════════════════════════ */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href')
      if (id === '#') return
      const target = $(id)
      if (target) {
        e.preventDefault()
        target.scrollIntoView({ behavior: 'smooth' })
      }
    })
  })

  /* ═══════════════════════════════════════
     8. SCROLL-TRIGGERED ANIMATIONS
     ═══════════════════════════════════════ */
  const anims = $$('.anim')

  const animObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el = entry.target
        const delay = parseInt(el.dataset.delay || '0', 10) * 120
        setTimeout(() => el.classList.add('is-visible'), delay)
        animObserver.unobserve(el)
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  )

  anims.forEach(el => animObserver.observe(el))

  /* ═══════════════════════════════════════
     10. CURSOR GLOW (desktop only)
     ═══════════════════════════════════════ */
  const cursorGlow = $('#cursorGlow')
  if (cursorGlow && matchMedia('(pointer:fine)').matches) {
    let cx = -600, cy = -600
    let tx = cx, ty = cy

    window.addEventListener('mousemove', e => {
      tx = e.clientX
      ty = e.clientY
    }, { passive: true })

    ;(function tickGlow() {
      cx += (tx - cx) * 0.15
      cy += (ty - cy) * 0.15
      cursorGlow.style.left = cx + 'px'
      cursorGlow.style.top = cy + 'px'
      requestAnimationFrame(tickGlow)
    })()
  }

  /* ═══════════════════════════════════════
     11. 3D TILT + INNER GLOW  (.card--tilt)
     ═══════════════════════════════════════ */
  if (matchMedia('(pointer:fine)').matches) {
    $$('.card--tilt').forEach(card => {
      const glow = card.querySelector('.card__glow, .proj__glow')

      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const hw = rect.width / 2
        const hh = rect.height / 2
        const rotY = ((x - hw) / hw) * 6
        const rotX = ((hh - y) / hh) * 6

        card.style.transform =
          `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02,1.02,1.02)`

        if (glow) {
          glow.style.left = x + 'px'
          glow.style.top = y + 'px'
        }
      })

      card.addEventListener('mouseleave', () => {
        card.style.transform = ''
      })
    })
  }

  /* ═══════════════════════════════════════
     12. MAGNETIC BUTTONS
     ═══════════════════════════════════════ */
  if (matchMedia('(pointer:fine)').matches) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect()
        const dx = e.clientX - (rect.left + rect.width / 2)
        const dy = e.clientY - (rect.top + rect.height / 2)
        el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`
      })

      el.addEventListener('mouseleave', () => {
        el.style.transform = ''
      })
    })
  }

  /* ═══════════════════════════════════════
     13. TERMINAL TYPING ANIMATION
     ═══════════════════════════════════════ */
  const termBody = $('#termBody')
  if (termBody) {
    const lines = [
      { type: 'prompt', text: '$ whoami' },
      { type: 'out',    text: 'Hirdianshu Singla' },
      { type: 'prompt', text: '$ cat degree.txt' },
      { type: 'out',    text: 'BASc Computer Engineering — UBC' },
      { type: 'prompt', text: '$ ls skills/' },
      { type: 'out',    text: 'Java  Python  C/C++  SQL  Verilog  ROS2' },
      { type: 'prompt', text: '$ cat status.txt' },
      { type: 'out',    text: '✔ Open to internships & co-ops' },
      { type: 'prompt', text: '$ _' },
    ]

    let lineIdx = 0

    function typeLine() {
      if (lineIdx >= lines.length) {
        const last = termBody.lastElementChild
        if (last) {
          const cursor = document.createElement('span')
          cursor.className = 'term__cursor'
          last.appendChild(cursor)
        }
        return
      }

      const { type, text } = lines[lineIdx]
      const div = document.createElement('div')
      div.className = `line ${type === 'prompt' ? 'line--prompt' : 'line--out'}`
      div.style.animationDelay = '0s'

      if (type === 'prompt') {
        termBody.appendChild(div)
        let charIdx = 0
        const typeChar = () => {
          if (charIdx < text.length) {
            div.textContent += text[charIdx]
            charIdx++
            setTimeout(typeChar, 35 + Math.random() * 30)
          } else {
            lineIdx++
            setTimeout(typeLine, 200)
          }
        }
        typeChar()
      } else {
        div.textContent = text
        termBody.appendChild(div)
        lineIdx++
        setTimeout(typeLine, 400)
      }
    }

    // Start typing after hero animations settle
    setTimeout(typeLine, 1400)
  }

})()