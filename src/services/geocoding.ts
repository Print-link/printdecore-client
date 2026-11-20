export interface PlaceSuggestion {
	id: string;
	label: string;
	latitude: number;
	longitude: number;
}

const PHOTON_URL = "https://photon.komoot.io/api/";
// A hard filter to Ghana: an unmapped local place comes back empty, not a same-named place abroad
const GHANA_BBOX = "-3.5,4.5,1.5,11.5";
const cache = new Map<string, PlaceSuggestion[]>();

const label = (p: Record<string, string | undefined>) => {
	const line1 = [p.name, p.street].filter(Boolean).join(" ");
	const line2 = [p.city || p.district || p.state, p.country].filter(Boolean).join(", ");
	return [line1, line2].filter(Boolean).join(", ") || "Unknown place";
};

/** Address suggestions as the customer types (Photon, OpenStreetMap), same as the mobile app */
export async function searchPlaces(query: string, near?: { latitude: number; longitude: number }): Promise<PlaceSuggestion[]> {
	const key = query.trim().toLowerCase();
	if (!key) return [];
	const cached = cache.get(key);
	if (cached) return cached;
	const params = new URLSearchParams({ q: key, limit: "5", bbox: GHANA_BBOX });
	if (near) {
		params.set("lat", String(near.latitude));
		params.set("lon", String(near.longitude));
	}
	const res = await fetch(`${PHOTON_URL}?${params.toString()}`);
	if (!res.ok) throw new Error("Search failed");
	const data = await res.json();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const results: PlaceSuggestion[] = (data?.features ?? []).map((f: any, i: number) => ({
		id: `${f.properties?.osm_type ?? "p"}-${f.properties?.osm_id ?? i}`,
		label: label(f.properties ?? {}),
		latitude: f.geometry.coordinates[1],
		longitude: f.geometry.coordinates[0],
	}));
	cache.set(key, results);
	if (cache.size > 30) cache.delete(cache.keys().next().value as string);
	return results;
}
