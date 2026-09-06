import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { customerApi, normalizeListResponse } from '@/services/api';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await customerApi.getOrders();
        setOrders(normalizeListResponse(response));
      } catch (err) {
        setError(err?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Orders" description="Review your recent and active orders." />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Order</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">{order.order_number || 'Order'}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {order.status || 'pending'}
                  </span>
                  <Link
                    to={`/customer/orders/${order.id}`}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {order.order_date ? new Date(order.order_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Items</p>
                  <p className="font-medium text-gray-900">{Number(order.item_count || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
