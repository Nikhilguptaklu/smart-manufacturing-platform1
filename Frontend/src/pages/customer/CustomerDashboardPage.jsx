import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, PackageCheck, ShoppingCart, Truck } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import KPICard from '@/components/ui/KPICard';
import DataTable from '@/components/ui/DataTable';
import { customerApi, normalizeObjectResponse } from '@/services/api';

export default function CustomerDashboardPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    productionOrders: 0,
    completedOrders: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await customerApi.getDashboard();
        const payload = normalizeObjectResponse(response, {
          totalOrders: 0,
          pendingOrders: 0,
          productionOrders: 0,
          completedOrders: 0,
          recentOrders: [],
        });
        setStats({
          totalOrders: payload?.totalOrders ?? 0,
          pendingOrders: payload?.pendingOrders ?? 0,
          productionOrders: payload?.productionOrders ?? 0,
          completedOrders: payload?.completedOrders ?? 0,
          recentOrders: Array.isArray(payload?.recentOrders) ? payload.recentOrders : [],
        });
      } catch (err) {
        setError(err?.message || 'Failed to load customer dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const recentOrders = (stats.recentOrders || []).map((order) => ({
    ...order,
    totalDisplay: Number(order.total_amount || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    }),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Dashboard"
        description="Track your orders, product availability, and status updates."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Total Orders" value={stats.totalOrders} icon={ClipboardList} color="blue" />
        <KPICard label="Pending" value={stats.pendingOrders} icon={ShoppingCart} color="amber" />
        <KPICard label="In Production" value={stats.productionOrders} icon={Truck} color="teal" />
        <KPICard label="Completed" value={stats.completedOrders} icon={PackageCheck} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Quick actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/customer/products"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/customer/orders"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              My Orders
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Recent orders</h3>
          <div className="mt-4 space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500">No recent orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.order_number || 'Order'}</p>
                    <p className="text-xs text-gray-500">{order.status || 'pending'}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{order.totalDisplay}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <DataTable
        loading={loading}
        data={recentOrders}
        emptyTitle="No orders found"
        emptyDescription="Once you place an order it will appear here."
        columns={[
          { key: 'order_number', header: 'Order', render: (row) => <span className="font-medium text-gray-900">{row.order_number}</span> },
          { key: 'status', header: 'Status', render: (row) => <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{row.status}</span> },
          { key: 'total_amount', header: 'Total', render: (row) => Number(row.total_amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) },
          { key: 'order_date', header: 'Date', render: (row) => row.order_date ? new Date(row.order_date).toLocaleDateString() : '—' },
        ]}
      />
    </div>
  );
}
