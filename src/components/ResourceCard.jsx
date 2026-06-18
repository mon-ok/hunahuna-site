import { Link } from 'react-router-dom'
import Image from '@/components/Image'
import './ResourceCard.scss'

/**
 * Animation 4 (per-item) — Resources hover accordion card.
 * Renders an image with an always-on label and a hover/focus-revealed block
 * (description + a real "Discover" link/button). The flex-grow expansion and
 * label fade-out are coordinated by the parent .resources__list (see
 * Resources.scss) so there's no per-position logic here.
 *
 * Sizing/timing tokens: $accordion-* in _variables.scss.
 */
export default function ResourceCard({
  src,
  alt = '',
  label,
  description,
  ctaLabel = 'Discover',
  ctaHref, // if omitted, renders a <button>; pass an onClick too if needed
  onClick,
  index = 0,
}) {
  // Internal routes use react-router's <Link> so navigation stays client-side
  // (no full page reload, so the one-time intro Preloader doesn't replay).
  // External/hash links fall back to a plain <a>; no href renders a <button>.
  const isExternal = ctaHref && /^(https?:|mailto:|tel:|\/\/)/i.test(ctaHref)
  const isHash = ctaHref?.startsWith('#')

  let Cta, ctaProps
  if (!ctaHref) {
    Cta = 'button'
    ctaProps = { type: 'button', onClick }
  } else if (isExternal || isHash) {
    Cta = 'a'
    ctaProps = { href: ctaHref, onClick }
  } else {
    Cta = Link
    ctaProps = { to: ctaHref.startsWith('/') ? ctaHref : `/${ctaHref}`, onClick }
  }

  return (
    <article className="resource-card" style={{ '--index': index }}>
      <div className="resource-card__media">
        <Image src={src} alt={alt} />
      </div>
      <div className="resource-card__scrim" aria-hidden="true" />

      <div className="resource-card__overlay">
        {label && <span className="resource-card__label">{label}</span>}

        <div className="resource-card__reveal">
          {description && <p className="resource-card__desc">{description}</p>}
          <Cta className="btn btn--ghost resource-card__cta" {...ctaProps}>
            {ctaLabel}
            {label && <span className="visually-hidden">: {label}</span>}
          </Cta>
        </div>
      </div>
    </article>
  )
}
