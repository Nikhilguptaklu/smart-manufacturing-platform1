import { useEffect, useState } from 'react';
import { Search, Pencil, AlertTriangle, Boxes, Package, Layers } from 'lucide-react';
import { inventoryApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { canWrite } from '@/lib/permissions';
import { useToast } from '@/components/ui/Toast';
import PageHeader from '@/components/ui/PageHeader';
import KPICard from '@/components/ui/KPICard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
const TYPE_LABELS = { raw_material: 'Raw Material', component: 'Component', finished_product: 'Finished Product' };
export default function InventoryPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const writable = canWrite(profile?.role, 'inventory');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [editTarget, setEditTarget] = useState(null);
    const [stockForm, setStockForm] = useState({ current_stock: 0, reorder_level: 0, status: 'healthy' });
    const [stats, setStats] = useState({ total: 0, healthy: 0, low: 0, critical: 0 });
    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (typeFilter !== 'all') params.item_type = typeFilter;
            const result = await inventoryApi.list(params);
            const list = result.data || [];
            setItems(list);
            setStats({
                total: list.length,
                healthy: list.filter((i) => i.status === 'healthy').length,
                low: list.filter((i) => i.status === 'low_stock').length,
                critical: list.filter((i) => i.status === 'critical').length,
            });
        } catch (error) {
            toast(error?.message || 'Failed to fetch inventory', 'error');
            setItems([]);
            setStats({ total: 0, healthy: 0, low: 0, critical: 0 });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchItems(); }, [search, typeFilter]);
    const openEdit = (item) => {
        setEditTarget(item);
        setStockForm({ current_stock: item.current_stock, reorder_level: item.reorder_level, status: item.status });
    };
    const saveStock = async () => {
        if (!editTarget)
            return;
        const newStatus = stockForm.current_stock <= stockForm.reorder_level * 0.5 ? 'critical' : stockForm.current_stock <= stockForm.reorder_level ? 'low_stock' : 'healthy';
        try {
            await inventoryApi.update(editTarget.id, {
                current_stock: stockForm.current_stock,
                reorder_level: stockForm.reorder_level,
                status: newStatus,
            });
            toast('Stock updated', 'success');
            setEditTarget(null);
            fetchItems();
        } catch (error) {
            toast(error?.message || 'Failed to update stock', 'error');
        }
    };
    return (<div className="space-y-6">
      <PageHeader title="Inventory Management" description="Track raw materials, components, and finished products"/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Items" value={stats.total} icon={Boxes} color="blue"/>
        <KPICard label="Healthy Stock" value={stats.healthy} icon={Package} color="emerald"/>
        <KPICard label="Low Stock" value={stats.low} icon={AlertTriangle} color="amber"/>
        <KPICard label="Critical" value={stats.critical} icon={AlertTriangle} color="red"/>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All Types</option>
            <option value="raw_material">Raw Materials</option>
            <option value="component">Components</option>
            <option value="finished_product">Finished Products</option>
          </select>
        </div>
      </div>

      <DataTable loading={loading} data={items} emptyTitle="No inventory items" columns={[
            { key: 'item_code', header: 'Code', render: (i) => <span className="font-mono text-xs font-medium text-gray-600">{i.item_code}</span> },
            { key: 'item_name', header: 'Item Name', render: (i) => (<div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-400"/>
              <span className="font-medium text-gray-900">{i.item_name}</span>
            </div>) },
            { key: 'item_type', header: 'Type', render: (i) => <span className="text-xs">{TYPE_LABELS[i.item_type]}</span> },
            { key: 'current_stock', header: 'Current Stock', render: (i) => (<span className={i.status === 'critical' ? 'text-red-600 font-semibold' : i.status === 'low_stock' ? 'text-amber-600 font-medium' : 'text-gray-900'}>
              {i.current_stock} {i.unit}
            </span>) },
            { key: 'reorder_level', header: 'Reorder Level', render: (i) => `${i.reorder_level} ${i.unit}` },
            { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status}/> },
            ...(writable ? [{
                    key: 'actions', header: 'Actions', render: (i) => (<button onClick={() => openEdit(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Pencil className="w-3.5 h-3.5"/> Update Stock
              </button>),
                }] : []),
        ]}/>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Update Stock Level" size="sm">
        {editTarget && (<div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{editTarget.item_name}</p>
              <p className="text-xs text-gray-500">{editTarget.item_code} · Current: {editTarget.current_stock} {editTarget.unit}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">New Stock Level</label>
              <input type="number" value={stockForm.current_stock} onChange={(e) => setStockForm({ ...stockForm, current_stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reorder Level</label>
              <input type="number" value={stockForm.reorder_level} onChange={(e) => setStockForm({ ...stockForm, reorder_level: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={saveStock} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>)}
      </Modal>
    </div>);
}
