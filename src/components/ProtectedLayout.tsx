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
	CaretLeft,
	CaretRight,
	UserCircle,
	BellRinging,
	BellSimple,
	DownloadSimple,
} from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";
import { useActiveOrders } from "../hooks/useActiveOrders";
import { useInstall, usePushState } from "../hooks/usePwa";
import { detachPushOnSignOut, disablePush, enablePush, sendTestPush, type PushState } from "../pwa/push";
import { openInstallGuide } from "../pwa/install";
import { PushBridge } from "./pwa/PushBridge";
import { InstallGuide } from "./pwa/InstallGuide";
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
	history: "My orders",
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

/** Top-level screens (tabs). Anything deeper gets a back button on phones */
const isTopLevel = (path: string) => Object.values(TAB_PATHS).includes(path.replace(/\/$/, ""));

/** A shop's chat keeps its message box at the bottom and has a back button, so the tab bar steps aside */
const isChat = (path: string) => /\/home\/shops\/[^/]+\/assistant/.test(path);

/** The phone header's title for a screen */
const screenTitle = (path: string, tab: Tab): string => {
	if (/\/order\//.test(path)) return "Order";
	if (/\/print-request\//.test(path)) return "Your request";
	if (/\/quote\/confirm/.test(path)) return "Confirm price";
	if (/\/shops\/[^/]+\/products\//.test(path)) return "Product";
	if (/\/shops\/[^/]+\/assistant/.test(path)) return "Ask the shop";
	if (/\/shops\/[^/]+/.test(path)) return "Print shop";
	if (/\/product\//.test(path)) return "Product";
	if (/\/category\//.test(path)) return "Category";
	if (/\/artworks\/[^/]+/.test(path)) return "Art work";
	if (/\/print-assistant\/form/.test(path)) return "Print Assistant";
	return TAB_TITLES[tab];
};

export const ProtectedLayout = () => {
	const { user, logout } = useAuth();
	const { cart, removeFromCart, getCartTotal, vendor } = useCart();
	// Orders still going: shown on Me, My orders and Print History so they're never out of sight
	const activeOrders = useActiveOrders();
	const orderBadgeUrgent = activeOrders.toPay > 0;
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
	const [meOpen, setMeOpen] = useState(false);
	const topLevel = isTopLevel(location.pathname);
	const chat = isChat(location.pathname);
	const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(TAB_PATHS[activeTab]));
	// Location is optional: once skipped, don't ask again this visit
	const [locationSkipped, setLocationSkipped] = useState(() => sessionStorage.getItem("location_skipped") === "1");
	const [cartExpanded, setCartExpanded] = useState(false);

	useEffect(() => {
		setActiveTab(tabFor(location.pathname));
		setMeOpen(false);
		if (window.innerWidth < 768) {
			setDrawerOpen(false);
		}
	}, [location.pathname]);

	const handleLogout = async () => {
		// This browser stops getting this account's order alerts
		await detachPushOnSignOut();
		logout();
		navigate("/login");
	};

	// Order alerts on this device: one tap turns them on (or shows the iPhone install steps)
	const pushState = usePushState();
	const { installed } = useInstall();
	const ALERT_TEXT: Record<PushState, string> = {
		loading: "Checking…",
		unsupported: "Not available in this browser",
		"needs-install": "Add the app to your Home Screen first",
		denied: "Blocked in your browser settings",
		off: "Get notified when your price is ready",
		on: "On — even when the app is closed",
		unavailable: "Not available yet",
	};
	const toggleAlerts = async () => {
		if (pushState === "needs-install") return openInstallGuide();
		if (pushState === "denied") return toast.info("Notifications are blocked. Allow them for this site in your browser settings, then try again.");
		if (pushState === "unsupported" || pushState === "unavailable" || pushState === "loading") return;
		if (pushState === "on") {
			if (!window.confirm("Turn off order alerts on this device?")) return;
			await disablePush();
			return toast.info("Order alerts are off on this device");
		}
		try {
			const result = await enablePush();
			if (result === "on") {
				toast.success("Order alerts are on");
				sendTestPush().catch(() => {});
			} else if (result === "denied") toast.info("Notifications were blocked. You can allow them in your browser settings.");
		} catch {
			toast.error("Couldn't turn on alerts. Please try again.");
		}
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
		disabled?: boolean,
		urgent?: boolean
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
						isActive ? "bg-black/15 text-black" : urgent ? "bg-red-500 text-white" : "bg-[#fbbf24] text-black"
					}`} title={urgent ? "An order needs you" : "Orders in progress"}>
						{badge}
					</span>
				)}
			</button>
		);
	};

	const tabButton = (tab: Tab, Icon: typeof House, label: string, badge?: number) => {
		const active = activeTab === tab;
		return (
			<button
				onClick={() => handleTabChange(tab)}
				className="tap relative flex flex-col items-center justify-center gap-0.5"
				aria-label={label}
				aria-current={active ? "page" : undefined}
			>
				<span className="relative">
					<Icon size={24} weight={active ? "fill" : "regular"} className={active ? "text-[#f59e0b]" : "text-gray-500 dark:text-gray-400"} />
					{badge !== undefined && badge > 0 && (
						<span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1a1a1a]">
							{badge > 9 ? "9+" : badge}
						</span>
					)}
				</span>
				<span className={`text-[10px] font-semibold ${active ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>{label}</span>
			</button>
		);
	};

	const sheetRow = (icon: React.ReactNode, label: string, onClick: () => void, chevron = true, sub?: string, extra?: React.ReactNode) => (
		<button onClick={onClick} className="tap w-full flex items-center gap-3 px-4 py-3.5 text-left text-gray-800 dark:text-gray-100">
			<span className="text-gray-500 dark:text-gray-400">{icon}</span>
			<span className="flex-1 min-w-0">
				<span className="block text-sm font-semibold">{label}</span>
				{sub && <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{sub}</span>}
			</span>
			{extra}
			{chevron && <CaretRight size={16} className="text-gray-400" />}
		</button>
	);

	return (
		<div className="min-h-dvh bg-gray-50 dark:bg-[#111111] flex">
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
				className="hidden md:flex sticky top-0 left-0 h-dvh w-72 bg-white dark:bg-[#1a1a1a] border-r border-gray-100 dark:border-gray-800 z-50 shrink-0 flex-col shadow-xl shadow-black/5"
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
							{navItem("history", <ClockCounterClockwise size={20} weight="duotone" />, "Print History", user ? activeOrders.count : undefined, false, orderBadgeUrgent)}
							{navItem("cart", <Printer size={20} weight="duotone" />, "Printing Tray", cart.length > 0 ? cart.length : undefined)}
							{pushState !== "unsupported" && pushState !== "loading" && (
								<button
									onClick={toggleAlerts}
									title={ALERT_TEXT[pushState]}
									className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
								>
									{pushState === "on" ? <BellRinging size={20} weight="duotone" className="text-emerald-500" /> : <BellSimple size={20} weight="duotone" />}
									<span className="flex-1 text-left">Order alerts</span>
									<span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pushState === "on" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
										{pushState === "on" ? "On" : "Off"}
									</span>
								</button>
							)}
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


			{/* Main content */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* ─── Phone header: title, and a back button on inner screens ─── */}
				<header className="md:hidden sticky top-0 z-30 pt-safe bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
					<div className="h-14 px-2 flex items-center gap-1">
						{topLevel ? (
							activeTab === "home" ? (
								<div className="pl-2"><Logo size="md" onClick={() => navigate("/home")} className="cursor-pointer" /></div>
							) : (
								<h1 className="pl-2 text-lg font-black text-gray-900 dark:text-white truncate">{TAB_TITLES[activeTab]}</h1>
							)
						) : (
							<>
								<button onClick={goBack} className="tap p-2 -ml-0.5 text-gray-900 dark:text-white rounded-full" aria-label="Back">
									<CaretLeft size={22} weight="bold" />
								</button>
								<h1 className="text-base font-bold text-gray-900 dark:text-white truncate">{screenTitle(location.pathname, activeTab)}</h1>
							</>
						)}
						<div className="ml-auto flex items-center">
							{/* Home has its own search bar, and Search is the search */}
							{activeTab !== "search" && !(topLevel && activeTab === "home") && (
								<button onClick={() => navigate("/home/search")} className="tap p-2.5 text-gray-700 dark:text-gray-300 rounded-full" aria-label="Search">
									<MagnifyingGlass size={22} weight="regular" />
								</button>
							)}
							<button onClick={toggleTheme} className="tap p-2.5 text-gray-700 dark:text-gray-300 rounded-full" aria-label={theme === "light" ? "Dark mode" : "Light mode"}>
								{theme === "light" ? <Moon size={22} weight="duotone" /> : <Sun size={22} weight="duotone" className="text-[#fbbf24]" />}
							</button>
						</div>
					</div>
				</header>

				{/* Top header (tablet and up) */}
				<header className="hidden md:block bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 h-16 shadow-sm">
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

							{/* Theme, account, sign in and logout are all in the sidebar beside this header */}
						</div>
					</div>
				</header>

				<LocationBanner hasLocation={hasLocation} needsPermission={needsPermission} />

				{/* Page content */}
				<main className={`flex-1 bg-gray-50 dark:bg-[#111111] ${chat ? "" : "pb-tabbar md:pb-0"}`}>
					<div key={location.pathname} className="screen-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
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

			{/* ─── Phone tab bar ─── */}
			{!chat && (
				<nav
					className="md:hidden fixed bottom-0 inset-x-0 z-40 h-tabbar pb-safe bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800"
					aria-label="Main"
				>
					<div className="h-16 grid grid-cols-5">
						{tabButton("home", House, "Home")}
						{tabButton("shops", Storefront, "Shops")}
						<button
							onClick={() => handleTabChange("assistant")}
							className="tap flex flex-col items-center justify-center gap-0.5"
							aria-label="Print Assistant"
							aria-current={activeTab === "assistant" ? "page" : undefined}
						>
							<span className={`-mt-5 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${activeTab === "assistant" ? "bg-[#f59e0b] shadow-amber-500/40" : "bg-[#fbbf24] shadow-amber-400/30"} text-black ring-4 ring-gray-50 dark:ring-[#111111]`}>
								<ChatCircleDots size={24} weight="fill" />
							</span>
							<span className={`text-[10px] font-semibold ${activeTab === "assistant" ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>Assistant</span>
						</button>
						{tabButton("cart", Printer, "Tray", cart.length)}
						<button
							onClick={() => setMeOpen(true)}
							className="tap flex flex-col items-center justify-center gap-0.5"
							aria-label="Me"
							aria-current={["history", "artworks"].includes(activeTab) ? "page" : undefined}
						>
							<span className="relative">
							{user && activeOrders.count > 0 && (
								<span
									className={`absolute -top-1.5 -right-2.5 z-[1] min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1a1a1a] ${
										orderBadgeUrgent ? "bg-red-500 text-white" : "bg-[#fbbf24] text-black"
									}`}
									aria-label={orderBadgeUrgent ? `${activeOrders.toPay} order to pay` : `${activeOrders.count} active order${activeOrders.count === 1 ? "" : "s"}`}
								>
									{!orderBadgeUrgent && <span className="absolute inset-0 rounded-full bg-[#fbbf24] animate-ping opacity-40" />}
									<span className="relative">{(orderBadgeUrgent ? activeOrders.toPay : activeOrders.count) > 9 ? "9+" : orderBadgeUrgent ? activeOrders.toPay : activeOrders.count}</span>
								</span>
							)}
							{user ? (
								<span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black uppercase ${["history", "artworks"].includes(activeTab) ? "bg-[#fbbf24] text-black" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}>
									{user.firstName?.[0] || "U"}
								</span>
							) : (
								<UserCircle size={24} weight={["history", "artworks"].includes(activeTab) ? "fill" : "regular"} className={["history", "artworks"].includes(activeTab) ? "text-[#f59e0b]" : "text-gray-500 dark:text-gray-400"} />
							)}
							</span>
							<span className={`text-[10px] font-semibold ${["history", "artworks"].includes(activeTab) ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>Me</span>
						</button>
					</div>
				</nav>
			)}

			<PushBridge signedIn={!!user} />
			<InstallGuide />

			{/* ─── "Me" sheet ─── */}
			{meOpen && (
				<div className="md:hidden fixed inset-0 z-50" role="dialog" aria-label="Me">
					<div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setMeOpen(false)} />
					<div className="sheet-up absolute bottom-0 inset-x-0 rounded-t-3xl bg-white dark:bg-[#1a1a1a] pb-safe shadow-2xl">
						<div className="flex justify-center pt-2.5 pb-1"><span className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" /></div>
						<div className="px-5 pt-2 pb-4">
							{user ? (
								<div className="flex items-center gap-3 py-2">
									<div className="w-12 h-12 rounded-full bg-linear-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shrink-0">
										<span className="text-lg font-black text-black uppercase">{user.firstName?.[0] || "U"}</span>
									</div>
									<div className="min-w-0">
										<p className="text-base font-bold text-gray-900 dark:text-white truncate">{user.firstName} {user.lastName}</p>
										<p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
									</div>
								</div>
							) : (
								<div className="py-2">
									<p className="text-base font-bold text-gray-900 dark:text-white">Welcome to Printdecore</p>
									<p className="text-xs text-gray-500 dark:text-gray-400">Sign in to order, pay and track your prints.</p>
									<div className="grid grid-cols-2 gap-2 mt-3">
										<button onClick={() => navigate("/login")} className="tap py-3 rounded-xl bg-[#fbbf24] text-black text-sm font-bold">Sign in</button>
										<button onClick={() => navigate("/register")} className="tap py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-bold">Create account</button>
									</div>
								</div>
							)}
						</div>
						<div className="mx-4 mb-3 rounded-2xl bg-gray-50 dark:bg-[#222222] divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
							{user &&
								sheetRow(
									<ClockCounterClockwise size={20} weight="duotone" />,
									"My orders",
									() => handleTabChange("history"),
									true,
									activeOrders.active[0]?.line,
									activeOrders.count > 0 && (
										<span
											className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
												orderBadgeUrgent ? "bg-red-500 text-white" : "bg-amber-100 text-[#b45309] dark:bg-amber-400/15 dark:text-amber-300"
											}`}
										>
											{orderBadgeUrgent ? `${activeOrders.toPay} to pay` : `${activeOrders.count} active`}
										</span>
									)
								)}
							{user &&
								pushState !== "unsupported" &&
								pushState !== "loading" &&
								sheetRow(
									pushState === "on" ? <BellRinging size={20} weight="duotone" className="text-emerald-500" /> : <BellSimple size={20} weight="duotone" />,
									"Order alerts",
									toggleAlerts,
									false,
									ALERT_TEXT[pushState],
									<span
										className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
											pushState === "on" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : pushState === "needs-install" ? "bg-[#fbbf24] text-black" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
										}`}
									>
										{pushState === "on" ? "On" : pushState === "needs-install" ? "Set up" : "Off"}
									</span>
								)}
							{!installed &&
								sheetRow(<DownloadSimple size={20} weight="duotone" />, "Install the app", () => {
									setMeOpen(false);
									openInstallGuide();
								}, true, "Opens full screen, with instant order alerts")}
							{sheetRow(<PaintBrush size={20} weight="duotone" />, "Art Works", () => handleTabChange("artworks"))}
							{/* Search and dark mode are in the header above, on every screen */}
						</div>
						{user && (
							<div className="mx-4 mb-4 rounded-2xl bg-gray-50 dark:bg-[#222222] overflow-hidden">
								<button onClick={handleLogout} className="tap w-full flex items-center gap-3 px-4 py-3.5 text-left text-red-500 text-sm font-semibold">
									<SignOut size={20} weight="bold" /> Sign out
								</button>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
