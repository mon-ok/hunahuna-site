import ResourceCard from '@/components/ResourceCard'
import { Reveal, RevealHeading } from '@/components/Motion'
import { useInView } from '@/hooks/useInView'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import './Resources.scss'

// PLACEHOLDER content — pass your own `items` (and copy) via props.
// TODO: replace the image paths and text with your real resources.
const PLACEHOLDER_ITEMS = [
  {
    src: '/placeholder-resource-1.jpg',
    alt: 'The beachfront pool',
    label: 'The Pool',
    description: 'An infinity edge that melts into the horizon at golden hour.',
    ctaHref: '#',
  },
  {
    src: '/placeholder-resource-2.jpg',
    alt: 'The restaurant terrace',
    label: 'Restaurant',
    description: 'Fresh local seafood and island favourites, toes near the sand.',
    ctaHref: '#',
  },
  {
    src: '/placeholder-resource-3.jpg',
    alt: 'A garden spa cabana',
    label: 'The Spa',
    description: 'Unhurried treatments in open-air cabanas among the palms.',
    ctaHref: '#',
  },
]

/**
 * Animation 3 — Resources section: a header, then images that fade in below it
 * with a slight stagger (scroll-triggered once).
 * Animation 4 — the row is a flex accordion: hovering/focusing a card expands
 * it while the others shrink, sibling labels fade out, and the hovered card
 * reveals its description + Discover button. Space redistributes automatically
 * regardless of which card is active (flex-grow), so there's no per-position
 * logic. On touch/small screens the accordion is disabled and cards stack with
 * their copy shown.
 *
 * Tokens: $resources-* (stagger/fade) and $accordion-* (hover) in _variables.scss.
 */
export default function Resources({
  eyebrow = 'Explore the resort', // PLACEHOLDER copy
  title = 'Where the days unfold', // PLACEHOLDER copy
  items = PLACEHOLDER_ITEMS,
}) {
  const reduce = usePrefersReducedMotion()
  const [ref, inView] = useInView()
  const visible = reduce || inView

  return (
    <section
      ref={ref}
      className={`resources section ${visible ? 'is-visible' : ''}`}
    >
      <div className="section__head resources__head">
        {eyebrow && (
          <Reveal as="span" className="eyebrow" x={0} y={-32} duration={0.5} active={visible}>
            {eyebrow}
          </Reveal>
        )}
        <RevealHeading as="h2" text={title} stagger={0.035} duration={0.5} active={visible} />
      </div>

      <ul className="resources__list">
        {items.map((item, i) => (
          <li key={item.label ?? i} className="resources__item">
            <ResourceCard {...item} index={i} />
          </li>
        ))}
      </ul>
    </section>
  )
}
