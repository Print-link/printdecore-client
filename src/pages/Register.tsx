import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
	EnvelopeSimple,
	LockSimple,
	User,
	Phone,
	WarningCircle,
	CheckCircle,
	GlobeSimple,
} from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import { Logo } from "../components/Logo";
import {
	getSupportedCountries,
	getCurrencyByCountry,
	detectCountryFromPhone,
	detectCountryFromGeolocation,
} from "../utils/countryUtils";

export const Register = () => {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [country, setCountry] = useState<string>("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isVerified, setIsVerified] = useState(false);
	const [detectingCountry, setDetectingCountry] = useState(false);
	const { register } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const supportedCountries = getSupportedCountries();

	useEffect(() => {
		// Check if user came from OTP verification
		const state = location.state;
		if (state?.email && state?.verified) {
			setEmail(state.email);
			setIsVerified(true);
		} else {
			// If not verified, redirect to send OTP page
			navigate("/send-otp", { replace: true });
		}
	}, [location.state, navigate]);

	// Auto-detect country on component mount
	useEffect(() => {
		const autoDetectCountry = async () => {
			if (country) return; // Don't override if already set

			setDetectingCountry(true);
			try {
				// Try geolocation first
				const detectedCountry = await detectCountryFromGeolocation();
				if (detectedCountry) {
					setCountry(detectedCountry);
					setDetectingCountry(false);
					return;
				}
			} catch (error) {
				console.error("Error detecting country from geolocation:", error);
			}

			// Fallback to default (Ghana)
			setCountry("GH");
			setDetectingCountry(false);
		};

		autoDetectCountry();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once on mount

	// Auto-detect country from phone number when it changes
	useEffect(() => {
		if (phoneNumber && phoneNumber.length > 5 && !country) {
			const detected = detectCountryFromPhone(phoneNumber);
			if (detected) {
				setCountry(detected);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [phoneNumber]); // Only trigger on phoneNumber change, not country

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		if (!phoneNumber.trim()) {
			setError("Phone number is required");
			return;
		}

		setIsLoading(true);

		try {
			const currency = getCurrencyByCountry(country || "GH");
			const result = await register(
				firstName,
				lastName,
				email,
				password,
				phoneNumber,
				country || "GH",
				currency
			);
			if (result.success) {
				toast.success("Account created successfully");
				navigate("/home");
			} else {
				setError(result.message || "Email already registered");
			}
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("An unknown error occurred. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-dvh bg-page flex flex-col items-center sm:justify-center px-5 pt-safe pb-safe">
			<div className="w-full max-w-sm py-10 sm:py-12">
				<div className="mb-8">
					<div className="mb-10">
						<Logo size="md" />
					</div>
					<h1 className="text-3xl font-bold title-tight text-ink mb-1">
						Create Account
					</h1>
					<p className="text-ink-2">Complete your registration</p>
					{isVerified && (
						<div className="mt-3 inline-flex items-center h-6 px-2 bg-ok-tint text-ok rounded-md text-xs font-semibold">
							<CheckCircle size={16} weight="regular" className="mr-1.5" />
							Email verified
						</div>
					)}
				</div>

				{error && (
					<div className="mb-6 p-3 bg-bad-tint text-bad rounded-xl flex items-center">
						<WarningCircle size={20} weight="regular" className="mr-3" />
						<p className="text-sm font-medium">{error}</p>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label className="block text-sm text-ink-2 mb-1.5">
							First Name
						</label>
						<div className="relative">
							<User size={20} weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
							<input
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="Enter your first name"
								className="w-full h-12 pl-10 pr-4 bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink"
								required
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm text-ink-2 mb-1.5">
							Last Name
						</label>
						<div className="relative">
							<User size={20} weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
							<input
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder="Enter your last name"
								className="w-full h-12 pl-10 pr-4 bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink"
								required
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm text-ink-2 mb-1.5">
							Email Address
						</label>
						<div className="relative">
							<EnvelopeSimple size={20} weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								className="w-full h-12 pl-10 pr-4 bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink opacity-70"
								required
								disabled
								readOnly
							/>
							{isVerified && (
								<CheckCircle size={20} weight="regular" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ok" />
							)}
						</div>
						<p className="mt-1 text-xs text-ink-2">
							Email verified and locked
						</p>
					</div>

					<div>
						<label className="block text-sm text-ink-2 mb-1.5">
							Phone Number
						</label>
						<div className="relative">
							<Phone size={20} weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
							<input
								type="tel"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
								placeholder="Enter your phone number (e.g., +233 XX XXX XXXX)"
								className="w-full h-12 pl-10 pr-4 bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink"
								required
								maxLength={20}
							/>
						</div>
						{phoneNumber && (
							<p className="mt-1 text-xs text-ink-2">
								{detectCountryFromPhone(phoneNumber)
									? `Detected: ${
											supportedCountries.find(
												(c) => c.code === detectCountryFromPhone(phoneNumber)
											)?.name || detectCountryFromPhone(phoneNumber)
									  }`
									: "Enter your phone number with country code"}
							</p>
						)}
					</div>

					<div>
						<label className="block text-sm text-ink-2 mb-1.5">
							Country
							{detectingCountry && (
								<span className="ml-2 text-xs text-ink-2">
									(Detecting...)
								</span>
							)}
						</label>
						<div className="relative">
							<GlobeSimple size={20} weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
							<select
								value={country}
								onChange={(e) => setCountry(e.target.value)}
								className="w-full h-12 pl-10 pr-4 bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink appearance-none"
								required
							>
								<option value="">Select your country</option>
								{supportedCountries.map((countryOption) => (
									<option key={countryOption.code} value={countryOption.code}>
										{countryOption.flag} {countryOption.name} (
										{countryOption.currency})
									</option>
								))}
							</select>
						</div>
						{country && (
							<p className="mt-1 text-xs text-ink-2">
								Currency: {getCurrencyByCountry(country)} -{" "}
								{
									supportedCountries.find((c) => c.code === country)
										?.currencyName
								}
							</p>
						)}
					</div>

					<div>
						<label className="block text-sm text-ink-2 mb-1.5">
							Password
						</label>
						<div className="relative">
							<LockSimple size={20} weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Create a password"
								className="w-full h-12 pl-10 pr-4 bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink"
								required
								minLength={6}
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm text-ink-2 mb-1.5">
							Confirm Password
						</label>
						<div className="relative">
							<LockSimple size={20} weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
							<input
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm your password"
								className="w-full h-12 pl-10 pr-4 bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink"
								required
								minLength={6}
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="tap w-full h-12 rounded-xl text-base font-semibold text-black bg-brand hover:bg-brand-press disabled:opacity-45 flex items-center justify-center"
					>
						{isLoading ? (
							<span className="flex items-center justify-center">
								<div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2"></div>
								Creating account...
							</span>
						) : (
							"Create Account"
						)}
					</button>
				</form>

				<div className="mt-6 text-center">
					<p className="text-sm text-ink-2">
						Already have an account?{" "}
						<Link
							to="/login"
							className="font-semibold text-ink underline underline-offset-2"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

