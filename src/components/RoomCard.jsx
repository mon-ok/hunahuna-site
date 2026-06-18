import { Link } from 'react-router-dom'
import Image from './Image'
import { roomImageUrl } from '@/lib/storage'
import { representativeRate, formatMoney } from '@/lib/rates'
import './RoomCard.scss'

function primaryImage(room) {
  const imgs = room.room_images ?? []
  return imgs.find((i) => i.is_primary) ?? imgs[0] ?? null
}

export default function RoomCard({ room }) {
  const img = primaryImage(room)
  const rate = representativeRate(room)

  return (
    <article className="room-card card">
      <Link to={`/rooms/${room.id}`} className="room-card__media" tabIndex={-1} aria-hidden="true">
        <Image
          src={roomImageUrl(img?.storage_path)}
          alt={img?.alt_text || `${room.room_type} room`}
          ratio="4 / 3"
        />
        {rate != null && (
          <span className="room-card__rate">
            from <span className="price">{formatMoney(rate)}</span>/night
          </span>
        )}
      </Link>

      <div className="room-card__body">
        <h3 className="room-card__title">
          <Link to={`/rooms/${room.id}`}>{room.room_type}</Link>
        </h3>

        <ul className="room-card__meta">
          <li>👤 Sleeps {room.max_occupancy}</li>
          <li>{room.has_aircon ? '❄️ Air-conditioned' : '🌬️ Fan-cooled'}</li>
        </ul>

        {room.description && (
          <p className="room-card__desc">{room.description}</p>
        )}

        <div className="room-card__actions">
          <Link to={`/rooms/${room.id}`} className="btn btn--outline">
            View details
          </Link>
          <Link to={`/booking?room=${room.id}`} className="btn btn--primary">
            Reserve
          </Link>
        </div>
      </div>
    </article>
  )
}
