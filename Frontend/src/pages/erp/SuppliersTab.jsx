import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { suppliersApi, normalizeListResponse } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { canWrite } from '@/lib/permissions';
import { useToast } from '@/components/ui/Toast';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
export default function SuppliersTab() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const writable = canWrite(profile?.role, 'suppliers');
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [form, setForm] = useState({ company_name: '', contact_person: '', email: '', phone: '', material_supplied: '', status: 'active' });
    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            const result = await suppliersApi.list(params);
            setSuppliers(normalizeListResponse(result));
        } catch (error) {
            toast(error?.message || 'Failed to fetch suppliers', 'error');
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchSuppliers(); }, [search]);
    const openAdd = () => {
        setEditing(null);
        setForm({ company_name: '', contact_person: '', email: '', phone: '', material_supplied: '', status: 'active' });
        setModalOpen(true);
    };
    const openEdit = (s) => {
        setEditing(s);
        setForm({ company_name: s.company_name, contact_person: s.contact_person, email: s.email, phone: s.phone ?? '', material_supplied: s.material_supplied, status: s.status });
        setModalOpen(true);
    };
    const save = async () => {
        if (!form.company_name || !form.contact_person) {
            toast('Company name and contact person required', 'error');
            return;
        }
        try {
            if (editing) {
                await suppliersApi.update(editing.id, form);
                toast('Supplier updated', 'success');
            } else {
                await suppliersApi.create(form);
                toast('Supplier created', 'success');
            }
            setModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            toast(error?.message || 'Failed to save supplier', 'error');
        }
    };
    const confirmDelete = async () => {
        if (!deleteTarget)
            return;
        try {
            await suppliersApi.remove(deleteTarget.id);
            toast('Supplier deleted', 'success');
            setDeleteTarget(null);
            fetchSuppliers();
        } catch (error) {
            toast(error?.message || 'Failed to delete supplier', 'error');
        }
    };
    return (<div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
        </div>
        {writable && (<button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4"/> Add Supplier
          </button>)}
      </div>

      <DataTable loading={loading} data={suppliers} emptyTitle="No suppliers found" columns={[
            { key: 'company_name', header: 'Company', render: (s) => <span className="font-medium text-gray-900">{s.company_name}</span> },
            { key: 'contact_person', header: 'Contact' },
            { key: 'email', header: 'Email', render: (s) => <span className="text-blue-600">{s.email}</span> },
            { key: 'phone', header: 'Phone', render: (s) => s.phone ?? '—' },
            { key: 'material_supplied', header: 'Material' },
            { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status}/> },
            ...(writable ? [{
                    key: 'actions', header: 'Actions', render: (s) => (<div className="flex items-center gap-2">
                <button onClick={() => openEdit(s)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4"/></button>
                <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>),
                }] : []),
        ]}/>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="lg">
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Material Supplied</label>
            <input value={form.material_supplied} onChange={(e) => setForm({ ...form, material_supplied: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="active">Active</option>
              <option value="preferred">Preferred</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">{editing ? 'Save Changes' : 'Create Supplier'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete Supplier" message={`Delete "${deleteTarget?.company_name}"? This cannot be undone.`} confirmLabel="Delete" danger/>
    </div>);
}
