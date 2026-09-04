import { useState, type FormEvent } from 'react'
import { getSite } from '@/lib/content'
import { submitContactForm } from '@/lib/contactApi'
import { interpolate } from '@/i18n/ui'
import { useLanguage } from '@/i18n/LanguageProvider'
import { Container } from '@/components/ui/Container'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/lib/utils'
import { VuPlate } from '@/components/ui/VuPlate'
import { VeniceMap } from '@/components/sections/VeniceMap'

export default function ContactPage() {
  const { lang, t } = useLanguage()
  const site = getSite(lang)

  useSeo({
    title: t.contact.seoTitle,
    description: t.contact.seoDescription,
  })

  const reduced = useReducedMotion()
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const form = e.currentTarget
    const data = new FormData(form)

    const result = await submitContactForm({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      subject: String(data.get('subject') ?? ''),
      message: String(data.get('message') ?? ''),
    })

    setPending(false)

    if (!result.ok) {
      setError(result.message ?? t.contact.error)
      return
    }

    form.reset()
    setSubmitted(true)
  }

  return (
    <section
      className={cn('contact-stage', reduced && 'contact-stage--static')}
      aria-label={t.contact.eyebrow}
    >
      <div className="contact-stage__frame" aria-hidden>
        <img
          src={site.contactPhoto}
          alt=""
          width={1536}
          height={1024}
          className="contact-stage__photo"
          loading="lazy"
          decoding="async"
        />
        <div className="contact-stage__shade" />
        <NoiseOverlay opacity={0.04} />
      </div>

      <Container className="relative z-10 py-[clamp(3.5rem,8vw,6.5rem)]">
        <div className="glass-card p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <VuPlate className="mb-3">{t.contact.eyebrow}</VuPlate>
              <h1 className="font-heading text-4xl tracking-[0.08em] text-white sm:text-5xl">
                {t.contact.title}
              </h1>
              <p className="mt-4 max-w-md text-muted">
                {t.contact.intro}
              </p>

              <ul className="mt-10 space-y-3 text-sm text-muted">
                <li>
                  <span className="font-heading text-xs tracking-[0.14em] text-primary">
                    {t.contact.email}
                  </span>
                  <br />
                  <a href={`mailto:${site.email}`} className="text-white hover:text-primary">
                    {site.email}
                  </a>
                </li>
                <li>
                  <span className="font-heading text-xs tracking-[0.14em] text-primary">
                    {t.contact.location}
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
                    {t.contact.sent}
                  </p>
                  <p className="mt-4 text-sm text-muted">
                    {interpolate(t.contact.sentBody, { email: site.email })}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-8"
                    onClick={() => setSubmitted(false)}
                  >
                    {t.contact.sendAnother}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="name" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
                      {t.contact.name}
                    </label>
                    <Input
                      id="name"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder={t.contact.namePlaceholder}
                      className="contact-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
                      {t.contact.email}
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={t.contact.emailPlaceholder}
                      className="contact-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
                      {t.contact.subject}
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      required
                      placeholder={t.contact.subjectPlaceholder}
                      className="contact-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
                      {t.contact.message}
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      placeholder={t.contact.messagePlaceholder}
                      className="contact-field"
                    />
                  </div>

                  {error ? (
                    <p role="alert" className="text-sm text-red-400">
                      {error}{' '}
                      <a
                        href={`mailto:${site.email}`}
                        className="underline hover:text-primary"
                      >
                        {interpolate(t.contact.emailLink, { email: site.email })}
                      </a>
                    </p>
                  ) : null}

                  <Button type="submit" size="lg" className="w-full" disabled={pending}>
                    {pending ? t.contact.sending : t.contact.send}
                  </Button>
                </form>
              )}
            </div>
          </div>
          <VeniceMap className="mt-8" />
        </div>
      </Container>
    </section>
  )
}
