import { Suspense } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { PageTransition } from './PageTransition'
import { ScrollToTop } from './ScrollToTop'
import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { LoadingLine, LoadingMeter } from '@/components/ui/LoadingMeter'
import { useLenis } from '@/hooks/useLenis'

function PageFallback() {
  return (
    <>
      <LoadingLine decorative />
      <div className="flex min-h-[50vh] items-center justify-center px-5">
        <LoadingMeter />
      </div>
    </>
  )
}

export function RootLayout() {
  useLenis()

  return (
    <div className="relative flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background text-foreground">
      <NoiseOverlay fixed opacity={0.035} className="z-[45]" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="main" className="relative z-0 min-w-0 flex-1 pt-20 md:pt-24">
        <Suspense fallback={<PageFallback />}>
          <PageTransition />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
