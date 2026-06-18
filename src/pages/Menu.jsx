import { useMemo, useState } from 'react'
import { useMenu } from '@/hooks/useMenu'
import MenuSection from '@/components/MenuSection'
import PageHeader from '@/components/PageHeader'
import { Loader, ErrorState, EmptyState } from '@/components/States'
import './Menu.scss'

const OUTLETS = [
  { key: 'restaurant', label: '🍽️ Restaurant' },
  { key: 'bar', label: '🍹 Bar' },
]

export default function Menu() {
  const { data: items, isLoading, isError, error, refetch } = useMenu()
  const [outlet, setOutlet] = useState('restaurant')

  // Group the active outlet's items by category, preserving fetch order.
  const grouped = useMemo(() => {
    const map = new Map()
    for (const item of items ?? []) {
      if (item.outlet !== outlet) continue
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category).push(item)
    }
    return [...map.entries()]
  }, [items, outlet])

  return (
    <>
      <PageHeader eyebrow="Eat & drink" title="Restaurant & Bar">
        Fresh local seafood, island favourites, and sundowner cocktails by the shore.
      </PageHeader>

      <section className="section">
        <div className="container">
          <div className="menu-toggle" role="tablist" aria-label="Choose outlet">
            {OUTLETS.map((o) => (
              <button
                key={o.key}
                role="tab"
                aria-selected={outlet === o.key}
                className={`menu-toggle__btn ${outlet === o.key ? 'is-active' : ''}`}
                onClick={() => setOutlet(o.key)}
              >
                {o.label}
              </button>
            ))}
          </div>

          {isLoading && <Loader label="Loading menu…" />}
          {isError && <ErrorState error={error} onRetry={refetch} />}
          {!isLoading && !isError && grouped.length === 0 && (
            <EmptyState message="Nothing on this menu just yet. Check back soon." />
          )}
          {!isLoading && !isError && grouped.map(([category, list]) => (
            <MenuSection key={category} category={category} items={list} />
          ))}
        </div>
      </section>
    </>
  )
}
