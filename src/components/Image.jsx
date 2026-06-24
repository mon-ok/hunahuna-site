import { useState } from 'react'

// Lazy-loaded image with a sand-coloured placeholder and graceful fallback.
// `alt` is required-by-convention here: callers always pass alt_text / caption.
export default function Image({ src, alt = '', className = '', ratio, ...rest }) {
  const [failed, setFailed] = useState(false)
  const style = ratio ? { aspectRatio: ratio } : undefined

  if (!src || failed) {
    // Intentional, on-brand placeholder for rows whose image column is empty —
    // a small sun-over-waves mark so the surrounding data still reads cleanly.
    return (
      <div
        className={`img img--placeholder ${className}`}
        style={style}
        role="img"
        aria-label={alt || 'Photo coming soon'}
      >
        <svg className="img__ph-icon" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="17" r="5.5" />
          <path d="M5 30 q3 -3 6 0 t6 0 t6 0 t6 0 t6 0 t6 0" />
          <path d="M5 37 q3 -3 6 0 t6 0 t6 0 t6 0 t6 0 t6 0" />
        </svg>
        <span className="img__ph-label">Photo coming soon</span>
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
