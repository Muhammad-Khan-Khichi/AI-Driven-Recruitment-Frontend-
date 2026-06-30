import { useState } from 'react';
import { FaBars, FaBell, FaSearch, FaCircle } from 'react-icons/fa';

const Header = ({ onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);

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
          <button className="w-10 h-10 rounded-lg bg-[#0f1414] border border-[#1f2937] flex items-center justify-center text-white relative">
            <FaBell />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#10d9a0] rounded-full"></span>
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10d9a0] to-[#22d3ee] flex items-center justify-center text-black font-bold text-sm">
            AC
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;