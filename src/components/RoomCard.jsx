import { Link } from 'react-router-dom'
import Image from './Image'
import { roomImageUrl } from '@/lib/storage'
import { representativeRate, formatMoney } from '@/lib/rates'
import './RoomCard.scss'

// A `group` represents one room_type (e.g. all six "Cliff Side Room"s). Rooms
// of the same type are identical in rate/occupancy/amenities, so the list shows
// one row per type with a count instead of repeating every room number.
function groupImage(group) {
  const imgs = group.images ?? []
  return imgs.find((i) => i.is_primary) ?? imgs[0] ?? null
}

export default function RoomCard({ group }) {
  const img = groupImage(group)
  const rate = representativeRate(group.representative)
  const detailHref = `/rooms/${group.representative.id}`
  const bookingHref = `/booking?room=${group.representative.id}`
  const countLabel = group.count === 1 ? '1 room' : `${group.count} rooms`

  return (
    <article className="room-card card">
      <Link to={detailHref} className="room-card__media" tabIndex={-1} aria-hidden="true">
        <Image
          src={roomImageUrl(img?.storage_path)}
          alt={img?.alt_text || `${group.type} room`}
          ratio="4 / 3"
        />
      </Link>

      <div className="room-card__body">
        <div className="room-card__header">
          <h3 className="room-card__title">
            <Link to={detailHref}>{group.type}</Link>
          </h3>
          <span className="room-card__count" title={`${countLabel} of this type`}>
            {countLabel}
          </span>
        </div>

        <ul className="room-card__meta">
          <li className="room-card__tag room-card__tag--guests">
            Sleeps {group.representative.max_occupancy}
          </li>
          <li
            className={`room-card__tag ${
              group.representative.has_aircon
                ? 'room-card__tag--aircon'
                : 'room-card__tag--fan'
            }`}
          >
            {group.representative.has_aircon ? 'Air-conditioned' : 'Fan-cooled'}
          </li>
        </ul>

        {group.representative.description && (
          <p className="room-card__desc">{group.representative.description}</p>
        )}

        <div className="room-card__footer">
          {rate != null && (
            <span className="room-card__rate">
              from <span className="price">{formatMoney(rate)}</span>
              <small>/night</small>
            </span>
          )}
          <div className="room-card__actions">
            <Link to={detailHref} className="btn btn--outline">
              View details
            </Link>
            <Link to={bookingHref} className="btn btn--primary">
              Reserve
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
