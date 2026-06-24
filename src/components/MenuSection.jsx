import MenuCard from './MenuCard'
import './MenuSection.scss'

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// One category block: a heading followed by a gallery grid of its items.
export default function MenuSection({ category, items }) {
  const id = `cat-${slug(category)}`
  return (
    <section className="menu-section" aria-labelledby={id}>
      <h3 id={id} className="menu-section__title">
        {category}
        <span className="menu-section__count">{items.length}</span>
      </h3>
      <div className="menu-grid">
        {items.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
