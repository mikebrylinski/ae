import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'

export default function NotFoundPage() {
  useSeo({
    title: 'Page Not Found',
    description: 'The page you requested could not be found.',
  })

  return (
    <section className="section-pad flex min-h-[70vh] items-center bg-black">
      <Container className="text-center">
        <p className="font-heading text-xs tracking-[0.2em] text-primary">404</p>
        <h1 className="font-heading mt-4 text-5xl tracking-[0.08em] text-white md:text-7xl">
          Lost In Monitor World
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          That page isn’t on the set list. Head back to the main stage.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/" className={cn(buttonVariants())}>
            Go Home
          </Link>
          <Link to="/portfolio" className={cn(buttonVariants({ variant: 'outline' }))}>
            View Portfolio
          </Link>
        </div>
      </Container>
    </section>
  )
}
