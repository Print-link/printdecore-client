import type { Category } from "../../types/category";

interface ResultsCheckerFormProps {
	category: Category;
	indexNumber: string;
	yearOfCompletion: string;
	dateOfBirth: string;
	onIndexNumberChange: (value: string) => void;
	onYearOfCompletionChange: (value: string) => void;
	onDateOfBirthChange: (value: string) => void;
	loading: boolean;
}

export const ResultsCheckerForm = ({
	category,
	indexNumber,
	yearOfCompletion,
	dateOfBirth,
	onIndexNumberChange,
	onYearOfCompletionChange,
	onDateOfBirthChange,
	loading,
}: ResultsCheckerFormProps) => {
	const isNovDecResult = category.categoryType === "novdec_result";

	return (
		<div className="max-w-2xl mx-auto">
			<div className="bg-white rounded-xl border border-gray-300 p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-6">
					Enter Your Details
				</h3>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							Index Number *
						</label>
						<input
							type="text"
							value={indexNumber}
							onChange={(e) => onIndexNumberChange(e.target.value)}
							placeholder="Enter your index number"
							className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
							required
							disabled={loading}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							Year of Completion *
						</label>
						<input
							type="text"
							value={yearOfCompletion}
							onChange={(e) => onYearOfCompletionChange(e.target.value)}
							placeholder="e.g., 2023"
							className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
							required
							disabled={loading}
						/>
					</div>

					{isNovDecResult && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Date of Birth *
							</label>
							<input
								type="date"
								value={dateOfBirth}
								onChange={(e) => onDateOfBirthChange(e.target.value)}
								className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
								required
								disabled={loading}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

