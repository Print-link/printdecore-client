import { useNavigate, useParams } from "react-router-dom";
import { EmptyState, Skeleton } from "../components/ui";
import { PageHeader } from "../components/common/PageHeader";
import { ProductLoader } from "../components/order/ProductLoader";
import { useMarketplaceVendor } from "../hooks/useMarketplace";

/** Set up one of a shop's products at that shop's prices, for that shop's order */
export const ShopProduct = () => {
	const { id, agentServiceId } = useParams<{ id: string; agentServiceId: string }>();
	const navigate = useNavigate();
	const { data: shop, isLoading } = useMarketplaceVendor(id);
	const listing = shop?.services.find((s) => s.agentServiceId === agentServiceId);

	if (isLoading) return <div className="max-w-2xl mx-auto"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/3 mt-2" /></div>;
	if (!shop || !listing) {
		return (
			<EmptyState title="Not available right now" body="This product can't be ordered at the moment." />
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
