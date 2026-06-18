import { useEffect, useRef } from 'react'

// Writes a 0→1 progress value to a CSS custom property on the ref'd element as
// it travels through the viewport (0 = just entering at the bottom, 1 = just
// left at the top). Drives scroll-linked CSS animations without re-rendering
// React on every scroll frame. Honours prefers-reduced-motion by parking the
// value at its midpoint (no motion).
export function useScrollProgress({ property = '--progress' } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty(property, '0.5')
      return
    }

    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const total = vh + rect.height // distance travelled top-of-vh → bottom-of-vh
      const p = Math.min(1, Math.max(0, (vh - rect.top) / total))
      el.style.setProperty(property, p.toFixed(4))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [property])

  return ref
}
