import { Hero } from '@/components/sections/Hero'
import { StatsBar } from '@/components/sections/StatsBar'
import { FeaturedProjects } from '@/components/sections/FeaturedProjects'
import { Services } from '@/components/sections/Services'
import { Testimonials } from '@/components/sections/Testimonials'
import { PressPreview } from '@/components/sections/PressPreview'
import { CTABanner } from '@/components/sections/CTABanner'
import { useSeo } from '@/hooks/useSeo'
import { useLanguage } from '@/i18n/LanguageProvider'

export default function HomePage() {
  const { t } = useLanguage()
  useSeo({
    title: t.home.seoTitle,
    description: t.home.seoDescription,
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
