import { useNavigate, useParams } from "react-router-dom";
import { SpinnerGap } from "@phosphor-icons/react";
import { PageHeader } from "../components/common/PageHeader";
import { ProductLoader } from "../components/order/ProductLoader";
import { useMarketplaceVendor } from "../hooks/useMarketplace";

/** Set up one of a shop's products at that shop's prices, for that shop's order */
export const ShopProduct = () => {
	const { id, agentServiceId } = useParams<{ id: string; agentServiceId: string }>();
	const navigate = useNavigate();
	const { data: shop, isLoading } = useMarketplaceVendor(id);
	const listing = shop?.services.find((s) => s.agentServiceId === agentServiceId);

	if (isLoading) return <SpinnerGap size={20} className="animate-spin text-[#fbbf24]" />;
	if (!shop || !listing) {
		return (
			<div className="max-w-2xl mx-auto">
				<PageHeader title="Set up your order" />
				<p className="text-sm text-gray-500">This product isn't available right now.</p>
			</div>
		);
	}
	return (
		<div className="w-full max-w-2xl mx-auto">
			<PageHeader title={listing.name} subtitle={`From ${shop.name}`} />
			<ProductLoader
				service={{ id: listing.serviceTemplateId, name: listing.name, measurementUnit: listing.measurementUnit }}
				vendor={{ id: shop.id, name: shop.name, agentServiceId: listing.agentServiceId }}
				onAdded={() => navigate("/home/tray")}
			/>
		</div>
	);
};
