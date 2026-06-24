import { useEffect, useMemo, useState } from 'react'
import { useMenu } from '@/hooks/useMenu'
import MenuSection from '@/components/MenuSection'
import PageHeader from '@/components/PageHeader'
import { Loader, ErrorState, EmptyState } from '@/components/States'
import './Menu.scss'

const OUTLETS = [
  { key: 'restaurant', label: 'Restaurant', icon: '' },
  { key: 'bar', label: 'Bar', icon: '' },
]

export default function Menu() {
  const { data: items, isLoading, isError, error, refetch } = useMenu()
  const [outlet, setOutlet] = useState('restaurant')
  const [category, setCategory] = useState('all')

  // Reset the category filter whenever the outlet changes — its categories differ.
  useEffect(() => setCategory('all'), [outlet])

  const outletItems = useMemo(
    () => (items ?? []).filter((i) => i.outlet === outlet),
    [items, outlet]
  )

  // Category tags for the sidebar, each with a count, in fetch order.
  const categories = useMemo(() => {
    const map = new Map()
    for (const it of outletItems) {
      map.set(it.category, (map.get(it.category) ?? 0) + 1)
    }
    return [...map.entries()].map(([name, count]) => ({ name, count }))
  }, [outletItems])

  // Sections to render: every category when "all", otherwise just the chosen one.
  const grouped = useMemo(() => {
    const map = new Map()
    for (const it of outletItems) {
      if (category !== 'all' && it.category !== category) continue
      if (!map.has(it.category)) map.set(it.category, [])
      map.get(it.category).push(it)
    }
    return [...map.entries()]
  }, [outletItems, category])

  return (
    <>
      <PageHeader eyebrow="Eat & drink" title="Restaurant & Bar">
        Fresh local seafood, island favourites, and sundowner cocktails by the shore.
      </PageHeader>

      <section className="section">
        <div className="container">
          {isLoading && <Loader label="Loading menu…" />}
          {isError && <ErrorState error={error} onRetry={refetch} />}

          {!isLoading && !isError && (
            <div className="menu-kiosk">
              <aside className="menu-kiosk__sidebar">
                <div className="menu-outlets" role="tablist" aria-label="Choose outlet">
                  {OUTLETS.map((o) => (
                    <button
                      key={o.key}
                      role="tab"
                      aria-selected={outlet === o.key}
                      className={`menu-outlets__btn ${outlet === o.key ? 'is-active' : ''}`}
                      onClick={() => setOutlet(o.key)}
                    >
                      <span aria-hidden="true">{o.icon}</span> {o.label}
                    </button>
                  ))}
                </div>

                <nav className="menu-cats" aria-label="Filter by category">
                  <button
                    className={`menu-cats__btn ${category === 'all' ? 'is-active' : ''}`}
                    onClick={() => setCategory('all')}
                  >
                    <span>All items</span>
                    <span className="menu-cats__count">{outletItems.length}</span>
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.name}
                      className={`menu-cats__btn ${category === c.name ? 'is-active' : ''}`}
                      onClick={() => setCategory(c.name)}
                    >
                      <span>{c.name}</span>
                      <span className="menu-cats__count">{c.count}</span>
                    </button>
                  ))}
                </nav>
              </aside>

              <div className="menu-kiosk__main">
                {grouped.length === 0 ? (
                  <EmptyState message="Nothing on this menu just yet. Check back soon." />
                ) : (
                  grouped.map(([cat, list]) => (
                    <MenuSection key={cat} category={cat} items={list} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
