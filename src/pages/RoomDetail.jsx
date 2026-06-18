import { useParams, Link } from 'react-router-dom'
import { useRoom } from '@/hooks/useRoom'
import RoomGallery from '@/components/RoomGallery'
import { Loader, ErrorState } from '@/components/States'
import { formatMoney } from '@/lib/rates'
import './RoomDetail.scss'

function RateRow({ label, value }) {
  if (value == null) return null
  return (
    <div className="rate-row">
      <span>{label}</span>
      <span className="price">{formatMoney(value)}<small>/night</small></span>
    </div>
  )
}

export default function RoomDetail() {
  const { id } = useParams()
  const { data: room, isLoading, isError, error, refetch } = useRoom(id)

  if (isLoading) return <div className="section container"><Loader label="Loading room…" /></div>
  if (isError) return <div className="section container"><ErrorState error={error} onRetry={refetch} /></div>
  if (!room) return null

  return (
    <section className="section">
      <div className="container">
        <Link to="/rooms" className="room-detail__back">← All rooms</Link>

        <div className="room-detail">
          <div className="room-detail__media">
            <RoomGallery images={room.room_images ?? []} roomType={room.room_type} />
          </div>

          <aside className="room-detail__aside">
            <h1 className="room-detail__title">{room.room_type}</h1>

            <ul className="room-detail__meta">
              <li>👤 Sleeps up to {room.max_occupancy}</li>
              <li>{room.has_aircon ? '❄️ Air-conditioned' : '🌬️ Fan-cooled'}</li>
              {room.room_number && <li>🚪 Room {room.room_number}</li>}
            </ul>

            <div className="room-detail__rates card">
              <h2 className="room-detail__rates-title">Nightly rates</h2>
              <RateRow label="Weekday" value={room.weekday_rate} />
              <RateRow label="Weekend (Fri–Sat)" value={room.weekend_rate} />
              <RateRow label="Holiday" value={room.holiday_rate} />
              {room.weekday_rate == null && room.weekend_rate == null && (
                <RateRow label="Base" value={room.base_rate} />
              )}
              <p className="room-detail__rates-note">
                Final total depends on your dates and is confirmed at booking.
              </p>
            </div>

            <Link to={`/booking?room=${room.id}`} className="btn btn--primary btn--block">
              Reserve this room
            </Link>
          </aside>
        </div>

        {room.description && (
          <div className="room-detail__desc">
            <h2>About this room</h2>
            <p>{room.description}</p>
          </div>
        )}
      </div>
    </section>
  )
}
