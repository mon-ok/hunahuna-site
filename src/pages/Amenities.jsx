import { useMemo } from 'react'
import { useAmenities } from '@/hooks/useAmenities'
import AmenityCard from '@/components/AmenityCard'
import PageHeader from '@/components/PageHeader'
import { Loader, ErrorState, EmptyState } from '@/components/States'
import './Amenities.scss'

const GROUPS = [
  { type: 'free', title: 'Included', blurb: 'Free for every guest.' },
  { type: 'paid', title: 'Paid', blurb: 'Add-ons available during your stay.' },
  { type: 'bookable', title: 'Bookable Activities', blurb: 'Reserve ahead, spaces are limited.' },
]

export default function Amenities() {
  const { data, isLoading, isError, error, refetch } = useAmenities()

  const byType = useMemo(() => {
    const map = { free: [], paid: [], bookable: [] }
    for (const a of data ?? []) {
      if (map[a.type]) map[a.type].push(a)
    }
    return map
  }, [data])

  const hasAny = (data ?? []).length > 0

  return (
    <>
      <PageHeader eyebrow="Things to do" title="Amenities & Activities">
        Everything you need to relax, plus a few adventures when you're ready for them.
      </PageHeader>

      <section className="section">
        <div className="container">
          {isLoading && <Loader label="Loading amenities…" />}
          {isError && <ErrorState error={error} onRetry={refetch} />}
          {!isLoading && !isError && !hasAny && (
            <EmptyState message="Amenity listings are coming soon." />
          )}

          {!isLoading && !isError && hasAny &&
            GROUPS.map((g) =>
              byType[g.type].length ? (
                <div key={g.type} className="amenity-group">
                  <div className="amenity-group__head">
                    <h2>{g.title}</h2>
                    <p>{g.blurb}</p>
                  </div>
                  <div className="amenity-grid">
                    {byType[g.type].map((a) => (
                      <AmenityCard key={a.id} amenity={a} />
                    ))}
                  </div>
                </div>
              ) : null
            )}
        </div>
      </section>
    </>
  )
}
