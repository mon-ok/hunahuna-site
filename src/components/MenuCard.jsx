import Image from './Image'
import { menuImageUrl } from '@/lib/storage'
import { formatMoney } from '@/lib/rates'
import './MenuCard.scss'

// Gallery tile for a single menu item. Photos are coming later — most rows have
// a null image_path, so <Image> falls back to the on-brand placeholder.
export default function MenuCard({ item }) {
  return (
    <article className="menu-card card">
      <div className="menu-card__media">
        <Image src={menuImageUrl(item.image_path)} alt={item.name} ratio="4 / 3" />
        {item.is_market_price ? (
          <span className="menu-card__price menu-card__price--market">Market price</span>
        ) : (
          <span className="menu-card__price">{formatMoney(item.price)}</span>
        )}
      </div>
      <div className="menu-card__body">
        <h4 className="menu-card__name">{item.name}</h4>
        {item.description && <p className="menu-card__desc">{item.description}</p>}
      </div>
    </article>
  )
}
