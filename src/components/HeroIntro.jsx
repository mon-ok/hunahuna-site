import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Image from '@/components/Image'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import './HeroIntro.scss'

// PLACEHOLDER content — swap `src`/`alt`/`eyebrow`/`title` (or pass props).
const PLACEHOLDER_IMG = '/placeholder-hero.jpg' // TODO: replace with your hero image

const EASE = [0.22, 1, 0.36, 1] // gentle ease-out-expo
const LETTER_STAGGER = 0.07 // gap between each letter fading in
const LETTER_FADE = 0.85 // how long each letter takes to fade in
const ROTATE_DURATION = 1.7 // how long the whole-line rotate-in takes

// Starting rotation (deg) for each rotate-in flavour. Origin is right-bottom.
//   up   -> rotateInUpRight   (swings up from a -90 deg tilt)
//   down -> rotateInDownRight (drops in from a +45 deg tilt)
const ROTATE_FROM = { up: -90, down: 45 }

// Tokenize a line into reveal segments: each is either whitespace or a run that
// must stay together on one line. Words split at hyphens so a long compound
// ("Spanish-Mediterranean") can wrap after the hyphen, while the animated
// inline-block letters never break mid-word.
function revealSegments(text) {
  return text.split(/(\s+)/).flatMap((tok) => {
    if (tok === '') return []
    if (/^\s+$/.test(tok)) return [tok]
    return tok.match(/[^-]+-?|-+/g) ?? [tok]
  })
}

/**
 * One hero line whose entrance runs two effects at once: the letters fade in one
 * after another (staggered) while the whole line simultaneously rotates into
 * place (rotateInUpRight / DownRight). Fully declarative (state-driven `animate`)
 * so it is StrictMode-safe; `start` gates it on the preloader curtain lifting.
 * The outer element handles the rotate; the inner element staggers the fade.
 */
function HeroLine({ text, as = 'span', className = '', rotate = 'up', start, reduce }) {
  // Split into segments (words, broken at hyphens, plus whitespace tokens) so
  // each stays on one line; letters still fade in one by one via `letters`.
  const segments = useMemo(() => revealSegments(text), [text])
  let letters = 0
  const MotionTag = motion[as] ?? motion.span
  const from = ROTATE_FROM[rotate] ?? 0

  // Reduced motion: render plain, final state — no split, no animation.
  if (reduce) {
    const PlainTag = as
    return <PlainTag className={className}>{text}</PlainTag>
  }

  return (
    <MotionTag
      className={className}
      style={{ display: 'inline-block', transformOrigin: 'right bottom' }}
      aria-label={text}
      initial={{ rotate: from }}
      animate={{ rotate: start ? 0 : from }}
      transition={{ duration: ROTATE_DURATION, ease: EASE }}
    >
      <motion.span
        style={{ display: 'inline-block' }}
        initial="hidden"
        animate={start ? 'show' : 'hidden'}
        variants={{ hidden: {}, show: {} }}
      >
        {/* Group the staggered letters by word, each word a nowrap inline-block,
            so the headline only ever breaks at spaces — never mid-word
            ("Spanish-Mediterranean" stays whole). Explicit per-letter delay
            stands in for staggerChildren now that words nest the letters. */}
        {segments.map((seg, s) =>
          /^\s+$/.test(seg) ? (
            <span key={`s${s}`} aria-hidden="true">
              {seg}
            </span>
          ) : (
            <span
              key={`w${s}`}
              aria-hidden="true"
              style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
            >
              {[...seg].map((ch, ci) => {
                const delay = letters++ * LETTER_STAGGER
                return (
                  <motion.span
                    key={`${s}-${ci}`}
                    style={{ display: 'inline-block' }}
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { duration: LETTER_FADE, ease: 'easeOut', delay } },
                    }}
                  >
                    {ch}
                  </motion.span>
                )
              })}
            </span>
          )
        )}
      </motion.span>
    </MotionTag>
  )
}

/**
 * Animation 1 — Hero intro.
 * The background image starts scaled up and slowly zooms out to fill the clipped
 * hero (CSS). The eyebrow + title then play the two-phase HeroLine entrance.
 * Collapses to the final, still state under prefers-reduced-motion.
 *
 * Image timing/easing lives in src/styles/_variables.scss ($hero-* tokens).
 */
export default function HeroIntro({
  src = PLACEHOLDER_IMG,
  alt = 'Sunset over the resort beach', // PLACEHOLDER alt — describe your image
  eyebrow = 'Hunahuna Beach Resort', // PLACEHOLDER copy
  title = 'Your slice of tropical paradise', // PLACEHOLDER copy
  children,
}) {
  const reduce = usePrefersReducedMotion()

  // Hold the intro until the preloader curtain lifts, so the entrance isn't
  // wasted behind the overlay on first load. If the preloader has already
  // finished (or this mounted via client-side nav, where it never shows), the
  // flag is set and we animate right away.
  const [ready, setReady] = useState(
    () => typeof window !== 'undefined' && window.__preloaderDone === true
  )

  useEffect(() => {
    if (ready) return
    const onDone = () => setReady(true)
    window.addEventListener('preloader:done', onDone)
    return () => window.removeEventListener('preloader:done', onDone)
  }, [ready])

  const start = ready && !reduce

  return (
    <section className={`hero-intro ${reduce || !ready ? '' : 'hero-intro--animate'}`}>
      <div className="hero-intro__media" aria-hidden="true">
        <Image src={src} alt={alt} className="hero-intro__img" />
      </div>
      <div className="hero-intro__scrim" aria-hidden="true" />

      <div className="container hero-intro__content">
        {eyebrow && (
          <HeroLine
            as="span"
            className="eyebrow hero-intro__eyebrow"
            text={eyebrow}
            rotate="down"
            start={start}
            reduce={reduce}
          />
        )}
        <HeroLine
          as="h1"
          className="hero-intro__title"
          text={title}
          rotate="up"
          start={start}
          reduce={reduce}
        />
        {children}
      </div>
    </section>
  )
}
