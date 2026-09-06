import { useState } from 'react';
import { User, Bell, Shield, Building, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import PageHeader from '@/components/ui/PageHeader';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
export default function SettingsPage() {
    const { profile, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [tab, setTab] = useState('profile');
    const [form, setForm] = useState({
        full_name: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        department: profile?.department ?? '',
    });
    const saveProfile = async () => {
        const { error } = await supabase.from('profiles').update({
            full_name: form.full_name,
            phone: form.phone,
            department: form.department,
        }).eq('id', profile?.id);
        if (error)
            toast(error.message, 'error');
        else {
            toast('Profile updated', 'success');
            refreshProfile();
        }
    };
    const TABS = [
        { key: 'profile', label: 'Profile', icon: User },
        { key: 'notifications', label: 'Notifications', icon: Bell },
        { key: 'security', label: 'Security', icon: Shield },
        { key: 'company', label: 'Company', icon: Building },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and platform preferences"/>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-1">
          {TABS.map((t) => (<button key={t.key} onClick={() => setTab(t.key)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${tab === t.key ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <t.icon className="w-4 h-4"/> {t.label}
            </button>))}
        </div>

        <div className="lg:col-span-3">
          {tab === 'profile' && (<div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile Information</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                  {profile?.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500">{profile?.email}</p>
                  <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${profile ? ROLE_COLORS[profile.role] : ''}`}>
                    {profile ? ROLE_LABELS[profile.role] : ''}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email (read-only)</label>
                  <input value={profile?.email ?? ''} disabled className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg text-gray-500"/>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={saveProfile} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Save className="w-4 h-4"/> Save Changes
                </button>
              </div>
            </div>)}

          {tab === 'notifications' && (<div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                { label: 'Low stock alerts', desc: 'Get notified when inventory drops below reorder level' },
                { label: 'Production status updates', desc: 'Receive updates on production order progress' },
                { label: 'New order notifications', desc: 'Get alerted when new sales orders are placed' },
                { label: 'Weekly summary reports', desc: 'Receive weekly performance summaries' },
            ].map((item) => (<div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer"/>
                      <div className="w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full peer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"/>
                    </label>
                  </div>))}
              </div>
            </div>)}

          {tab === 'security' && (<div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                  <input type="password" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                  <input type="password" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                  <input type="password" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Update Password</button>
              </div>
            </div>)}

          {tab === 'company' && (<div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                  <input defaultValue="SmartFactory Industries Inc." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
                  <input defaultValue="Industrial Manufacturing" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Production Lines</label>
                  <input defaultValue="5" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Timezone</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>UTC-08:00 Pacific</option>
                    <option>UTC-05:00 Eastern</option>
                    <option>UTC+00:00 GMT</option>
                    <option>UTC+01:00 Central European</option>
                    <option>UTC+09:00 Japan</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Save className="w-4 h-4"/> Save Settings
                </button>
              </div>
            </div>)}
        </div>
      </div>
    </div>);
}
