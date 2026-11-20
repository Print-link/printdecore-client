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
import { OrderDetails } from "./pages/OrderDetails";
import { PaymentCallback } from "./pages/PaymentCallback";
import { QuoteConfirmation } from "./pages/QuoteConfirmation";
import { WhatsAppQuotePayment } from "./pages/WhatsAppQuotePayment";
import { ArtWorks } from "./pages/ArtWorks";
import { ArtWorkDetail } from "./pages/ArtWorkDetail";
import { CatalogueCategory } from "./pages/CatalogueCategory";
import { ConfigureProduct } from "./pages/ConfigureProduct";
import { Shops } from "./pages/Shops";
import { Shop } from "./pages/Shop";
import { ShopProduct } from "./pages/ShopProduct";
import { Tray } from "./pages/Tray";
import { PrintAssistant } from "./pages/PrintAssistant";
import { PrintAgent, ShopAssistant } from "./pages/PrintAgent";
import { PrintRequestDetails } from "./pages/PrintRequestDetails";

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
					<Route path="artworks" element={<ArtWorks />} />
					<Route path="artworks/:id" element={<ArtWorkDetail />} />
				{/* Ordering: guests can browse and price; sign-in is asked when it's needed */}
				<Route path="category/:id" element={<CatalogueCategory />} />
				<Route path="product/:serviceTemplateId" element={<ConfigureProduct />} />
				<Route path="shops" element={<Shops />} />
				<Route path="shops/:id" element={<Shop />} />
				<Route path="shops/:id/products/:agentServiceId" element={<ShopProduct />} />
				<Route path="shops/:id/assistant" element={<ShopAssistant />} />
				<Route path="tray" element={<Tray />} />
				<Route path="print-assistant" element={<PrintAgent />} />
				<Route path="print-assistant/form" element={<PrintAssistant />} />

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
					path="print-request/:id"
					element={
						<ProtectedRoute>
							<PrintRequestDetails />
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
