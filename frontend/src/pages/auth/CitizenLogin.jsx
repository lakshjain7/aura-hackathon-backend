import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, ArrowRight, ShieldCheck, Lock, AlertCircle } from 'lucide-react'
import { login } from '../../utils/api'

export default function CitizenLogin() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1) // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (phone.length < 10) return setError('Please enter a valid phone number')
    setLoading(true)
    setError('')
    try {
      // Mock OTP request for demo
      setTimeout(() => {
        setStep(2)
        setLoading(false)
      }, 1000)
    } catch (err) {
      setError('Failed to send OTP. Try again.')
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login({ phone, otp })
      if (res.data.status === 'success') {
        localStorage.setItem('aura_token', res.data.token)
        localStorage.setItem('aura_user', JSON.stringify(res.data.user))
        navigate('/citizen')
      }
    } catch (err) {
      setError('Invalid OTP. Use 123456 for demo.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#FAFAF8', position: 'relative', overflow: 'hidden', padding: 20
    }}>
      {/* Background Orbs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,76,245,0.05) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.05) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 420, background: 'white', borderRadius: 32,
          padding: '48px 40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
          border: '1px solid #E5E7EB', position: 'relative', zIndex: 1
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#5B4CF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>A</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>AURA</span>
          </Link>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            {step === 1 ? 'Welcome Back' : 'Verify Identity'}
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
            {step === 1 ? 'Enter your WhatsApp number to continue' : `Enter the 6-digit code sent to +91 ${phone}`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleRequestOtp}
            >
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%', padding: '16px 16px 16px 48px', borderRadius: 16,
                      border: '1px solid #E5E7EB', fontSize: 16, outline: 'none',
                      transition: 'border-color 0.2s', background: '#F9FAFB'
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#DC2626', fontSize: 13, marginBottom: 20 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16, background: '#111827',
                  color: 'white', border: 'none', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {loading ? 'Sending...' : 'Request OTP'}
                <ArrowRight size={18} />
              </motion.button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerify}
            >
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>OTP Code</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
                    <Lock size={18} />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{
                      width: '100%', padding: '16px 16px 16px 48px', borderRadius: 16,
                      border: '1px solid #E5E7EB', fontSize: 18, fontWeight: 700,
                      letterSpacing: '0.5em', outline: 'none', background: '#F9FAFB'
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#DC2626', fontSize: 13, marginBottom: 20 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16, background: '#5B4CF5',
                  color: 'white', border: 'none', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 10px 20px rgba(91,76,245,0.2)'
                }}
              >
                {loading ? 'Verifying...' : 'Complete Sign In'}
                <ShieldCheck size={18} />
              </motion.button>

              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  width: '100%', marginTop: 20, background: 'none', border: 'none',
                  color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Change Phone Number
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>Don't have an account? </span>
          <Link to="/register" style={{ fontSize: 13, color: '#5B4CF5', fontWeight: 700, textDecoration: 'none' }}>Register Free</Link>
        </div>
      </motion.div>
    </div>
  )
}
