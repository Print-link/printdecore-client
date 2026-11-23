import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

/** Main tabs: the app header already shows their title, on every screen size */
const TAB_ROOTS = ["/home", "/home/search", "/home/shops", "/home/print-assistant", "/home/artworks", "/home/history", "/home/tray"];

/**
 * A page's title with a back button. On phones the app header has the back
 * button, so it's only shown from tablet up. On main tabs, or when the app
 * header already says the same (appTitle), the title isn't repeated.
 */
export const PageHeader = ({ title, subtitle, back = true, right, appTitle }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode; appTitle?: boolean }) => {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const tabRoot = appTitle || TAB_ROOTS.includes(pathname.replace(/\/$/, ""));
	return (
		<div className={`flex items-start gap-2 mb-5 md:mb-6 ${tabRoot && !subtitle && !right ? "hidden" : ""}`}>
			{back && (
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="tap hidden md:flex -ml-2 w-10 h-10 items-center justify-center rounded-full text-ink hover:bg-fill"
					aria-label="Back"
				>
					<ArrowLeft size={20} />
				</button>
			)}
			<div className="flex-1 min-w-0">
				<h1 className={`text-2xl md:text-3xl font-bold title-tight text-ink ${tabRoot ? "hidden" : ""}`}>{title}</h1>
				{subtitle && <p className="text-sm text-ink-2 mt-0.5">{subtitle}</p>}
			</div>
			{right}
		</div>
	);
};
