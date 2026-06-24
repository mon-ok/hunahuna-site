import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'
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

// Strong ease-in-out so each half of the wipe accelerates and then glides.
const WIPE_EASE = [0.83, 0, 0.17, 1]
const WIPE_HALF = 0.45 // seconds per half (cover, then reveal)

export default function App() {
  const location = useLocation()
  const reduce = useReducedMotion()

  // --- Home screen-wipe transition ------------------------------------------
  // Navigating TO or FROM the home page plays a full-screen panel that wipes
  // across the viewport. `displayLocation` lags behind the real location so the
  // page on screen doesn't change until the panel has fully covered it:
  //   1. cover  — panel sweeps in from the left over the current page
  //   2. swap   — route content switches underneath, hidden by the panel
  //   3. reveal — panel slides off to the right; the new page follows in its wake
  // Every other route just swaps `displayLocation` immediately and keeps the
  // plain cross-fade below. Reduced-motion users skip the wipe entirely.
  const [displayLocation, setDisplayLocation] = useState(location)
  const [phase, setPhase] = useState('idle') // 'idle' | 'cover' | 'reveal'

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return
    const involvesHome =
      location.pathname === '/' || displayLocation.pathname === '/'
    if (reduce || !involvesHome) {
      setDisplayLocation(location) // no wipe — the cross-fade handles it
    } else {
      setPhase('cover') // keep showing the old page until the panel covers it
    }
  }, [location, displayLocation, reduce])

  // Reset scroll when the *displayed* page changes (during a wipe this happens
  // while the panel covers the screen, so the jump is never visible).
  useEffect(() => window.scrollTo(0, 0), [displayLocation.pathname])

  return (
    <div className="app">
      {/* Premium intro overlay — shows once on initial load, then self-removes */}
      <Preloader />
      <a className="skip-link" href="#main">Skip to content</a>
      <Navbar />
      <main id="main" className="app__main">
        {/* Subtle cross-fade between pages. mode="wait" lets the old page
            finish exiting before the new one enters for a clean transition.
            During a wipe the swap is instant (duration 0) since it's hidden
            under the covering panel. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={displayLocation.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce || phase !== 'idle' ? 0 : 0.3, ease: 'easeOut' }}
          >
            <Suspense fallback={<Loader label="Loading…" />}>
              <Routes location={displayLocation}>
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

      {/* The wipe panel itself. Same element across both halves so the motion is
          one continuous left→right sweep: cover (x -100%→0) then reveal (0→100%). */}
      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div
            className="page-wipe"
            aria-hidden="true"
            initial={{ x: '-100%' }}
            animate={{ x: phase === 'cover' ? '0%' : '100%' }}
            transition={{ duration: WIPE_HALF, ease: WIPE_EASE }}
            onAnimationComplete={() => {
              if (phase === 'cover') {
                setDisplayLocation(location) // swap hidden under full cover
                setPhase('reveal')
              } else {
                setPhase('idle')
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
