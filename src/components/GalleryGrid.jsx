import { useState } from 'react'
import Image from './Image'
import Lightbox from './Lightbox'
import { Stagger, StaggerItem } from './Motion'
import { galleryImageUrl } from '@/lib/storage'
import './GalleryGrid.scss'

export default function GalleryGrid({ images = [] }) {
  const [index, setIndex] = useState(null)

  const items = images.map((img) => ({
    url: galleryImageUrl(img.storage_path),
    alt: img.caption || 'Resort photo',
  }))

  return (
    <>
      <Stagger as="ul" className="gallery-grid" gap={0.05}>
        {images.map((img, i) => (
          <StaggerItem as="li" key={img.id} className="gallery-grid__item" y={18}>
            <button
              type="button"
              className="gallery-grid__btn"
              onClick={() => setIndex(i)}
              aria-label={img.caption ? `View: ${img.caption}` : 'View photo'}
            >
              <Image
                src={galleryImageUrl(img.storage_path)}
                alt={img.caption || 'Resort photo'}
                ratio="1 / 1"
              />
              {img.caption && (
                <span className="gallery-grid__caption">{img.caption}</span>
              )}
            </button>
          </StaggerItem>
        ))}
      </Stagger>

      <Lightbox
        items={items}
        index={index}
        onClose={() => setIndex(null)}
        onNavigate={setIndex}
      />
    </>
  )
}
