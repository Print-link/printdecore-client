import { Component, type ErrorInfo, type ReactNode } from "react";
import { ArrowClockwise, House, WarningOctagon } from "@phosphor-icons/react";

interface ErrorBoundaryProps {
	children: ReactNode;
	/** Changing this (e.g. the page's path) clears the error, so moving on recovers */
	resetKey?: string;
	/** Smaller card for inside the app's layout, instead of a full page */
	inline?: boolean;
}

interface ErrorBoundaryState {
	error: Error | null;
}

const RELOADED = "pd:chunk-reload";

/** A page's code failed to download — usually a new version was deployed */
const isChunkError = (error: Error) =>
	/Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
		error.message
	);

/**
 * Catches a screen that crashes while drawing, so the customer sees what
 * happened and a way out instead of a blank page. After a deploy, a page whose
 * old code is gone is fixed by reloading once, which it does by itself.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("Screen crashed:", error, info.componentStack);
		if (isChunkError(error)) {
			try {
				if (!sessionStorage.getItem(RELOADED)) {
					sessionStorage.setItem(RELOADED, "1");
					window.location.reload();
				}
			} catch {
				/* storage blocked: show the card */
			}
		}
	}

	componentDidUpdate(prev: ErrorBoundaryProps) {
		if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
	}

	render() {
		const { error } = this.state;
		if (!error) return this.props.children;
		const update = isChunkError(error);

		return (
			<div
				role="alert"
				className={`flex items-center justify-center px-4 ${this.props.inline ? "py-16" : "min-h-screen bg-page"}`}
			>
				<div className="w-full max-w-sm text-center">
					<span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-tint text-brand-ink">
						<WarningOctagon size={30} weight="regular" />
					</span>
					<h1 className="text-lg font-bold text-ink">
						{update ? "A new version is available" : "Something went wrong on this page"}
					</h1>
					<p className="mt-1.5 text-sm text-ink-2">
						{update
							? "Reload to get the latest Printdecore."
							: "Your orders and payments are safe. Reload the page, or head home and try again."}
					</p>
					<div className="mt-5 flex justify-center gap-2">
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-black hover:bg-brand-press focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
						>
							<ArrowClockwise size={16} weight="bold" /> Reload
						</button>
						{!update && (
							<a
								href="/home"
								className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-gray-50 dark:border-gray-700 dark:text-ink-3 dark:hover:bg-gray-800"
							>
								<House size={16} /> Home
							</a>
						)}
					</div>
				</div>
			</div>
		);
	}
}
