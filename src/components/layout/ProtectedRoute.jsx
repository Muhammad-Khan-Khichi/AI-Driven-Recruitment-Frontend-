import { Navigate } from 'react-router-dom'
import { useAuth } from '../../pages/context/AuthContext'

export function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return null
  if (!token) return <Navigate to="/auth" replace />
  return children
}

export function AdminRoute({ children }) {
  const { token, loading, isAdmin } = useAuth()
  if (loading) return null
  if (!token) return <Navigate to="/auth" replace />
  if (!isAdmin()) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto mt-20">
        <p className="text-red font-semibold mb-1">🚫 Admin access required</p>
        <p className="text-t3 text-sm">You don't have permission to view this page.</p>
      </div>
    )
  }
  return children
}
