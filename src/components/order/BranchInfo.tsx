import { MapPin, Phone, EnvelopeSimple, Buildings } from "@phosphor-icons/react";

interface BranchInfoProps {
	branch: {
		id: string;
		name: string;
		phoneNumber?: string;
		branchEmailAddress?: string;
		location?: {
			id: string;
			address: string;
			latitude: number;
			longitude: number;
		};
	};
}

export const BranchInfo = ({ branch }: BranchInfoProps) => {
	return (
		<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
			<div className="flex items-center gap-2.5 mb-4">
				<div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
					<Buildings size={16} weight="duotone" className="text-white" />
				</div>
				<h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
					Branch
				</h3>
			</div>
			<div className="space-y-3">
				<div>
					<p className="text-base font-bold text-gray-900 dark:text-white">
						{branch.name}
					</p>
				</div>

				{branch.location?.address && (
					<div className="flex items-start gap-2.5">
						<MapPin size={16} weight="duotone" className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
						<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
							{branch.location.address}
						</p>
					</div>
				)}

				{branch.phoneNumber && (
					<div className="flex items-center gap-2.5">
						<Phone size={16} weight="duotone" className="text-gray-400 dark:text-gray-500 shrink-0" />
						<a href={`tel:${branch.phoneNumber}`} className="text-sm text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white transition-colors">
							{branch.phoneNumber}
						</a>
					</div>
				)}

				{branch.branchEmailAddress && (
					<div className="flex items-center gap-2.5">
						<EnvelopeSimple size={16} weight="duotone" className="text-gray-400 dark:text-gray-500 shrink-0" />
						<a href={`mailto:${branch.branchEmailAddress}`} className="text-sm text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white transition-colors break-all">
							{branch.branchEmailAddress}
						</a>
					</div>
				)}
			</div>
		</div>
	);
};
