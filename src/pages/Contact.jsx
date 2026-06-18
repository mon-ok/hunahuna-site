import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import PageHeader from '@/components/PageHeader'
import './Contact.scss'

// No dedicated contact-message table is in scope, so the form composes a
// mailto: to the resort. Swap for an Edge Function / form service when ready.
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'hello@hunahuna.example'
const PHONE = import.meta.env.VITE_CONTACT_PHONE || '+63 900 000 0000'
const ADDRESS = import.meta.env.VITE_CONTACT_ADDRESS || 'Beachfront Road, Island Province, Philippines'
const MAPS_QUERY = encodeURIComponent(ADDRESS)

export default function Contact() {
  const [params] = useSearchParams()
  const inquiry = params.get('inquiry')
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      message: inquiry ? `Hi! I'd like to inquire about: ${inquiry}.\n\n` : '',
    },
  })

  const onSubmit = (v) => {
    const subject = encodeURIComponent(
      inquiry ? `Inquiry: ${inquiry}` : 'Website enquiry'
    )
    const body = encodeURIComponent(
      `Name: ${v.name}\nEmail: ${v.email}\n\n${v.message}`
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <>
      <PageHeader eyebrow="Say hello" title="Contact & Location">
        Questions, special requests, or just want directions? We're happy to help.
      </PageHeader>

      <section className="section">
        <div className="container contact">
          <div className="contact__info">
            <h2>Get in touch</h2>
            <ul className="contact__list">
              <li><span aria-hidden="true">📍</span> {ADDRESS}</li>
              <li><span aria-hidden="true">✉️</span> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
              <li><span aria-hidden="true">📞</span> <a href={`tel:${PHONE.replace(/\s/g, '')}`}>{PHONE}</a></li>
            </ul>

            <h3>Front desk hours</h3>
            <p className="contact__hours">Daily, 7:00 AM – 10:00 PM</p>

            <h3>Follow along</h3>
            <ul className="contact__socials">
              <li><a href="#" aria-label="Facebook">Facebook</a></li>
              <li><a href="#" aria-label="Instagram">Instagram</a></li>
            </ul>

            <div className="contact__map">
              <iframe
                title="Resort location map"
                src={`https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="contact__form-wrap">
            <h2>Send a message</h2>
            {sent && (
              <p className="contact__sent" role="status">
                Thanks! Your email app should have opened with your message ready to send.
              </p>
            )}
            <form className="contact__form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="field">
                <label className="field__label" htmlFor="c-name">Name</label>
                <input id="c-name" className="field__control"
                  {...register('name', { required: 'Please enter your name.' })} />
                {errors.name && <p className="field__error">{errors.name.message}</p>}
              </div>
              <div className="field">
                <label className="field__label" htmlFor="c-email">Email</label>
                <input id="c-email" type="email" className="field__control"
                  {...register('email', {
                    required: 'Please enter your email.',
                    pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email.' },
                  })} />
                {errors.email && <p className="field__error">{errors.email.message}</p>}
              </div>
              <div className="field">
                <label className="field__label" htmlFor="c-message">Message</label>
                <textarea id="c-message" rows={5} className="field__control"
                  {...register('message', { required: 'Please add a message.' })} />
                {errors.message && <p className="field__error">{errors.message.message}</p>}
              </div>
              <button type="submit" className="btn btn--primary btn--block">Send message</button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
