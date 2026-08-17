import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { LoadingLine, LoadingMeter } from '@/components/ui/LoadingMeter'

const HomePage = lazy(() => import('@/pages/HomePage'))
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage'))
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'))
const ExperiencePage = lazy(() => import('@/pages/ExperiencePage'))
const MediaPage = lazy(() => import('@/pages/MediaPage'))
const DownloadsPage = lazy(() => import('@/pages/DownloadsPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="downloads" element={<DownloadsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
