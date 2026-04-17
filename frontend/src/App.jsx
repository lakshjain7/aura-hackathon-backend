import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ToastProvider } from './components/ui/Toast'
import Landing from './pages/Landing'
import CitizenLogin from './pages/auth/CitizenLogin'
import CitizenRegister from './pages/auth/CitizenRegister'
import OfficerLogin from './pages/auth/OfficerLogin'
import SubmitComplaint from './pages/citizen/SubmitComplaint'
import TrackComplaint from './pages/citizen/TrackComplaint'
import CitizenDashboard from './pages/citizen/CitizenDashboard'
import OfficerDashboard from './pages/officer/OfficerDashboard'
import ActiveComplaint from './pages/officer/ActiveComplaint'
import AdminDashboard from './pages/admin/AdminDashboard'
import DemoPanel from './components/shared/DemoPanel'

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('aura_token')
  if (!token) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/officer/login'} replace />
  }
  return children
}

import Navbar from './components/shared/Navbar'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Navbar />
        <AnimatePresence mode="wait">

          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<CitizenLogin />} />
            <Route path="/register" element={<CitizenRegister />} />
            <Route path="/officer/login" element={<OfficerLogin />} />
            <Route path="/admin/login" element={<OfficerLogin />} />
            <Route path="/submit" element={<SubmitComplaint />} />
            <Route path="/track/:id" element={<TrackComplaint />} />
            <Route path="/citizen" element={<CitizenDashboard />} />
            <Route path="/officer" element={
              <ProtectedRoute role="officer"><OfficerDashboard /></ProtectedRoute>
            } />
            <Route path="/officer/active/:complaintId" element={
              <ProtectedRoute role="officer"><ActiveComplaint /></ProtectedRoute>
            } />
            <Route path="/officer/*" element={
              <ProtectedRoute role="officer"><OfficerDashboard /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
        <DemoPanel />
      </ToastProvider>
    </BrowserRouter>
  )
}
