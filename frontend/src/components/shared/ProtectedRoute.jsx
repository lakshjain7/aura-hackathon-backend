import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children, role = 'citizen' }) {
  const location = useLocation()
  const token = localStorage.getItem('aura_token')
  const user = JSON.parse(localStorage.getItem('aura_user') || '{}')

  if (!token) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && user.role !== role) {
    // If user has wrong role (e.g. citizen trying to access officer pages)
    return <Navigate to="/" replace />
  }

  return children
}
