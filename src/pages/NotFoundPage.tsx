import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'
import { useLanguage } from '@/i18n/LanguageProvider'

export default function NotFoundPage() {
  const { t } = useLanguage()
  useSeo({
    title: t.notFound.seoTitle,
    description: t.notFound.seoDescription,
  })

  return (
    <section className="section-pad flex min-h-[70vh] items-center bg-black">
      <Container className="text-center">
        <p className="font-heading text-xs tracking-[0.2em] text-primary">404</p>
        <h1 className="font-heading mt-4 text-5xl tracking-[0.08em] text-white md:text-7xl">
          {t.notFound.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          {t.notFound.body}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/" className={cn(buttonVariants())}>
            {t.notFound.home}
          </Link>
          <Link to="/portfolio" className={cn(buttonVariants({ variant: 'outline' }))}>
            {t.notFound.portfolio}
          </Link>
        </div>
      </Container>
    </section>
  )
}
