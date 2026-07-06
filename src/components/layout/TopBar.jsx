import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaCog, FaSearch, FaCircle } from 'react-icons/fa';
import { useAuth } from '../../pages/context/AuthContext';

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
  };

  const handleProfileSettings = () => {
    setShowProfileMenu(false);
    navigate('/profile');
  };

  return (
    <header className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#1f2937] lg:hidden">
      <div className="flex items-center justify-between p-4">
        {/* Menu button */}
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-lg bg-[#0f1414] border border-[#1f2937] flex items-center justify-center text-white"
        >
          <FaBars />
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-lg bg-[#0f1414] border border-[#1f2937] flex items-center justify-center text-white relative"
            >
              <FaBell />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#10d9a0] rounded-full"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0f1414] border border-[#1f2937] rounded-lg shadow-xl overflow-hidden">
                <div className="p-4 border-b border-[#1f2937]">
                  <h3 className="text-white font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 hover:bg-[#1f2937]/30 transition cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#10d9a0]/20 flex items-center justify-center flex-shrink-0">
                        <FaCircle className="text-[#10d9a0]" size={8} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Welcome to HireAI!</p>
                        <p className="text-gray-400 text-xs mt-1">Get started by exploring the dashboard.</p>
                        <p className="text-gray-500 text-xs mt-1">Just now</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-[#1f2937]/30 transition cursor-pointer border-t border-[#1f2937]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <FaCircle className="text-blue-400" size={8} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Profile Settings Available</p>
                        <p className="text-gray-400 text-xs mt-1">Update your info from the profile menu.</p>
                        <p className="text-gray-500 text-xs mt-1">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-[#1f2937] text-center">
                  <button className="text-[#10d9a0] text-xs font-semibold hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10d9a0] to-[#22d3ee] flex items-center justify-center text-black font-bold text-sm overflow-hidden hover:scale-105 transition"
            >
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials()
              )}
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0f1414] border border-[#1f2937] rounded-lg shadow-xl overflow-hidden">
                {/* User Info */}
                <div className="p-4 border-b border-[#1f2937]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10d9a0] to-[#22d3ee] flex items-center justify-center text-black font-bold overflow-hidden">
                      {user?.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">
                        {user?.full_name || user?.username || 'User'}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleProfileSettings}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-white hover:bg-[#1f2937]/50 transition text-left"
                  >
                    <FaCog className="text-gray-400" />
                    <span>Profile Settings</span>
                  </button>

                  <button
                    onClick={handleProfileSettings}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-white hover:bg-[#1f2937]/50 transition text-left"
                  >
                    <FaUser className="text-gray-400" />
                    <span>My Account</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-[#1f2937] py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition text-left"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;