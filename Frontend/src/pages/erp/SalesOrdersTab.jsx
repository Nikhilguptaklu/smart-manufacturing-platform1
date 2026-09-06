import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { salesOrdersApi, customersApi, normalizeListResponse } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { canWrite } from '@/lib/permissions';
import { useToast } from '@/components/ui/Toast';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
const STATUSES = ['pending', 'processing', 'production', 'shipped', 'completed', 'cancelled'];
export default function SalesOrdersTab() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const writable = canWrite(profile?.role, 'orders');
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);
    const [form, setForm] = useState({
        order_number: '', customer_id: '', total_amount: 0, order_date: '', delivery_date: '', status: 'pending',
    });
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;
            const result = await salesOrdersApi.list(params);
            setOrders(normalizeListResponse(result));
        } catch (error) {
            toast(error?.message || 'Failed to fetch orders', 'error');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const loadCustomers = async () => {
            try {
                const result = await customersApi.list({ status: 'active' });
                setCustomers(normalizeListResponse(result));
            } catch (error) {
                toast(error?.message || 'Failed to fetch customers', 'error');
            }
        };
        loadCustomers();
        fetchOrders();
    }, [search, statusFilter]);
    const openAdd = () => {
        setEditing(null);
        const nextNum = `SO-${10013 + orders.length}`;
        setForm({ order_number: nextNum, customer_id: '', total_amount: 0, order_date: new Date().toISOString().slice(0, 10), delivery_date: '', status: 'pending' });
        setModalOpen(true);
    };
    const openEdit = (o) => {
        setEditing(o);
        setForm({ order_number: o.order_number, customer_id: o.customer_id ?? '', total_amount: o.total_amount, order_date: o.order_date, delivery_date: o.delivery_date ?? '', status: o.status });
        setModalOpen(true);
    };
    const save = async () => {
        if (!form.order_number) {
            toast('Order number required', 'error');
            return;
        }
        const payload = { ...form, customer_id: form.customer_id || null, delivery_date: form.delivery_date || null };
        try {
            if (editing) {
                await salesOrdersApi.update(editing.id, payload);
                toast('Order updated', 'success');
            } else {
                await salesOrdersApi.create(payload);
                toast('Order created', 'success');
            }
            setModalOpen(false);
            fetchOrders();
        } catch (error) {
            toast(error?.message || 'Failed to save order', 'error');
        }
    };
    const confirmDelete = async () => {
        if (!deleteTarget)
            return;
        try {
            await salesOrdersApi.remove(deleteTarget.id);
            toast('Order deleted', 'success');
            setDeleteTarget(null);
            fetchOrders();
        } catch (error) {
            toast(error?.message || 'Failed to delete order', 'error');
        }
    };
    return (<div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        {writable && (<button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4"/> New Order
          </button>)}
      </div>

      <DataTable loading={loading} data={orders} emptyTitle="No orders found" columns={[
            { key: 'order_number', header: 'Order #', render: (o) => <span className="font-mono text-xs font-medium text-gray-600">{o.order_number}</span> },
            { key: 'customer', header: 'Customer', render: (o) => o.customer?.company_name ?? '—' },
            { key: 'total_amount', header: 'Total', render: (o) => `$${o.total_amount.toLocaleString()}` },
            { key: 'order_date', header: 'Order Date', render: (o) => new Date(o.order_date).toLocaleDateString() },
            { key: 'delivery_date', header: 'Delivery', render: (o) => o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : '—' },
            { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status}/> },
            {
                key: 'actions', header: 'Actions', render: (o) => (<div className="flex items-center gap-2">
                <button onClick={() => setViewTarget(o)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Eye className="w-4 h-4"/>
                </button>
                {writable && <>
                  <button onClick={() => openEdit(o)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => setDeleteTarget(o)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                </>}
              </div>),
            },
        ]}/>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Order' : 'New Sales Order'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Order Number *</label>
            <input value={form.order_number} onChange={(e) => setForm({ ...form, order_number: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
            <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select customer...</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total Amount ($)</label>
            <input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Order Date</label>
            <input type="date" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Date</label>
            <input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">{editing ? 'Save Changes' : 'Create Order'}</button>
        </div>
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Order Details" size="md">
        {viewTarget && (<div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Order Number</p><p className="text-sm font-medium text-gray-900">{viewTarget.order_number}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><StatusBadge status={viewTarget.status}/></div>
              <div><p className="text-xs text-gray-500">Customer</p><p className="text-sm font-medium text-gray-900">{viewTarget.customer?.company_name ?? '—'}</p></div>
              <div><p className="text-xs text-gray-500">Total Amount</p><p className="text-sm font-medium text-gray-900">${viewTarget.total_amount.toLocaleString()}</p></div>
              <div><p className="text-xs text-gray-500">Order Date</p><p className="text-sm text-gray-900">{new Date(viewTarget.order_date).toLocaleDateString()}</p></div>
              <div><p className="text-xs text-gray-500">Delivery Date</p><p className="text-sm text-gray-900">{viewTarget.delivery_date ? new Date(viewTarget.delivery_date).toLocaleDateString() : '—'}</p></div>
            </div>
          </div>)}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete Order" message={`Delete order "${deleteTarget?.order_number}"? This cannot be undone.`} confirmLabel="Delete" danger/>
    </div>);
}
