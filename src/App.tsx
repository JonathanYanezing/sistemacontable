import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Inventory from './pages/Inventory';
import Clients from './pages/Clients';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Payroll from './pages/Payroll';
import WorkOrders from './pages/WorkOrders';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Company from './pages/Company';

function App() {
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="company" element={<Company />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="clients" element={<Clients />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;












