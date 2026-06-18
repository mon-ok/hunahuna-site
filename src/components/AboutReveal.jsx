import Image from '@/components/Image'
import { Reveal, RevealHeading } from '@/components/Motion'
import { useInView } from '@/hooks/useInView'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import './AboutReveal.scss'

// PLACEHOLDER content — swap via props.
const PLACEHOLDER_IMG = '/placeholder-about.jpg' // TODO: replace with your about image

/**
 * Animation 2 — About section (scroll-triggered, once).
 * The image starts filling the full width; when the section enters the viewport
 * it animates down to the right half, and the copy fades into the freed left
 * half. On mobile it stacks (text, then image) with a simple fade.
 *
 * Timing/easing: $about-duration + $ease-out-expo in _variables.scss.
 */
export default function AboutReveal({
  src = PLACEHOLDER_IMG,
  alt = 'A quiet corner of the resort', // PLACEHOLDER alt
  eyebrow = 'Our story', // PLACEHOLDER copy
  title = 'Where the palms meet the shore', // PLACEHOLDER copy
  children,
}) {
  const reduce = usePrefersReducedMotion()
  const [ref, inView] = useInView()
  // Drives the slow rightward pan from scroll position (writes --pan to the
  // media frame). No-op / centred under reduced motion.
  const mediaRef = useScrollProgress({ property: '--pan' })
  // When reduced motion is on, render in the resolved state immediately.
  const open = reduce || inView

  return (
    <section
      ref={ref}
      className={`about-reveal section ${open ? 'is-visible' : ''}`}
    >
      <div className="about-reveal__inner">
        <div className="about-reveal__text">
          {/* Cascade: eyebrow fades up, the heading reveals letter by letter,
              then the body copy fades up a beat later. */}
          {eyebrow && (
            <Reveal as="span" className="eyebrow" y={16} duration={0.9} active={open}>
              {eyebrow}
            </Reveal>
          )}
          <RevealHeading as="h2" text={title} active={open} />
          <Reveal y={20} duration={1.1} delay={0.25} active={open}>
            {children ?? (
              // PLACEHOLDER copy — replace by passing children.
              <p className="lead">
                A handful of cottages tucked between palm groves and a quiet beach,
                close enough to reach easily, far enough to feel like an escape.
              </p>
            )}
          </Reveal>
        </div>

        <div ref={mediaRef} className="about-reveal__media">
          <div className="about-reveal__pan">
            <Image src={src} alt={alt} />
          </div>
        </div>
      </div>
    </section>
  )
}
