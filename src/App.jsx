import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Preloader from '@/components/Preloader'
import { Loader } from '@/components/States'

// Route-level code splitting: each page is its own chunk, so the initial
// bundle only carries shared chrome + whichever route is first requested.
const Home = lazy(() => import('@/pages/Home'))
const Rooms = lazy(() => import('@/pages/Rooms'))
const RoomDetail = lazy(() => import('@/pages/RoomDetail'))
const Menu = lazy(() => import('@/pages/Menu'))
const Amenities = lazy(() => import('@/pages/Amenities'))
const Gallery = lazy(() => import('@/pages/Gallery'))
const About = lazy(() => import('@/pages/About'))
const Contact = lazy(() => import('@/pages/Contact'))
const Booking = lazy(() => import('@/pages/Booking'))
const BookingConfirmation = lazy(() => import('@/pages/BookingConfirmation'))
const MyReservations = lazy(() => import('@/pages/MyReservations'))
const NotFound = lazy(() => import('@/pages/NotFound'))

import './App.scss'

// Scroll to top on route change.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  const location = useLocation()
  const reduce = useReducedMotion()

  return (
    <div className="app">
      {/* Premium intro overlay — shows once on initial load, then self-removes */}
      <Preloader />
      <a className="skip-link" href="#main">Skip to content</a>
      <Navbar />
      <ScrollToTop />
      <main id="main" className="app__main">
        {/* Subtle cross-fade between pages. mode="wait" lets the old page
            finish exiting before the new one enters for a clean transition. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut' }}
          >
            <Suspense fallback={<Loader label="Loading…" />}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/rooms" element={<Rooms />} />
                <Route path="/rooms/:id" element={<RoomDetail />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/amenities" element={<Amenities />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/booking/confirmed" element={<BookingConfirmation />} />
                <Route path="/reservations" element={<MyReservations />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
