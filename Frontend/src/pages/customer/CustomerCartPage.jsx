import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { customerApi } from '@/services/api';

const CART_KEY = 'smartfactory_customer_cart';

const readCart = () => {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const writeCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items));

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

export default function CustomerCartPage() {
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCart(readCart());
    const onCartChange = () => setCart(readCart());
    window.addEventListener('smartfactory-cart-updated', onCartChange);
    return () => window.removeEventListener('smartfactory-cart-updated', onCartChange);
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0),
    [cart]
  );

  const updateQuantity = (productId, delta) => {
    const next = cart
      .map((item) => {
        if (item.product_id !== productId) return item;
        const updatedQuantity = Number(item.quantity || 0) + delta;
        return { ...item, quantity: updatedQuantity > 0 ? updatedQuantity : 0 };
      })
      .filter((item) => item.quantity > 0);

    setCart(next);
    writeCart(next);
    window.dispatchEvent(new Event('smartfactory-cart-updated'));
  };

  const removeItem = (productId) => {
    const next = cart.filter((item) => item.product_id !== productId);
    setCart(next);
    writeCart(next);
    window.dispatchEvent(new Event('smartfactory-cart-updated'));
  };

  const placeOrder = async () => {
    if (!cart.length) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: Number(item.unit_price || 0),
          quantity: Number(item.quantity || 0),
        })),
        total_amount: subtotal,
      };

      await customerApi.createOrder(payload);
      setCart([]);
      writeCart([]);
      window.dispatchEvent(new Event('smartfactory-cart-updated'));
    } catch (err) {
      setError(err?.message || 'Unable to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shopping Cart" description="Review your selected products before checkout." />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {cart.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Your cart is empty</h3>
          <p className="mt-2 text-sm text-gray-500">Add products from the catalog to start a new order.</p>
          <Link
            to="/customer/products"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.product_id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{item.product_name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{formatCurrency(item.unit_price)} each</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-gray-300">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="px-3 py-2 text-gray-700 hover:bg-gray-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-10 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="px-3 py-2 text-gray-700 hover:bg-gray-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>Line total</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(Number(item.unit_price || 0) * Number(item.quantity || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={placeOrder}
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {submitting ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
