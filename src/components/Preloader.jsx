import { useEffect, useState } from 'react'
import './Preloader.scss'

/**
 * Premium intro overlay shown once on initial page load. It holds for `holdMs`
 * (while a progress bar fills), then fades out over `fadeMs` and unmounts
 * itself. Locks body scroll while visible. Honours prefers-reduced-motion with
 * a short, motionless version.
 */
export default function Preloader({ holdMs = 2200, fadeMs = 800 }) {
  const [leaving, setLeaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hold = reduce ? 600 : holdMs
    const fade = reduce ? 0 : fadeMs

    document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => {
      setLeaving(true)
      // Signal on-mount animations (e.g. the hero intro) that the curtain is
      // lifting, so they don't play out hidden behind the overlay. The flag
      // covers components that mount after this fires (slow chunk load).
      window.__preloaderDone = true
      window.dispatchEvent(new Event('preloader:done'))
    }, hold)
    const t2 = setTimeout(() => {
      setDone(true)
      document.body.style.overflow = ''
    }, hold + fade)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      document.body.style.overflow = ''
    }
  }, [holdMs, fadeMs])

  if (done) return null

  return (
    <div
      className={`preloader ${leaving ? 'is-leaving' : ''}`}
      style={{ '--preloader-fade': `${fadeMs}ms`, '--preloader-hold': `${holdMs}ms` }}
      role="status"
      aria-live="polite"
    >
      <div className="preloader__inner">
        {/* On-palette brand mark: sun rising over a horizon, drawn in. */}
        <svg className="preloader__mark" viewBox="0 0 80 80" aria-hidden="true">
          <circle className="preloader__ring" cx="40" cy="40" r="26" />
          <circle className="preloader__sun" cx="40" cy="38" r="9" />
          <line className="preloader__horizon" x1="16" y1="48" x2="64" y2="48" />
        </svg>

        <span className="preloader__name">Hunahuna</span>
        <span className="preloader__sub">Beach Resort</span>

        <span className="preloader__bar" aria-hidden="true">
          <i />
        </span>
      </div>
      <span className="visually-hidden">Loading…</span>
    </div>
  )
}
