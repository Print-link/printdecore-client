import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft, Package, Check } from "lucide-react";
import { getServiceTemplates, type ServiceTemplate } from "../services/orderApi";
import { EmptyState } from "../components/EmptyState";

export const ServiceTemplates = () => {
	const { branchId } = useParams<{ branchId: string }>();
	const [searchParams] = useSearchParams();
	const subCategoryId = searchParams.get("subCategoryId");
	const navigate = useNavigate();

	const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchServiceTemplates = async () => {
			if (!subCategoryId) {
				setError("SubCategory ID is missing");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);
				const response = await getServiceTemplates(subCategoryId);

				if (response.success && response.data) {
					setServiceTemplates(response.data);
				} else {
					setError("Failed to load service templates");
				}
			} catch (err: unknown) {
				console.error("Error fetching service templates:", err);
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load service templates";
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchServiceTemplates();
	}, [subCategoryId]);

	const handleServiceTemplateClick = (serviceTemplateId: string) => {
		navigate(
			`/home/order/agent-services/${branchId}?serviceTemplateId=${serviceTemplateId}`
		);
	};

	console.log("Image Url ---- ", serviceTemplates)

	const handleBack = () => {
		navigate(-1);
	};

	if (loading) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-8 h-8 text-[#fbbf24] animate-spin" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
				<div className="text-center py-12">
					<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Error Loading Service Templates
					</h2>
					<p className="text-gray-600 mb-4">{error}</p>
					<button
						onClick={handleBack}
						className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#fbbf24] hover:text-[#fbbf24]"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-7xl mx-auto">
			{/* Back Button */}
			<button
				onClick={handleBack}
				className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back
			</button>

			{/* Header */}
			<div className="mb-4">
				<h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
					Select a Service Template
				</h1>
				<p className="text-sm text-gray-600">
					Choose a service variant to view branch-specific pricing
				</p>
			</div>

			{/* Service Templates List/Grid */}
			{serviceTemplates.length === 0 ? (
				<EmptyState type="no-results" />
			) : (
				<div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
					{serviceTemplates.map((template) => (
						<button
							key={template.id}
							onClick={() => handleServiceTemplateClick(template.id)}
							className="w-full bg-white rounded-lg p-4 border-2 border-gray-200 text-left group hover:border-[#fbbf24] transition-all"
						>
							<div className="flex items-start gap-3 md:flex-col md:gap-4">
								<div className="flex items-center gap-3 flex-1 min-w-0 md:flex-col md:items-start md:w-full">
									{template.imageUrl ? (
										<img src={template.imageUrl} alt={template.name} />
									) : (
										<Package className="w-6 h-6 text-[#fbbf24]" />
									)}
									<div className="flex-1 min-w-0 md:w-full">
										<div className="flex items-start justify-between gap-2 mb-2">
											<h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-[#fbbf24] transition-colors">
												{template.name}
											</h3>
											{/* <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
												{template.measurementUnit}
											</span> */}
										</div>
										{template.description && (
											<p className="text-sm text-gray-600 line-clamp-2 mb-2">
												{template?.description}
											</p>
										)}
										{/* Features */}
										<div className="space-y-1.5 mb-2">
											{template.allowsCustomSize && (
												<div className="flex items-center text-xs md:text-sm text-gray-700">
													<Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#fbbf24] mr-2 shrink-0" />
													<span className="truncate">Custom size</span>
												</div>
											)}
											{template.supportsFrontBack && (
												<div className="flex items-center text-xs md:text-sm text-gray-700">
													<Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#fbbf24] mr-2 shrink-0" />
													<span className="truncate">Front & Back</span>
												</div>
											)}
											{template.supportsColor && (
												<div className="flex items-center text-xs md:text-sm text-gray-700">
													<Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#fbbf24] mr-2 shrink-0" />
													<span className="truncate">Color printing</span>
												</div>
											)}
											{template.supportsPrintCut && (
												<div className="flex items-center text-xs md:text-sm text-gray-700">
													<Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#fbbf24] mr-2 shrink-0" />
													<span className="truncate">Print & Cut</span>
												</div>
											)}
										</div>
										<div className="flex items-center text-sm font-semibold text-[#fbbf24]">
											<span>View Pricing</span>
											<span className="ml-2 hidden md:inline">→</span>
										</div>
									</div>
								</div>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

