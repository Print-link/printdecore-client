import { UserCircle, EnvelopeSimple, Phone } from "@phosphor-icons/react";

interface ExecutedByInfoProps {
	executedBy: {
		_id?: string;
		name?: string;
		email?: string;
		phone?: string;
	};
}

export const ExecutedByInfo = ({ executedBy }: ExecutedByInfoProps) => {
	return (
		<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
			<div className="flex items-center gap-2.5 mb-4">
				<div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
					<UserCircle size={16} weight="duotone" className="text-white" />
				</div>
				<h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
					Executed By
				</h3>
			</div>
			<div className="space-y-3">
				{executedBy.name && (
					<p className="text-base font-bold text-gray-900 dark:text-white">
						{executedBy.name}
					</p>
				)}

				{executedBy.email && (
					<div className="flex items-center gap-2.5">
						<EnvelopeSimple size={16} weight="duotone" className="text-gray-400 dark:text-gray-500 shrink-0" />
						<a href={`mailto:${executedBy.email}`} className="text-sm text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white transition-colors break-all">
							{executedBy.email}
						</a>
					</div>
				)}

				{executedBy.phone && (
					<div className="flex items-center gap-2.5">
						<Phone size={16} weight="duotone" className="text-gray-400 dark:text-gray-500 shrink-0" />
						<a href={`tel:${executedBy.phone}`} className="text-sm text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white transition-colors">
							{executedBy.phone}
						</a>
					</div>
				)}
			</div>
		</div>
	);
};
