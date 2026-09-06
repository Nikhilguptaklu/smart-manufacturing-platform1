import { useEffect, useState } from 'react';
import { Package, Boxes, Factory, ClipboardList, Users, AlertTriangle, Gauge, Activity, TrendingUp, Clock, CheckCircle2, AlertCircle, } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from 'recharts';
import { dashboardApi, normalizeObjectResponse, normalizeListResponse } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/permissions';
import KPICard from '@/components/ui/KPICard';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';

export default function DashboardPage() {
    const { profile, session, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        products: 0,
        inventory: 0,
        activeProduction: 0,
        pendingOrders: 0,
        activeCustomers: 0,
        lowStock: 0,
        completedProduction: 0,
        avgProgress: 0,
    });
    const [productionOrders, setProductionOrders] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [monthlyProductionData, setMonthlyProductionData] = useState([]);
    const [salesTrendData, setSalesTrendData] = useState([]);
    const [prodStatusData, setProdStatusData] = useState([]);
    const [machineStatusData, setMachineStatusData] = useState([]);

    useEffect(() => {
        if (authLoading || !session || !profile) {
            setLoading(true);
            return;
        }

        async function fetchData() {
            setLoading(true);
            try {
                const [statsResult, recentOrdersResult, prodSummaryResult, lowStockResult, chartDataResult] = await Promise.all([
                    dashboardApi.getStats(),
                    dashboardApi.getRecentOrders(),
                    dashboardApi.getProductionSummary(),
                    dashboardApi.getLowStockItems(),
                    dashboardApi.getChartData(),
                ]);

                const dashStats = normalizeObjectResponse(statsResult, {}) || {};
                const recentOrders = normalizeObjectResponse(recentOrdersResult, {}) || {};
                const prodSummary = normalizeObjectResponse(prodSummaryResult, {}) || {};
                const lowStockData = normalizeListResponse(lowStockResult);
                const chartData = normalizeObjectResponse(chartDataResult, {}) || {};

                setStats({
                    products: Number(dashStats.products || 0),
                    inventory: Number(dashStats.inventory || 0),
                    activeProduction: Number(dashStats.activeProduction || 0),
                    pendingOrders: Number(dashStats.pendingOrders || 0),
                    activeCustomers: Number(dashStats.activeCustomers || 0),
                    lowStock: Number(dashStats.lowStock || 0),
                    completedProduction: Number(dashStats.completedProduction || 0),
                    avgProgress: Number(dashStats.avgProgress || 0),
                });

                setProductionOrders(Array.isArray(recentOrders.productionOrders) ? recentOrders.productionOrders : []);
                setLowStockItems(lowStockData);

                setProdStatusData([
                    { name: 'In Production', value: Number(prodSummary.in_production || 0), color: '#3b82f6' },
                    { name: 'Completed', value: Number(prodSummary.completed || 0), color: '#10b981' },
                    { name: 'Pending', value: Number(prodSummary.pending || 0), color: '#f59e0b' },
                    { name: 'On Hold', value: Number(prodSummary.on_hold || 0), color: '#f97316' },
                ]);

                setMonthlyProductionData(Array.isArray(chartData.monthlyProduction) ? chartData.monthlyProduction : []);
                setSalesTrendData(Array.isArray(chartData.salesTrend) ? chartData.salesTrend : []);
                setProdStatusData(Array.isArray(chartData.productionStatus) && chartData.productionStatus.length > 0
                    ? chartData.productionStatus
                    : [
                        { name: 'In Production', value: Number(prodSummary.in_production || 0), color: '#3b82f6' },
                        { name: 'Completed', value: Number(prodSummary.completed || 0), color: '#10b981' },
                        { name: 'Pending', value: Number(prodSummary.pending || 0), color: '#f59e0b' },
                        { name: 'On Hold', value: Number(prodSummary.on_hold || 0), color: '#f97316' },
                    ]);
                setMachineStatusData(Array.isArray(chartData.machineStatus) && chartData.machineStatus.length > 0
                    ? chartData.machineStatus
                    : []);
            } catch (error) {
                console.error('Dashboard fetch error:', error);
                toast(error?.message || 'Failed to load dashboard data', 'error');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [authLoading, session?.access_token, profile?.id, toast]);

    if (loading || authLoading)
        return <LoadingSpinner />;

    const roleLabel = profile ? ROLE_LABELS[profile.role] : '';

    return (<div className="space-y-6">
      <PageHeader title={`${roleLabel} Dashboard`} description={`Welcome back, ${profile?.full_name}. Here's your manufacturing overview.`}/>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Products" value={stats.products} icon={Package} color="blue"/>
        <KPICard label="Inventory Items" value={stats.inventory} icon={Boxes} color="indigo"/>
        <KPICard label="Active Production" value={stats.activeProduction} icon={Factory} color="teal"/>
        <KPICard label="Pending Orders" value={stats.pendingOrders} icon={ClipboardList} color="amber"/>
        <KPICard label="Active Customers" value={stats.activeCustomers} icon={Users} color="cyan"/>
        <KPICard label="Low Stock Items" value={stats.lowStock} icon={AlertTriangle} color="red"/>
        <KPICard label="Avg Progress" value={`${stats.avgProgress}%`} icon={Gauge} color="emerald"/>
        <KPICard label="Completed Orders" value={stats.completedProduction} icon={CheckCircle2} color="teal"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Monthly Production Output</h3>
              <p className="text-xs text-gray-500">Units produced over the last six months</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500"/>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyProductionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
              <Legend wrapperStyle={{ fontSize: '12px' }}/>
              <Bar dataKey="units" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Units Produced"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Sales Orders Trend</h3>
              <p className="text-xs text-gray-500">Monthly order volume and revenue</p>
            </div>
            <Activity className="w-5 h-5 text-emerald-500"/>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
              <Legend wrapperStyle={{ fontSize: '12px' }}/>
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Orders"/>
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Revenue ($)"/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Production Status</h3>
              <p className="text-xs text-gray-500">Current order distribution</p>
            </div>
            <Factory className="w-5 h-5 text-blue-500"/>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={prodStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name">
                {prodStatusData.map((entry, i) => (<Cell key={i} fill={entry.color}/>))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
              <Legend wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Machine Status</h3>
              <p className="text-xs text-gray-500">Derived from active production and inventory signals</p>
            </div>
            <Gauge className="w-5 h-5 text-teal-500"/>
          </div>
          <div className="space-y-3">
            {machineStatusData.length === 0 ? (
              <p className="text-sm text-gray-500">No machine status data available.</p>
            ) : (
              machineStatusData.map((m) => (<div key={m.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: m.color }}/>
                  <span className="text-sm text-gray-700">{m.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min((m.value / Math.max(machineStatusData.reduce((sum, item) => sum + item.value, 0), 1)) * 100, 100)}%`, background: m.color }}/>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{m.value}</span>
                </div>
              </div>))
            )}
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={machineStatusData} cx="50%" cy="50%" outerRadius={50} dataKey="value" nameKey="name">
                {machineStatusData.map((entry, i) => (<Cell key={i} fill={entry.color}/>))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Active Production Orders</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {productionOrders.filter((o) => o.status === 'in_production' || o.status === 'pending').slice(0, 6).map((order) => (<div key={order.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{order.production_number}</span>
                    <StatusBadge status={order.status}/>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{order.product_name} · Qty: {order.quantity} · {order.production_line}</p>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${order.progress >= 80 ? 'bg-emerald-500' : order.progress >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${order.progress}%` }}/>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">{order.progress}%</span>
              </div>))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Low Stock Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-amber-500"/>
          </div>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-500">No low stock alerts.</p>
            ) : (
              lowStockItems.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                    <p className="text-xs text-gray-500">Current stock: {item.current_stock}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700 uppercase tracking-wide">{item.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>);
}
