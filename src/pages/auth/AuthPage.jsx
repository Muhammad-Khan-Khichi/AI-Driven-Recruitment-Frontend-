import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  RiMailLine, RiLockLine, RiArrowRightLine,
  RiGoogleLine, RiLinkedinLine, RiEyeLine, RiEyeOffLine,
  RiUserLine, RiMapPinLine, RiLoader4Line,
  RiArrowLeftLine, RiCheckboxCircleLine,
} from 'react-icons/ri'
import { useAuth } from '../../pages/context/AuthContext'
import { errMessage } from '../utils/errors'
import ThemeToggle from '../../components/ui/ThemeToggle'

const API_BASE = 'http://localhost:8000/api'

// ── OAuth callback handler ─────────────────────────────────────────────
function useOAuthCallback() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { refreshProfile } = useAuth()
  const [oauthError, setOauthError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token  = params.get('token') || params.get('access_token')
    const error  = params.get('error')

    if (error) {
      const messages = {
        google_failed:   'Google sign-in failed. Check that Google OAuth credentials are configured on the server.',
        linkedin_failed: 'LinkedIn sign-in failed. Check that LinkedIn OAuth credentials are configured on the server.',
        oauth_failed:    'OAuth sign-in failed. Please try again or use email/password.',
      }
      setOauthError(messages[error] || `Sign-in failed: ${error}`)
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    if (token) {
      localStorage.setItem('hire_ai_token', token)
      refreshProfile()
        .then(() => navigate('/', { replace: true }))
        .catch(() => {
          setOauthError('OAuth succeeded but could not load your profile. Please try again.')
          localStorage.removeItem('hire_ai_token')
          window.history.replaceState({}, '', window.location.pathname)
        })
    }
  }, [location.search])

  return oauthError
}

// ── Field ─────────────────────────────────────────────────────────────
function Field({ label, id, icon: Icon, type = 'text', placeholder, value, onChange, right, error }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType  = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="label-xs">{label}</label>
        {right}
      </div>
      <div className="relative">
        {Icon && (
          <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-t3 pointer-events-none" />
        )}
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={isPassword ? 'current-password' : 'email'}
          className={`
            input-base
            ${Icon ? 'pl-10' : 'pl-4'}
            ${isPassword ? 'pr-10' : 'pr-4'}
            ${error ? 'border-red focus:border-red focus:shadow-none' : ''}
          `}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t3 hover:text-t1 transition-colors">
            {show ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
          </button>
        )}
      </div>
      {error && <p className="text-red text-xs mt-0.5">{error}</p>}
    </div>
  )
}

// ── Divider ────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-border" />
      <span className="label-xs text-t4 tracking-widest">or continue with</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// ── OAuth button ───────────────────────────────────────────────────────
function OAuthBtn({ icon: Icon, label, href }) {
  return (
    <a
      href={href}
      className="
        flex-1 flex items-center justify-center gap-2.5 py-3 px-4
        bg-surface2 border border-border rounded-lg
        text-t1 text-sm font-medium
        hover:border-border2 hover:bg-surface3
        transition-all duration-150 active:scale-[0.98]
        no-underline
      "
    >
      <Icon size={17} />
      {label}
    </a>
  )
}

// ── Sign In form ───────────────────────────────────────────────────────
function SignInForm({ globalError, onForgot }) {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const e = {}
    if (!email)    e.email    = 'Email is required'
    if (!password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setApiError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setApiError(errMessage(err, 'Invalid credentials. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in">
      <Field label="Work Email" id="signin-email" icon={RiMailLine} type="email"
        placeholder="name@company.com" value={email} onChange={setEmail} error={errors.email} />
      <Field label="Password" id="signin-password" icon={RiLockLine} type="password"
        placeholder="••••••••" value={password} onChange={setPassword} error={errors.password}
        right={
          <button type="button" onClick={onForgot}
            className="text-em text-xs font-semibold hover:brightness-110 transition-all">
            Forgot?
          </button>
        }
      />

      {(apiError || globalError) && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-xs rounded-lg px-3 py-2.5">
          {apiError || globalError}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-1">
        {loading
          ? <RiLoader4Line size={16} className="animate-spin" />
          : <>Sign In <RiArrowRightLine size={16} /></>}
      </button>

      <OrDivider />

      <div className="flex gap-3">
        <OAuthBtn icon={RiGoogleLine}   label="Google"   href={`${API_BASE}/auth/google/login`} />
        <OAuthBtn icon={RiLinkedinLine} label="LinkedIn" href={`${API_BASE}/auth/linkedin/login`} />
      </div>
    </form>
  )
}

// ── Sign Up form ───────────────────────────────────────────────────────
function SignUpForm({ globalError }) {
  const { signup } = useAuth()
  const navigate   = useNavigate()

  const [form, setForm] = useState({
    email: '', username: '', full_name: '', password: '', location: 'Pakistan',
  })
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  const set = field => val => setForm(f => ({ ...f, [field]: val }))

  const validate = () => {
    const e = {}
    if (!form.email)              e.email    = 'Email is required'
    if (!form.username)           e.username = 'Username is required'
    if (form.password.length < 8) e.password = 'At least 8 characters'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setApiError('')
    setLoading(true)
    try {
      await signup(form)
      navigate('/')
    } catch (err) {
      setApiError(errMessage(err, 'Could not create account. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in">
      <Field label="Work Email"  id="su-email"    icon={RiMailLine}   type="email"    placeholder="name@company.com" value={form.email}     onChange={set('email')}     error={errors.email} />
      <Field label="Username"    id="su-username" icon={RiUserLine}   type="text"     placeholder="johndoe"          value={form.username}  onChange={set('username')}  error={errors.username} />
      <Field label="Full Name"   id="su-name"     icon={RiUserLine}   type="text"     placeholder="John Doe"         value={form.full_name} onChange={set('full_name')} />
      <Field label="Password"    id="su-password" icon={RiLockLine}   type="password" placeholder="Min 8 characters" value={form.password}  onChange={set('password')}  error={errors.password} />
      <Field label="Location"    id="su-location" icon={RiMapPinLine} type="text"     placeholder="City, Country"    value={form.location}  onChange={set('location')} />

      {(apiError || globalError) && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-xs rounded-lg px-3 py-2.5">
          {apiError || globalError}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-1">
        {loading
          ? <RiLoader4Line size={16} className="animate-spin" />
          : <>Create Account <RiArrowRightLine size={16} /></>}
      </button>

      <OrDivider />

      <div className="flex gap-3">
        <OAuthBtn icon={RiGoogleLine}   label="Google"   href={`${API_BASE}/auth/google/login`} />
        <OAuthBtn icon={RiLinkedinLine} label="LinkedIn" href={`${API_BASE}/auth/linkedin/login`} />
      </div>
    </form>
  )
}

// ── Forgot Password form ───────────────────────────────────────────────
function ForgotPasswordForm({ onBack, onSent }) {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || data.message || 'Failed to send reset email')
      }

      const data = await res.json()
      console.log('✅ Reset email response:', data)
      onSent(email)
    } catch (err) {
      setError(errMessage(err, 'Failed to send reset email. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold text-t1 mb-1">Reset your password</h2>
        <p className="text-t3 text-sm">
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </p>
      </div>

      <Field
        label="Work Email"
        id="forgot-email"
        icon={RiMailLine}
        type="email"
        placeholder="name@company.com"
        value={email}
        onChange={setEmail}
        error={error}
      />

      <button type="submit" disabled={loading} className="btn-primary mt-1">
        {loading
          ? <RiLoader4Line size={16} className="animate-spin" />
          : <>Send Reset Link <RiArrowRightLine size={16} /></>}
      </button>

      <button type="button" onClick={onBack}
        className="flex items-center justify-center gap-2 text-t3 hover:text-t1 text-sm font-medium transition-colors py-2">
        <RiArrowLeftLine size={15} />
        Back to Sign In
      </button>
    </form>
  )
}

// ── Email Sent confirmation ────────────────────────────────────────────
function EmailSentMessage({ email, onBack }) {
  return (
    <div className="flex flex-col gap-4 animate-in text-center">
      <div className="flex justify-center mb-2">
        <div className="w-14 h-14 rounded-full bg-em/10 flex items-center justify-center">
          <RiMailLine size={28} className="text-em" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-t1 mb-1">Check your email</h2>
        <p className="text-t3 text-sm leading-relaxed">
          If an account exists for <strong className="text-t2">{email}</strong>, we've sent a password reset link.
          Please check your inbox and follow the instructions.
        </p>
      </div>

      <div className="bg-surface2 border border-border rounded-lg p-3 text-xs text-t3 text-left">
        <p className="font-medium text-t2 mb-1">Didn't get the email?</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Check your spam/junk folder</li>
          <li>Make sure you entered the correct email</li>
          <li>Wait a minute — delivery can take up to 60 seconds</li>
        </ul>
      </div>

      <button type="button" onClick={onBack}
        className="flex items-center justify-center gap-2 text-em hover:brightness-110 text-sm font-semibold transition-all py-2">
        <RiArrowLeftLine size={15} />
        Back to Sign In
      </button>
    </div>
  )
}

// ── Reset Password form (used when user clicks email link) ─────────────
function ResetPasswordForm({ token, onBack, onSuccess }) {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const e = {}
    if (password.length < 8) e.password = 'At least 8 characters'
    if (password !== confirm) e.confirm = "Passwords don't match"
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setApiError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, new_password: password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || data.message || 'Failed to reset password')
      }

      onSuccess()
    } catch (err) {
      setApiError(errMessage(err, 'Failed to reset password. The link may have expired.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold text-t1 mb-1">Set a new password</h2>
        <p className="text-t3 text-sm">
          Your new password must be at least 8 characters long.
        </p>
      </div>

      <Field label="New Password" id="reset-password" icon={RiLockLine} type="password"
        placeholder="Min 8 characters" value={password} onChange={setPassword} error={errors.password} />
      <Field label="Confirm Password" id="reset-confirm" icon={RiLockLine} type="password"
        placeholder="Re-enter password" value={confirm} onChange={setConfirm} error={errors.confirm} />

      {apiError && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-xs rounded-lg px-3 py-2.5">
          {apiError}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-1">
        {loading
          ? <RiLoader4Line size={16} className="animate-spin" />
          : <>Reset Password <RiArrowRightLine size={16} /></>}
      </button>

      <button type="button" onClick={onBack}
        className="flex items-center justify-center gap-2 text-t3 hover:text-t1 text-sm font-medium transition-colors py-2">
        <RiArrowLeftLine size={15} />
        Back to Sign In
      </button>
    </form>
  )
}

// ── Password Reset Success ─────────────────────────────────────────────
function PasswordResetSuccess({ onDone }) {
  return (
    <div className="flex flex-col gap-4 animate-in text-center">
      <div className="flex justify-center mb-2">
        <div className="w-14 h-14 rounded-full bg-em/10 flex items-center justify-center">
          <RiCheckboxCircleLine size={28} className="text-em" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-t1 mb-1">Password reset!</h2>
        <p className="text-t3 text-sm leading-relaxed">
          Your password has been successfully updated. You can now sign in with your new password.
        </p>
      </div>

      <button type="button" onClick={onDone} className="btn-primary mt-1">
        <RiArrowRightLine size={16} className="inline mr-1" />
        Continue to Sign In
      </button>
    </div>
  )
}

// ── Main AuthPage ──────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState('signin')  // signin | signup | forgot | sent | reset | success
  const [sentEmail, setSentEmail] = useState('')
  const [resetToken, setResetToken] = useState('')

  const location = useLocation()
  const oauthError = useOAuthCallback()

  // Detect ?token=xxx in URL → enter reset mode automatically
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get('token') || params.get('reset_token')
    if (t && !location.pathname.includes('/auth/callback')) {
      setResetToken(t)
      setMode('reset')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [location.search])

  return (
    <div className="min-h-screen w-full bg-bg flex flex-col items-center justify-center px-4 py-10 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-lg px-7 py-8 animate-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-3xl leading-none"></span>
            <span className="text-[1.65rem] font-extrabold tracking-tight text-t1">HireAI</span>
          </div>
          <p className="text-t3 text-sm">AI-Driven Recruitment Pipeline</p>
        </div>

        {/* Conditional content based on mode */}
        {mode === 'signin' && (
          <>
            <div className="flex border-b border-border mb-6 relative">
              {[{ key: 'signin', label: 'Sign In' }, { key: 'signup', label: 'Create Account' }].map(t => (
                <button key={t.key} onClick={() => setMode(t.key)}
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors duration-150 relative ${mode === t.key ? 'text-em' : 'text-t3 hover:text-t2'}`}>
                  {t.label}
                  {mode === t.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-em rounded-full" />}
                </button>
              ))}
            </div>
            <SignInForm globalError={oauthError} onForgot={() => setMode('forgot')} />
          </>
        )}

        {mode === 'signup' && (
          <>
            <div className="flex border-b border-border mb-6 relative">
              {[{ key: 'signin', label: 'Sign In' }, { key: 'signup', label: 'Create Account' }].map(t => (
                <button key={t.key} onClick={() => setMode(t.key)}
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors duration-150 relative ${mode === t.key ? 'text-em' : 'text-t3 hover:text-t2'}`}>
                  {t.label}
                  {mode === t.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-em rounded-full" />}
                </button>
              ))}
            </div>
            <SignUpForm globalError={oauthError} />
          </>
        )}

        {mode === 'forgot' && (
          <ForgotPasswordForm
            onBack={() => setMode('signin')}
            onSent={(email) => {
              setSentEmail(email)
              setMode('sent')
            }}
          />
        )}

        {mode === 'sent' && (
          <EmailSentMessage email={sentEmail} onBack={() => setMode('signin')} />
        )}

        {mode === 'reset' && (
          <ResetPasswordForm
            token={resetToken}
            onBack={() => setMode('signin')}
            onSuccess={() => setMode('success')}
          />
        )}

        {mode === 'success' && (
          <PasswordResetSuccess onDone={() => setMode('signin')} />
        )}

        {(mode === 'signin' || mode === 'signup') && (
          <p className="text-center text-t4 text-xs mt-6 leading-relaxed">
            By continuing, you agree to HireAI's{' '}
            <button className="text-t2 hover:text-em transition-colors font-medium">Terms of Service</button>
            {' & '}
            <button className="text-t2 hover:text-em transition-colors font-medium">Privacy Policy</button>
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 mt-8">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-em animate-pulse-slow" />
          <span className="label-xs text-t4">Network Secure</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-em animate-pulse-slow" />
          <span className="label-xs text-t4">AI Engine Active</span>
        </div>
      </div>
    </div>
  )
}