import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Boxes, Factory, ClipboardList, Layers, Users, BarChart3, UserCog, Settings, X, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canAccess } from '@/lib/permissions';
const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
    { to: '/erp', label: 'ERP', icon: ClipboardList, module: 'erp' },
    { to: '/inventory', label: 'Inventory', icon: Boxes, module: 'inventory' },
    { to: '/production', label: 'Production', icon: Factory, module: 'production' },
    { to: '/plm', label: 'PLM / BOM', icon: Layers, module: 'plm' },
    { to: '/crm', label: 'CRM', icon: Users, module: 'crm' },
    { to: '/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
    { to: '/users', label: 'Users & Roles', icon: UserCog, module: 'users' },
    { to: '/settings', label: 'Settings', icon: Settings, module: 'settings' },
    { to: '/customer', label: 'Customer Portal', icon: ShoppingCart, module: 'customer' },
];
const ROLE_BADGE_COLORS = {
    admin: 'bg-red-500',
    manager: 'bg-blue-500',
    engineer: 'bg-teal-500',
    employee: 'bg-slate-500',
    customer: 'bg-amber-500',
};
export default function Sidebar({ open, onClose }) {
    const { profile } = useAuth();
    const role = profile?.role ?? 'employee';
    const visibleItems = NAV_ITEMS.filter((item) => canAccess(role, item.module));
    return (<>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose}/>}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0f172a] text-gray-300 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Factory className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">SmartFactory</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Manufacturing Platform</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map((item) => (<NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-4.5 h-4.5 flex-shrink-0"/>
              {item.label}
            </NavLink>))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50">
            <div className={`w-2 h-2 rounded-full ${ROLE_BADGE_COLORS[role]}`}/>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{profile?.full_name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{role} Role</p>
            </div>
          </div>
        </div>
      </aside>
    </>);
}
