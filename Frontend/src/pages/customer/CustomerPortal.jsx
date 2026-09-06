import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import CustomerDashboardPage from './CustomerDashboardPage';
import CustomerProductsPage from './CustomerProductsPage';
import CustomerProductDetailPage from './CustomerProductDetailPage';
import CustomerCartPage from './CustomerCartPage';
import CustomerOrdersPage from './CustomerOrdersPage';
import CustomerOrderDetailPage from './CustomerOrderDetailPage';
import CustomerProfilePage from './CustomerProfilePage';

const navItems = [
  { to: '/customer', label: 'Dashboard' },
  { to: '/customer/products', label: 'Products' },
  { to: '/customer/cart', label: 'Cart' },
  { to: '/customer/orders', label: 'My Orders' },
  { to: '/customer/profile', label: 'Profile' },
];

export default function CustomerPortal() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Routes>
        <Route index element={<CustomerDashboardPage />} />
        <Route path="products" element={<CustomerProductsPage />} />
        <Route path="products/:id" element={<CustomerProductDetailPage />} />
        <Route path="cart" element={<CustomerCartPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
        <Route path="orders/:id" element={<CustomerOrderDetailPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
        <Route path="*" element={<Navigate to="/customer" replace />} />
      </Routes>
    </div>
  );
}
