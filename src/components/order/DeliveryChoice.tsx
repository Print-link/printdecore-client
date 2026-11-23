import { useEffect, useState } from "react";
import { Crosshair, MapPin, SpinnerGap, Storefront, Truck } from "@phosphor-icons/react";
import { useGeolocation } from "../../hooks/useGeolocation";
import { Button } from "../ui";
import { deliveryReady, type Delivery } from "../../services/orderApi";
import { searchPlaces, type PlaceSuggestion } from "../../services/geocoding";

interface DeliveryChoiceProps {
	delivery: Delivery | null;
	onChange: (delivery: Delivery) => void;
	/** Shown when set: a button to move on once the details are complete */
	onContinue?: () => void;
}

const inputClass =
	"w-full h-11 px-3 text-base bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink";

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
		`tap flex-1 flex items-center justify-center gap-2 h-10 text-sm font-semibold rounded-[10px] ${active ? "bg-surface text-ink ring-1 ring-line" : "text-ink-2"}`;

	return (
		<div className="space-y-4">
			<div className="flex p-1 rounded-xl bg-fill" role="radiogroup" aria-label="Delivery or pickup">
				<button type="button" role="radio" aria-checked={d.fulfilment === "delivery"} className={option(d.fulfilment === "delivery")} onClick={() => choose("delivery")}>
					<Truck size={18} /> Deliver to me
				</button>
				<button type="button" role="radio" aria-checked={d.fulfilment === "pickup"} className={option(d.fulfilment === "pickup")} onClick={() => choose("pickup")}>
					<Storefront size={18} /> I'll pick it up
				</button>
			</div>

			{d.fulfilment === "delivery" && (
				<div className="relative">
					<label className="block text-sm text-ink-2 mb-1.5" htmlFor="delivery-address">
						Delivery address
					</label>
					<div className="flex gap-2">
						<div className="relative flex-1">
							<MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
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
							{searching && <SpinnerGap size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-3" />}
						</div>
						<button
							type="button"
							onClick={() => {
								setLocating(true);
								requestLocation();
							}}
							className="tap w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-fill text-ink"
							title="Use my current location"
							aria-label="Use my current location"
						>
							<Crosshair size={18} />
						</button>
					</div>
					{suggestions.length > 0 && (
						<ul className="absolute z-20 mt-1 w-full bg-surface border border-line-strong rounded-xl overflow-hidden divide-y divide-line">
							{suggestions.map((s) => (
								<li key={s.id}>
									<button
										type="button"
										className="w-full text-left px-3 py-3 text-sm text-ink hover:bg-fill"
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
						<p className="mt-1.5 text-xs font-semibold text-ok">Address pinned</p>
					) : (
						<p className="mt-1.5 text-xs text-ink-3">Pick an address from the suggestions, or use your current location.</p>
					)}
				</div>
			)}

			<label className="block">
				<span className="block text-sm text-ink-2 mb-1.5">Phone number</span>
				<input
					className={inputClass}
					type="tel"
					value={d.recipientPhone ?? ""}
					onChange={(e) => onChange({ ...d, recipientPhone: e.target.value })}
					placeholder="So we can reach you about this order"
				/>
			</label>

			{onContinue && (
				<Button block onClick={onContinue} disabled={!deliveryReady(d)}>
					Continue
				</Button>
			)}
		</div>
	);
};
