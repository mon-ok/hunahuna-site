import { Link } from 'react-router-dom'
import Image from '@/components/Image'
import { RevealHeading } from '@/components/Motion'
import { useInView } from '@/hooks/useInView'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import './SplitReveal.scss'

// PLACEHOLDER content — swap via props.
const PLACEHOLDER_IMG = '/placeholder-split.svg' // TODO: replace with your image

/**
 * Scroll-triggered split reveal. The image fills the whole section, then on
 * first scroll into view it recedes to one half (default: left) while the copy
 * fades into the other half. Mirror of AboutReveal's layout; `mediaSide` flips
 * which half the image settles into. Stacks (image, then text) on mobile.
 *
 * Timing/easing: $split-* + $ease-out-expo in _variables.scss.
 */
export default function SplitReveal({
  src = PLACEHOLDER_IMG,
  alt = 'A wide view across the resort', // PLACEHOLDER alt
  eyebrow = 'The setting', // PLACEHOLDER copy
  title = 'Room to breathe', // PLACEHOLDER copy
  mediaSide = 'left', // 'left' | 'right'
  cta, // optional { to, label }
  children,
}) {
  const reduce = usePrefersReducedMotion()
  const [ref, inView] = useInView()
  const open = reduce || inView

  return (
    <section
      ref={ref}
      className={`split-reveal split-reveal--media-${mediaSide} section ${
        open ? 'is-visible' : ''
      }`}
    >
      <div className="split-reveal__inner">
        <div className="split-reveal__media">
          <Image src={src} alt={alt} />
        </div>

        <div className="split-reveal__text">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <RevealHeading as="h2" text={title} active={open} />
          {children ?? (
            // PLACEHOLDER copy — replace by passing children.
            <p className="lead">
              Wide-open spaces between the palms and the shore, designed for
              long, unhurried days. As you scroll in, the image steps aside to
              make room for the story.
            </p>
          )}
          {cta && (
            <Link to={cta.to} className="btn btn--line">
              {cta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
