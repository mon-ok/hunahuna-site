import Image from './Image'
import { menuImageUrl } from '@/lib/storage'
import { formatMoney } from '@/lib/rates'
import './MenuSection.scss'

// Renders one category's items. `items` are already filtered to is_available.
export default function MenuSection({ category, items }) {
  return (
    <section className="menu-section" aria-labelledby={`cat-${category}`}>
      <h3 id={`cat-${category}`} className="menu-section__title">
        {category}
      </h3>
      <ul className="menu-section__list">
        {items.map((item) => (
          <li key={item.id} className="menu-item">
            {item.image_path && (
              <Image
                src={menuImageUrl(item.image_path)}
                alt={item.name}
                ratio="1 / 1"
                className="menu-item__img"
              />
            )}
            <div className="menu-item__body">
              <div className="menu-item__head">
                <h4 className="menu-item__name">{item.name}</h4>
                <span className="menu-item__price">
                  {item.is_market_price ? (
                    <span className="badge badge--accent">Market Price</span>
                  ) : (
                    <span className="price">{formatMoney(item.price)}</span>
                  )}
                </span>
              </div>
              {item.description && (
                <p className="menu-item__desc">{item.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
