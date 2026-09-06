import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Factory, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend, } from 'recharts';
import { productionOrdersApi, productsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { canWrite } from '@/lib/permissions';
import { useToast } from '@/components/ui/Toast';
import PageHeader from '@/components/ui/PageHeader';
import KPICard from '@/components/ui/KPICard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
const PRODUCTION_BY_LINE = [
    { line: 'Line A', units: 32 },
    { line: 'Line B', units: 18 },
    { line: 'Line C', units: 118 },
    { line: 'Line D', units: 350 },
    { line: 'Line E', units: 790 },
];
export default function ProductionPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const writable = canWrite(profile?.role, 'production');
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [form, setForm] = useState({
        production_number: '', product_id: '', product_name: '', quantity: 1,
        production_line: 'Line A', start_date: '', expected_completion: '', progress: 0, status: 'pending',
    });
    const [stats, setStats] = useState({ active: 0, completed: 0, pending: 0, efficiency: 0 });
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;
            const result = await productionOrdersApi.list(params);
            const list = result.data || [];
            setOrders(list);
            setStats({
                active: list.filter((o) => o.status === 'in_production').length,
                completed: list.filter((o) => o.status === 'completed').length,
                pending: list.filter((o) => o.status === 'pending').length,
                efficiency: list.length > 0 ? Math.round(list.reduce((a, o) => a + o.progress, 0) / list.length) : 0,
            });
        } catch (error) {
            toast(error?.message || 'Failed to fetch production orders', 'error');
            setOrders([]);
            setStats({ active: 0, completed: 0, pending: 0, efficiency: 0 });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const result = await productsApi.list({ status: 'active' });
                setProducts(result.data || []);
            } catch (error) {
                toast(error?.message || 'Failed to fetch products', 'error');
            }
        };
        loadProducts();
        fetchOrders();
    }, [search, statusFilter]);
    const openAdd = () => {
        setEditing(null);
        const nextNum = `PO-${1013 + orders.length}`;
        setForm({ production_number: nextNum, product_id: '', product_name: '', quantity: 1, production_line: 'Line A', start_date: new Date().toISOString().slice(0, 10), expected_completion: '', progress: 0, status: 'pending' });
        setModalOpen(true);
    };
    const openEdit = (o) => {
        setEditing(o);
        setForm({ production_number: o.production_number, product_id: o.product_id ?? '', product_name: o.product_name, quantity: o.quantity, production_line: o.production_line, start_date: o.start_date, expected_completion: o.expected_completion ?? '', progress: o.progress, status: o.status });
        setModalOpen(true);
    };
    const save = async () => {
        if (!form.production_number || !form.product_name) {
            toast('Production number and product name required', 'error');
            return;
        }
        const payload = { ...form, product_id: form.product_id || null, expected_completion: form.expected_completion || null };
        try {
            if (editing) {
                await productionOrdersApi.update(editing.id, payload);
                toast('Production order updated', 'success');
            } else {
                await productionOrdersApi.create(payload);
                toast('Production order created', 'success');
            }
            setModalOpen(false);
            fetchOrders();
        } catch (error) {
            toast(error?.message || 'Failed to save production order', 'error');
        }
    };
    const confirmDelete = async () => {
        if (!deleteTarget)
            return;
        try {
            await productionOrdersApi.remove(deleteTarget.id);
            toast('Production order deleted', 'success');
            setDeleteTarget(null);
            fetchOrders();
        } catch (error) {
            toast(error?.message || 'Failed to delete production order', 'error');
        }
    };
    const efficiencyData = [{ name: 'Efficiency', value: stats.efficiency, fill: '#3b82f6' }];
    return (<div className="space-y-6">
      <PageHeader title="Production Management" description="Monitor and manage production orders across all lines"/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Production" value={stats.active} icon={Factory} color="blue"/>
        <KPICard label="Completed" value={stats.completed} icon={CheckCircle2} color="emerald"/>
        <KPICard label="Pending" value={stats.pending} icon={Clock} color="amber"/>
        <KPICard label="Avg Progress" value={`${stats.efficiency}%`} icon={TrendingUp} color="teal"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Production Output by Line</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={PRODUCTION_BY_LINE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="line" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
              <Bar dataKey="units" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Overall Efficiency</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart innerRadius="40%" outerRadius="90%" data={efficiencyData} startAngle={90} endAngle={-270}>
              <RadialBar background dataKey="value" cornerRadius={10}/>
              <Legend iconSize={0} layout="vertical" verticalAlign="middle" content={() => (<text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-gray-900">
                  {stats.efficiency}%
                </text>)}/>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search production orders..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_production">In Production</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {writable && (<button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4"/> New Production Order
          </button>)}
      </div>

      <DataTable loading={loading} data={orders} emptyTitle="No production orders" columns={[
            { key: 'production_number', header: 'Order #', render: (o) => <span className="font-mono text-xs font-medium text-gray-600">{o.production_number}</span> },
            { key: 'product_name', header: 'Product', render: (o) => <span className="font-medium text-gray-900">{o.product_name}</span> },
            { key: 'quantity', header: 'Qty' },
            { key: 'production_line', header: 'Line' },
            { key: 'progress', header: 'Progress', render: (o) => (<div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${o.progress >= 80 ? 'bg-emerald-500' : o.progress >= 40 ? 'bg-blue-500' : o.progress > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} style={{ width: `${o.progress}%` }}/>
              </div>
              <span className="text-xs font-medium text-gray-600">{o.progress}%</span>
            </div>) },
            { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status}/> },
            { key: 'expected_completion', header: 'Due', render: (o) => o.expected_completion ? new Date(o.expected_completion).toLocaleDateString() : '—' },
            ...(writable ? [{
                    key: 'actions', header: 'Actions', render: (o) => (<div className="flex items-center gap-2">
                <button onClick={() => openEdit(o)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4"/></button>
                <button onClick={() => setDeleteTarget(o)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>),
                }] : []),
        ]}/>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Production Order' : 'New Production Order'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Production Number *</label>
            <input value={form.production_number} onChange={(e) => setForm({ ...form, production_number: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
            <select value={form.product_id} onChange={(e) => {
            const p = products.find((p) => p.id === e.target.value);
            setForm({ ...form, product_id: e.target.value, product_name: p?.product_name ?? '' });
        }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select product...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
            <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Production Line</label>
            <select value={form.production_line} onChange={(e) => setForm({ ...form, production_line: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              {['Line A', 'Line B', 'Line C', 'Line D', 'Line E'].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expected Completion</label>
            <input type="date" value={form.expected_completion} onChange={(e) => setForm({ ...form, expected_completion: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Progress (%)</label>
            <input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="pending">Pending</option>
              <option value="in_production">In Production</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">{editing ? 'Save Changes' : 'Create Order'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete Production Order" message={`Delete "${deleteTarget?.production_number}"? This cannot be undone.`} confirmLabel="Delete" danger/>
    </div>);
}
