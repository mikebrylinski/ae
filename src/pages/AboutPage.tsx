import { site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { CTABanner } from '@/components/sections/CTABanner'
import { useSeo } from '@/hooks/useSeo'

export default function AboutPage() {
  useSeo({
    title: 'About',
    description:
      'Meet Andy Ebert — worldwide touring monitor engineer since 1997, with credits including Alanis Morissette, The Weeknd, Maroon 5, and Guns N’ Roses.',
  })

  const { about } = site

  return (
    <>
      <section className="section-pad bg-black">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <MediaImage
              src={about.portrait}
              alt="Andy Ebert"
              aspect="aspect-[3/4]"
              fallbackLabel="Portrait"
            />

            <div>
              <p className="font-heading mb-3 text-xs tracking-[0.2em] text-primary">
                About
              </p>
              <h1 className="font-heading text-4xl tracking-[0.08em] text-white sm:text-5xl">
                Andy Ebert
              </h1>

              <blockquote className="mt-8 border-l-4 border-primary bg-surface/80 py-5 pl-5 pr-4 md:py-6 md:pl-6">
                <p className="font-heading text-lg leading-snug tracking-[0.04em] text-primary sm:text-xl md:text-2xl">
                  “{about.quote}”
                </p>
                {about.quoteAttribution ? (
                  <footer className="mt-4 text-xs tracking-[0.14em] text-muted uppercase">
                    — {about.quoteAttribution}
                  </footer>
                ) : null}
              </blockquote>

              <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/90">
                {about.story.map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-20 grid gap-10 md:grid-cols-2">
            <div className="border border-border bg-surface p-6 md:p-8">
              <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                Philosophy
              </h2>
              <p className="text-sm leading-relaxed text-muted md:text-base">
                {about.philosophy}
              </p>
            </div>
            <div className="border border-border bg-surface p-6 md:p-8">
              <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                Behind The Scenes
              </h2>
              <p className="text-sm leading-relaxed text-muted md:text-base">
                {about.behindTheScenes}
              </p>
            </div>
          </div>

          <div className="mt-12 border border-border p-6 md:p-8">
            <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
              On The Road
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted md:text-base">
              {about.travel}
            </p>
          </div>

          <div className="mt-16">
            <h2 className="font-heading mb-6 text-2xl tracking-[0.08em] text-white">
              Quick Facts
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {about.funFacts.map((fact) => (
                <li
                  key={fact}
                  className="border-l-2 border-primary pl-4 text-sm text-muted"
                >
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
      <CTABanner />
    </>
  )
}
