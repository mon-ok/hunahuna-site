import { useState } from 'react'

// Lazy-loaded image with a sand-coloured placeholder and graceful fallback.
// `alt` is required-by-convention here: callers always pass alt_text / caption.
export default function Image({ src, alt = '', className = '', ratio, ...rest }) {
  const [failed, setFailed] = useState(false)
  const style = ratio ? { aspectRatio: ratio } : undefined

  if (!src || failed) {
    return (
      <div
        className={`img img--placeholder ${className}`}
        style={style}
        role="img"
        aria-label={alt || 'Image unavailable'}
      >
        <span aria-hidden="true">🌴</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`img ${className}`}
      style={style}
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}
