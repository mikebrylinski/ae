import { Suspense } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { PageTransition } from './PageTransition'
import { ScrollToTop } from './ScrollToTop'
import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { useLenis } from '@/hooks/useLenis'

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status">
      <span className="font-heading text-xs tracking-[0.2em] text-primary">
        Loading…
      </span>
    </div>
  )
}

export function RootLayout() {
  useLenis()

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <NoiseOverlay fixed opacity={0.035} className="z-[45]" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="main" className="relative z-0 flex-1 pt-20 md:pt-24">
        <Suspense fallback={<PageFallback />}>
          <PageTransition />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
