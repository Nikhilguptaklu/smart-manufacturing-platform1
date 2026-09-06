import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import ProductsTab from './ProductsTab';
import SalesOrdersTab from './SalesOrdersTab';
import SuppliersTab from './SuppliersTab';
const TABS = [
    { key: 'products', label: 'Products', path: '/erp/products' },
    { key: 'orders', label: 'Sales Orders', path: '/erp/orders' },
    { key: 'suppliers', label: 'Suppliers', path: '/erp/suppliers' },
];
export default function ErpPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('products');
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enterprise Resource Planning</h1>
        <p className="text-sm text-gray-500 mt-1">Manage products, sales orders, and suppliers</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (<button key={tab.key} onClick={() => { setActiveTab(tab.key); navigate(tab.path); }} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>))}
      </div>

      <Routes>
        <Route path="products" element={<ProductsTab />}/>
        <Route path="orders" element={<SalesOrdersTab />}/>
        <Route path="suppliers" element={<SuppliersTab />}/>
      </Routes>
    </div>);
}
