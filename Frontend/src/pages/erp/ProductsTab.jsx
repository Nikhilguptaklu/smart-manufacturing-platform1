import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import { productsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { canWrite } from '@/lib/permissions';
import { useToast } from '@/components/ui/Toast';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
const CATEGORIES = ['Machinery', 'Robotics', 'Automation', 'Electronics', 'Sensors', 'Components', 'Quality'];
export default function ProductsTab() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const writable = canWrite(profile?.role, 'products');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [form, setForm] = useState({
        product_code: '', product_name: '', category: 'Machinery', description: '',
        unit_price: 0, stock_quantity: 0, reorder_level: 10, status: 'active',
    });
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (categoryFilter !== 'all') params.category = categoryFilter;
            const result = await productsApi.list(params);
            setProducts(result.data || []);
        } catch (error) {
            toast(error?.message || 'Failed to fetch products', 'error');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchProducts(); }, [search, categoryFilter]);
    const openAdd = () => {
        setEditing(null);
        setForm({ product_code: '', product_name: '', category: 'Machinery', description: '', unit_price: 0, stock_quantity: 0, reorder_level: 10, status: 'active' });
        setModalOpen(true);
    };
    const openEdit = (p) => {
        setEditing(p);
        setForm({ product_code: p.product_code, product_name: p.product_name, category: p.category, description: p.description ?? '', unit_price: p.unit_price, stock_quantity: p.stock_quantity, reorder_level: p.reorder_level, status: p.status });
        setModalOpen(true);
    };
    const save = async () => {
        if (!form.product_code || !form.product_name) {
            toast('Product code and name are required', 'error');
            return;
        }
        try {
            if (editing) {
                await productsApi.update(editing.id, form);
                toast('Product updated', 'success');
            } else {
                await productsApi.create(form);
                toast('Product created', 'success');
            }
            setModalOpen(false);
            fetchProducts();
        } catch (error) {
            toast(error?.message || 'Failed to save product', 'error');
        }
    };
    const confirmDelete = async () => {
        if (!deleteTarget)
            return;
        try {
            await productsApi.remove(deleteTarget.id);
            toast('Product deleted', 'success');
            setDeleteTarget(null);
            fetchProducts();
        } catch (error) {
            toast(error?.message || 'Failed to delete product', 'error');
        }
    };
    return (<div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"/>
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {writable && (<button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4"/> Add Product
          </button>)}
      </div>

      <DataTable loading={loading} data={products} emptyTitle="No products found" emptyDescription="Try adjusting your search or filters." columns={[
            { key: 'product_code', header: 'Code', render: (p) => <span className="font-mono text-xs font-medium text-gray-600">{p.product_code}</span> },
            { key: 'product_name', header: 'Product Name', render: (p) => (<div>
              <p className="font-medium text-gray-900">{p.product_name}</p>
              <p className="text-xs text-gray-400">{p.description ?? ''}</p>
            </div>) },
            { key: 'category', header: 'Category' },
            { key: 'unit_price', header: 'Price', render: (p) => `$${p.unit_price.toLocaleString()}` },
            { key: 'stock_quantity', header: 'Stock', render: (p) => (<span className={p.stock_quantity <= p.reorder_level ? 'text-red-600 font-medium' : ''}>{p.stock_quantity}</span>) },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status}/> },
            ...(writable ? [{
                    key: 'actions', header: 'Actions', render: (p) => (<div className="flex items-center gap-2">
                <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4"/>
                </button>
                <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>),
                }] : []),
        ]}/>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product Code *</label>
            <input value={form.product_code} onChange={(e) => setForm({ ...form, product_code: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="PRD-013"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
            <input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="active">Active</option>
              <option value="discontinued">Discontinued</option>
              <option value="prototype">Prototype</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price ($)</label>
            <input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Stock Quantity</label>
            <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reorder Level</label>
            <input type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={save} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Package className="w-4 h-4"/> {editing ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete Product" message={`Are you sure you want to delete "${deleteTarget?.product_name}"? This action cannot be undone.`} confirmLabel="Delete" danger/>
    </div>);
}
