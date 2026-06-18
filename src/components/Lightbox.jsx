import { useEffect, useCallback } from 'react'
import './Lightbox.scss'

// Accessible lightbox: Esc to close, arrows to navigate, focus trapped to the
// dialog. `items` is [{ url, alt }]; `index` is the active item.
export default function Lightbox({ items, index, onClose, onNavigate }) {
  const open = index != null && index >= 0
  const item = open ? items[index] : null

  const go = useCallback(
    (delta) => {
      if (!open) return
      const next = (index + delta + items.length) % items.length
      onNavigate(next)
    },
    [open, index, items.length, onNavigate]
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, go, onClose])

  if (!open || !item) return null

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.alt || 'Image viewer'}
      onClick={onClose}
    >
      <button className="lightbox__close" onClick={onClose} aria-label="Close">×</button>

      {items.length > 1 && (
        <button
          className="lightbox__nav lightbox__nav--prev"
          onClick={(e) => { e.stopPropagation(); go(-1) }}
          aria-label="Previous image"
        >‹</button>
      )}

      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img src={item.url} alt={item.alt || ''} className="lightbox__img" />
        {item.alt && <figcaption className="lightbox__caption">{item.alt}</figcaption>}
      </figure>

      {items.length > 1 && (
        <button
          className="lightbox__nav lightbox__nav--next"
          onClick={(e) => { e.stopPropagation(); go(1) }}
          aria-label="Next image"
        >›</button>
      )}
    </div>
  )
}
