import { useState, type FormEvent } from 'react'
import { site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { MediaImage } from '@/components/ui/MediaImage'
import { useSeo } from '@/hooks/useSeo'

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
    <section className="section-pad bg-black">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="font-heading mb-3 text-xs tracking-[0.2em] text-primary">
              Contact
            </p>
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
              <li>
                <span className="font-heading text-xs tracking-[0.14em] text-primary">
                  LinkedIn
                </span>
                <br />
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white hover:text-primary"
                >
                  Connect on LinkedIn
                </a>
              </li>
            </ul>

            <div className="mt-10 hidden lg:block">
              <MediaImage
                src={site.contactPhoto}
                alt="Contact Andy Ebert"
                aspect="aspect-video"
                fallbackLabel="Contact"
              />
            </div>
          </div>

          <div className="border border-border bg-surface p-6 md:p-8">
            {submitted ? (
              <div role="status" className="py-12 text-center">
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
                  <Input id="name" name="name" required autoComplete="name" placeholder="Your name" />
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
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
                    Subject
                  </label>
                  <Input id="subject" name="subject" required placeholder="Tour / Broadcast / Production" />
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
      </Container>
    </section>
  )
}
