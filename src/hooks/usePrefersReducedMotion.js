import { useEffect, useState } from 'react'

// Tracks the OS "reduce motion" setting, reactively. Kept dependency-free so the
// CSS-animation components don't pull framer-motion into their bundle just to
// read this flag. (framer-motion's useReducedMotion remains available via
// Motion.jsx for the framer-driven parts of the site.)
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
