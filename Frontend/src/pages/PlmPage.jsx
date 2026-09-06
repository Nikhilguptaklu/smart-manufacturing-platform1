import { useEffect, useState } from 'react';
import { Plus, Layers, GitBranch, ChevronRight, X } from 'lucide-react';
import { productVersionsApi, bomsApi, bomItemsApi, componentsApi, productsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { canWrite } from '@/lib/permissions';
import { useToast } from '@/components/ui/Toast';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
export default function PlmPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const writable = canWrite(profile?.role, 'boms');
    const [tab, setTab] = useState('versions');
    // Versions state
    const [versions, setVersions] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingV, setLoadingV] = useState(true);
    const [vModal, setVModal] = useState(false);
    const [editingV, setEditingV] = useState(null);
    const [vForm, setVForm] = useState({ product_id: '', version: '', status: 'draft', engineer: '' });
    // BOM state
    const [boms, setBoms] = useState([]);
    const [loadingB, setLoadingB] = useState(true);
    const [selectedBom, setSelectedBom] = useState(null);
    const [bomItems, setBomItems] = useState([]);
    const [components, setComponents] = useState([]);
    const [itemModal, setItemModal] = useState(false);
    const [itemForm, setItemForm] = useState({ component_id: '', component_name: '', quantity: 1, unit: 'pcs' });
    const [deleteBomItem, setDeleteBomItem] = useState(null);
    const [bomModal, setBomModal] = useState(false);
    const [bomForm, setBomForm] = useState({ product_id: '', version: '', status: 'active' });
    const fetchVersions = async () => {
        setLoadingV(true);
        try {
            const result = await productVersionsApi.list();
            setVersions(result.data || []);
        } catch (error) {
            toast(error?.message || 'Failed to fetch versions', 'error');
            setVersions([]);
        } finally {
            setLoadingV(false);
        }
    };
    const fetchBoms = async () => {
        setLoadingB(true);
        try {
            const result = await bomsApi.list();
            setBoms(result.data || []);
        } catch (error) {
            toast(error?.message || 'Failed to fetch BOMs', 'error');
            setBoms([]);
        } finally {
            setLoadingB(false);
        }
    };
    const fetchBomItems = async (bomId) => {
        try {
            const result = await bomItemsApi.list({ bom_id: bomId });
            setBomItems(result.data || []);
        } catch (error) {
            toast(error?.message || 'Failed to fetch BOM items', 'error');
            setBomItems([]);
        }
    };
    const fetchComponents = async () => {
        try {
            const result = await componentsApi.list();
            setComponents(result.data || []);
        } catch (error) {
            toast(error?.message || 'Failed to fetch components', 'error');
            setComponents([]);
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
        fetchVersions();
        fetchBoms();
        fetchComponents();
    }, []);
    useEffect(() => {
        if (selectedBom)
            fetchBomItems(selectedBom.id);
    }, [selectedBom]);
    // Version handlers
    const saveVersion = async () => {
        if (!vForm.product_id || !vForm.version) {
            toast('Product and version required', 'error');
            return;
        }
        const payload = { ...vForm, last_updated: new Date().toISOString() };
        try {
            if (editingV) {
                await productVersionsApi.update(editingV.id, payload);
                toast('Version updated', 'success');
            } else {
                await productVersionsApi.create(payload);
                toast('Version created', 'success');
            }
            setVModal(false);
            fetchVersions();
        } catch (error) {
            toast(error?.message || 'Failed to save version', 'error');
        }
    };
    // BOM handlers
    const saveBom = async () => {
        if (!bomForm.product_id || !bomForm.version) {
            toast('Product and version required', 'error');
            return;
        }
        try {
            const result = await bomsApi.create(bomForm);
            toast('BOM created', 'success');
            setBomModal(false);
            fetchBoms();
            if (result.data && result.data.length > 0)
                setSelectedBom(result.data[0]);
        } catch (error) {
            toast(error?.message || 'Failed to create BOM', 'error');
        }
    };
    const saveBomItem = async () => {
        if (!selectedBom || !itemForm.component_name) {
            toast('Component name required', 'error');
            return;
        }
        const comp = components.find((c) => c.id === itemForm.component_id);
        const payload = {
            bom_id: selectedBom.id,
            component_id: itemForm.component_id || null,
            component_name: itemForm.component_name,
            quantity: itemForm.quantity,
            unit: comp?.unit ?? itemForm.unit,
            status: 'active',
        };
        try {
            await bomItemsApi.create(payload);
            toast('Component added to BOM', 'success');
            fetchBomItems(selectedBom.id);
            setItemModal(false);
            setItemForm({ component_id: '', component_name: '', quantity: 1, unit: 'pcs' });
        } catch (error) {
            toast(error?.message || 'Failed to add component', 'error');
        }
    };
    const removeBomItem = async () => {
        if (!deleteBomItem || !selectedBom)
            return;
        try {
            await bomItemsApi.remove(deleteBomItem.id);
            toast('Component removed', 'success');
            setDeleteBomItem(null);
            fetchBomItems(selectedBom.id);
        } catch (error) {
            toast(error?.message || 'Failed to remove component', 'error');
        }
    };
    return (<div className="space-y-6">
      <PageHeader title="PLM / Bill of Materials" description="Manage product versions and engineering BOMs"/>

      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setTab('versions')} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'versions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <span className="flex items-center gap-2"><GitBranch className="w-4 h-4"/> Product Versions</span>
        </button>
        <button onClick={() => setTab('bom')} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'bom' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <span className="flex items-center gap-2"><Layers className="w-4 h-4"/> Bill of Materials</span>
        </button>
      </div>

      {tab === 'versions' && (<div className="space-y-4">
          {writable && (<div className="flex justify-end">
              <button onClick={() => { setEditingV(null); setVForm({ product_id: '', version: '', status: 'draft', engineer: '' }); setVModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4"/> New Version
              </button>
            </div>)}
          <DataTable loading={loadingV} data={versions} emptyTitle="No product versions" columns={[
                { key: 'product', header: 'Product', render: (v) => <span className="font-medium text-gray-900">{v.product?.product_name ?? '—'}</span> },
                { key: 'version', header: 'Version', render: (v) => <span className="font-mono text-xs font-medium text-blue-600">{v.version}</span> },
                { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status}/> },
                { key: 'engineer', header: 'Engineer', render: (v) => v.engineer ?? '—' },
                { key: 'last_updated', header: 'Last Updated', render: (v) => new Date(v.last_updated).toLocaleDateString() },
            ]}/>
        </div>)}

      {tab === 'bom' && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">BOM List</h3>
              {writable && (<button onClick={() => setBomModal(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Plus className="w-4 h-4"/></button>)}
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loadingB ? <div className="text-sm text-gray-500 p-4">Loading...</div> : boms.length === 0 ? (<p className="text-sm text-gray-500 p-4 text-center">No BOMs created</p>) : boms.map((bom) => (<button key={bom.id} onClick={() => setSelectedBom(bom)} className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedBom?.id === bom.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <p className="text-sm font-medium text-gray-900 truncate">{bom.product?.product_name ?? '—'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-blue-600">{bom.version}</span>
                    <StatusBadge status={bom.status}/>
                  </div>
                </button>))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedBom ? (<div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{selectedBom.product?.product_name}</h3>
                    <p className="text-xs text-gray-500">BOM Version: {selectedBom.version}</p>
                  </div>
                  {writable && (<button onClick={() => { setItemForm({ component_id: '', component_name: '', quantity: 1, unit: 'pcs' }); setItemModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                      <Plus className="w-3.5 h-3.5"/> Add Component
                    </button>)}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-blue-600"/>
                    <span className="font-semibold text-gray-900">{selectedBom.product?.product_name}</span>
                  </div>
                  <div className="ml-2 space-y-1.5">
                    {bomItems.length === 0 ? (<p className="text-xs text-gray-400 italic ml-4">No components in this BOM</p>) : bomItems.map((item) => (<div key={item.id} className="flex items-center gap-2 group">
                        <ChevronRight className="w-4 h-4 text-gray-400"/>
                        <span className="text-gray-700">|-- {item.component_name}</span>
                        <span className="text-xs text-gray-400">({item.quantity} {item.unit})</span>
                        {writable && (<button onClick={() => setDeleteBomItem(item)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity">
                            <X className="w-3.5 h-3.5"/>
                          </button>)}
                      </div>))}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Components Detail</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Component</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Unit</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bomItems.map((item) => (<tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-700">{item.component_name}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{item.quantity}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">{item.unit}</td>
                            <td className="px-3 py-2"><StatusBadge status={item.status}/></td>
                          </tr>))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>) : (<div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                <p className="text-sm text-gray-500">Select a BOM from the list to view its components</p>
              </div>)}
          </div>
        </div>)}

      {/* Version Modal */}
      <Modal open={vModal} onClose={() => setVModal(false)} title={editingV ? 'Edit Version' : 'New Product Version'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
            <select value={vForm.product_id} onChange={(e) => setVForm({ ...vForm, product_id: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select product...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Version *</label>
            <input value={vForm.version} onChange={(e) => setVForm({ ...vForm, version: e.target.value })} placeholder="v2.1" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={vForm.status} onChange={(e) => setVForm({ ...vForm, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="draft">Draft</option>
              <option value="released">Released</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Engineer</label>
            <input value={vForm.engineer} onChange={(e) => setVForm({ ...vForm, engineer: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setVModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={saveVersion} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">{editingV ? 'Save' : 'Create'}</button>
        </div>
      </Modal>

      {/* BOM Modal */}
      <Modal open={bomModal} onClose={() => setBomModal(false)} title="Create New BOM" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
            <select value={bomForm.product_id} onChange={(e) => setBomForm({ ...bomForm, product_id: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select product...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Version *</label>
            <input value={bomForm.version} onChange={(e) => setBomForm({ ...bomForm, version: e.target.value })} placeholder="v2.0" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setBomModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={saveBom} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Create BOM</button>
        </div>
      </Modal>

      {/* BOM Item Modal */}
      <Modal open={itemModal} onClose={() => setItemModal(false)} title="Add Component to BOM" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Component</label>
            <select value={itemForm.component_id} onChange={(e) => {
            const c = components.find((c) => c.id === e.target.value);
            setItemForm({ ...itemForm, component_id: e.target.value, component_name: c?.component_name ?? '', unit: c?.unit ?? 'pcs' });
        }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select component...</option>
              {components.map((c) => <option key={c.id} value={c.id}>{c.component_name} ({c.component_code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
            <input type="number" min={1} value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setItemModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={saveBomItem} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Component</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteBomItem} onClose={() => setDeleteBomItem(null)} onConfirm={removeBomItem} title="Remove Component" message={`Remove "${deleteBomItem?.component_name}" from this BOM?`} confirmLabel="Remove" danger/>
    </div>);
}
