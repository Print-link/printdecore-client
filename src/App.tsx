import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { SendOTP } from "./pages/SendOTP";
import { VerifyOTP } from "./pages/VerifyOTP";
import { Home } from "./pages/Home";
import { Landing } from "./pages/Landing";
import { History } from "./pages/History";
import { Search } from "./pages/Search";
import { PrintStationDetails } from "./pages/PrintStationDetails";
import { Categories } from "./pages/Categories";
import { OrderDetails } from "./pages/OrderDetails";
import { PaymentCallback } from "./pages/PaymentCallback";
import { QuoteConfirmation } from "./pages/QuoteConfirmation";
import { SubCategories } from "./pages/SubCategories";
import { ServiceTemplates } from "./pages/ServiceTemplates";
import { AgentServices } from "./pages/AgentServices";
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

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="w-8 h-8 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<Routes>
			{/* Public Landing Page - Redirect authenticated users to home */}
			<Route 
				path="/" 
				element={user ? <Navigate to="/home" replace /> : <Landing />} 
			/>
			
			{/* Auth Routes */}
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
			
			{/* Public Routes - Landing page accessible even when authenticated */}
			<Route path="/payment/callback" element={<PaymentCallback />} />
			<Route path="/landing" element={<Landing />} />
			<Route path="/welcome" element={<Landing />} />
			
			{/* Protected Routes */}
			<Route
				path="/quote/confirm"
				element={
					<ProtectedRoute>
						<QuoteConfirmation />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/home"
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
				{/* New Order Flow Routes */}
				<Route
					path="order/sub-categories/:branchId"
					element={<SubCategories />}
				/>
				<Route
					path="order/service-templates/:branchId"
					element={<ServiceTemplates />}
				/>
				<Route
					path="order/agent-services/:branchId"
					element={<AgentServices />}
				/>
				<Route path="order/configure/:branchId" element={<OrderForm />} />
				<Route path="order/cart/:branchId" element={<Cart />} />
				<Route path="order/checkout/:branchId" element={<Checkout />} />
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
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
