import { useQuery } from "@tanstack/react-query";
import { getMarketplaceVendor, listMarketplaceVendors } from "../services/marketplaceApi";

export const useMarketplaceVendors = (coords: { latitude: number; longitude: number } | null, q?: string) =>
	useQuery({
		queryKey: ["marketplaceVendors", coords?.latitude, coords?.longitude, q],
		queryFn: () => listMarketplaceVendors({ latitude: coords?.latitude, longitude: coords?.longitude, q: q || undefined }),
		staleTime: 1000 * 60,
	});

export const useMarketplaceVendor = (id: string | undefined) =>
	useQuery({
		queryKey: ["marketplaceVendor", id],
		queryFn: () => getMarketplaceVendor(id!),
		enabled: !!id,
		staleTime: 1000 * 60,
		retry: false,
	});
