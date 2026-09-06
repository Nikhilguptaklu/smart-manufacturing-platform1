import { useEffect, useState } from 'react';
import { Search, UserCog, Shield, Mail, Building } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import PageHeader from '@/components/ui/PageHeader';
import KPICard from '@/components/ui/KPICard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import { usersApi } from '@/services/api';

export default function UsersPage() {
    const { profile: currentUser, session } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [editTarget, setEditTarget] = useState(null);
    const [editForm, setEditForm] = useState({ role: 'employee', department: '', full_name: '' });

    const fetchUsers = async () => {
        setLoading(true);
        setError('');

        try {
            const accessToken = session?.access_token;

            if (!accessToken) {
                setUsers([]);
                setError('Authentication required. Please sign in again.');
                setLoading(false);
                return;
            }

            const response = await usersApi.getUsers(accessToken);
            const userList = Array.isArray(response?.data) ? response.data : [];
            setUsers(userList);
        } catch (err) {
            setUsers([]);

            let message = 'Failed to load users.';

            if (err?.status === 401) {
                message = 'Authentication failed. Please sign in again.';
            } else if (err?.status === 403) {
                message = 'Access denied. Admin access required.';
            } else if (err?.status === 404) {
                message = 'Users API route is missing.';
            } else if (err?.status === 500) {
                message = 'Server error while loading users.';
            } else if (err?.message) {
                message = err.message;
            }

            setError(message);
            toast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [session?.access_token]);

    const saveEdit = async () => {
        if (!editTarget)
            return;
        const { error } = await supabase.from('profiles').update({
            role: editForm.role,
            department: editForm.department,
            full_name: editForm.full_name,
        }).eq('id', editTarget.id);
        if (error)
            toast(error.message, 'error');
        else {
            toast('User updated', 'success');
            setEditTarget(null);
            fetchUsers();
        }
    };

    const roleCounts = { admin: 0, manager: 0, engineer: 0, employee: 0 };
    users.forEach((u) => {
        const normalizedRole = u.role || 'employee';
        if (Object.prototype.hasOwnProperty.call(roleCounts, normalizedRole)) {
            roleCounts[normalizedRole] += 1;
        }
    });

    const filteredUsers = users.filter((u) => {
        const fullName = (u.full_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const term = search.toLowerCase();
        return !term || fullName.includes(term) || email.includes(term);
    });

    return (<div className="space-y-6">
      <PageHeader title="Users & Roles" description="Manage user accounts and role-based access control"/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.keys(ROLE_LABELS).map((role) => (<KPICard key={role} label={ROLE_LABELS[role]} value={roleCounts[role]} icon={role === 'admin' ? Shield : UserCog} color={role === 'admin' ? 'red' : role === 'manager' ? 'blue' : role === 'engineer' ? 'teal' : 'indigo'}/>))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
        </div>
      </div>

      <DataTable loading={loading} data={filteredUsers} emptyTitle="No users found" columns={[
            { key: 'full_name', header: 'Name', render: (u) => (<div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                {(u.full_name || 'U').charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{u.full_name || 'Unnamed User'}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
            </div>) },
            { key: 'role', header: 'Role', render: (u) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[u.role] || ROLE_COLORS.employee}`}>{ROLE_LABELS[u.role] || 'Employee'}</span> },
            { key: 'department', header: 'Department', render: (u) => (<span className="flex items-center gap-1.5 text-gray-600">
              <Building className="w-3.5 h-3.5 text-gray-400"/>
              {u.department ?? '—'}
            </span>) },
            { key: 'email', header: 'Email', render: (u) => <span className="flex items-center gap-1.5 text-blue-600"><Mail className="w-3.5 h-3.5"/>{u.email}</span> },
            { key: 'created_at', header: 'Joined', render: (u) => u.created_at ? new Date(u.created_at).toLocaleDateString() : '—' },
            {
                key: 'actions', header: 'Actions', render: (u) => (<button onClick={() => { setEditTarget(u); setEditForm({ role: u.role, department: u.department ?? '', full_name: u.full_name ?? '' }); }} disabled={u.id === currentUser?.id} className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed">
                Edit Role
              </button>),
            },
        ]}/>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit User Role" size="md">
        {editTarget && (<div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{editTarget.full_name || 'Unnamed User'}</p>
              <p className="text-xs text-gray-500">{editTarget.email}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
              <input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                {Object.keys(ROLE_LABELS).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
          </div>)}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={saveEdit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Changes</button>
        </div>
      </Modal>
    </div>);
}
