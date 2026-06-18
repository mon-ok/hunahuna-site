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
        A family-run beachfront resort built around sunsets, good food, and easy days.
      </PageHeader>

      <section className="section">
        <div className="container section__head">
          <Reveal as="p" className="lead about-intro">
            Hunahuna began as a simple stretch of shoreline and a big idea: a place
            where guests could feel the island the way locals do. Over the years
            we’ve grown into a small collection of cottages and rooms, a restaurant
            and bar, and a handful of activities, but the heart of it hasn’t
            changed. We’re still about warm welcomes, fresh food, and that moment
            when the sky turns gold over the water.
          </Reveal>
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
