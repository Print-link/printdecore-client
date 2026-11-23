import { Suspense, useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
	SignOut,
	House,
	ClockCounterClockwise,
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
import { Button, Group, IconButton, Spinner, Tag } from "./ui";

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
	if (path.includes("/history") || path.includes("/order/") || path.includes("/quote/")) return "history";
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
	};

	const handleRemoveFromCart = (itemId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		removeFromCart(itemId);
	};

	const navItem = (
		tab: Tab,
		Icon: typeof House,
		label: string,
		badge?: number,
		urgent?: boolean
	) => {
		const isActive = activeTab === tab;
		return (
			<button
				onClick={() => handleTabChange(tab)}
				aria-current={isActive ? "page" : undefined}
				className={`tap w-full flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold ${
					isActive ? "bg-fill text-ink" : "text-ink-2 hover:bg-fill hover:text-ink"
				}`}
			>
				<Icon size={20} weight={isActive ? "fill" : "regular"} className={isActive ? "text-ink" : ""} />
				<span className="flex-1 text-left">{label}</span>
				{badge !== undefined && badge > 0 && (
					<span className={`num min-w-5 h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${urgent ? "bg-bad text-white" : "bg-brand text-black"}`} title={urgent ? "An order needs you" : "Orders in progress"}>
						{badge}
					</span>
				)}
			</button>
		);
	};

	const tabButton = (tab: Tab, Icon: typeof House, label: string, badge?: number, urgent?: boolean, onClick?: () => void, activeOverride?: boolean) => {
		const active = activeOverride ?? activeTab === tab;
		return (
			<button
				onClick={onClick ?? (() => handleTabChange(tab))}
				className="tap relative flex flex-col items-center justify-center gap-1"
				aria-label={label}
				aria-current={active ? "page" : undefined}
			>
				<span className="relative">
					<Icon size={24} weight={active ? "fill" : "regular"} className={active ? "text-ink" : "text-ink-3"} />
					{badge !== undefined && badge > 0 && (
						<span className={`num absolute -top-1 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center ring-2 ring-surface ${urgent ? "bg-bad text-white" : "bg-brand text-black"}`}>
							{badge > 9 ? "9+" : badge}
						</span>
					)}
				</span>
				<span className={`text-[11px] leading-none ${active ? "font-semibold text-ink" : "font-medium text-ink-3"}`}>{label}</span>
				{active && <span className="absolute top-0 inset-x-1/4 h-0.5 rounded-full bg-ink" aria-hidden />}
			</button>
		);
	};

	const sheetRow = (icon: React.ReactNode, label: string, onClick: () => void, chevron = true, sub?: string, extra?: React.ReactNode) => (
		<button onClick={onClick} className="tap w-full flex items-center gap-3 pl-4 text-left text-ink">
			<span className="text-ink-2">{icon}</span>
			<span className="flex-1 min-w-0 flex items-center gap-3 py-3.5 pr-4 border-b border-line group-last:border-0">
				<span className="flex-1 min-w-0">
					<span className="block text-base font-semibold">{label}</span>
					{sub && <span className="block truncate text-sm text-ink-2">{sub}</span>}
				</span>
				{extra}
				{chevron && <CaretRight size={16} className="text-ink-3" />}
			</span>
		</button>
	);

	const meActive = ["history", "artworks"].includes(activeTab);
	const initial = (user?.firstName?.[0] || "U").toUpperCase();
	const alertTag = (
		<Tag tone={pushState === "on" ? "ok" : pushState === "needs-install" ? "brand" : "neutral"}>
			{pushState === "on" ? "On" : pushState === "needs-install" ? "Set up" : "Off"}
		</Tag>
	);

	return (
		<div className="min-h-dvh bg-page flex">
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

			{/* ─── Sidebar (tablet and up) ─── */}
			<aside className="hidden md:flex sticky top-0 left-0 h-dvh w-64 bg-surface border-r border-line z-40 shrink-0 flex-col">
				<div className="flex items-center px-5 h-16 shrink-0">
					<Logo size="lg" onClick={() => navigate("/home")} className="cursor-pointer" />
				</div>

				<nav className="flex-1 px-3 pb-4 overflow-y-auto">
					<div className="space-y-0.5">
						{navItem("home", House, "Home")}
						{navItem("search", MagnifyingGlass, "Search")}
						{navItem("shops", Storefront, "Print shops")}
						{navItem("assistant", ChatCircleDots, "Print Assistant")}
						{navItem("artworks", PaintBrush, "Art works")}
					</div>

					{user && (
						<>
							<p className="px-3 pt-6 pb-2 text-xs font-semibold text-ink-3">Your account</p>
							<div className="space-y-0.5">
								{navItem("history", ClockCounterClockwise, "My orders", activeOrders.count, orderBadgeUrgent)}
								{navItem("cart", Printer, "Printing tray", cart.length)}
								{pushState !== "unsupported" && pushState !== "loading" && (
									<button
										onClick={toggleAlerts}
										title={ALERT_TEXT[pushState]}
										className="tap w-full flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold text-ink-2 hover:bg-fill hover:text-ink"
									>
										{pushState === "on" ? <BellRinging size={20} /> : <BellSimple size={20} />}
										<span className="flex-1 text-left">Order alerts</span>
										{alertTag}
									</button>
								)}
							</div>
						</>
					)}

					{/* Tray preview */}
					{cart.length > 0 && (
						<div className="mt-6 rounded-xl border border-line overflow-hidden">
							<button onClick={() => setCartExpanded(!cartExpanded)} className="w-full flex items-center justify-between gap-2 px-3 h-11 hover:bg-fill">
								<span className="flex items-center gap-2 text-sm font-semibold text-ink">
									<Bag size={16} /> Tray · <span className="num">{cart.length}</span>
								</span>
								<span className="flex items-center gap-2">
									<span className="num text-sm font-bold text-ink">GHS {getCartTotal().toFixed(2)}</span>
									{cartExpanded ? <CaretUp size={14} className="text-ink-3" /> : <CaretDown size={14} className="text-ink-3" />}
								</span>
							</button>
							{cartExpanded && (
								<div className="border-t border-line">
									<div className="max-h-52 overflow-y-auto">
										{cart.map((item) => (
											<div key={item.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-line last:border-0">
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-ink truncate">{item.serviceName}</p>
													<p className="num text-xs text-ink-2">
														{item.quantity} × · GHS {item.calculatedPrice.toFixed(2)}
													</p>
												</div>
												<button onClick={(e) => handleRemoveFromCart(item.id, e)} className="tap p-1.5 rounded-lg text-ink-3 hover:text-bad hover:bg-fill shrink-0" aria-label="Remove item">
													<Trash size={14} />
												</button>
											</div>
										))}
									</div>
									<div className="p-3 border-t border-line">
										{vendor && <p className="text-xs text-ink-2 mb-2 truncate">From {vendor.name}</p>}
										<Button size="md" block onClick={() => navigate("/home/tray")}>View tray</Button>
									</div>
								</div>
							)}
						</div>
					)}
				</nav>

				<div className="p-3 border-t border-line">
					{user ? (
						<>
							<div className="flex items-center gap-3 px-2 py-2">
								<span className="w-9 h-9 rounded-full bg-brand text-black flex items-center justify-center shrink-0 text-sm font-bold">{initial}</span>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-ink truncate">{user.firstName} {user.lastName}</p>
									<p className="text-xs text-ink-3 truncate">{user.email}</p>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-2 mt-2">
								<Button variant="secondary" size="md" onClick={toggleTheme} icon={theme === "light" ? <Moon size={16} /> : <Sun size={16} />}>
									{theme === "light" ? "Dark" : "Light"}
								</Button>
								<Button variant="secondary" size="md" onClick={handleLogout} icon={<SignOut size={16} />}>
									Sign out
								</Button>
							</div>
						</>
					) : (
						<>
							<p className="px-1 pb-3 text-sm text-ink-2">Sign in to place orders and track them.</p>
							<Button block size="md" onClick={() => navigate("/login")} icon={<SignIn size={16} />}>Sign in</Button>
							<div className="grid grid-cols-2 gap-2 mt-2">
								<Button variant="secondary" size="md" onClick={toggleTheme} icon={theme === "light" ? <Moon size={16} /> : <Sun size={16} />}>
									{theme === "light" ? "Dark" : "Light"}
								</Button>
								<Button variant="secondary" size="md" onClick={() => navigate("/register")} icon={<User size={16} />}>
									Join
								</Button>
							</div>
						</>
					)}
				</div>
			</aside>

			{/* Main content */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* ─── Phone header: title, and a back button on inner screens ─── */}
				<header className="md:hidden sticky top-0 z-30 pt-safe bg-surface border-b border-line">
					<div className="h-14 px-2 flex items-center gap-1">
						{topLevel ? (
							activeTab === "home" ? (
								<div className="pl-2"><Logo size="md" onClick={() => navigate("/home")} className="cursor-pointer" /></div>
							) : (
								<h1 className="pl-2 text-xl font-bold title-tight text-ink truncate">{TAB_TITLES[activeTab]}</h1>
							)
						) : (
							<>
								<IconButton label="Back" onClick={goBack}>
									<CaretLeft size={22} weight="bold" />
								</IconButton>
								<h1 className="text-lg font-semibold text-ink truncate">{screenTitle(location.pathname, activeTab)}</h1>
							</>
						)}
						<div className="ml-auto flex items-center">
							{/* Home has its own search bar, and Search is the search */}
							{activeTab !== "search" && !(topLevel && activeTab === "home") && (
								<IconButton label="Search" onClick={() => navigate("/home/search")}>
									<MagnifyingGlass size={22} />
								</IconButton>
							)}
							<IconButton label={theme === "light" ? "Dark mode" : "Light mode"} onClick={toggleTheme}>
								{theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
							</IconButton>
						</div>
					</div>
				</header>

				{/* Top header (tablet and up) */}
				<header className="hidden md:flex items-center bg-surface border-b border-line sticky top-0 z-30 h-16 px-6 lg:px-8">
					<h1 className="text-xl font-bold title-tight text-ink truncate">
						{topLevel ? TAB_TITLES[activeTab] : screenTitle(location.pathname, activeTab)}
					</h1>
				</header>

				<LocationBanner hasLocation={hasLocation} needsPermission={needsPermission} onTurnOn={requestLocation} />

				{/* Page content */}
				<main className={`flex-1 bg-page ${chat ? "" : "pb-tabbar md:pb-0"}`}>
					<div key={location.pathname} className="screen-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 md:py-6">
						{/* A crashed page keeps the menu around it, and clears when you navigate */}
						<ErrorBoundary inline resetKey={location.pathname}>
							<Suspense
								fallback={
									<div className="min-h-[50vh] flex items-center justify-center text-ink-3" role="status" aria-label="Loading">
										<Spinner className="w-6 h-6" />
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
				<nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-tabbar pb-safe bg-surface border-t border-line" aria-label="Main">
					<div className="h-16 grid grid-cols-5">
						{tabButton("home", House, "Home")}
						{tabButton("shops", Storefront, "Shops")}
						{tabButton("assistant", ChatCircleDots, "Assistant")}
						{tabButton("cart", Printer, "Tray", cart.length)}
						{tabButton(
							"history",
							UserCircle,
							"Me",
							user ? (orderBadgeUrgent ? activeOrders.toPay : activeOrders.count) : undefined,
							orderBadgeUrgent,
							() => setMeOpen(true),
							meActive
						)}
					</div>
				</nav>
			)}

			<PushBridge signedIn={!!user} />
			<InstallGuide />

			{/* ─── "Me" sheet ─── */}
			{meOpen && (
				<div className="md:hidden fixed inset-0 z-50" role="dialog" aria-label="Me">
					<div className="absolute inset-0 bg-black/50" onClick={() => setMeOpen(false)} />
					<div className="sheet-up absolute bottom-0 inset-x-0 rounded-t-3xl bg-surface pb-safe">
						<div className="flex justify-center pt-2.5 pb-1"><span className="w-9 h-1 rounded-full bg-line-strong" /></div>
						<div className="px-5 pt-2 pb-4">
							{user ? (
								<div className="flex items-center gap-3">
									<span className="w-12 h-12 rounded-full bg-brand text-black flex items-center justify-center shrink-0 text-lg font-bold">{initial}</span>
									<div className="min-w-0">
										<p className="text-lg font-bold text-ink truncate">{user.firstName} {user.lastName}</p>
										<p className="text-sm text-ink-2 truncate">{user.email}</p>
									</div>
								</div>
							) : (
								<div>
									<p className="text-xl font-bold title-tight text-ink">Welcome to Printdecore</p>
									<p className="text-sm text-ink-2 mt-0.5">Sign in to order, pay and track your prints.</p>
									<div className="grid grid-cols-2 gap-2 mt-4">
										<Button onClick={() => navigate("/login")}>Sign in</Button>
										<Button variant="secondary" onClick={() => navigate("/register")}>Create account</Button>
									</div>
								</div>
							)}
						</div>
						<Group className="mx-4 mb-3 [&>*:last-child>span:last-child]:border-0">
							{user &&
								sheetRow(
									<ClockCounterClockwise size={22} />,
									"My orders",
									() => handleTabChange("history"),
									true,
									activeOrders.active[0]?.line,
									activeOrders.count > 0 && (
										<Tag tone={orderBadgeUrgent ? "bad" : "brand"}>
											<span className="num">{orderBadgeUrgent ? `${activeOrders.toPay} to pay` : `${activeOrders.count} active`}</span>
										</Tag>
									)
								)}
							{user &&
								pushState !== "unsupported" &&
								pushState !== "loading" &&
								sheetRow(
									pushState === "on" ? <BellRinging size={22} /> : <BellSimple size={22} />,
									"Order alerts",
									toggleAlerts,
									false,
									ALERT_TEXT[pushState],
									alertTag
								)}
							{!installed &&
								sheetRow(<DownloadSimple size={22} />, "Install the app", () => {
									setMeOpen(false);
									openInstallGuide();
								}, true, "Full screen, with instant order alerts")}
							{sheetRow(<PaintBrush size={22} />, "Art works", () => handleTabChange("artworks"))}
						</Group>
						{user && (
							<Group className="mx-4 mb-4">
								<button onClick={handleLogout} className="tap w-full flex items-center gap-3 px-4 py-3.5 text-left text-bad text-base font-semibold">
									<SignOut size={22} /> Sign out
								</button>
							</Group>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
