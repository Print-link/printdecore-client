import { useQuery } from "@tanstack/react-query";
import { listPromoBanners } from "../services/promoBannerApi";

export const usePromoBanners = () =>
	useQuery({
		queryKey: ["promoBanners"],
		queryFn: listPromoBanners,
		staleTime: 1000 * 60 * 5,
	});
