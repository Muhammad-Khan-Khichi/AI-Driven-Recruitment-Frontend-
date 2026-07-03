import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/auth/AuthPage'
import Dashboard from './pages/Dashboard'
import Resume from './pages/Resume'
import JobSearch from './pages/JobSearch'
import Applications from './pages/Applications'
import History from './pages/History'
import Semantic from './pages/Semantic'
import Optimizer from './pages/Optimizer'
import Interview from './pages/Interview'
import LinkedIn from './pages/LinkedIn'
import CoverLetter from './pages/CoverLetter'
import Layout from './components/layout/Layout'
import { ProtectedRoute, AdminRoute } from './components/layout/ProtectedRoute'
import Placeholder from './components/ui/Placeholder'

// ✅ Import your real Admin page
import Admin from './pages/Admin'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Authenticated shell — Layout wraps all child routes via Outlet */}
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
        <Route path="linkedin"     element={<LinkedIn />} />
        <Route path="interview"    element={<Interview />} />
        <Route path="applications" element={<Applications />} />
        <Route path="history"      element={<History />} />
        <Route path="cover-letter" element={<CoverLetter />} />

        {/* ✅ Admin only — points to REAL Admin page, not Placeholder */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Placeholder title="Page not found" icon="❓" />} />
    </Routes>
  )
}