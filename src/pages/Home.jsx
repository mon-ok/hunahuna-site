import HeroIntro from '@/components/HeroIntro'
import AboutReveal from '@/components/AboutReveal'
import SplitReveal from '@/components/SplitReveal'
import Resources from '@/components/Resources'

// Home page. Four scroll/hover animations across the section.
export default function Home() {
  return (
    <>
      {/* Animation 1: hero zoom + heading reveal (plays on load) */}
      <HeroIntro
        src="/hunahuna-hero.png"
        alt="Sunset over Huna Huna Cliff Resort"
        eyebrow="Huna Huna Cliff Resort"
        title="Your Next Spanish-Mediterranean Destination"
      />

      {/* Animation 2: about split reveal (scroll down to trigger) */}
      <AboutReveal
        src="/hunahuna-about.png"
        alt="Huna Huna Cliff Resort hillside view of the Camotes Sea"
        eyebrow="Spanish-Mediterranean Sanctuary"
        title="Overlooking the Camotes Sea"
      >
        <p className="lead">
          Perched on the hillside of Catmon, Northern Cebu, just a scenic 45-kilometer drive north of Cebu City, Huna Huna Cliff Resort offers a refreshing blend of discovery, excitement, and relaxation.
        </p>
      </AboutReveal>

      {/* Split reveal: image fills the section, then recedes to the left half
          (text fades into the right) when it scrolls into view. */}
      <SplitReveal
        src="/hunahuna-split.jpg"
        alt="Overlooking the cliffside resort and ocean"
        eyebrow="Our Story"
        title="Crafted Over Two Decades"
        mediaSide="left"
        cta={{ to: '/about', label: 'Explore Our Story' }}
      >
        <p className="lead">
          Our journey began when we visited and fell in love with what was then the Monte Carlo Resort. Originally buying just four rooms, the restaurant, and the land in between, my wife Merly and I envisioned a unique seaside getaway.
        </p>
      </SplitReveal>

      {/* Animations 3 + 4: resources stagger-in, then hover/focus the cards */}
      <Resources
        eyebrow="Resort Facilities"
        title="Designed for Your Comfort"
        items={[
          {
            src: '/hunahuna-pool.png',
            alt: 'Revamped infinity edge sea pool with jacuzzi',
            label: 'Infinity Sea Pool',
            description: 'A beautiful infinity pool overlooking the ocean, featuring two hydrotherapy beds, an in-pool bar, a jacuzzi, and an expanded deck area perfect for weddings and celebrations.',
            ctaHref: '/amenities',
          },
          {
            src: '/hunahuna-restaurant.png',
            alt: 'Lower deck restaurant and wood pizza oven',
            label: 'Lower Deck Dining',
            description: 'Enjoy delicious meals from our lower deck buffet counter, featuring traditional wood-fired pizza ovens and stunning panoramic coastal views.',
            ctaHref: '/menu',
          },
          {
            src: '/hunahuna-spa.jpg',
            alt: 'Revamped cottages and event space',
            label: 'Cottages & Events',
            description: 'Featuring a long cottage seating 20+ guests for conferences or parties, and revamped cozy cottages with custom undercover seating connected for your comfort.',
            ctaHref: '/rooms',
          },
        ]}
      />
    </>
  )
}

