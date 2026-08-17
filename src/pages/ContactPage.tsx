import { useState, type FormEvent } from 'react'
import { site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/lib/utils'
import { VuPlate } from '@/components/ui/VuPlate'

/**
 * Contact form is UI-only for now.
 * Future: POST to Contact API (see src/lib/cms.ts TODO).
 */
export default function ContactPage() {
  useSeo({
    title: 'Contact',
    description:
      'Start a conversation with Andy Ebert about your next tour, broadcast, or production.',
  })

  const reduced = useReducedMotion()
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    // Stub for future Contact API
    window.setTimeout(() => {
      setPending(false)
      setSubmitted(true)
    }, 600)
  }

  return (
    <section
      className={cn('contact-stage', reduced && 'contact-stage--static')}
      aria-label="Contact"
    >
      <div className="contact-stage__frame" aria-hidden>
        <img
          src={site.contactPhoto}
          alt=""
          width={1536}
          height={1024}
          className="contact-stage__photo"
        />
        <div className="contact-stage__shade" />
        <NoiseOverlay opacity={0.04} />
      </div>

      <Container className="relative z-10 py-[clamp(3.5rem,8vw,6.5rem)]">
        <div className="glass-card p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <VuPlate className="mb-3">Contact</VuPlate>
              <h1 className="font-heading text-4xl tracking-[0.08em] text-white sm:text-5xl">
                Start A Conversation
              </h1>
              <p className="mt-4 max-w-md text-muted">
                Planning a tour, broadcast, or production? Reach out — Andy is
                available for select engagements worldwide.
              </p>

              <ul className="mt-10 space-y-3 text-sm text-muted">
                <li>
                  <span className="font-heading text-xs tracking-[0.14em] text-primary">
                    Email
                  </span>
                  <br />
                  <a href={`mailto:${site.email}`} className="text-white hover:text-primary">
                    {site.email}
                  </a>
                </li>
                <li>
                  <span className="font-heading text-xs tracking-[0.14em] text-primary">
                    Location
                  </span>
                  <br />
                  {site.location}
                </li>
              </ul>
            </div>

            <div className="lg:border-l lg:border-white/10 lg:pl-12">
              {submitted ? (
                <div role="status" className="py-12 text-center lg:text-left">
                  <p className="font-heading text-2xl tracking-[0.08em] text-primary">
                    Message Ready
                  </p>
                  <p className="mt-4 text-sm text-muted">
                    Thanks for reaching out. This form is a UI preview — wire the
                    Contact API to send messages live.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-8"
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="name" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Your name"
                      className="contact-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="contact-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      required
                      placeholder="Tour / Broadcast / Production"
                      className="contact-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      placeholder="Tell Andy about the project…"
                      className="contact-field"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={pending}>
                    {pending ? 'Sending…' : 'Send Message'}
                  </Button>
                  <p className="text-xs text-muted">
                    Form is UI-only until the Contact API is connected.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
