import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import './Navbar.scss'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/rooms', label: 'Rooms & Cottages' },
  { to: '/menu', label: 'Restaurant & Bar' },
  { to: '/amenities', label: 'Amenities' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const { pathname } = useLocation()

  // The home page has a full-bleed dark hero behind the bar: it sits as a blue,
  // hide-on-scroll bar at the top, then solidifies as you scroll down.
  const heroRoute = pathname === '/'

  useEffect(() => {
    // Reset visibility when the route changes (hide-on-scroll is home-only).
    setHidden(false)
    lastY.current = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)

      // Home only: hide when scrolling down, reveal when scrolling up, and
      // always show near the very top.
      if (heroRoute) {
        if (y <= 80) setHidden(false)
        else if (y > lastY.current + 4) setHidden(true)
        else if (y < lastY.current - 4) setHidden(false)
      }
      lastY.current = y
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [heroRoute])

  const solid = scrolled || open || !heroRoute

  return (
    <header
      className={`nav ${solid ? 'is-solid' : ''} ${open ? 'is-open' : ''} ${
        heroRoute ? 'nav--home' : ''
      } ${hidden && !open ? 'is-hidden' : ''}`}
    >
      <div className="nav__inner container">
        <Link to="/" className="nav__brand" onClick={() => setOpen(false)}>
          <span className="nav__brandtext">
            Hunahuna<small>Beach Resort</small>
          </span>
        </Link>

        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="visually-hidden">Toggle menu</span>
          <span className={`nav__bars ${open ? 'is-open' : ''}`} aria-hidden="true" />
        </button>

        <nav
          id="primary-nav"
          className={`nav__menu ${open ? 'is-open' : ''}`}
          aria-label="Primary"
        >
          <ul>
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `nav__link ${isActive ? 'is-active' : ''}`
                  }
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link
                to="/booking"
                className="btn btn--primary nav__cta"
                onClick={() => setOpen(false)}
              >
                Book Now
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
