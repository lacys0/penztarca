// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }      from './contexts/AuthContext'
import { ThemeProvider }     from './contexts/ThemeContext'
import { ProtectedRoute }    from './components/ProtectedRoute'
import { Layout }            from './components/Layout'

import Login           from './pages/Login'
import Register        from './pages/Register'
import ForgotPassword  from './pages/ForgotPassword'
import ResetPassword   from './pages/ResetPassword'
import Dashboard       from './pages/Dashboard'
import Transactions    from './pages/Transactions'
import Recurring       from './pages/Recurring'
import Categories      from './pages/Categories'
import Settings        from './pages/Settings'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Publikus */}
            <Route path="/login"            element={<Login />} />
            <Route path="/register"         element={<Register />} />
            <Route path="/forgot-password"  element={<ForgotPassword />} />
            <Route path="/reset-password"   element={<ResetPassword />} />

            {/* Védett – közös Layout-on belül */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index            element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="recurring"    element={<Recurring />} />
              <Route path="categories"   element={<Categories />} />
              <Route path="settings"     element={<Settings />} />
            </Route>

            {/* Ismeretlen URL → főoldal */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
