import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
export default function Header({ onMenuClick }) {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
        function handleClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);
    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };
    return (<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-600 hover:text-gray-900">
          <Menu className="w-6 h-6"/>
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5"/>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"/>
        </button>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
              {profile?.full_name?.charAt(0) ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
              <p className="text-xs text-gray-500">{profile?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400"/>
          </button>

          {menuOpen && (<div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
                <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium border ${profile ? ROLE_COLORS[profile.role] : ''}`}>
                  {profile ? ROLE_LABELS[profile.role] : ''}
                </span>
                {profile?.department && (<p className="text-xs text-gray-400 mt-1.5">{profile.department} Department</p>)}
              </div>
              <button onClick={() => { setMenuOpen(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <User className="w-4 h-4"/>
                Profile & Settings
              </button>
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4"/>
                Sign Out
              </button>
            </div>)}
        </div>
      </div>
    </header>);
}
