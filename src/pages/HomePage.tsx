import { Hero } from '@/components/sections/Hero'
import { StatsBar } from '@/components/sections/StatsBar'
import { FeaturedProjects } from '@/components/sections/FeaturedProjects'
import { Services } from '@/components/sections/Services'
import { Testimonials } from '@/components/sections/Testimonials'
import { PressPreview } from '@/components/sections/PressPreview'
import { CTABanner } from '@/components/sections/CTABanner'
import { useSeo } from '@/hooks/useSeo'

export default function HomePage() {
  useSeo({
    title: 'Andy Ebert | Monitor Engineer & Live Production',
    description:
      'When artists need to hear perfection. Worldwide touring monitor engineer since 1997 — Alanis Morissette, The Weeknd, Maroon 5, Guns N’ Roses, Mariah Carey, and more.',
  })

  return (
    <>
      <Hero />
      <StatsBar />
      <FeaturedProjects />
      <Services />
      <Testimonials />
      <PressPreview />
      <CTABanner />
    </>
  )
}
