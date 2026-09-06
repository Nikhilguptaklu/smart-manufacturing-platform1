import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { customerApi, normalizeObjectResponse } from '@/services/api';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

export default function CustomerOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await customerApi.getOrder(id);
        setOrder(normalizeObjectResponse(response));
      } catch (err) {
        setError(err?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadOrder();
  }, [id]);

  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading order details...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        <Link to="/customer/orders" className="inline-flex items-center gap-2 text-sm text-blue-600">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageHeader title={order.order_number || 'Order Details'} description="Review items and status for this purchase." />
        <Link to="/customer/orders" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{order.status || 'pending'}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrency(order.total_amount)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Items</h3>
        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No items available for this order.</p>
          ) : (
            items.map((item, index) => (
              <div key={`${item.product_id || index}`} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-900">{item.product_name || 'Product'}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity || 0}</p>
                </div>
                <p className="font-medium text-gray-700">{formatCurrency(Number(item.unit_price || 0) * Number(item.quantity || 0))}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
