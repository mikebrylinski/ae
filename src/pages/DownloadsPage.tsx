import { Download } from 'lucide-react'
import { downloads } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { CTABanner } from '@/components/sections/CTABanner'
import { cn } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'

export default function DownloadsPage() {
  useSeo({
    title: 'Downloads',
    description:
      'Free PDF input lists, rack layouts, and console charts from monitor engineer Andy Ebert.',
  })

  return (
    <>
      <section className="section-pad bg-black">
        <Container>
          <p className="font-heading mb-3 text-xs tracking-[0.2em] text-primary">
            Resources
          </p>
          <h1 className="font-heading text-4xl tracking-[0.08em] text-white sm:text-5xl md:text-6xl">
            Downloads
          </h1>
          <p className="mt-4 max-w-2xl text-muted">{downloads.intro}</p>

          <div className="mt-16 space-y-20 md:mt-20 md:space-y-24">
            {downloads.categories.map((category) => (
              <div key={category.id}>
                <div className="mb-8 md:mb-10">
                  <h2 className="font-heading text-2xl tracking-[0.08em] text-white md:text-3xl">
                    {category.title}
                  </h2>
                  {category.description ? (
                    <p className="mt-2 max-w-2xl text-sm text-muted">
                      {category.description}
                    </p>
                  ) : null}
                </div>

                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((item) => {
                    const isExternal = Boolean(item.external)
                    return (
                      <li
                        key={item.id}
                        className="group flex flex-col border border-border bg-surface p-5 transition-[border-color,box-shadow] duration-500 hover:border-primary/30 hover:shadow-[0_0_24px_rgba(184,255,0,0.06)] md:p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-heading text-base tracking-[0.06em] text-white transition-colors duration-500 group-hover:text-primary sm:text-lg">
                            {item.label}
                          </h3>
                          <Badge variant="muted">{item.type}</Badge>
                        </div>
                        <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/80">
                          {item.description}
                        </p>
                        <a
                          href={item.href}
                          download={!isExternal ? true : undefined}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noreferrer' : undefined}
                          className={cn(
                            buttonVariants({ variant: 'outline', size: 'sm' }),
                            'mt-6 w-full justify-center sm:w-auto',
                          )}
                        >
                          <Download size={14} strokeWidth={1.75} aria-hidden />
                          Download
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="paper-surface section-divider-top relative overflow-hidden py-10 md:py-12">
        <Container className="relative z-10">
          <p className="w-full text-center text-sm leading-relaxed text-black/70">
            All charts and layouts are provided free of charge. A PDF reader such
            as Adobe Acrobat Reader is required to open the files.
          </p>
        </Container>
      </section>

      <CTABanner />
    </>
  )
}
