import { Link } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import { Reveal, Stagger, StaggerItem } from '@/components/Motion'
import './About.scss'

const VALUES = [
  { title: 'Rooted in place', text: 'Local hands, local flavours, and a light footprint on the island we call home.' },
  { title: 'Easy hospitality', text: 'No fuss, no pretence, just warm, genuine care for every guest.' },
  { title: 'Made for slowing down', text: 'Spaces designed for long lunches, lazy afternoons, and unhurried sunsets.' },
]

export default function About() {
  return (
    <>
      <PageHeader eyebrow="Our story" title="About Hunahuna">
        A Spanish-Mediterranean retreat on the cliffs of Catmon, Cebu, built on two decades of love and dedication.
      </PageHeader>

      <section className="section">
        <div className="container section__head">
          <div className="about-intro">
            <Reveal as="p" className="lead" y={20}>
              Our story began many years ago during visits to the former Monte Carlo Resort. Captivated by the natural beauty of the Catmon hillside overlooking the Camotes Sea, we couldn't resist when the original owners, the Hakkens, offered us the chance to buy a piece of the property.
            </Reveal>
            <Reveal as="p" y={20} delay={0.1} style={{ marginTop: '1.25rem', color: 'var(--color-muted)' }}>
              It started with just four rooms, a restaurant, an ablution block, and the land in between. My wife Merly and I decided to build a small two-bedroom house, keeping its design sympathetic to the existing structure and surrounding cliffs.
            </Reveal>
            <Reveal as="p" y={20} delay={0.2} style={{ marginTop: '1.25rem', color: 'var(--color-muted)' }}>
              A year later, the rest of the property was offered to us. Seeing the resort's incredible potential as a cohesive whole, we embarked on a long-term development: constructing six new sea-view rooms with en-suite bathrooms and private verandas, a connected roof deck with an access bridge, and new staircases to link every corner of the property.
            </Reveal>
            <Reveal as="p" y={20} delay={0.3} style={{ marginTop: '1.25rem', color: 'var(--color-muted)' }}>
              We upgraded the lower deck with a full buffet counter and a traditional wood-fired pizza oven. We built a long cottage capable of hosting 20+ guests for conferences and celebrations. Later, we revamped the sea pool into a stunning infinity pool with two hydrotherapy beds, an in-pool bar, and a jacuzzi, alongside expanded decking for unforgettable weddings and parties. Today, we continue to refine this Mediterranean dream.
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">What we care about</span>
            <h2>The Hunahuna way</h2>
          </div>
          <Stagger as="ul" className="about-values" gap={0.12}>
            {VALUES.map((v, i) => (
              <StaggerItem as="li" key={v.title} className="about-value">
                <span className="about-value__num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="section">
        <Reveal className="container about-cta">
          <span className="eyebrow">Come see for yourself</span>
          <h2>Your sunset is waiting</h2>
          <p>Spend a few easy days with us on the shore.</p>
          <Link to="/booking" className="btn btn--primary">Book your stay</Link>
        </Reveal>
      </section>
    </>
  )
}
