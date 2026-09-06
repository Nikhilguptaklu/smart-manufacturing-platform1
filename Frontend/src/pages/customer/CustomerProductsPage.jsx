import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { customerApi, normalizeListResponse } from '@/services/api';

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

export default function CustomerProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await customerApi.getProducts();
        setProducts(normalizeListResponse(response));
      } catch (err) {
        setError(err?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const addQuickToCart = (product) => {
    const cart = readCart();
    const existing = cart.find((item) => item.product_id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ product_id: product.id, product_name: product.product_name, unit_price: Number(product.unit_price || 0), quantity: 1 });
    }

    writeCart(cart);
    window.dispatchEvent(new Event('smartfactory-cart-updated'));
  };

  const filteredProducts = products.filter((product) => {
    const term = search.toLowerCase();
    return !term || product.product_name?.toLowerCase().includes(term) || product.product_code?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Browse available products and place an order." />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm outline-none ring-0 focus:border-blue-500"
            placeholder="Search products..."
          />
        </div>
        <Link to="/customer/cart" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <ShoppingCart className="h-4 w-4" />
          Cart
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading products...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No products available.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{product.category}</p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">{product.product_name}</h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{product.status}</span>
                </div>

                <p className="mt-3 text-sm text-gray-600">{product.description || 'No description available.'}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Product code</p>
                    <p className="text-sm font-medium text-gray-900">{product.product_code}</p>
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    {Number(product.unit_price || 0).toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </p>
                </div>

                <div className="mt-5 flex gap-2">
                  <Link
                    to={`/customer/products/${product.id}`}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => addQuickToCart(product)}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
