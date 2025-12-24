import { MapPin, Phone, Mail } from "lucide-react";

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
		<div className="bg-white rounded-lg border-2 border-gray-200 p-4">
			<h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
				<MapPin className="w-5 h-5" />
				Branch Information
			</h3>
			<div className="space-y-4">
				<div>
					<p className="text-xs text-gray-500 mb-1">Branch Name</p>
					<p className="text-base font-semibold text-gray-900">
						{branch.name}
					</p>
				</div>
				{branch.location?.address && (
					<div>
						<p className="text-xs text-gray-500 mb-1">Address</p>
						<p className="text-sm font-medium text-gray-900">
							{branch.location.address}
						</p>
					</div>
				)}
				{branch.phoneNumber && (
					<div className="flex items-start gap-2">
						<Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
						<div>
							<p className="text-xs text-gray-500 mb-1">Phone</p>
							<p className="text-sm font-medium text-gray-900">
								{branch.phoneNumber}
							</p>
						</div>
					</div>
				)}
				{branch.branchEmailAddress && (
					<div className="flex items-start gap-2">
						<Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
						<div>
							<p className="text-xs text-gray-500 mb-1">Email</p>
							<p className="text-sm font-medium text-gray-900 break-all">
								{branch.branchEmailAddress}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

