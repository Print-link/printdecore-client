import { Printer, Search, Tag } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
	// Type-based API (legacy)
	type?: "no-stations" | "no-results" | "no-categories";
	onClearSearch?: () => void;
	message?: string;
	// Flexible API (new)
	icon?: ReactNode;
	title?: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
}

export const EmptyState = ({
	type,
	onClearSearch,
	message,
	icon,
	title,
	description,
	actionLabel,
	onAction,
}: EmptyStateProps) => {
	// If using flexible API (icon, title, description)
	if (icon || title || description) {
		return (
			<div className="bg-white rounded-2xl p-8 text-center">
				{icon && <div className="flex justify-center mb-4">{icon}</div>}
				{title && (
					<h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
				)}
				{description && (
					<p className="text-gray-600 mb-4">{description}</p>
				)}
				{actionLabel && onAction && (
					<button
						onClick={onAction}
						className="inline-flex items-center px-4 py-2 bg-[#fbbf24] text-black rounded-lg font-semibold hover:bg-[#fcd34d] transition-all"
					>
						{actionLabel}
					</button>
				)}
			</div>
		);
	}

	// Legacy type-based API
	if (type === "no-stations") {
		return (
			<div className="bg-white p-8 text-center">
				<Printer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-600">
					No print stations available at the moment.
				</p>
			</div>
		);
	}

	if (type === "no-categories") {
		return (
			<div className="bg-white rounded-2xl p-8 text-center">
				<Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-600 mb-2">
					{message || "No categories found matching your search."}
				</p>
				{onClearSearch && (
					<button
						onClick={onClearSearch}
						className="text-[#fbbf24] hover:text-[#fbbf24] font-medium text-sm"
					>
						Clear search
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="bg-white rounded-2xl p-8 text-center">
			<Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
			<p className="text-gray-600 mb-2">
				{message || "No print stations found matching your search."}
			</p>
			{onClearSearch && (
				<button
					onClick={onClearSearch}
					className="text-[#fbbf24] hover:text-[#fbbf24] font-medium text-sm"
				>
					Clear search
				</button>
			)}
		</div>
	);
};

