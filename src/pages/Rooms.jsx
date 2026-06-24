import { useMemo, useState } from 'react'
import { useRooms } from '@/hooks/useRooms'
import RoomCard from '@/components/RoomCard'
import PageHeader from '@/components/PageHeader'
import { Loader, ErrorState, EmptyState } from '@/components/States'
import { Stagger, StaggerItem } from '@/components/Motion'
import './Rooms.scss'

// Collapse identical rooms into one entry per room_type. Rooms sharing a type
// have the same rate/occupancy/amenities, so we keep the first as the
// representative (for detail/booking links) and just count the rest.
function groupByType(rooms) {
  const groups = new Map()
  for (const room of rooms) {
    let group = groups.get(room.room_type)
    if (!group) {
      group = { type: room.room_type, count: 0, representative: room, images: [] }
      groups.set(room.room_type, group)
    }
    group.count += 1
    // Show a thumbnail from whichever room in the type actually has photos.
    if (!group.images.length && room.room_images?.length) {
      group.images = room.room_images
    }
  }
  return [...groups.values()]
}

export default function Rooms() {
  const { data: rooms, isLoading, isError, error, refetch } = useRooms()
  const [type, setType] = useState('all')
  const [minGuests, setMinGuests] = useState(0)

  const groups = useMemo(() => groupByType(rooms ?? []), [rooms])

  const types = useMemo(
    () => ['all', ...groups.map((g) => g.type)],
    [groups]
  )

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      if (type !== 'all' && g.type !== type) return false
      if (minGuests && g.representative.max_occupancy < minGuests) return false
      return true
    })
  }, [groups, type, minGuests])

  return (
    <>
      <PageHeader eyebrow="Stay with us" title="Rooms & Cottages">
        From cosy fan-cooled cottages to air-conditioned suites, find the right
        spot for your island escape.
      </PageHeader>

      <section className="section">
        <div className="container">
          {!isLoading && !isError && (
            <div className="rooms-filters">
              <div className="field">
                <label className="field__label" htmlFor="f-type">Room type</label>
                <select
                  id="f-type"
                  className="field__control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {types.map((t) => (
                    <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="f-guests">Guests</label>
                <select
                  id="f-guests"
                  className="field__control"
                  value={minGuests}
                  onChange={(e) => setMinGuests(Number(e.target.value))}
                >
                  <option value={0}>Any</option>
                  <option value={1}>1+</option>
                  <option value={2}>2+</option>
                  <option value={4}>4+</option>
                  <option value={6}>6+</option>
                </select>
              </div>
            </div>
          )}

          {isLoading && <Loader label="Loading rooms…" />}
          {isError && <ErrorState error={error} onRetry={refetch} />}
          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState message="No rooms match those filters. Try widening your search." />
          )}
          {!isLoading && !isError && filtered.length > 0 && (
            <Stagger className="rooms-list" gap={0.08}>
              {filtered.map((group) => (
                <StaggerItem key={group.type}>
                  <RoomCard group={group} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>
    </>
  )
}
