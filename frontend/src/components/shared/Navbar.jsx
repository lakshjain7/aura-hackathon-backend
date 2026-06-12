import { motion } from 'framer-motion'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, User, Bell, LogOut } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  
  // Check if user is logged in
  const token = localStorage.getItem('aura_token')
  const user = JSON.parse(localStorage.getItem('aura_user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('aura_token')
    localStorage.removeItem('aura_user')
    navigate('/login')
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #E5E7EB',
      height: 72, display: 'flex', alignItems: 'center',
      padding: '0 32px', justifyContent: 'space-between'
    }}>
      {/* Left Side: Back + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {!isHome && (
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            style={{
              background: '#F3F4F6', border: 'none',
              borderRadius: '50%', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#374151'
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>
        )}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#5B4CF5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(91,76,245,0.2)' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>A</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>AURA</span>
        </Link>
      </div>

      {/* Center: Navigation Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <Link to="/citizen" style={{ fontSize: 14, fontWeight: 600, color: '#4B5563', textDecoration: 'none' }}>My Dashboard</Link>
        <Link to="/submit" style={{ fontSize: 14, fontWeight: 600, color: '#4B5563', textDecoration: 'none' }}>File Complaint</Link>
      </div>

      {/* Right Side: Simple Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer' }}
        >
          <Bell size={20} />
        </motion.button>

        {token ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#4B5563" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{user.name || 'Citizen'}</span>
            </div>
            <motion.button
              onClick={handleLogout}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 12, border: '1px solid #FEE2E2',
                background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} />
              Sign Out
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 20px', borderRadius: 20, background: '#111827',
              color: 'white', border: 'none', fontSize: 13, fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sign In
          </motion.button>
        )}
      </div>
    </nav>
  )
}
