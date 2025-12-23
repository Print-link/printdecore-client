import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Home, History, Menu, X, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';

export const ProtectedLayout = () => {
  const { user, logout } = useAuth();
  const { cart, removeFromCart, getCartTotal, branchId } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname === '/history') return 'history';
    if (location.pathname === '/search') return 'search';
    if (location.pathname.startsWith('/order/cart')) return 'cart';
    return 'home';
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(false);

  useEffect(() => {
    if (location.pathname === '/history') {
      setActiveTab('history');
    } else if (location.pathname === '/search') {
      setActiveTab('search');
    } else if (location.pathname.startsWith('/order/cart')) {
      setActiveTab('cart');
    } else {
      setActiveTab('home');
    }
    // Close drawer on mobile when route changes
    if (window.innerWidth < 768) {
      setDrawerOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (tab: 'home' | 'history' | 'search' | 'cart') => {
    setActiveTab(tab);
    if (tab === 'home') {
      navigate('/');
    } else if (tab === 'history') {
      navigate('/history');
    } else if (tab === 'search') {
      navigate('/search');
    } else if (tab === 'cart' && branchId) {
      navigate(`/order/cart/${branchId}`);
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
			<div
				className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out shrink-0 ${
					drawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
				}`}
			>
				<div className="flex flex-col h-full">
					{/* Drawer Header */}
					<div className="flex items-center justify-between px-6 py-5 border-b-2 border-[#fbbf24] bg-[#fbbf24]">
						<h2 className="text-xl font-bold text-white">Print Station</h2>
						<button
							onClick={toggleDrawer}
							className="md:hidden p-1.5 text-white hover:bg-white/10 rounded transition-colors"
							aria-label="Close menu"
						>
							<X className="w-5 h-5" />
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
								<ShoppingCart
									className={`w-5 h-5 ${
										activeTab === "cart" ? "text-white" : "text-gray-500"
									}`}
								/>
								<span>Cart</span>
								{cart.length > 0 && (
									<span className="ml-auto bg-[#fbbf24] text-white text-xs font-bold px-2 py-0.5 rounded-full">
										{cart.length}
									</span>
								)}
							</button>
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
													navigate(`/order/cart/${branchId}`);
													if (window.innerWidth < 768) {
														setDrawerOpen(false);
													}
												}}
												className="w-full px-3 py-2 bg-[#fbbf24] text-white text-sm font-medium rounded-lg hover:bg-[#fbbf24] transition-colors"
											>
												View Cart
											</button>
										)}
									</div>
								)}
							</div>
						)}
					</nav>

					{/* Drawer Footer */}
					<div className="p-4 border-t-2 border-gray-200 bg-gray-50">
						<div className="mb-4 px-3 py-3 bg-white rounded-lg border-2 border-gray-200">
							<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
								Signed in as
							</p>
							<p className="text-sm font-semibold text-gray-900 truncate">
								{user?.firstName} {user?.lastName}
							</p>
							<p className="text-xs text-gray-500 truncate mt-0.5">
								{user?.email}
							</p>
						</div>
						<button
							onClick={handleLogout}
							className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-300 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 hover:border-red-400 transition-all touch-manipulation"
						>
							<LogOut className="w-4 h-4" />
							<span>Logout</span>
						</button>
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
				<header className="bg-white border-b-2 border-gray-200 sticky top-0 z-30">
					<div className="px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-16">
							<div className="flex items-center gap-3">
								{/* Menu Button - Only visible on mobile */}
								<button
									onClick={toggleDrawer}
									className="md:hidden p-2 text-gray-700 hover:text-[#fbbf24] hover:bg-white rounded-lg transition-colors touch-manipulation"
									aria-label="Toggle menu"
								>
									{drawerOpen ? (
										<X className="w-6 h-6" />
									) : (
										<Menu className="w-6 h-6" />
									)}
								</button>
								<h1 className="text-xl font-bold text-gray-900 md:hidden">
									Print Station
								</h1>
								{/* Desktop Title */}
								<h1 className="hidden md:block text-xl font-bold text-gray-900">
									{activeTab === "home"
										? "Print Stations"
										: activeTab === "search"
										? "Search"
										: activeTab === "cart"
										? "Shopping Cart"
										: "Print History"}
								</h1>
							</div>
							<div className="flex items-center space-x-4">
								{/* Search Icon - Only visible on mobile */}
								<button
									onClick={() => {
										navigate("/search");
										if (window.innerWidth < 768) {
											setDrawerOpen(false);
										}
									}}
									className="md:hidden p-2 text-gray-700 hover:text-[#fbbf24] hover:bg-white rounded-lg transition-colors touch-manipulation"
									aria-label="Search"
								>
									<Search className="w-6 h-6" />
								</button>
								<span className="hidden sm:inline text-sm text-gray-600">
									Welcome,{" "}
									<span className="font-semibold text-gray-900">
										{user?.firstName} {user?.lastName}
									</span>
								</span>
								<button
									onClick={handleLogout}
									className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#fbbf24] hover:bg-white rounded-lg transition-colors touch-manipulation"
									aria-label="Logout"
								>
									<LogOut className="w-4 h-4 sm:mr-2" />
									<span className="hidden sm:inline">Logout</span>
								</button>
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

