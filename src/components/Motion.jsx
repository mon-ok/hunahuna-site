import { motion, useReducedMotion } from 'framer-motion'

// ---------------------------------------------------------------------------
// Shared motion primitives. Every animation here is transform/opacity only so
// the compositor can run it on the GPU — no layout thrash, smooth on mobile.
// All of them collapse to "no motion" when the OS requests reduced motion.
// ---------------------------------------------------------------------------

// Trigger reveals once the element is comfortably within the viewport — not the
// moment it peeks in at the bottom edge — so a slow reveal actually plays where
// the user is looking instead of finishing off-screen. `once` so scrolling back
// up doesn't re-animate (which reads as janky on long pages). The bottom margin
// shrinks the trigger zone up from the bottom of the screen.
const VIEWPORT = { once: true, amount: 0.3, margin: '0px 0px -25% 0px' }

const EASE = [0.22, 1, 0.36, 1] // gentle "ease-out-expo"-ish curve

/**
 * Fade + rise into view on scroll. Use for sections, headings, images.
 * `delay` lets you cascade siblings; `x`/`y` tune the offset it drifts in from
 * (positive = starts down/right -> e.g. fade-in-from-bottom-right).
 */
export function Reveal({
  children,
  as = 'div',
  delay = 0,
  x = 0,
  y = 28,
  duration = 0.7,
  className,
  active, // omit -> self-triggers on scroll; pass a bool -> caller controls it
  ...rest
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as] ?? motion.div

  if (reduce) {
    const Plain = motion[as] ?? motion.div
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    )
  }

  const hidden = { opacity: 0, x, y }
  const shown = { opacity: 1, x: 0, y: 0 }
  // Controlled (caller passes `active`) vs self-triggering (whileInView).
  const trigger =
    active === undefined
      ? { whileInView: shown, viewport: VIEWPORT }
      : { animate: active ? shown : hidden }

  return (
    <Tag
      className={className}
      initial={hidden}
      transition={{ duration, ease: EASE, delay }}
      {...trigger}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/**
 * Container that staggers its <StaggerItem> children as the group scrolls in.
 */
export function Stagger({
  children,
  as = 'div',
  gap = 0.1,
  className,
  ...rest
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as] ?? motion.div

  return (
    <Tag
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView={reduce ? undefined : 'show'}
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap } },
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function StaggerItem({ children, as = 'div', y = 24, className, ...rest }) {
  const reduce = useReducedMotion()
  const Tag = motion[as] ?? motion.div

  return (
    <Tag
      className={className}
      variants={{
        hidden: reduce ? {} : { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/**
 * Heading that reveals itself as it scrolls into view, one unit at a time. The
 * long stagger is intentional: it keeps animating gently while the user is still
 * scrolling toward it, rather than snapping in all at once. Whitespace is kept as
 * plain text so the heading still wraps at word boundaries, and the full text is
 * exposed to screen readers via aria-label.
 *
 * `by` picks the flavour:
 *   'letter' (default) — each letter fades + drifts up a touch (airy, delicate).
 *   'word'             — each whole word rises up from further below and fades
 *                        in (bolder, more deliberate) so it reads distinctly
 *                        from the letter mode.
 */
export function RevealHeading({
  text,
  as = 'h2',
  className,
  by = 'letter', // 'letter' | 'word'
  stagger = by === 'word' ? 0.14 : 0.07,
  duration = by === 'word' ? 0.9 : 1.1,
  active, // omit -> self-triggers on scroll; pass a bool -> caller controls it
  ...rest
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as] ?? motion.h2

  if (reduce) {
    const Plain = motion[as] ?? motion.h2
    return (
      <Plain className={className} {...rest}>
        {text}
      </Plain>
    )
  }

  const trigger =
    active === undefined
      ? { whileInView: 'show', viewport: VIEWPORT }
      : { animate: active ? 'show' : 'hidden' }

  // Word mode: split into words while preserving the spaces between them. Each
  // word rises up from further below and fades in — a chunkier, more deliberate
  // cadence that reads distinctly from the delicate per-letter fade.
  if (by === 'word') {
    const parts = text.split(/(\s+)/) // keeps the whitespace tokens
    return (
      <Tag
        className={className}
        aria-label={text}
        initial="hidden"
        variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
        {...trigger}
        {...rest}
      >
        {parts.map((part, i) =>
          /\s+/.test(part) ? (
            <span key={i} aria-hidden="true">
              {part}
            </span>
          ) : (
            <motion.span
              key={i}
              aria-hidden="true"
              style={{ display: 'inline-block' }}
              variants={{
                hidden: { opacity: 0, y: 44 },
                show: { opacity: 1, y: 0, transition: { duration, ease: EASE } },
              }}
            >
              {part}
            </motion.span>
          )
        )}
      </Tag>
    )
  }

  return (
    <Tag
      className={className}
      aria-label={text}
      initial="hidden"
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
      {...trigger}
      {...rest}
    >
      {[...text].map((ch, i) =>
        ch === ' ' ? (
          <span key={i} aria-hidden="true">
            {' '}
          </span>
        ) : (
          <motion.span
            key={i}
            aria-hidden="true"
            style={{ display: 'inline-block' }}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration, ease: EASE } },
            }}
          >
            {ch}
          </motion.span>
        )
      )}
    </Tag>
  )
}

// Re-export for ad-hoc one-off animations elsewhere.
export { motion, useReducedMotion }
