import { Link } from 'react-router-dom'
import { formatMoney } from '@/lib/rates'
import './AmenityCard.scss'

const TYPE_LABEL = {
  free: 'Free',
  paid: 'Paid',
  bookable: 'Bookable',
}

export default function AmenityCard({ amenity }) {
  const { name, type, description, hours, price, capacity } = amenity
  return (
    <article className="amenity-card card">
      <div className="amenity-card__head">
        <h3 className="amenity-card__name">{name}</h3>
        <span className={`badge amenity-card__type amenity-card__type--${type}`}>
          {TYPE_LABEL[type] ?? type}
        </span>
      </div>

      {description && <p className="amenity-card__desc">{description}</p>}

      <ul className="amenity-card__meta">
        {hours && <li>🕒 {hours}</li>}
        {capacity != null && <li>👥 Up to {capacity}</li>}
        {price != null && type !== 'free' && (
          <li className="price">{formatMoney(price)}</li>
        )}
      </ul>

      {type === 'bookable' && (
        <Link to={`/contact?inquiry=${encodeURIComponent(name)}`} className="btn btn--outline amenity-card__cta">
          Inquire / Book
        </Link>
      )}
    </article>
  )
}
