import { useEffect, useRef, useState } from 'react'

// Fire once when an element scrolls into view. Returns [ref, inView].
// Defaults mirror Motion.jsx's VIEWPORT so scroll reveals feel consistent
// across the CSS-driven and framer-motion-driven parts of the site.
export function useInView({
  threshold = 0.3,
  rootMargin = '0px 0px -25% 0px',
  once = true,
} = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // SSR / very old browsers: skip straight to the visible state.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) obs.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, rootMargin, once])

  return [ref, inView]
}
