import { EnvelopeSimple, Phone } from "@phosphor-icons/react";

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
		<div className="py-5 border-t border-line">
			<div className="flex items-center gap-2.5 mb-4">
				<h3 className="text-lg font-bold title-tight text-ink">
					Executed By
				</h3>
			</div>
			<div className="space-y-3">
				{executedBy.name && (
					<p className="text-base font-bold text-ink">
						{executedBy.name}
					</p>
				)}

				{executedBy.email && (
					<div className="flex items-center gap-2.5">
						<EnvelopeSimple size={16} weight="regular" className="text-ink-3 shrink-0" />
						<a href={`mailto:${executedBy.email}`} className="text-sm text-ink font-medium hover:text-ink transition-colors break-all">
							{executedBy.email}
						</a>
					</div>
				)}

				{executedBy.phone && (
					<div className="flex items-center gap-2.5">
						<Phone size={16} weight="regular" className="text-ink-3 shrink-0" />
						<a href={`tel:${executedBy.phone}`} className="text-sm text-ink font-medium hover:text-ink transition-colors">
							{executedBy.phone}
						</a>
					</div>
				)}
			</div>
		</div>
	);
};
