import { useEffect, useState } from "react";
import { Crosshair, MapPin, SpinnerGap, Storefront, Truck } from "@phosphor-icons/react";
import { useGeolocation } from "../../hooks/useGeolocation";
import { deliveryReady, type Delivery } from "../../services/orderApi";
import { searchPlaces, type PlaceSuggestion } from "../../services/geocoding";

interface DeliveryChoiceProps {
	delivery: Delivery | null;
	onChange: (delivery: Delivery) => void;
	/** Shown when set: a button to move on once the details are complete */
	onContinue?: () => void;
}

const inputClass =
	"w-full px-3 py-2.5 text-sm bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 focus:border-[#fbbf24]";

/** Delivery (with an address found on the map) or pickup, and a phone to reach the customer on */
export const DeliveryChoice = ({ delivery, onChange, onContinue }: DeliveryChoiceProps) => {
	const d: Delivery = delivery ?? { fulfilment: "delivery" };
	const { userLocation, requestLocation } = useGeolocation();
	const [query, setQuery] = useState(d.address ?? "");
	const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
	const [searching, setSearching] = useState(false);
	const [locating, setLocating] = useState(false);

	// Suggestions as the customer types, once they've stopped for a moment
	useEffect(() => {
		if (!query.trim() || query === d.address) {
			setSuggestions([]);
			return;
		}
		const t = setTimeout(() => {
			setSearching(true);
			searchPlaces(query, userLocation ?? undefined)
				.then(setSuggestions)
				.catch(() => setSuggestions([]))
				.finally(() => setSearching(false));
		}, 350);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query]);

	// "Use my location": pin the address where the customer is
	useEffect(() => {
		if (!locating || !userLocation) return;
		setLocating(false);
		const address = d.address || "My current location";
		setQuery(address);
		onChange({ ...d, address, latitude: userLocation.latitude, longitude: userLocation.longitude });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [locating, userLocation]);

	const choose = (fulfilment: Delivery["fulfilment"]) => onChange({ ...d, fulfilment });
	const option = (active: boolean) =>
		`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold rounded-xl border transition-colors ${
			active ? "border-[#fbbf24] bg-amber-50 dark:bg-amber-900/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
		}`;

	return (
		<div className="space-y-4">
			<div className="flex gap-2" role="radiogroup" aria-label="Delivery or pickup">
				<button type="button" role="radio" aria-checked={d.fulfilment === "delivery"} className={option(d.fulfilment === "delivery")} onClick={() => choose("delivery")}>
					<Truck size={18} /> Deliver to me
				</button>
				<button type="button" role="radio" aria-checked={d.fulfilment === "pickup"} className={option(d.fulfilment === "pickup")} onClick={() => choose("pickup")}>
					<Storefront size={18} /> I'll pick it up
				</button>
			</div>

			{d.fulfilment === "delivery" && (
				<div className="relative">
					<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2" htmlFor="delivery-address">
						Delivery address
					</label>
					<div className="flex gap-2">
						<div className="relative flex-1">
							<MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								id="delivery-address"
								className={`${inputClass} pl-9`}
								value={query}
								onChange={(e) => {
									setQuery(e.target.value);
									// Typing again un-pins the address until a suggestion is chosen
									onChange({ ...d, address: undefined, latitude: undefined, longitude: undefined });
								}}
								placeholder="Search for a street, area or landmark"
								autoComplete="off"
							/>
							{searching && <SpinnerGap size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
						</div>
						<button
							type="button"
							onClick={() => {
								setLocating(true);
								requestLocation();
							}}
							className="px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#fbbf24]"
							title="Use my current location"
							aria-label="Use my current location"
						>
							<Crosshair size={18} />
						</button>
					</div>
					{suggestions.length > 0 && (
						<ul className="absolute z-20 mt-1 w-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
							{suggestions.map((s) => (
								<li key={s.id}>
									<button
										type="button"
										className="w-full text-left px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
										onClick={() => {
											setQuery(s.label);
											setSuggestions([]);
											onChange({ ...d, address: s.label, latitude: s.latitude, longitude: s.longitude });
										}}
									>
										{s.label}
									</button>
								</li>
							))}
						</ul>
					)}
					{d.address && d.latitude != null ? (
						<p className="mt-1 text-xs text-green-600">Address pinned</p>
					) : (
						<p className="mt-1 text-xs text-gray-500">Pick an address from the suggestions, or use your current location.</p>
					)}
				</div>
			)}

			<label className="block">
				<span className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Phone number</span>
				<input
					className={inputClass}
					type="tel"
					value={d.recipientPhone ?? ""}
					onChange={(e) => onChange({ ...d, recipientPhone: e.target.value })}
					placeholder="So we can reach you about this order"
				/>
			</label>

			{onContinue && (
				<button
					type="button"
					onClick={onContinue}
					disabled={!deliveryReady(d)}
					className="w-full py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Continue
				</button>
			)}
		</div>
	);
};
