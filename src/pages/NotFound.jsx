import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center', maxWidth: '520px' }}>
        <div style={{ fontSize: '3.5rem' }} aria-hidden="true">🏝️</div>
        <h1>Lost in paradise</h1>
        <p style={{ color: '#6b6b6b' }}>
          We couldn't find that page. Let's get you back to the shore.
        </p>
        <Link to="/" className="btn btn--primary">Back to home</Link>
      </div>
    </section>
  )
}
