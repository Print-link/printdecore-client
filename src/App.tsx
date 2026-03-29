import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { usePaymentRecovery } from "./hooks/usePaymentRecovery";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { SendOTP } from "./pages/SendOTP";
import { VerifyOTP } from "./pages/VerifyOTP";
import { Home } from "./pages/Home";

import { History } from "./pages/History";
import { Search } from "./pages/Search";
import { PrintStationDetails } from "./pages/PrintStationDetails";
import { Categories } from "./pages/Categories";
import { OrderDetails } from "./pages/OrderDetails";
import { PaymentCallback } from "./pages/PaymentCallback";
import { QuoteConfirmation } from "./pages/QuoteConfirmation";
import { WhatsAppQuotePayment } from "./pages/WhatsAppQuotePayment";
import { SubCategories } from "./pages/SubCategories";
import { OrderForm } from "./pages/OrderForm";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});

const AppRoutes = () => {
	const { user, isLoading } = useAuth();
	usePaymentRecovery();

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="w-8 h-8 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<Routes>
			{/* Root route - redirect to home (now accessible without auth) */}
			<Route path="/" element={<Navigate to="/home" replace />} />
			
			{/* Auth Routes - redirect to home if already authenticated */}
			<Route
				path="/login"
				element={user ? <Navigate to="/home" replace /> : <Login />}
			/>
			<Route
				path="/send-otp"
				element={user ? <Navigate to="/home" replace /> : <SendOTP />}
			/>
			<Route
				path="/verify-otp"
				element={user ? <Navigate to="/home" replace /> : <VerifyOTP />}
			/>
			<Route
				path="/register"
				element={user ? <Navigate to="/home" replace /> : <Register />}
			/>
			
			{/* Public Routes */}
			<Route path="/payment/callback" element={<PaymentCallback />} />
			<Route path="/quote/pay/:token" element={<WhatsAppQuotePayment />} />
			
			{/* Main App Routes - Accessible without authentication */}
			<Route path="/home" element={<ProtectedLayout />}>
				<Route index element={<Home />} />
				<Route path="search" element={<Search />} />
				<Route path="categories/:id" element={<Categories />} />
				<Route path="print-station/:id" element={<PrintStationDetails />} />
				
				{/* Protected Routes - Require authentication */}
				<Route
					path="history"
					element={
						<ProtectedRoute>
							<History />
						</ProtectedRoute>
					}
				/>
				<Route
					path="order/:id"
					element={
						<ProtectedRoute>
							<OrderDetails />
						</ProtectedRoute>
					}
				/>
				<Route
					path="order/sub-categories/:branchId"
					element={
						<ProtectedRoute>
							<SubCategories />
						</ProtectedRoute>
					}
				/>
				<Route
					path="order/configure/:branchId"
					element={
						<ProtectedRoute>
							<OrderForm />
						</ProtectedRoute>
					}
				/>
				<Route
					path="order/cart/:branchId"
					element={
						<ProtectedRoute>
							<Cart />
						</ProtectedRoute>
					}
				/>
				<Route
					path="order/checkout/:branchId"
					element={
						<ProtectedRoute>
							<Checkout />
						</ProtectedRoute>
					}
				/>
				<Route
					path="quote/confirm"
					element={
						<ProtectedRoute>
							<QuoteConfirmation />
						</ProtectedRoute>
					}
				/>
			</Route>
			
			<Route path="*" element={<Navigate to="/home" replace />} />
		</Routes>
	);
};

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<BrowserRouter>
					<AuthProvider>
						<CartProvider>
							<AppRoutes />
						</CartProvider>
					</AuthProvider>
				</BrowserRouter>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
