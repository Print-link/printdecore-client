import { User } from "lucide-react";

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
		<div className="bg-white rounded-lg border-2 border-gray-200 p-4">
			<h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
				<User className="w-5 h-5" />
				Executed By
			</h3>
			<div className="space-y-4">
				{executedBy.name && (
					<div>
						<p className="text-xs text-gray-500 mb-1">Full Name</p>
						<p className="text-sm font-semibold text-gray-900">
							{executedBy.name}
						</p>
					</div>
				)}
				{executedBy.email && (
					<div>
						<p className="text-xs text-gray-500 mb-1">Email</p>
						<p className="text-sm font-medium text-gray-900 break-all">
							{executedBy.email}
						</p>
					</div>
				)}
				{executedBy.phone && (
					<div>
						<p className="text-xs text-gray-500 mb-1">Phone Number</p>
						<p className="text-sm font-medium text-gray-900">
							{executedBy.phone}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

