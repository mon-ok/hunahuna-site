import { useState } from 'react'
import Image from './Image'
import Lightbox from './Lightbox'
import { roomImageUrl } from '@/lib/storage'
import './RoomGallery.scss'

// Detail-page gallery. Expects images pre-sorted by sort_order.
export default function RoomGallery({ images = [], roomType = '' }) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(null)

  if (!images.length) {
    return (
      <Image src={null} alt={`${roomType} room`} ratio="16 / 10" className="room-gallery__main-img" />
    )
  }

  const items = images.map((img, i) => ({
    url: roomImageUrl(img.storage_path),
    alt: img.alt_text || `${roomType} photo ${i + 1}`,
  }))
  const current = images[active]

  return (
    <div className="room-gallery">
      <button
        type="button"
        className="room-gallery__main"
        onClick={() => setLightbox(active)}
        aria-label="Open photo in full screen"
      >
        <Image
          src={roomImageUrl(current.storage_path)}
          alt={current.alt_text || `${roomType} room`}
          ratio="16 / 10"
          className="room-gallery__main-img"
        />
      </button>

      {images.length > 1 && (
        <ul className="room-gallery__thumbs">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                className={`room-gallery__thumb ${i === active ? 'is-active' : ''}`}
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
              >
                <Image
                  src={roomImageUrl(img.storage_path)}
                  alt={img.alt_text || `${roomType} thumbnail ${i + 1}`}
                  ratio="1 / 1"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Lightbox
        items={items}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onNavigate={setLightbox}
      />
    </div>
  )
}
