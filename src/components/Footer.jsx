import { Link } from 'react-router-dom'
import './Footer.scss'

export default function Footer() {
  const year = import.meta.env.VITE_BUILD_YEAR || '2026'
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__col footer__col--brand">
          <span className="footer__brand">Hunahuna</span>
          <p>Warm tropical stays, sunset views, and island hospitality on a quiet stretch of shoreline.</p>
        </div>

        <div className="footer__col">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/rooms">Rooms &amp; Cottages</Link></li>
            <li><Link to="/menu">Restaurant &amp; Bar</Link></li>
            <li><Link to="/amenities">Amenities</Link></li>
            <li><Link to="/gallery">Gallery</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Visit</h4>
          <ul>
            <li><Link to="/about">Our Story</Link></li>
            <li><Link to="/contact">Contact &amp; Location</Link></li>
            <li><Link to="/booking">Book a Stay</Link></li>
            <li><Link to="/reservations">My Reservations</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer__bar">
        <div className="container">
          <span>© {year} Hunahuna Beach Resort. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
