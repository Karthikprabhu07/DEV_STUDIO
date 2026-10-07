import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { EventsProvider } from '@/contexts/EventsContext'
import { DigitalIdProvider } from '@/contexts/DigitalIdContext'
import { CommunityProvider } from '@/contexts/CommunityContext'
import { CertificatesProvider } from '@/contexts/CertificatesContext'
import { GitHubProvider } from '@/contexts/GitHubContext'
import { LeftNavRail } from '@/components/layout/LeftNavRail'
import { CookieConsent } from '@/components/layout/CookieConsent'
import { AuthModal } from '@/components/auth/AuthModal'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Terminal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import { useAuth } from '@/contexts/AuthContext'

// Lazy loaded pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const EventsPage = lazy(() => import('@/pages/EventsPage').then(m => ({ default: m.EventsPage })))
const AttendancePage = lazy(() => import('@/pages/AttendancePage').then(m => ({ default: m.AttendancePage })))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })))
const ChallengesPage = lazy(() => import('@/pages/ChallengesPage').then(m => ({ default: m.ChallengesPage })))
const ResourcesPage = lazy(() => import('@/pages/ResourcesPage').then(m => ({ default: m.ResourcesPage })))
const IdCardPage = lazy(() => import('@/pages/IdCardPage').then(m => ({ default: m.IdCardPage })))
const VerifyPage = lazy(() => import('@/pages/VerifyPage').then(m => ({ default: m.VerifyPage })))
const VerifyCertificatePage = lazy(() => import('@/pages/VerifyCertificatePage').then(m => ({ default: m.VerifyCertificatePage })))
const DirectorConsolePage = lazy(() => import('@/pages/DirectorConsolePage').then(m => ({ default: m.DirectorConsolePage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

const InAppLoader = () => (
  <div className="flex flex-col items-center justify-center py-32 space-y-4">
    <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center animate-pulse">
      <Terminal className="w-6 h-6 text-accent-primary" />
    </div>
    <div className="text-xs font-mono text-text-muted animate-pulse tracking-wider uppercase">Loading Workspace...</div>
  </div>
)

export function AppContent() {
  const { isLoaded } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')

  useEffect(() => {
    const authQuery = searchParams.get('auth')
    if (authQuery === 'signin' || authQuery === 'login') {
      setAuthMode('signin')
      setIsAuthOpen(true)
    } else if (authQuery === 'signup' || authQuery === 'join') {
      setAuthMode('signup')
      setIsAuthOpen(true)
    }
  }, [searchParams])

  const handleCloseAuth = () => {
    setIsAuthOpen(false)
    if (searchParams.has('auth')) {
      searchParams.delete('auth')
      setSearchParams(searchParams, { replace: true })
    }
  }

  if (!isLoaded) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-page text-text-primary font-sans selection:bg-accent-primary/20 selection:text-accent-primary">
      {/* Pinned Left Navigation Rail */}
      <LeftNavRail onOpenAuth={() => setIsAuthOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 md:py-8">
          <Suspense fallback={<InAppLoader />}>
            <Routes>
              <Route path="/" element={<DashboardPage onOpenAuth={() => setIsAuthOpen(true)} />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/id-card" element={<IdCardPage onOpenAuth={() => setIsAuthOpen(true)} />} />
            <Route path="/verify/:token" element={<VerifyPage />} />
            <Route path="/verify-certificate/:token" element={<VerifyCertificatePage />} />
            <Route
              path="/members"
              element={
                <ProtectedRoute allowedRoles={['admin']} requireActive={true} onOpenAuth={() => setIsAuthOpen(true)}>
                  <DirectorConsolePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/director"
              element={
                <ProtectedRoute allowedRoles={['admin']} requireActive={true} onOpenAuth={() => setIsAuthOpen(true)}>
                  <DirectorConsolePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute onOpenAuth={() => setIsAuthOpen(true)}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<NotFoundPage onOpenAuth={() => setIsAuthOpen(true)} />} />
            </Routes>
          </Suspense>
        </main>

        <footer className="border-t border-border-default bg-bg-surface py-6 text-xs text-text-muted mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-bg-surface border border-border-default flex items-center justify-center text-accent-primary">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono font-bold text-text-primary">DEVSTUDIO</span>
              <span className="text-border-default">|</span>
              <span className="text-text-muted">Mangalore Institute of Technology & Engineering</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 font-mono text-[11px] text-text-muted">
              <div className="flex items-center gap-4">
                <Link to="/terms" className="hover:text-accent-teal hover:underline">Terms & Conditions</Link>
                <Link to="/privacy" className="hover:text-accent-teal hover:underline">Privacy Policy</Link>
              </div>
              <span className="hidden sm:inline text-border-default">|</span>
              <span>Human creativity + AI assistance + engineering judgment</span>
              <span className="hidden sm:inline text-border-default">|</span>
              <span className="text-status-success flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
                All Systems Operational
              </span>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={handleCloseAuth} initialMode={authMode} />
      <CookieConsent />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <EventsProvider>
          <CommunityProvider>
            <CertificatesProvider>
              <GitHubProvider>
                <DigitalIdProvider>
                  <AppContent />
                </DigitalIdProvider>
              </GitHubProvider>
            </CertificatesProvider>
          </CommunityProvider>
        </EventsProvider>
      </AuthProvider>
    </Router>
  )
}
