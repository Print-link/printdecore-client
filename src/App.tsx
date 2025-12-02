import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedLayout } from './components/ProtectedLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SendOTP } from './pages/SendOTP';
import { VerifyOTP } from './pages/VerifyOTP';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Search } from './pages/Search';
import { PrintStationDetails } from './pages/PrintStationDetails';
import { Categories } from './pages/Categories';
import { OrderDetails } from './pages/OrderDetails';

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/send-otp" element={user ? <Navigate to="/" replace /> : <SendOTP />} />
      <Route path="/verify-otp" element={user ? <Navigate to="/" replace /> : <VerifyOTP />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProtectedLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="history" element={<History />} />
        <Route path="search" element={<Search />} />
        <Route path="order/:id" element={<OrderDetails />} />
        <Route path="categories/:id" element={<Categories />} />
        <Route path="print-station/:id" element={<PrintStationDetails />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
