import { Suspense, useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
	SignOut,
	House,
	ClockCounterClockwise,
	List,
	X,
	MagnifyingGlass,
	Trash,
	Moon,
	Sun,
	Printer,
	User,
	SignIn,
	Bag,
	CaretDown,
	CaretUp,
	Sparkle,
	PaintBrush,
	Storefront,
	ChatCircleDots,
} from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLocationAccess } from "../hooks/useLocationAccess";
import { LocationBanner } from "./banners/LocationBanner";
import { LocationModal } from "./modals/LocationModal";
import { Logo } from "./Logo";
import { ErrorBoundary } from "./ErrorBoundary";

type Tab = "home" | "history" | "search" | "cart" | "artworks" | "shops" | "assistant";

const TAB_PATHS: Record<Tab, string> = {
	home: "/home",
	search: "/home/search",
	shops: "/home/shops",
	assistant: "/home/print-assistant",
	artworks: "/home/artworks",
	history: "/home/history",
	cart: "/home/tray",
};

const TAB_TITLES: Record<Tab, string> = {
	home: "Home",
	search: "Search",
	shops: "Print Shops",
	assistant: "Print Assistant",
	artworks: "Art Works",
	cart: "Printing Tray",
	history: "Print History",
};

const tabFor = (path: string): Tab => {
	if (path.includes("/history")) return "history";
	if (path.includes("/search")) return "search";
	if (path.includes("/artworks")) return "artworks";
	if (path.includes("/shops")) return "shops";
	if (path.includes("/print-assistant") || path.includes("/print-request")) return "assistant";
	if (path.includes("/tray")) return "cart";
	return "home";
};

export const ProtectedLayout = () => {
	const { user, logout } = useAuth();
	const { cart, removeFromCart, getCartTotal, vendor } = useCart();
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

	const [activeTab, setActiveTab] = useState<Tab>(() => tabFor(location.pathname));
	const [drawerOpen, setDrawerOpen] = useState(false);
	// Location is optional: once skipped, don't ask again this visit
	const [locationSkipped, setLocationSkipped] = useState(() => sessionStorage.getItem("location_skipped") === "1");
	const [cartExpanded, setCartExpanded] = useState(false);

	useEffect(() => {
		setActiveTab(tabFor(location.pathname));
		if (window.innerWidth < 768) {
			setDrawerOpen(false);
		}
	}, [location.pathname]);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const handleTabChange = (tab: Tab) => {
		if (!user && tab === "history") {
			navigate("/login");
			return;
		}
		setActiveTab(tab);
		navigate(TAB_PATHS[tab]);
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

	const navItem = (
		tab: Tab,
		icon: React.ReactNode,
		label: string,
		badge?: number,
		disabled?: boolean
	) => {
		const isActive = activeTab === tab;
		return (
			<button
				onClick={() => !disabled && handleTabChange(tab)}
				disabled={disabled}
				className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
					isActive
						? "bg-[#fbbf24] text-black shadow-md shadow-amber-200/50"
						: disabled
						? "text-gray-400 cursor-not-allowed opacity-50"
						: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
				}`}
			>
				{/* Active left bar */}
				{isActive && (
					<span className="absolute left-0 top-2 bottom-2 w-1 bg-black/20 rounded-r-full" />
				)}
				<span className={`transition-transform duration-200 ${!isActive && !disabled ? 'group-hover:scale-110' : ''}`}>
					{icon}
				</span>
				<span className="flex-1 text-left font-semibold">{label}</span>
				{badge !== undefined && badge > 0 && (
					<span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-5 text-center ${
						isActive ? "bg-black/15 text-black" : "bg-[#fbbf24] text-black"
					}`}>
						{badge}
					</span>
				)}
			</button>
		);
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-[#111111] flex">
			<LocationBanner
				hasLocation={hasLocation}
				needsPermission={needsPermission}
			/>
			<LocationModal
				isOpen={needsPermission && !locationSkipped}
				permission={permission}
				error={error}
				isLoading={isLoading}
				onRequestLocation={requestLocation}
				onSkip={() => {
					sessionStorage.setItem("location_skipped", "1");
					setLocationSkipped(true);
				}}
			/>

			{/* ─── Sidebar ─── */}
			<div
				className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white dark:bg-black-secondary border-r border-gray-100 dark:border-gray-800 z-50 transform transition-transform duration-300 ease-in-out shrink-0 flex flex-col shadow-xl shadow-black/5 ${
					drawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
				}`}
			>
				{/* Logo header — must match header h-16 */}
				<div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-gray-100 dark:border-gray-800">
					<Logo
						size="xl"
						onClick={() => navigate("/home")}
						className="cursor-pointer"
					/>
					<button
						onClick={toggleDrawer}
						className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={20} weight="bold" />
					</button>
				</div>

				{/* Navigation */}
				<nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
					{/* Discover section */}
					<p className="px-4 mb-2 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
						Discover
					</p>
					{navItem("home", <House size={20} weight="duotone" />, "Home")}
					{navItem("search", <MagnifyingGlass size={20} weight="regular" />, "Search")}
					{navItem("shops", <Storefront size={20} weight="duotone" />, "Print Shops")}
					{navItem("assistant", <ChatCircleDots size={20} weight="duotone" />, "Print Assistant")}
					{navItem("artworks", <PaintBrush size={20} weight="duotone" />, "Art Works")}

					{/* My Account section */}
					{user && (
						<>
							<p className="px-4 pt-4 mb-2 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
								My Account
							</p>
							{navItem("history", <ClockCounterClockwise size={20} weight="duotone" />, "Print History")}
							{navItem("cart", <Printer size={20} weight="duotone" />, "Printing Tray", cart.length > 0 ? cart.length : undefined)}
						</>
					)}

					{/* Cart preview panel */}
					{cart.length > 0 && (
						<div className="mt-4 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
							<button
								onClick={() => setCartExpanded(!cartExpanded)}
								className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
							>
								<div className="flex items-center gap-2">
									<Bag size={16} weight="duotone" className="text-[#fbbf24]" />
									<span className="text-sm font-bold text-gray-800 dark:text-gray-200">
										Cart ({cart.length})
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-bold text-[#fbbf24]">
										GHS {getCartTotal().toFixed(2)}
									</span>
									{cartExpanded ? (
										<CaretUp size={16} weight="bold" className="text-gray-500" />
									) : (
										<CaretDown size={16} weight="bold" className="text-gray-500" />
									)}
								</div>
							</button>

							{cartExpanded && (
								<div className="bg-white dark:bg-[#222222]">
									<div className="max-h-52 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
										{cart.map((item) => (
											<div
												key={item.id}
												className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
											>
												<div className="flex-1 min-w-0 pr-2">
													<p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.serviceName}</p>
													<p className="text-[11px] text-gray-500 mt-0.5">
														Qty: {item.quantity} · <span className="text-[#fbbf24] font-bold">GHS {item.calculatedPrice.toFixed(2)}</span>
													</p>
												</div>
												<button
													onClick={(e) => handleRemoveFromCart(item.id, e)}
													className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
													aria-label="Remove item"
												>
													<Trash size={14} weight="regular" />
												</button>
											</div>
										))}
									</div>
									{cart.length > 0 && (
										<div className="p-3 border-t border-gray-100 dark:border-gray-800">
											{vendor && <p className="text-[11px] text-gray-500 mb-2">From {vendor.name}</p>}
											<button
												onClick={() => {
													navigate("/home/tray");
													if (window.innerWidth < 768) setDrawerOpen(false);
												}}
												className="w-full py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-sm font-bold rounded-lg transition-colors"
											>
												View Tray →
											</button>
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</nav>

				{/* Footer */}
				<div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#141414]">
					{user ? (
						<div className="space-y-3">
							{/* User card */}
							<div className="flex items-center gap-3 px-3 py-3 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-gray-800">
								<div className="w-9 h-9 rounded-full bg-linear-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shrink-0 shadow-sm">
									<span className="text-sm font-black text-black uppercase">
										{user?.firstName?.[0] || "U"}
									</span>
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
										{user?.firstName} {user?.lastName}
									</p>
									<p className="text-[11px] text-gray-400 truncate">
										{user?.email}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-2">
								<button
									onClick={toggleTheme}
									className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-xl hover:border-[#fbbf24] dark:hover:border-[#fbbf24] transition-all group text-sm font-semibold text-gray-600 dark:text-gray-400"
								>
									{theme === "light" ? (
										<Moon size={16} weight="duotone" className="group-hover:text-[#fbbf24]" />
									) : (
										<Sun size={16} weight="duotone" className="text-[#fbbf24]" />
									)}
									<span className="text-xs">Theme</span>
								</button>
								<button
									onClick={handleLogout}
									className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-xl hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 transition-all group text-sm font-semibold text-gray-600 dark:text-gray-400"
								>
									<SignOut size={16} weight="bold" className="group-hover:text-red-500" />
									<span className="text-xs">Logout</span>
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-3">
							{/* Guest prompt */}
							<div className="px-3 py-3 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30">
								<div className="flex items-center gap-2 mb-1">
									<Sparkle size={14} weight="duotone" className="text-[#fbbf24]" />
									<p className="text-[11px] font-bold text-[#fbbf24] uppercase tracking-wider">
										Guest Mode
									</p>
								</div>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									Sign in to place orders and track your history
								</p>
							</div>

							<button
								onClick={() => navigate("/login")}
								className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black rounded-xl font-bold text-sm transition-all shadow-sm shadow-amber-200/50 hover:shadow-amber-200"
							>
								<SignIn size={16} weight="bold" />
								Sign In
							</button>

							<div className="grid grid-cols-2 gap-2">
								<button
									onClick={toggleTheme}
									className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-xl hover:border-[#fbbf24] transition-all group text-xs font-semibold text-gray-600 dark:text-gray-400"
								>
									{theme === "light" ? (
										<Moon size={16} weight="duotone" className="group-hover:text-[#fbbf24]" />
									) : (
										<Sun size={16} weight="duotone" className="text-[#fbbf24]" />
									)}
									Theme
								</button>
								<button
									onClick={() => navigate("/register")}
									className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-xl hover:border-[#fbbf24] transition-all group text-xs font-semibold text-gray-600 dark:text-gray-400"
								>
									<User size={16} weight="regular" className="group-hover:text-[#fbbf24]" />
									Join
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Mobile overlay */}
			{drawerOpen && (
				<div
					className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
					onClick={toggleDrawer}
				/>
			)}

			{/* Main content */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Top header */}
				<header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 h-16 shadow-sm">
					<div className="px-4 sm:px-6 lg:px-8 h-full mx-auto w-full">
						<div className="flex items-center justify-between h-full gap-4">
							<div className="flex items-center gap-3 min-w-0">
								<button
									onClick={toggleDrawer}
									className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-[#fbbf24] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
									aria-label="Toggle menu"
								>
									{drawerOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
								</button>

								<div className="md:hidden">
									<Logo size="md" onClick={() => navigate("/home")} className="cursor-pointer" />
								</div>

								<div className="hidden md:flex flex-col">
									<h1 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
										{TAB_TITLES[activeTab]}
									</h1>
									<p className="text-[10px] font-bold text-[#fbbf24] uppercase tracking-widest leading-tight">
										{activeTab === "home" ? "Print anything, near you" : "Printdecore"}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2 shrink-0">
								{user && (
									<div className="hidden sm:flex flex-col items-end">
										<p className="text-[11px] text-gray-400">Welcome back,</p>
										<p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[140px]">
											{user?.firstName}
										</p>
									</div>
								)}

								<div className="flex items-center bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-100 dark:border-gray-800 gap-0.5">
									<button
										onClick={() => {
											navigate("/home/search");
											if (window.innerWidth < 768) setDrawerOpen(false);
										}}
										className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-[#fbbf24] rounded-lg transition-colors"
										aria-label="Search"
									>
										<MagnifyingGlass size={20} weight="regular" />
									</button>

									<button
										onClick={toggleTheme}
										className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#fbbf24] rounded-lg transition-colors"
										aria-label="Toggle theme"
									>
										{theme === "light" ? (
											<Moon size={20} weight="duotone" />
										) : (
											<Sun size={20} weight="duotone" className="text-[#fbbf24]" />
										)}
									</button>

									{!user && (
										<button
											onClick={() => navigate("/login")}
											className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-[#fbbf24] rounded-lg transition-colors"
											aria-label="Login"
										>
											<SignIn size={20} weight="bold" />
										</button>
									)}
								</div>

								<div className="hidden md:flex items-center gap-2">
									{user ? (
										<button
											onClick={handleLogout}
											className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
										>
											<SignOut size={16} weight="bold" />
											Logout
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
												className="px-4 py-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-sm font-black rounded-xl shadow-sm shadow-amber-200/50 transition-all hover:-translate-y-0.5"
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

				{/* Page content */}
				<main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#111111]">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
						{/* A crashed page keeps the menu around it, and clears when you navigate */}
						<ErrorBoundary inline resetKey={location.pathname}>
							<Suspense
								fallback={
									<div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Loading">
										<div className="w-8 h-8 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin"></div>
									</div>
								}
							>
								<Outlet />
							</Suspense>
						</ErrorBoundary>
					</div>
				</main>
			</div>
		</div>
	);
};
