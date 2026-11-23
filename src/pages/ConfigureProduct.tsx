import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, Skeleton } from "../components/ui";
import { PageHeader } from "../components/common/PageHeader";
import { ProductLoader } from "../components/order/ProductLoader";
import { getServiceTemplateOrderDetails } from "../services/orderApi";

/** Set up one of Printdecore's products and add it to the tray */
export const ConfigureProduct = () => {
	const { serviceTemplateId } = useParams<{ serviceTemplateId: string }>();
	const navigate = useNavigate();
	const { data: service, isLoading, isError } = useQuery({
		queryKey: ["serviceOrderDetails", serviceTemplateId],
		queryFn: () => getServiceTemplateOrderDetails(serviceTemplateId!),
		enabled: !!serviceTemplateId,
	});

	return (
		<div className="w-full max-w-2xl mx-auto">
			<PageHeader title={service?.name ?? "Set up your order"} subtitle="Printdecore finds a printer near you and handles it" />
			{isLoading && <Skeleton className="h-40" />}
			{isError && <EmptyState title="Not available right now" body="This product can't be ordered at the moment." />}
			{service && <ProductLoader service={service} onAdded={() => navigate("/home/tray")} />}
		</div>
	);
};
