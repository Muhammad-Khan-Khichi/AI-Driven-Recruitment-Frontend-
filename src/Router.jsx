import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/auth/AuthPage'
import Dashboard from './pages/Dashboard'
import Resume from './pages/Resume'
import JobSearch from './pages/JobSearch'
import Applications from './pages/Applications'
import History from './pages/History'
import Semantic from './pages/Semantic'
import Optimizer from './pages/Optimizer'
import Layout from './components/layout/Layout'
import { ProtectedRoute, AdminRoute } from './components/layout/ProtectedRoute'
import Placeholder from './components/ui/Placeholder'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Authenticated shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index               element={<Dashboard />} />
        <Route path="resume"       element={<Resume />} />
        <Route path="job-search"   element={<JobSearch />} />
        <Route path="semantic"     element={<Semantic />} />
        <Route path="optimizer"    element={<Optimizer />} />
        <Route path="linkedin"     element={<Placeholder title="LinkedIn Optimizer" icon="💼" />} />
        <Route path="interview"    element={<Placeholder title="Interview Prep" icon="🎤" />} />
        <Route path="applications" element={<Applications />} />
        <Route path="history"      element={<History />} />

        {/* Admin only */}
        <Route
          path="admin"
          element={<AdminRoute><Placeholder title="Admin Panel"  icon="👑" /></AdminRoute>}
        />
        <Route
          path="admin/stats"
          element={<AdminRoute><Placeholder title="System Stats" icon="📈" /></AdminRoute>}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Placeholder title="Page not found" icon="❓" />} />
    </Routes>
  )
}
