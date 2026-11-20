import { useQuery } from "@tanstack/react-query";
import { SpinnerGap } from "@phosphor-icons/react";
import type { CartVendor } from "../../contexts/CartContext";
import type { ServiceTemplateOrderDetails } from "../../services/orderApi";
import { getProduct } from "../../services/pricingApi";
import type { ConfiguredService, ConfiguredStart } from "./configuredService";
import { ProductConfigurator } from "./ProductConfigurator";

interface ProductLoaderProps {
	service: ServiceTemplateOrderDetails;
	vendor?: CartVendor & { agentServiceId: string };
	onAdded?: () => void;
	onConfigured?: (configured: ConfiguredService) => void;
	initial?: ConfiguredStart;
}

/** Loads the product's options, then the configurator. A product a shop hasn't priced isn't offered. */
export const ProductLoader = ({ service, vendor, ...rest }: ProductLoaderProps) => {
	const { data: product, isLoading, isError } = useQuery({
		queryKey: ["productDefinition", service.id, vendor?.id],
		queryFn: () => getProduct(service.id, vendor?.id),
		staleTime: 1000 * 60 * 5,
		retry: false,
	});

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-sm text-gray-500 py-6">
				<SpinnerGap size={16} className="animate-spin" /> Loading options…
			</div>
		);
	}
	if (isError || !product || product.pricingModel !== "v2" || (vendor && !product.shop)) {
		return (
			<p className="text-sm text-gray-500 py-6">
				{vendor ? `${vendor.name} isn't taking orders for this right now.` : "This product isn't available to order right now."}
			</p>
		);
	}
	return <ProductConfigurator key={product.id} product={product} service={service} vendor={vendor} {...rest} />;
};
