import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { getAgentServices, type AgentService } from "../services/orderApi";

export const AgentServices = () => {
	const { branchId } = useParams<{ branchId: string }>();
	const [searchParams] = useSearchParams();
	const serviceTemplateId = searchParams.get("serviceTemplateId");
	const navigate = useNavigate();

	const [agentServices, setAgentServices] = useState<AgentService[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchAgentServices = async () => {
			if (!branchId || !serviceTemplateId) {
				setError("Branch ID or Service Template ID is missing");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);
				const response = await getAgentServices(branchId, serviceTemplateId);

				if (response.success && response.data) {
					setAgentServices(response.data);
				} else {
					setError("Failed to load agent services");
				}
			} catch (err: unknown) {
				console.error("Error fetching agent services:", err);
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load agent services";
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchAgentServices();
	}, [branchId, serviceTemplateId]);

	const handleAgentServiceClick = (agentServiceId: string) => {
		navigate(
			`/home/order/configure/${branchId}?agentServiceId=${agentServiceId}&serviceTemplateId=${serviceTemplateId}`
		);
	};

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
						Error Loading Agent Services
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
					Branch Pricing
				</h1>
				<p className="text-sm text-gray-600">
					Select a service to configure your order
				</p>
			</div>

			{/* Agent Services */}
			{agentServices.length === 0 ? (
				<div className="bg-white rounded-xl p-8 text-center border border-gray-300">
					<XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Service Not Available
					</h3>
					<p className="text-gray-600 mb-4">
						This service is not available at this branch. Contact the branch for a custom
						quote.
					</p>
					<button
						onClick={handleBack}
						className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#fbbf24] hover:text-[#fbbf24]"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
				</div>
			) : (
				<div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
					{agentServices.map((service) => (
						<button
							key={service.id}
							onClick={() => handleAgentServiceClick(service.id)}
							disabled={!service.isActive}
							className={`w-full bg-white rounded-lg p-4 border-2 text-left group transition-all ${
								service.isActive
									? "border-gray-200 hover:border-[#fbbf24] cursor-pointer"
									: "border-gray-200 opacity-60 cursor-not-allowed"
							}`}
						>
							<div className="flex items-start gap-3 md:flex-col md:gap-4">
								<div className="flex items-center gap-3 flex-1 min-w-0 md:flex-col md:items-start md:w-full">
									<div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border-2 border-gray-200 group-hover:border-[#fbbf24] transition-colors">
										<DollarSign className="w-6 h-6 text-[#fbbf24]" />
									</div>
									<div className="flex-1 min-w-0 md:w-full">
										<div className="flex items-start justify-between gap-2 mb-2">
											<div className="flex-1 min-w-0">
												<div className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">
													{service.pricePerUnit ? `GHS ${service.pricePerUnit.toFixed(2)}` : "Custom Quote"}
												</div>
												{service.pricePerUnit && (
													<div className="text-xs md:text-sm text-gray-600">
														per unit
													</div>
												)}
											</div>
											{service.isActive ? (
												<CheckCircle className="w-5 h-5 text-[#fbbf24] shrink-0" />
											) : (
												<XCircle className="w-5 h-5 text-gray-400 shrink-0" />
											)}
										</div>

										{/* Available Options */}
										<div className="space-y-1.5 mb-3 mt-3">
											{service.supportsFrontBack && (
												<div className="flex items-center text-xs md:text-sm text-gray-700">
													<CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#fbbf24] mr-2 shrink-0" />
													<span className="truncate">Front & Back</span>
												</div>
											)}
											{service.supportsColor && (
												<div className="flex items-center text-xs md:text-sm text-gray-700">
													<CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#fbbf24] mr-2 shrink-0" />
													<span className="truncate">Color Printing</span>
												</div>
											)}
											{service.supportsPrintCut && (
												<div className="flex items-center text-xs md:text-sm text-gray-700">
													<CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#fbbf24] mr-2 shrink-0" />
													<span className="truncate">Print & Cut</span>
												</div>
											)}
											{service.supportsFrontOnly && (
												<div className="flex items-center text-xs md:text-sm text-gray-700">
													<CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#fbbf24] mr-2 shrink-0" />
													<span className="truncate">Front Only</span>
												</div>
											)}
										</div>
										<div className="flex items-center text-sm font-semibold text-[#fbbf24]">
											<span>{service.isActive ? "Select & Configure" : "Not Available"}</span>
											{service.isActive && <span className="ml-2 hidden md:inline">→</span>}
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

