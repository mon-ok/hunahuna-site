import { useMemo, useState } from 'react'
import { useGallery } from '@/hooks/useGallery'
import GalleryGrid from '@/components/GalleryGrid'
import PageHeader from '@/components/PageHeader'
import { Loader, ErrorState, EmptyState } from '@/components/States'
import './Gallery.scss'

export default function Gallery() {
  const { data, isLoading, isError, error, refetch } = useGallery()
  const [category, setCategory] = useState('all')

  const categories = useMemo(() => {
    const set = new Set((data ?? []).map((g) => g.category).filter(Boolean))
    return ['all', ...[...set].sort()]
  }, [data])

  const filtered = useMemo(() => {
    if (category === 'all') return data ?? []
    return (data ?? []).filter((g) => g.category === category)
  }, [data, category])

  return (
    <>
      <PageHeader eyebrow="See for yourself" title="Gallery">
        Sunsets, cottages, food, and the little moments that make a stay.
      </PageHeader>

      <section className="section">
        <div className="container">
          {!isLoading && !isError && categories.length > 1 && (
            <div className="gallery-filters" role="tablist" aria-label="Filter by category">
              {categories.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={category === c}
                  className={`gallery-filter ${category === c ? 'is-active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          )}

          {isLoading && <Loader label="Loading gallery…" />}
          {isError && <ErrorState error={error} onRetry={refetch} />}
          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState message="No photos in this category yet." />
          )}
          {!isLoading && !isError && filtered.length > 0 && (
            <GalleryGrid images={filtered} />
          )}
        </div>
      </section>
    </>
  )
}
