import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import ErpPage from '@/pages/erp/ErpPage';
import InventoryPage from '@/pages/InventoryPage';
import ProductionPage from '@/pages/ProductionPage';
import PlmPage from '@/pages/PlmPage';
import CrmPage from '@/pages/CrmPage';
import ReportsPage from '@/pages/ReportsPage';
import UsersPage from '@/pages/UsersPage';
import SettingsPage from '@/pages/SettingsPage';
import CustomerPortal from '@/pages/customer/CustomerPortal';

function RootRedirect() {
    const { session, profile, loading } = useAuth();
    if (loading)
        return <FullPageSpinner />;
    if (!session)
        return <Navigate to="/login" replace/>;
    if (profile?.role === 'customer')
        return <Navigate to="/customer" replace/>;
    return <Navigate to="/dashboard" replace/>;
}

export default function App() {
    return (<AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />}/>
            <Route path="/register" element={<RegisterPage />}/>
            <Route path="/" element={<RootRedirect />}/>

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<ProtectedRoute module="dashboard"><DashboardPage /></ProtectedRoute>} />
              <Route path="erp/*" element={<ProtectedRoute module="erp"><ErpPage /></ProtectedRoute>} />
              <Route path="inventory" element={<ProtectedRoute module="inventory"><InventoryPage /></ProtectedRoute>} />
              <Route path="production" element={<ProtectedRoute module="production"><ProductionPage /></ProtectedRoute>} />
              <Route path="plm" element={<ProtectedRoute module="plm"><PlmPage /></ProtectedRoute>} />
              <Route path="crm" element={<ProtectedRoute module="crm"><CrmPage /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute module="reports"><ReportsPage /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute module="users"><UsersPage /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute module="settings"><SettingsPage /></ProtectedRoute>} />
              <Route path="customer/*" element={<ProtectedRoute module="customer"><CustomerPortal /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace/>}/>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>);
}
