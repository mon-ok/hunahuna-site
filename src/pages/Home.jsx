import HeroIntro from '@/components/HeroIntro'
import AboutReveal from '@/components/AboutReveal'
import SplitReveal from '@/components/SplitReveal'
import Resources from '@/components/Resources'

// Home page. Four scroll/hover animations across the section. Image paths here
// fall back to the Image component's 🌴 tile until you drop real files in
// /public (see the paths below) or pass your own props.
export default function Home() {
  return (
    <>
      {/* Animation 1: hero zoom + heading reveal (plays on load) */}
      <HeroIntro
        src="/hunahuna-hero.jpg"
        alt="Sunset over the resort beach"
        eyebrow="Hunahuna Beach Resort"
        title="Your slice of tropical paradise"
      />

      {/* Animation 2: about split reveal (scroll down to trigger) */}
      <AboutReveal
        src="/hunahuna-about.jpg"
        alt="A quiet corner of the resort"
        eyebrow="Our story"
        title="Where the palms meet the shore"
      >
        <p className="lead">
          A handful of cottages tucked between palm groves and a quiet beach,
          close enough to reach easily, far enough to feel like an escape. Scroll
          past and watch the image slide to the right half as this copy fades in.
        </p>
      </AboutReveal>

      {/* Split reveal: image fills the section, then recedes to the left half
          (text fades into the right) when it scrolls into view. */}
      <SplitReveal
        src="/hunahuna-split.jpg"
        alt="A wide view across the resort"
        eyebrow="The setting"
        title="Room to breathe"
        mediaSide="left"
      >
        <p className="lead">
          Wide-open spaces between the palms and the shore, designed for long,
          unhurried days. Scroll in and watch the image step aside to make room
          for the story.
        </p>
      </SplitReveal>

      {/* Animations 3 + 4: resources stagger-in, then hover/focus the cards */}
      <Resources
        eyebrow="Explore the resort"
        title="Where the days unfold"
        items={[
          {
            src: '/hunahuna-pool.jpg',
            alt: 'The beachfront pool',
            label: 'The Pool',
            description: 'An infinity edge that melts into the horizon at golden hour.',
            ctaHref: '/rooms',
          },
          {
            src: '/hunahuna-restaurant.jpg',
            alt: 'The restaurant terrace',
            label: 'Restaurant',
            description: 'Fresh local seafood and island favourites, toes near the sand.',
            ctaHref: '/menu',
          },
          {
            src: '/hunahuna-spa.jpg',
            alt: 'A garden spa cabana',
            label: 'The Spa',
            description: 'Unhurried treatments in open-air cabanas among the palms.',
            ctaHref: '/amenities',
          },
        ]}
      />
    </>
  )
}
