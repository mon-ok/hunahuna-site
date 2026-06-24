import { representativeRate, formatMoney } from '@/lib/rates'
import './RoomTypePicker.scss'

// Selectable list of room *types* (no per-room redundancy). Each option shows
// its details as tags rather than a comma-separated string.
export default function RoomTypePicker({ groups = [], value, onSelect }) {
  return (
    <div className="room-picker" role="radiogroup" aria-label="Room or cottage">
      {groups.map((g) => {
        const selected = g.type === value
        const rate = representativeRate(g.representative)
        return (
          <button
            type="button"
            key={g.type}
            role="radio"
            aria-checked={selected}
            className={`room-picker__option ${selected ? 'is-selected' : ''}`}
            onClick={() => onSelect(g.type)}
          >
            <span className="room-picker__head">
              <span className="room-picker__name">{g.type}</span>
              {rate != null && (
                <span className="room-picker__rate">
                  from <span className="price">{formatMoney(rate)}</span>
                  <small>/night</small>
                </span>
              )}
            </span>
            <span className="room-picker__tags">
              <span className="tag tag--guests">
                Sleeps {g.representative.max_occupancy}
              </span>
              <span
                className={`tag ${
                  g.representative.has_aircon ? 'tag--aircon' : 'tag--fan'
                }`}
              >
                {g.representative.has_aircon ? 'Air-conditioned' : 'Fan-cooled'}
              </span>
              <span className="tag tag--count">
                {g.count === 1 ? '1 room' : `${g.count} rooms`}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
