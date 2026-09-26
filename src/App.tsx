import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { RootLayout } from '@/components/layout/RootLayout'
import { LoadingLine, LoadingMeter } from '@/components/ui/LoadingMeter'

const HomePage = lazy(() => import('@/pages/HomePage'))
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage'))
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'))
const ExperiencePage = lazy(() => import('@/pages/ExperiencePage'))
const MediaPage = lazy(() => import('@/pages/MediaPage'))
const GalleryPage = lazy(() => import('@/pages/GalleryPage'))
const GalleryPhotoPage = lazy(() => import('@/pages/GalleryPhotoPage'))
const DownloadsPage = lazy(() => import('@/pages/DownloadsPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const AboutBPage = lazy(() => import('@/pages/AboutBPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function RouteAnalytics() {
  const { pathname } = useLocation()
  return <Analytics route={pathname} path={pathname} />
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteAnalytics />
      <LanguageProvider>
      <Routes>
        <Route
          path="admin"
          element={
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center bg-black px-5">
                  <LoadingLine decorative />
                  <LoadingMeter />
                </div>
              }
            >
              <AdminPage />
            </Suspense>
          }
        />
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="portfolio/:slug" element={<ProjectDetailPage />} />
          <Route path="experience" element={<ExperiencePage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="gallery/:id" element={<GalleryPhotoPage />} />
          <Route path="downloads" element={<DownloadsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="aboutb" element={<AboutBPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </LanguageProvider>
    </BrowserRouter>
  )
}
