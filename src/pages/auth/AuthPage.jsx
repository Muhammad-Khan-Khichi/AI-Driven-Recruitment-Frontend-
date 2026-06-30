import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiMailLine, RiLockLine, RiArrowRightLine,
  RiGoogleLine, RiLinkedinLine, RiEyeLine, RiEyeOffLine,
  RiUserLine, RiMapPinLine,
} from 'react-icons/ri'
import { useAuth } from '../../pages/context/AuthContext'
import ThemeToggle from '../../components/ui/ThemeToggle'

// ── Reusable field component ──────────────────────────────────
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
          <Icon
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-t3 pointer-events-none"
          />
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
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t3 hover:text-t1 transition-colors"
          >
            {show ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
          </button>
        )}
      </div>
      {error && <p className="text-red text-xs mt-0.5">{error}</p>}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-border" />
      <span className="label-xs text-t4 tracking-widest">or continue with</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// ── Social button ─────────────────────────────────────────────
function SocialBtn({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex-1 flex items-center justify-center gap-2.5 py-3 px-4
        bg-surface2 border border-border rounded-lg
        text-t1 text-sm font-medium
        hover:border-border2 hover:bg-surface3
        transition-all duration-150 active:scale-[0.98]
      "
    >
      <Icon size={17} />
      {label}
    </button>
  )
}

// ── Sign In form ──────────────────────────────────────────────
function SignInForm() {
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
      setApiError(typeof err === 'string' ? err : 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in">
      <Field
        label="Work Email"
        id="signin-email"
        icon={RiMailLine}
        type="email"
        placeholder="name@company.com"
        value={email}
        onChange={setEmail}
        error={errors.email}
      />
      <Field
        label="Password"
        id="signin-password"
        icon={RiLockLine}
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={setPassword}
        error={errors.password}
        right={
          <button
            type="button"
            className="text-em text-xs font-semibold hover:brightness-110 transition-all"
          >
            Forgot?
          </button>
        }
      />

      {apiError && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-xs rounded-lg px-3 py-2.5">
          {apiError}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-1">
        {loading
          ? <span className="h-4 w-4 rounded-full border-2 border-bg border-t-transparent animate-spin" />
          : <>Sign In <RiArrowRightLine size={16} /></>
        }
      </button>

      <OrDivider />

      <div className="flex gap-3">
        <SocialBtn icon={RiGoogleLine}   label="Google"   onClick={() => {}} />
        <SocialBtn icon={RiLinkedinLine} label="LinkedIn" onClick={() => {}} />
      </div>
    </form>
  )
}

// ── Create Account form ───────────────────────────────────────
function SignUpForm() {
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
    if (!form.email)                e.email    = 'Email is required'
    if (!form.username)             e.username  = 'Username is required'
    if (form.password.length < 8)   e.password  = 'At least 8 characters'
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
      setApiError(typeof err === 'string' ? err : 'Could not create account. Please try again.')
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

      {apiError && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-xs rounded-lg px-3 py-2.5">
          {apiError}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-1">
        {loading
          ? <span className="h-4 w-4 rounded-full border-2 border-bg border-t-transparent animate-spin" />
          : <>Create Account <RiArrowRightLine size={16} /></>
        }
      </button>
    </form>
  )
}

// ── Main AuthPage ─────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState('signin')

  return (
    <div className="
      min-h-screen w-full
      bg-bg
      flex flex-col items-center justify-center
      px-4 py-10
      relative
    ">
      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="
        w-full max-w-sm
        bg-surface
        border border-border
        rounded-2xl shadow-lg
        px-7 py-8
        animate-in
      ">
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="flex items-center gap-2 mb-1.5">
            {/* Target icon */}
            <span className="text-3xl leading-none"></span>
            <span className="text-[1.65rem] font-extrabold tracking-tight text-t1">HireAI</span>
          </div>
          <p className="text-t3 text-sm">AI-Driven Recruitment Pipeline</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6 relative">
          {[
            { key: 'signin',  label: 'Sign In' },
            { key: 'signup',  label: 'Create Account' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`
                flex-1 pb-3 text-sm font-semibold transition-colors duration-150 relative
                ${tab === t.key ? 'text-em' : 'text-t3 hover:text-t2'}
              `}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-em rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Form */}
        {tab === 'signin' ? <SignInForm /> : <SignUpForm />}

        {/* Terms */}
        <p className="text-center text-t4 text-xs mt-6 leading-relaxed">
          By continuing, you agree to HireAI's{' '}
          <button className="text-t2 hover:text-em transition-colors font-medium">Terms of Service</button>
          {' & '}
          <button className="text-t2 hover:text-em transition-colors font-medium">Privacy Policy</button>
        </p>
      </div>

      {/* Bottom status bar */}
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
