import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
	LogOut,
	Home,
	History,
	Menu,
	X,
	Search,
	Trash2,
	Moon,
	Sun,
	PrinterIcon,
	User,
	LogIn,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLocationAccess } from "../hooks/useLocationAccess";
import { LocationBanner } from "./banners/LocationBanner";
import { LocationModal } from "./modals/LocationModal";
import { Logo } from "./Logo";

export const ProtectedLayout = () => {
	const { user, logout } = useAuth();
	const { cart, removeFromCart, getCartTotal, branchId } = useCart();
	const {
		hasLocation,
		needsPermission,
		permission,
		error,
		isLoading,
		requestLocation,
	} = useLocationAccess();
	const { theme, toggleTheme } = useTheme();
	const navigate = useNavigate();
	const location = useLocation();

	const [activeTab, setActiveTab] = useState(() => {
		if (location.pathname.includes("/history")) return "history";
		if (location.pathname.includes("/search")) return "search";
		if (location.pathname.includes("/order/cart")) return "cart";
		return "home";
	});
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [cartExpanded, setCartExpanded] = useState(false);

	useEffect(() => {
		if (location.pathname.includes("/history")) {
			setActiveTab("history");
		} else if (location.pathname.includes("/search")) {
			setActiveTab("search");
		} else if (location.pathname.includes("/order/cart")) {
			setActiveTab("cart");
		} else {
			setActiveTab("home");
		}
		// Close drawer on mobile when route changes
		if (window.innerWidth < 768) {
			setDrawerOpen(false);
		}
	}, [location.pathname]);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

const handleTabChange = (tab: "home" | "history" | "search" | "cart") => {
		// Check if user is trying to access protected features without authentication
		if (!user && (tab === "history" || tab === "cart")) {
			navigate("/login");
			return;
		}
		
		setActiveTab(tab);
		if (tab === "home") {
			navigate("/home");
		} else if (tab === "history") {
			navigate("/home/history");
		} else if (tab === "search") {
			navigate("/home/search");
		} else if (tab === "cart" && branchId) {
			navigate(`/home/order/cart/${branchId}`);
		}
		// Close drawer on mobile when navigation item is clicked
		if (window.innerWidth < 768) {
			setDrawerOpen(false);
		}
	};

	const handleRemoveFromCart = (itemId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		removeFromCart(itemId);
	};

	const toggleDrawer = () => {
		setDrawerOpen(!drawerOpen);
	};

	return (
		<div className="min-h-screen bg-gray-50 flex">
			{/* Side Drawer - Always visible on desktop, toggleable on mobile */}
			<LocationBanner
				hasLocation={hasLocation}
				needsPermission={needsPermission}
			/>

			<LocationModal
				isOpen={needsPermission}
				permission={permission}
				error={error}
				isLoading={isLoading}
				onRequestLocation={requestLocation}
			/>

			<div
				className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out shrink-0 ${
					drawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
				}`}
			>
				<div className="flex flex-col h-full">
					{/* Drawer Header */}
					<div className="flex items-center justify-between px-6 h-20 border-b-2 border-[#fbbf24] bg-white dark:bg-[#1a1a1a]">
						<Logo
							size="xl"
							onClick={() => navigate("/home")}
							className="cursor-pointer"
						/>
						<button
							onClick={toggleDrawer}
							className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors md:hidden"
							aria-label="Close menu"
						>
							<X className="w-6 h-6" />
						</button>
					</div>

					{/* Drawer Navigation */}
					<nav className="flex-1 px-4 py-6 overflow-y-auto">
						<div className="space-y-1">
							<button
								onClick={() => handleTabChange("home")}
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-base transition-all touch-manipulation ${
									activeTab === "home"
										? "bg-[#fbbf24] text-white border-2 border-[#fbbf24]"
										: "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-2 border-transparent"
								}`}
							>
								<Home
									className={`w-5 h-5 ${
										activeTab === "home" ? "text-white" : "text-gray-500"
									}`}
								/>
								<span>Home</span>
							</button>
							<button
								onClick={() => handleTabChange("search")}
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-base transition-all touch-manipulation ${
									activeTab === "search"
										? "bg-[#fbbf24] text-white border-2 border-[#fbbf24]"
										: "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-2 border-transparent"
								}`}
							>
								<Search
									className={`w-5 h-5 ${
										activeTab === "search" ? "text-white" : "text-gray-500"
									}`}
								/>
								<span>Search</span>
							</button>
{user && (
							<>
								<button
									onClick={() => handleTabChange("history")}
									className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-base transition-all touch-manipulation ${
										activeTab === "history"
											? "bg-[#fbbf24] text-white border-2 border-[#fbbf24]"
											: "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-2 border-transparent"
									}`}
								>
									<History
										className={`w-5 h-5 ${
											activeTab === "history" ? "text-white" : "text-gray-500"
										}`}
									/>
									<span>Print History</span>
								</button>
								<button
									onClick={() => {
										if (branchId) {
											handleTabChange("cart");
										} else {
											// If no branchId, can't navigate to cart
											return;
										}
									}}
									disabled={!branchId || cart.length === 0}
									className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-base transition-all touch-manipulation relative ${
										activeTab === "cart"
											? "bg-[#fbbf24] text-white border-2 border-[#fbbf24]"
											: "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-2 border-transparent"
									} ${
										!branchId || cart.length === 0
											? "opacity-50 cursor-not-allowed"
											: ""
									}`}
								>
									<PrinterIcon
										className={`w-5 h-5 ${
											activeTab === "cart" ? "text-white" : "text-gray-500"
										}`}
									/>
									<span>Printing Tray</span>
									{cart.length > 0 && (
										<span className="ml-auto bg-[#fbbf24] text-white text-xs font-bold px-2 py-0.5 rounded-full">
											{cart.length}
										</span>
									)}
								</button>
							</>
						)}
						</div>

						{/* Cart Items Display */}
						{cart.length > 0 && (
							<div className="mt-6 pt-6 border-t border-gray-200">
								<button
									onClick={() => setCartExpanded(!cartExpanded)}
									className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
								>
									<span>Cart Items ({cart.length})</span>
									<span className="text-xs text-gray-500">
										{cartExpanded ? "Hide" : "Show"}
									</span>
								</button>
								{cartExpanded && (
									<div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
										{cart.map((item) => (
											<div
												key={item.id}
												className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-[#fbbf24] transition-colors"
											>
												<div className="flex items-start justify-between gap-2">
													<div className="flex-1 min-w-0">
														<p className="text-xs font-medium text-gray-900 truncate">
															{item.width && item.height
																? `${item.width}×${item.height} ${item.measurementUnit}`
																: "Service Item"}
														</p>
														<p className="text-xs text-gray-600 mt-0.5">
															Qty: {item.quantity}
														</p>
														<p className="text-xs font-semibold text-[#fbbf24] mt-1">
															GHS {item.calculatedPrice.toFixed(2)}
														</p>
													</div>
													<button
														onClick={(e) => handleRemoveFromCart(item.id, e)}
														className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors shrink-0"
														aria-label="Remove item"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											</div>
										))}
									</div>
								)}
								{cartExpanded && (
									<div className="mt-3 pt-3 border-t border-gray-200">
										<div className="flex items-center justify-between px-2 mb-2">
											<span className="text-sm font-semibold text-gray-900">
												Total:
											</span>
											<span className="text-sm font-bold text-[#fbbf24]">
												GHS {getCartTotal().toFixed(2)}
											</span>
										</div>
										{branchId && (
											<button
												onClick={() => {
													navigate(`/home/order/cart/${branchId}`);
													if (window.innerWidth < 768) {
														setDrawerOpen(false);
													}
												}}
												className="w-full px-3 py-2 bg-[#fbbf24] text-white text-sm font-medium rounded-lg hover:bg-[#fbbf24] transition-colors"
											>
												View Tray
											</button>
										)}
									</div>
								)}
							</div>
						)}
					</nav>

{/* Drawer Footer */}
					<div className="p-4 border-t-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#262626]">
						{user ? (
							<div className="space-y-3">
								<div className="px-4 py-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
									<p className="text-[10px] font-bold text-[#fbbf24] uppercase tracking-wider mb-1">
										Account
									</p>
									<p className="text-sm font-bold text-gray-900 dark:text-white truncate">
										{user?.firstName} {user?.lastName}
									</p>
									<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
										{user?.email}
									</p>
								</div>
								
								<div className="grid grid-cols-2 gap-2">
									<button
										onClick={toggleTheme}
										className="flex flex-col items-center justify-center gap-1 p-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:border-[#fbbf24] dark:hover:border-[#fbbf24] transition-all group"
									>
										{theme === "light" ? (
											<Moon className="w-5 h-5 text-gray-600 group-hover:text-[#fbbf24]" />
										) : (
											<Sun className="w-5 h-5 text-[#fbbf24]" />
										)}
										<span className="text-[10px] font-bold text-gray-500 uppercase">Theme</span>
									</button>
									<button
										onClick={handleLogout}
										className="flex flex-col items-center justify-center gap-1 p-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:border-red-500 dark:hover:border-red-500 transition-all group"
									>
										<LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-500" />
										<span className="text-[10px] font-bold text-gray-500 uppercase">Logout</span>
									</button>
								</div>
							</div>
						) : (
							<div className="space-y-3">
								<div className="px-4 py-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
									<p className="text-[10px] font-bold text-[#fbbf24] uppercase tracking-wider mb-1">
										Guest Mode
									</p>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										Sign in to place orders and sync history
									</p>
								</div>
								
								<div className="space-y-2">
									<button
										onClick={() => navigate("/login")}
										className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-white rounded-xl font-bold text-sm transition-all shadow-sm"
									>
										<LogIn className="w-4 h-4" />
										<span>Sign In</span>
									</button>
									<div className="grid grid-cols-2 gap-2">
										<button
											onClick={toggleTheme}
											className="flex flex-col items-center justify-center gap-1 p-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:border-[#fbbf24] transition-all group"
										>
											{theme === "light" ? (
												<Moon className="w-4 h-4 text-gray-600 group-hover:text-[#fbbf24]" />
											) : (
												<Sun className="w-4 h-4 text-[#fbbf24]" />
											)}
											<span className="text-[10px] font-bold text-gray-500 uppercase">Theme</span>
										</button>
										<button
											onClick={() => navigate("/register")}
											className="flex flex-col items-center justify-center gap-1 p-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:border-[#fbbf24] transition-all group"
										>
											<User className="w-4 h-4 text-gray-600 group-hover:text-[#fbbf24]" />
											<span className="text-[10px] font-bold text-gray-500 uppercase">Join</span>
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Mobile Drawer Overlay */}
			{drawerOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
					onClick={toggleDrawer}
				/>
			)}

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Header */}
				<header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 h-20 shadow-sm">
					<div className="px-4 sm:px-6 lg:px-8 h-full mx-auto w-full">
						<div className="flex items-center justify-between h-full gap-4">
							<div className="flex items-center gap-4 min-w-0">
								{/* Menu Button - Only visible on mobile */}
								<button
									onClick={toggleDrawer}
									className="md:hidden p-2.5 text-gray-700 dark:text-gray-300 hover:text-[#fbbf24] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all touch-manipulation flex-shrink-0"
									aria-label="Toggle menu"
								>
									{drawerOpen ? (
										<X className="w-6 h-6" />
									) : (
										<Menu className="w-6 h-6" />
									)}
								</button>
								
								{/* Mobile Logo */}
								<div className="md:hidden flex-shrink-0">
									<Logo
										size="md"
										onClick={() => navigate("/home")}
										className="cursor-pointer"
									/>
								</div>
								
								{/* Desktop Title */}
								<div className="hidden md:flex flex-col">
									<h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
										{activeTab === "home"
											? "Print Agents"
											: activeTab === "search"
											? "Search Services"
											: activeTab === "cart"
											? "Printing Tray"
											: "Print History"}
									</h1>
									<p className="text-[10px] font-bold text-[#fbbf24] uppercase tracking-widest">
										{activeTab === "home" ? "Find branch near you" : "Printdecore Dashboard"}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
								{/* Desktop Welcome Text */}
								{user && (
									<div className="hidden sm:flex flex-col items-end min-w-0">
										<p className="text-xs text-gray-500 dark:text-gray-400">Welcome back,</p>
										<p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
											{user?.firstName} {user?.lastName}
										</p>
									</div>
								)}

								<div className="flex items-center bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-100 dark:border-gray-800">
									{/* Search Icon - Only visible on mobile */}
									<button
										onClick={() => {
											navigate("/home/search");
											if (window.innerWidth < 768) {
												setDrawerOpen(false);
											}
										}}
										className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-[#fbbf24] rounded-lg transition-colors"
										aria-label="Search"
									>
										<Search className="w-5 h-5" />
									</button>
									
									{/* Theme Toggle */}
									<button
										onClick={toggleTheme}
										className="p-2 text-gray-700 dark:text-gray-300 hover:text-[#fbbf24] rounded-lg transition-colors"
										aria-label="Toggle theme"
									>
										{theme === "light" ? (
											<Moon className="w-5 h-5" />
										) : (
											<Sun className="w-5 h-5 text-[#fbbf24]" />
										)}
									</button>
									
									{/* User/Auth Dropdown Shortcut (Mobile Only) */}
									{!user && (
										<button
											onClick={() => navigate("/login")}
											className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-[#fbbf24] rounded-lg transition-colors"
											aria-label="Login"
										>
											<LogIn className="w-5 h-5" />
										</button>
									)}
								</div>

								{/* Desktop Auth Buttons */}
								<div className="hidden md:flex items-center gap-3">
									{user ? (
										<button
											onClick={handleLogout}
											className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
										>
											<LogOut className="w-4 h-4" />
											<span>Logout</span>
										</button>
									) : (
										<>
											<button
												onClick={() => navigate("/login")}
												className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-[#fbbf24] px-3 py-2 transition-colors"
											>
												Sign In
											</button>
											<button
												onClick={() => navigate("/register")}
												className="px-4 py-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-white text-sm font-bold rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5"
											>
												Get Started
											</button>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<main className="flex-1 overflow-y-auto bg-gray-50">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
};
