import { useSearchParams } from 'react-router-dom'
import { useRooms } from '@/hooks/useRooms'
import BookingForm from '@/components/BookingForm'
import PageHeader from '@/components/PageHeader'
import { Loader, ErrorState } from '@/components/States'
import './Booking.scss'

export default function Booking() {
  const [params] = useSearchParams()
  const preselectedRoomId = params.get('room') || ''
  const { data: rooms, isLoading, isError, error, refetch } = useRooms()

  return (
    <>
      <PageHeader eyebrow="Reserve" title="Book your stay">
        Pick your room and dates, and we'll hold a pending reservation while the
        resort confirms.
      </PageHeader>

      <section className="section">
        <div className="container booking-layout">
          <div className="booking-layout__main">
            {isLoading && <Loader label="Loading rooms…" />}
            {isError && <ErrorState error={error} onRetry={refetch} />}
            {!isLoading && !isError && (
              <BookingForm rooms={rooms ?? []} preselectedRoomId={preselectedRoomId} />
            )}
          </div>

          <aside className="booking-layout__aside">
            <div className="booking-aside card">
              <h3>How booking works</h3>
              <ol className="booking-steps">
                <li>Choose a room, dates, and guests.</li>
                <li>We check availability and calculate your rate.</li>
                <li>Submit your details, and a <strong>pending</strong> reservation is created.</li>
                <li>The resort confirms availability and payment before your stay.</li>
              </ol>
              <p className="booking-aside__note">
                Need help? Visit <a href="/contact">Contact</a> or call the front desk.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
