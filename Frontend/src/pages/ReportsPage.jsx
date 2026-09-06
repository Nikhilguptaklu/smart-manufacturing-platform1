import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from 'recharts';
import { Factory, Boxes, DollarSign, Users, Package } from 'lucide-react';
import { productionOrdersApi, inventoryApi, salesOrdersApi, customersApi, productsApi } from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import KPICard from '@/components/ui/KPICard';
import StatusBadge from '@/components/ui/StatusBadge';
export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState('production');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [prodOrders, setProdOrders] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    useEffect(() => {
        async function fetchAll() {
            try {
                const [poResult, invResult, soResult, cuResult, prResult] = await Promise.all([
                    productionOrdersApi.list(),
                    inventoryApi.list(),
                    salesOrdersApi.list(),
                    customersApi.list(),
                    productsApi.list(),
                ]);
                setProdOrders(poResult.data || []);
                setInventory(invResult.data || []);
                setSalesOrders(soResult.data || []);
                setCustomers(cuResult.data || []);
                setProducts(prResult.data || []);
            } catch (error) {
                console.error('Failed to fetch report data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);
    if (loading)
        return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>;
    const REPORT_TABS = [
        { key: 'production', label: 'Production', icon: Factory },
        { key: 'inventory', label: 'Inventory', icon: Boxes },
        { key: 'sales', label: 'Sales', icon: DollarSign },
        { key: 'customer', label: 'Customer', icon: Users },
        { key: 'product', label: 'Product', icon: Package },
    ];
    const prodStatusData = [
        { name: 'In Production', value: prodOrders.filter((o) => o.status === 'in_production').length, color: '#3b82f6' },
        { name: 'Completed', value: prodOrders.filter((o) => o.status === 'completed').length, color: '#10b981' },
        { name: 'Pending', value: prodOrders.filter((o) => o.status === 'pending').length, color: '#f59e0b' },
        { name: 'On Hold', value: prodOrders.filter((o) => o.status === 'on_hold').length, color: '#f97316' },
    ];
    const invStatusData = [
        { name: 'Healthy', value: inventory.filter((i) => i.status === 'healthy').length, color: '#10b981' },
        { name: 'Low Stock', value: inventory.filter((i) => i.status === 'low_stock').length, color: '#f59e0b' },
        { name: 'Critical', value: inventory.filter((i) => i.status === 'critical').length, color: '#ef4444' },
    ];
    const salesByMonth = {};
    salesOrders.forEach((o) => {
        const m = new Date(o.order_date).toLocaleDateString('en-US', { month: 'short' });
        salesByMonth[m] = (salesByMonth[m] ?? 0) + o.total_amount;
    });
    const salesTrend = Object.entries(salesByMonth).map(([month, revenue]) => ({ month, revenue }));
    const customerStatusData = [
        { name: 'Active', value: customers.filter((c) => c.status === 'active').length, color: '#10b981' },
        { name: 'Prospect', value: customers.filter((c) => c.status === 'prospect').length, color: '#f59e0b' },
        { name: 'Inactive', value: customers.filter((c) => c.status === 'inactive').length, color: '#9ca3af' },
    ];
    const productCategoryData = {};
    products.forEach((p) => { productCategoryData[p.category] = (productCategoryData[p.category] ?? 0) + 1; });
    const productByCategory = Object.entries(productCategoryData).map(([name, value]) => ({ name, value }));
    return (<div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Comprehensive business intelligence across all modules"/>

      <div className="flex flex-wrap items-center gap-2">
        {REPORT_TABS.map((tab) => (<button key={tab.key} onClick={() => setReportType(tab.key)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${reportType === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <tab.icon className="w-4 h-4"/> {tab.label}
          </button>))}
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
          <span className="text-gray-400">—</span>
          <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
        </div>
      </div>

      {reportType === 'production' && (<div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Orders" value={prodOrders.length} icon={Factory} color="blue"/>
            <KPICard label="Completed" value={prodOrders.filter((o) => o.status === 'completed').length} icon={Factory} color="emerald"/>
            <KPICard label="In Production" value={prodOrders.filter((o) => o.status === 'in_production').length} icon={Factory} color="amber"/>
            <KPICard label="Avg Progress" value={`${Math.round(prodOrders.reduce((a, o) => a + o.progress, 0) / (prodOrders.length || 1))}%`} icon={Factory} color="teal"/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Production Status Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={prodStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name">
                    {prodStatusData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
                  <Legend wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Production Orders by Line</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={Object.entries(prodOrders.reduce((acc, o) => { acc[o.production_line] = (acc[o.production_line] ?? 0) + 1; return acc; }, {})).map(([line, count]) => ({ line, count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                  <XAxis dataKey="line" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Production Orders Detail</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Line</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {prodOrders.map((o) => (<tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{o.production_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{o.product_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{o.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{o.production_line}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{o.progress}%</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status}/></td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}

      {reportType === 'inventory' && (<div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Items" value={inventory.length} icon={Boxes} color="blue"/>
            <KPICard label="Healthy" value={inventory.filter((i) => i.status === 'healthy').length} icon={Boxes} color="emerald"/>
            <KPICard label="Low Stock" value={inventory.filter((i) => i.status === 'low_stock').length} icon={Boxes} color="amber"/>
            <KPICard label="Critical" value={inventory.filter((i) => i.status === 'critical').length} icon={Boxes} color="red"/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Stock Status Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={invStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name">
                    {invStatusData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
                  <Legend wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Inventory by Type</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                { name: 'Raw Material', value: inventory.filter((i) => i.item_type === 'raw_material').length },
                { name: 'Components', value: inventory.filter((i) => i.item_type === 'component').length },
                { name: 'Finished', value: inventory.filter((i) => i.item_type === 'finished_product').length },
            ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>)}

      {reportType === 'sales' && (<div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Orders" value={salesOrders.length} icon={DollarSign} color="blue"/>
            <KPICard label="Total Revenue" value={`$${salesOrders.reduce((a, o) => a + o.total_amount, 0).toLocaleString()}`} icon={DollarSign} color="emerald"/>
            <KPICard label="Completed" value={salesOrders.filter((o) => o.status === 'completed').length} icon={DollarSign} color="teal"/>
            <KPICard label="Pending" value={salesOrders.filter((o) => o.status === 'pending').length} icon={DollarSign} color="amber"/>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}/>
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>)}

      {reportType === 'customer' && (<div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard label="Total Customers" value={customers.length} icon={Users} color="blue"/>
            <KPICard label="Active" value={customers.filter((c) => c.status === 'active').length} icon={Users} color="emerald"/>
            <KPICard label="Prospects" value={customers.filter((c) => c.status === 'prospect').length} icon={Users} color="amber"/>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Customer Status</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={customerStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name">
                  {customerStatusData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
                <Legend wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>)}

      {reportType === 'product' && (<div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard label="Total Products" value={products.length} icon={Package} color="blue"/>
            <KPICard label="Active" value={products.filter((p) => p.status === 'active').length} icon={Package} color="emerald"/>
            <KPICard label="Low Stock" value={products.filter((p) => p.stock_quantity <= p.reorder_level).length} icon={Package} color="red"/>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Products by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}
    </div>);
}
