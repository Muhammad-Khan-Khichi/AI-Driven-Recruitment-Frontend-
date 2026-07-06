import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../pages/context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────────────────
// Modular Icons & Toasts
// ─────────────────────────────────────────────────────────
const Icon = ({ name, size = 24, fill = false, className = '' }) => (
  <span
    className={`material-symbols-outlined select-none inline-block align-middle ${className}`}
    style={{
      fontSize: `${size}px`,
      fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {name}
  </span>
);

const Toast = ({ type, text, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [text, onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-5 max-w-md ${
        isSuccess
          ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400'
          : 'bg-rose-950/90 border-rose-500/30 text-rose-400'
      }`}
    >
      <Icon name={isSuccess ? 'check_circle' : 'error'} size={20} />
      <span className="text-sm font-medium leading-5">{text}</span>
      <button 
        onClick={onClose}
        className="ml-2 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const { updateUser, logout } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    profile_picture: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    setAvatarError(false);
  }, [formData.profile_picture]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchProfile = async (signal) => {
    try {
      const token = localStorage.getItem('hire_ai_token');
      const res = await fetch(`${API}/api/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal,
      });

      if (!res.ok) {
        if (res.status === 401) {
          showMessage('error', 'Session expired. Please log in again.');
          setTimeout(() => navigate('/auth'), 1500);
          return;
        }
        throw new Error('Failed to load profile details.');
      }

      const data = await res.json();
      setUser(data);
      setFormData({
        full_name: data.full_name || '',
        username: data.username || '',
        profile_picture: data.profile_picture || '',
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        showMessage('error', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.username) return user.username.slice(0, 2).toUpperCase();
    return 'U';
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(formData.username.trim())) {
      showMessage('error', 'Username must be 3-30 characters using only letters, numbers, hyphens or underscores.');
      return;
    }

    setSavingProfile(true);
    try {
      const token = localStorage.getItem('hire_ai_token');
      const res = await fetch(`${API}/api/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          username: formData.username.trim(),
          profile_picture: formData.profile_picture.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update profile');
      }

      const updated = await res.json();
      setUser(updated);
      updateUser(updated);
      showMessage('success', 'Profile configuration updated successfully.');
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setSavingPassword(true);
    try {
      const token = localStorage.getItem('hire_ai_token');
      const res = await fetch(`${API}/api/profile/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to change password');
      }

      showMessage('success', 'Security password successfully modified.');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();

    if (passwordData.new_password.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      showMessage('error', 'Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const token = localStorage.getItem('hire_ai_token');
      const res = await fetch(
        `${API}/api/profile/set-password?new_password=${encodeURIComponent(passwordData.new_password)}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to set credential password');
      }

      showMessage('success', 'Password created successfully.');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      await fetchProfile();
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showMessage('error', 'Please confirm validation string before deleting account.');
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem('hire_ai_token');
      const res = await fetch(`${API}/api/profile/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Account deletion rejected.');
      }

      logout();
      navigate('/');
    } catch (err) {
      showMessage('error', err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="text-center p-8 max-w-sm border border-zinc-800 bg-zinc-900/50 rounded-2xl">
          <Icon name="error" size={48} className="text-rose-500 mb-4" />
          <p className="text-lg font-semibold">Failed to fetch profile info</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-5 px-5 py-2.5 bg-violet-600 rounded-xl text-white font-medium hover:bg-violet-500 active:scale-[0.98] transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const isOAuthUser = Boolean(user.oauth_provider);
  const hasNoPassword = isOAuthUser && user.hashed_password === 'oauth_user';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-violet-500/30 selection:text-violet-200">
      <style>{`
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {message.text && (
        <Toast 
          type={message.type} 
          text={message.text} 
          onClose={() => setMessage({ type: '', text: '' })} 
        />
      )}

      <main className="min-h-screen p-6 md:p-12 max-w-[1200px] mx-auto space-y-8">
        {/* Header Block */}
        <header className="border-b border-zinc-800 pb-6">
          <h2 className="text-3xl md:text-4xl tracking-tight font-bold text-zinc-50">
            Account Workspace
          </h2>
          <p className="text-sm md:text-base text-zinc-400 mt-1">
            Update personal metadata metrics and active cryptographic settings.
          </p>
        </header>

        {/* User Statistics Banner */}
        <section className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-cyan-500" />
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-xl overflow-hidden border-2 border-zinc-800">
                {user.profile_picture && !avatarError ? (
                  <img
                    src={user.profile_picture}
                    alt="User avatar matrix"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  getInitials()
                )}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h3 className="text-xl md:text-2xl text-zinc-50 font-bold">
                  {user.full_name || user.username}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 text-xs font-mono self-center border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isOAuthUser ? `${user.oauth_provider} integration` : 'Standard Profile Access'}
                </span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                <span className="font-mono text-zinc-500">@{user.username}</span>
                <span className="text-zinc-600">•</span>
                <span>{user.email}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs font-mono text-zinc-500">
                  Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Configuration Split Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form: Profile Edit */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                <Icon name="person_edit" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-50">Identity Profiles</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="full_name" className="text-xs font-medium text-zinc-400">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleProfileInputChange}
                  placeholder="e.g. Alex Morgan"
                  maxLength={100}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 p-3 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none text-sm placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="username" className="text-xs font-medium text-zinc-400">Unique Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 font-mono text-sm">@</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleProfileInputChange}
                    placeholder="username"
                    maxLength={30}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 p-3 pl-8 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none text-sm placeholder:text-zinc-600"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">Alphanumeric, hyphens, or underscores (min 3 characters).</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile_picture" className="text-xs font-medium text-zinc-400">Avatar Resource URL</label>
                <input
                  id="profile_picture"
                  name="profile_picture"
                  type="url"
                  value={formData.profile_picture}
                  onChange={handleProfileInputChange}
                  placeholder="https://example.com/image.png"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 p-3 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none text-sm placeholder:text-zinc-600"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all active:scale-[0.99] text-sm shadow-lg shadow-violet-950/20"
              >
                {savingProfile ? 'Committing Changes...' : 'Save Configuration'}
              </button>
            </form>
          </section>

          {/* Form: Password Security */}
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Icon name="lock_reset" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-50">
                {hasNoPassword ? 'Initialize Keyphrase' : 'Update Authentication Key'}
              </h3>
            </div>

            {hasNoPassword ? (
              <>
                <div className="bg-cyan-950/40 border border-cyan-500/20 rounded-xl p-4 text-cyan-400 text-xs leading-relaxed">
                  Authentication verified via <strong>{user.oauth_provider}</strong>. Setup an independent password string to activate manual input login methods.
                </div>

                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="new_password_set" className="text-xs font-medium text-zinc-400">New Password</label>
                    <div className="relative">
                      <input
                        id="new_password_set"
                        name="new_password"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={handlePasswordInputChange}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 p-3 pr-10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <Icon name={showPasswords.new ? 'visibility_off' : 'visibility'} size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirm_password_set" className="text-xs font-medium text-zinc-400">Confirm Password String</label>
                    <div className="relative">
                      <input
                        id="confirm_password_set"
                        name="confirm_password"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={handlePasswordInputChange}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 p-3 pr-10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <Icon name={showPasswords.confirm ? 'visibility_off' : 'visibility'} size={18} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword || !passwordData.new_password || !passwordData.confirm_password}
                    className="w-full mt-2 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 disabled:cursor-not-allowed font-medium py-3 rounded-xl transition-all active:scale-[0.99] text-sm"
                  >
                    {savingPassword ? 'Processing...' : 'Establish Keyphrase'}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="current_password" className="text-xs font-medium text-zinc-400">Current Keyphrase</label>
                  <div className="relative">
                    <input
                      id="current_password"
                      name="current_password"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={handlePasswordInputChange}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 p-3 pr-10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Icon name={showPasswords.current ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new_password_change" className="text-xs font-medium text-zinc-400">New Keyphrase</label>
                  <div className="relative">
                    <input
                      id="new_password_change"
                      name="new_password"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={handlePasswordInputChange}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 p-3 pr-10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Icon name={showPasswords.new ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm_password_change" className="text-xs font-medium text-zinc-400">Confirm New Keyphrase</label>
                  <div className="relative">
                    <input
                      id="confirm_password_change"
                      name="confirm_password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={handlePasswordInputChange}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 p-3 pr-10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Icon name={showPasswords.confirm ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    savingPassword ||
                    !passwordData.current_password ||
                    !passwordData.new_password ||
                    !passwordData.confirm_password
                  }
                  className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-200 font-medium py-3 rounded-xl transition-all active:scale-[0.99] text-sm border border-zinc-700/60"
                >
                  {savingPassword ? 'Syncing Keyphrase...' : 'Modify Keyphrase'}
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Section: Danger Zone Gate */}
        <section className="bg-zinc-950 border border-rose-900/40 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-rose-600" />
          <div className="absolute -top-6 -right-6 opacity-5 pointer-events-none text-rose-500">
            <Icon name="report_problem" size={140} />
          </div>

          <div className="relative z-10 space-y-6">
            {!showDeleteConfirm ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm uppercase tracking-wider">
                    <Icon name="delete_forever" size={18} />
                    <span>Irreversible Destructive Boundary</span>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Account eradication cleanses absolute profile records, parsed configurations, and historic cache vectors. Data state retrieval loops cannot be initialized after authorization token purge.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full md:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-500 font-medium text-white text-sm rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-rose-950/20 whitespace-nowrap"
                >
                  Decommission Profile
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                    <Icon name="warning" size={20} />
                    Verify System Purge Request
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Input confirmation token <span className="font-mono bg-zinc-900 px-2 py-0.5 rounded text-rose-400 border border-zinc-800 font-bold">DELETE</span> below to execute account state destruction.
                  </p>
                </div>

                <div className="max-w-md space-y-3">
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm execution"
                    className="w-full bg-zinc-900 border border-rose-900/40 rounded-xl text-zinc-100 p-3 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all outline-none text-sm font-mono tracking-wide placeholder:text-zinc-600"
                  />

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirmText !== 'DELETE'}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-rose-950/20 flex-1 sm:flex-none"
                    >
                      {deleting ? 'Purging Core...' : 'Confirm Purge'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:text-zinc-200 font-medium text-sm rounded-xl transition-all flex-1 sm:flex-none"
                    >
                      Abort Action
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}