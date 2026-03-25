import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

interface StatusMessageProps {
	type: "success" | "error";
	message: string;
}

export const StatusMessage = ({ type, message }: StatusMessageProps) => {
	return (
		<div
			className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-start sm:items-center ${
				type === "success"
					? "bg-green-50 dark:bg-green-900/20 text-green-800"
					: "bg-red-50 dark:bg-red-900/20 text-red-800"
			}`}
		>
			{type === "success" ? (
				<CheckCircle size={20} weight="duotone" className="mr-2 sm:mr-3 shrink-0 mt-0.5 sm:mt-0" />
			) : (
				<WarningCircle size={20} weight="duotone" className="mr-2 sm:mr-3 shrink-0 mt-0.5 sm:mt-0" />
			)}
			<p className="text-sm font-medium break-word">{message}</p>
		</div>
	);
};

