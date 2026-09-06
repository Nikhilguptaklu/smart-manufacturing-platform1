import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, Users, Building2, Globe, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, } from 'recharts';
import { customersApi, salesOrdersApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { canWrite } from '@/lib/permissions';
import { useToast } from '@/components/ui/Toast';
import PageHeader from '@/components/ui/PageHeader';
import KPICard from '@/components/ui/KPICard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
const INDUSTRY_CHART = [
    { name: 'Automotive', value: 3, color: '#3b82f6' },
    { name: 'Electronics', value: 2, color: '#10b981' },
    { name: 'Aerospace', value: 1, color: '#f59e0b' },
    { name: 'Robotics', value: 1, color: '#8b5cf6' },
    { name: 'Other', value: 5, color: '#6b7280' },
];
export default function CrmPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const writable = canWrite(profile?.role, 'customers');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);
    const [viewOrders, setViewOrders] = useState([]);
    const [form, setForm] = useState({ company_name: '', contact_person: '', email: '', phone: '', country: '', industry: '', status: 'active' });
    const [stats, setStats] = useState({ total: 0, active: 0, prospect: 0 });
    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;
            const result = await customersApi.list(params);
            const list = result.data || [];
            setCustomers(list);
            setStats({ total: list.length, active: list.filter((c) => c.status === 'active').length, prospect: list.filter((c) => c.status === 'prospect').length });
        } catch (error) {
            toast(error?.message || 'Failed to fetch customers', 'error');
            setCustomers([]);
            setStats({ total: 0, active: 0, prospect: 0 });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchCustomers(); }, [search, statusFilter]);
    const openView = async (c) => {
        setViewTarget(c);
        try {
            const result = await salesOrdersApi.list({ customer_id: c.id });
            setViewOrders(result.data || []);
        } catch (error) {
            toast(error?.message || 'Failed to fetch orders', 'error');
            setViewOrders([]);
        }
    };
    const openAdd = () => {
        setEditing(null);
        setForm({ company_name: '', contact_person: '', email: '', phone: '', country: '', industry: '', status: 'active' });
        setModalOpen(true);
    };
    const openEdit = (c) => {
        setEditing(c);
        setForm({ company_name: c.company_name, contact_person: c.contact_person, email: c.email, phone: c.phone ?? '', country: c.country, industry: c.industry, status: c.status });
        setModalOpen(true);
    };
    const save = async () => {
        if (!form.company_name || !form.contact_person) {
            toast('Company name and contact required', 'error');
            return;
        }
        try {
            if (editing) {
                await customersApi.update(editing.id, form);
                toast('Customer updated', 'success');
            } else {
                await customersApi.create(form);
                toast('Customer created', 'success');
            }
            setModalOpen(false);
            fetchCustomers();
        } catch (error) {
            toast(error?.message || 'Failed to save customer', 'error');
        }
    };
    const confirmDelete = async () => {
        if (!deleteTarget)
            return;
        try {
            await customersApi.remove(deleteTarget.id);
            toast('Customer deleted', 'success');
            setDeleteTarget(null);
            fetchCustomers();
        } catch (error) {
            toast(error?.message || 'Failed to delete customer', 'error');
        }
    };
    return (<div className="space-y-6">
      <PageHeader title="Customer Relationship Management" description="Manage customer accounts and track order history"/>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Total Customers" value={stats.total} icon={Users} color="blue"/>
        <KPICard label="Active Accounts" value={stats.active} icon={Building2} color="emerald"/>
        <KPICard label="Prospects" value={stats.prospect} icon={TrendingUp} color="amber"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Customers by Industry</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={INDUSTRY_CHART}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Customer Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
            { name: 'Active', value: stats.active, color: '#10b981' },
            { name: 'Prospect', value: stats.prospect, color: '#f59e0b' },
            { name: 'Inactive', value: stats.total - stats.active - stats.prospect, color: '#9ca3af' },
        ]} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                {[{ color: '#10b981' }, { color: '#f59e0b' }, { color: '#9ca3af' }].map((e, i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
              <Legend wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {writable && (<button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4"/> Add Customer
          </button>)}
      </div>

      <DataTable loading={loading} data={customers} emptyTitle="No customers found" columns={[
            { key: 'company_name', header: 'Company', render: (c) => <span className="font-medium text-gray-900">{c.company_name}</span> },
            { key: 'contact_person', header: 'Contact' },
            { key: 'email', header: 'Email', render: (c) => <span className="text-blue-600">{c.email}</span> },
            { key: 'country', header: 'Country', render: (c) => <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-gray-400"/>{c.country}</span> },
            { key: 'industry', header: 'Industry' },
            { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status}/> },
            {
                key: 'actions', header: 'Actions', render: (c) => (<div className="flex items-center gap-2">
                <button onClick={() => openView(c)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4"/></button>
                {writable && <>
                  <button onClick={() => openEdit(c)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                </>}
              </div>),
            },
        ]}/>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company Name *</label>
            <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact Person *</label>
            <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
            <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="active">Active</option>
              <option value="prospect">Prospect</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">{editing ? 'Save' : 'Create'}</button>
        </div>
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Customer Details" size="lg">
        {viewTarget && (<div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div><p className="text-xs text-gray-500">Company</p><p className="text-sm font-medium text-gray-900">{viewTarget.company_name}</p></div>
              <div><p className="text-xs text-gray-500">Contact</p><p className="text-sm text-gray-900">{viewTarget.contact_person}</p></div>
              <div><p className="text-xs text-gray-500">Email</p><p className="text-sm text-blue-600">{viewTarget.email}</p></div>
              <div><p className="text-xs text-gray-500">Phone</p><p className="text-sm text-gray-900">{viewTarget.phone ?? '—'}</p></div>
              <div><p className="text-xs text-gray-500">Country</p><p className="text-sm text-gray-900">{viewTarget.country}</p></div>
              <div><p className="text-xs text-gray-500">Industry</p><p className="text-sm text-gray-900">{viewTarget.industry}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><StatusBadge status={viewTarget.status}/></div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Order History</h4>
              {viewOrders.length === 0 ? (<p className="text-sm text-gray-500 py-4 text-center">No orders for this customer</p>) : (<div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Order #</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewOrders.map((o) => (<tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-mono text-gray-600">{o.order_number}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{new Date(o.order_date).toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">${o.total_amount.toLocaleString()}</td>
                          <td className="px-3 py-2"><StatusBadge status={o.status}/></td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>)}
            </div>
          </div>)}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete Customer" message={`Delete "${deleteTarget?.company_name}"? This cannot be undone.`} confirmLabel="Delete" danger/>
    </div>);
}
