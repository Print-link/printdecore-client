import { ToastContainer, cssTransition, type CloseButtonProps, type IconProps } from "react-toastify";
import "./toaster.css";

/**
 * The app's toast: a dark card that springs in from the top, a tinted icon
 * tile whose mark draws itself, a hairline timer, and a stacked deck that
 * fans out on hover. toaster.css restyles react-toastify under .pd-toaster,
 * so calls across the app stay toast.success(...), toast.error(...) etc.
 */
const Spring = cssTransition({
	enter: "pd-toast-in",
	exit: "pd-toast-out",
	collapseDuration: 240,
});

const MARKS: Record<string, React.ReactNode> = {
	success: <path d="M6.5 12.5l3.5 3.5 7.5-8" />,
	error: (
		<>
			<path d="M8 8l8 8" />
			<path d="M16 8l-8 8" />
		</>
	),
	warning: (
		<>
			<path d="M12 6.5v7" />
			<path d="M12 17.5v.01" />
		</>
	),
	info: (
		<>
			<path d="M12 11v6" />
			<path d="M12 7.5v.01" />
		</>
	),
	default: <path d="M7 12.5h10" />,
};

const ToastIcon = ({ type, isLoading }: IconProps) => (
	<span className={`pd-toast-icon pd-toast-icon--${isLoading ? "loading" : type}`} aria-hidden>
		{isLoading ? (
			<span className="pd-toast-spinner" />
		) : (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
				{MARKS[type] ?? MARKS.default}
			</svg>
		)}
	</span>
);

const CloseButton = ({ closeToast }: CloseButtonProps) => (
	<button type="button" className="pd-toast-close" onClick={closeToast} aria-label="Dismiss">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
			<path d="M7 7l10 10M17 7L7 17" />
		</svg>
	</button>
);

export const Toaster = () => (
	<ToastContainer
		position="top-center"
		transition={Spring}
		icon={ToastIcon}
		closeButton={CloseButton}
		autoClose={4200}
		limit={4}
		stacked
		closeOnClick={false}
		pauseOnFocusLoss
		pauseOnHover
		draggable
		draggableDirection="y"
		draggablePercent={40}
		className="pd-toaster"
		theme="dark"
		role="status"
	/>
);
