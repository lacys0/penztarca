// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PageSpinner } from './ui/Spinner'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageSpinner />
  if (!user)   return <Navigate to="/login" replace />
  return children
}
