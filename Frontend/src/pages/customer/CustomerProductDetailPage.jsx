import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { customerApi, normalizeObjectResponse } from '@/services/api';

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

export default function CustomerProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await customerApi.getProduct(id);
        setProduct(normalizeObjectResponse(response));
      } catch (err) {
        setError(err?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadProduct();
  }, [id]);

  const addToCart = () => {
    if (!product) return;

    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      setError('Quantity must be a whole number greater than zero.');
      return;
    }

    const cart = readCart();
    const existing = cart.find((item) => item.product_id === product.id);

    if (existing) {
      existing.quantity += parsedQty;
    } else {
      cart.push({
        product_id: product.id,
        product_name: product.product_name,
        unit_price: Number(product.unit_price || 0),
        quantity: parsedQty,
      });
    }

    writeCart(cart);
    window.dispatchEvent(new Event('smartfactory-cart-updated'));
    navigate('/customer/cart');
  };

  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading product...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        <Link to="/customer/products" className="inline-flex items-center gap-2 text-sm text-blue-600">
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Link to="/customer/products" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600">
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{product.category}</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{product.product_name}</h1>
            <p className="mt-3 text-gray-600">{product.description || 'No description available.'}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Price</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {Number(product.unit_price || 0).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </p>

            <div className="mt-5">
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={addToCart}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
