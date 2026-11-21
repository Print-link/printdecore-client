import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

/** Main tabs: on phones the app header already shows their title */
const TAB_ROOTS = ["/home", "/home/search", "/home/shops", "/home/print-assistant", "/home/artworks", "/home/history", "/home/tray"];

/**
 * A page's title with a back button. On phones the app header has the back
 * button (and, on main tabs, the title), so they're only shown from tablet up.
 */
export const PageHeader = ({ title, subtitle, back = true, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) => {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const tabRoot = TAB_ROOTS.includes(pathname.replace(/\/$/, ""));
	return (
		<div className={`flex items-start gap-3 mb-4 md:mb-6 ${tabRoot && !subtitle && !right ? "hidden md:flex" : ""}`}>
			{back && (
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="hidden md:block mt-1 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
					aria-label="Back"
				>
					<ArrowLeft size={18} />
				</button>
			)}
			<div className="flex-1 min-w-0">
				<h1 className={`text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-tight ${tabRoot ? "hidden md:block" : ""}`}>{title}</h1>
				{subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 md:mt-1">{subtitle}</p>}
			</div>
			{right}
		</div>
	);
};
