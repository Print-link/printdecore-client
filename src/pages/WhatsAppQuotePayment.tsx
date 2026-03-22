import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	FileText,
	CheckCircle,
	AlertCircle,
	Clock,
	XCircle,
	MapPin,
	Mail,
	Phone,
	LogIn,
	User,
	History,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ─── Types ─────────────────────────────────────────────────────────────

interface QuoteData {
	id: string;
	category: string;
	description?: string;
	amount: number;
	currency: string;
	status: string;
	paymentStatus: string;
	expiresAt?: string;
	branchName?: string;
	branchCoverImage?: string;
	branchAddress?: string;
	branchEmail?: string;
	branchPhone?: string;
	contactName?: string;
	paystackSubaccountId?: string;
	createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────

const formatCurrency = (amount: number, currency: string) => {
	const symbols: Record<string, string> = {
		GHS: "GH₵",
		NGN: "₦",
		USD: "$",
		GBP: "£",
		EUR: "€",
	};
	return `${symbols[currency] || currency}${amount.toFixed(2)}`;
};

const getToken = (): string | null => localStorage.getItem("token");

const authHeaders = () => {
	const token = getToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Component ─────────────────────────────────────────────────────────

export const WhatsAppQuotePayment = () => {
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const { user, isLoading: authLoading } = useAuth();

	const [quote, setQuote] = useState<QuoteData | null>(null);
	const [fetching, setFetching] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [paying, setPaying] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [paymentSuccess, setPaymentSuccess] = useState(false);
	const [declining, setDeclining] = useState(false);
	const [logoError, setLogoError] = useState(false);
	const [claimed, setClaimed] = useState(false);

	const paymentWindowRef = useRef<Window | null>(null);
	const messageHandlerRef = useRef<((e: MessageEvent) => void) | null>(null);
	const windowCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// ─── Fetch quote details (public) ───────────────────────────────────

	const fetchQuote = useCallback(async () => {
		if (!token) {
			setError("Invalid payment link.");
			setFetching(false);
			return;
		}

		try {
			setFetching(true);
			const response = await axios.get(
				`${BASE_URL}/whatsapp-quotes/pay/${token}`
			);

			if (response.data.success && response.data.data) {
				setQuote(response.data.data);
				if (response.data.data.paymentStatus === "paid") {
					setPaymentSuccess(true);
				}
			} else {
				setError("Quote not found. Please contact the business.");
			}
		} catch (err: unknown) {
			const error = err as {
				response?: { status?: number; data?: { message?: string } };
			};
			if (error.response?.status === 404) {
				setError(
					error.response?.data?.message ||
						"This quote has expired or is invalid. Please contact the business."
				);
			} else {
				setError("Failed to load quote. Please try again later.");
			}
		} finally {
			setFetching(false);
		}
	}, [token]);

	useEffect(() => {
		fetchQuote();
	}, [fetchQuote]);

	// ─── Claim quote when user logs in ──────────────────────────────────

	useEffect(() => {
		if (user && token && quote && !claimed && !paymentSuccess) {
			const claim = async () => {
				try {
					await axios.post(
						`${BASE_URL}/whatsapp-quotes/pay/${token}/claim`,
						{},
						{ headers: authHeaders() }
					);
					setClaimed(true);
				} catch {
					// Non-blocking — order might already be linked
				}
			};
			claim();
		}
	}, [user, token, quote, claimed, paymentSuccess]);

	// ─── Cleanup ────────────────────────────────────────────────────────

	const cleanup = useCallback(() => {
		if (messageHandlerRef.current) {
			window.removeEventListener("message", messageHandlerRef.current);
			messageHandlerRef.current = null;
		}
		if (windowCheckRef.current) {
			clearInterval(windowCheckRef.current);
			windowCheckRef.current = null;
		}
	}, []);

	useEffect(() => cleanup, [cleanup]);

	// ─── Verify payment (authenticated) ─────────────────────────────────

	const verifyPayment = useCallback(
		async (reference: string) => {
			if (!token) return;

			setVerifying(true);
			cleanup();

			try {
				const response = await axios.post(
					`${BASE_URL}/whatsapp-quotes/pay/${token}/verify`,
					{ reference },
					{ headers: authHeaders() }
				);

				if (response.data.success) {
					setPaymentSuccess(true);
					toast.success("Payment confirmed! Your order has been recorded.");
				} else {
					toast.error(
						"Payment could not be verified. Please contact support."
					);
				}
			} catch {
				toast.error("Payment verification failed. Please contact support.");
			} finally {
				setVerifying(false);
				setPaying(false);
			}
		},
		[token, cleanup]
	);

	// ─── Initialize payment ─────────────────────────────────────────────

	const handlePay = useCallback(async () => {
		if (!token || !quote || !user) return;

		setPaying(true);

		try {
			const response = await axios.post(
				`${BASE_URL}/whatsapp-quotes/pay/${token}/initialize`,
				{ email: user.email }
			);

			if (
				response.data.success &&
				response.data.data?.authorization_url
			) {
				const windowName = `PaystackPayment_${Date.now()}`;
				paymentWindowRef.current = window.open(
					response.data.data.authorization_url,
					windowName,
					"width=600,height=700,scrollbars=yes"
				);

				if (
					!paymentWindowRef.current ||
					paymentWindowRef.current.closed
				) {
					window.location.href = response.data.data.authorization_url;
					return;
				}

				const handleMessage = (event: MessageEvent) => {
					if (event.origin !== window.location.origin) return;
					const ref = event.data?.reference;
					if (!ref) return;

					if (event.data?.type === "PAYSTACK_SUCCESS") {
						cleanup();
						verifyPayment(ref);
					} else if (
						event.data?.type === "PAYSTACK_FAILED" ||
						event.data?.type === "PAYSTACK_ERROR"
					) {
						cleanup();
						setPaying(false);
						toast.error(
							"Payment was cancelled or failed. Please try again."
						);
					}
				};

				messageHandlerRef.current = handleMessage;
				window.addEventListener("message", handleMessage);

				windowCheckRef.current = setInterval(() => {
					if (paymentWindowRef.current?.closed) {
						cleanup();
						setPaying(false);
					}
				}, 1000);
			} else {
				throw new Error(
					response.data.message || "Failed to initialize payment"
				);
			}
		} catch (err: unknown) {
			const error = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				error.response?.data?.message ||
					error.message ||
					"Failed to start payment"
			);
			setPaying(false);
		}
	}, [token, quote, user, cleanup, verifyPayment]);

	// ─── Decline quote ──────────────────────────────────────────────────

	const handleDecline = useCallback(async () => {
		if (!token) return;
		setDeclining(true);

		try {
			await axios.post(
				`${BASE_URL}/whatsapp-quotes/pay/${token}/decline`
			);
			toast.info("Quote declined.");
			setQuote((prev) =>
				prev ? { ...prev, status: "declined" } : null
			);
		} catch {
			toast.error("Failed to decline quote.");
		} finally {
			setDeclining(false);
		}
	}, [token]);

	// ─── Derived state ──────────────────────────────────────────────────

	const isPayable =
		quote &&
		["pending", "viewed", "accepted"].includes(quote.status) &&
		quote.paymentStatus !== "paid";

	const isExpiredOrCancelled =
		quote &&
		["expired", "cancelled", "declined"].includes(quote.status);

	// ─── Loading ────────────────────────────────────────────────────────

	if (fetching || authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="w-10 h-10 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-500 text-sm">Loading quote...</p>
				</div>
			</div>
		);
	}

	// ─── Error ──────────────────────────────────────────────────────────

	if (error && !quote) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
				<div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
					<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<AlertCircle className="w-8 h-8 text-red-500" />
					</div>
					<h2 className="text-xl font-bold text-gray-900 mb-2">
						Quote Unavailable
					</h2>
					<p className="text-gray-600 mb-6">{error}</p>
					<button
						onClick={() => navigate("/")}
						className="px-6 py-3 bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#f59e0b] transition-colors"
					>
						Go Home
					</button>
				</div>
			</div>
		);
	}

	if (!quote) return null;

	// ─── Payment success ────────────────────────────────────────────────

	if (paymentSuccess || quote.paymentStatus === "paid") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
				<div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
					<div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<CheckCircle className="w-10 h-10 text-green-500" />
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Payment Confirmed
					</h2>
					<p className="text-gray-600 mb-2">
						Your payment of{" "}
						<span className="font-bold text-gray-900">
							{formatCurrency(quote.amount, quote.currency)}
						</span>{" "}
						has been received.
					</p>
					<p className="text-gray-500 text-sm mb-6">
						This order is now in your order history. The business has
						been notified and will process it.
					</p>
					{user && (
						<button
							onClick={() => navigate("/home/history")}
							className="inline-flex items-center gap-2 px-6 py-3 bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#f59e0b] transition-colors"
						>
							<History className="w-4 h-4" />
							View Order History
						</button>
					)}
				</div>
			</div>
		);
	}

	// ─── Expired / Cancelled / Declined ─────────────────────────────────

	if (isExpiredOrCancelled) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
				<div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
					<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						{quote.status === "expired" ? (
							<Clock className="w-8 h-8 text-gray-400" />
						) : (
							<XCircle className="w-8 h-8 text-gray-400" />
						)}
					</div>
					<h2 className="text-xl font-bold text-gray-900 mb-2">
						Quote{" "}
						{quote.status.charAt(0).toUpperCase() +
							quote.status.slice(1)}
					</h2>
					<p className="text-gray-600 mb-6">
						{quote.status === "expired"
							? "This quote has expired. Please contact the business for a new quote."
							: quote.status === "declined"
							? "You have declined this quote."
							: "This quote has been cancelled by the business."}
					</p>
					{quote.branchPhone && (
						<a
							href={`tel:${quote.branchPhone}`}
							className="inline-flex items-center gap-2 px-6 py-3 bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#f59e0b] transition-colors"
						>
							<Phone className="w-4 h-4" />
							Contact Business
						</a>
					)}
				</div>
			</div>
		);
	}

	// ─── Verifying ──────────────────────────────────────────────────────

	if (verifying) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
				<div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
					<div className="w-10 h-10 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<h2 className="text-xl font-bold text-gray-900 mb-2">
						Verifying Payment
					</h2>
					<p className="text-gray-500">
						Please wait while we confirm your payment...
					</p>
				</div>
			</div>
		);
	}

	// ─── Main payment view ──────────────────────────────────────────────

	return (
		<div className="min-h-screen bg-gray-50 py-8 px-4">
			<div className="max-w-2xl mx-auto">
				{/* Business Header */}
				<div className="bg-white border border-gray-200 rounded-2xl mb-6 overflow-hidden">
					<div className="px-8 py-6">
						<div className="flex items-start gap-5">
							{quote.branchCoverImage && !logoError ? (
								<img
									src={quote.branchCoverImage}
									alt={quote.branchName || "Business"}
									className="w-16 h-16 object-contain rounded-xl border border-gray-200 flex-shrink-0"
									onError={() => setLogoError(true)}
								/>
							) : (
								<div className="w-16 h-16 bg-[#fbbf24]/10 rounded-xl border border-gray-200 flex items-center justify-center flex-shrink-0">
									<FileText className="w-8 h-8 text-[#fbbf24]" />
								</div>
							)}
							<div className="flex-1 min-w-0">
								<h2 className="text-xl font-bold text-gray-900 mb-1">
									{quote.branchName || "Business Quote"}
								</h2>
								{quote.branchAddress && (
									<p className="text-sm text-gray-500 flex items-center gap-1.5">
										<MapPin className="w-3.5 h-3.5 flex-shrink-0" />
										{quote.branchAddress}
									</p>
								)}
								{quote.branchEmail && (
									<p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
										<Mail className="w-3.5 h-3.5 flex-shrink-0" />
										{quote.branchEmail}
									</p>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Quote Header */}
				<div className="mb-6">
					<div className="flex items-center gap-3 mb-2">
						<div className="w-10 h-10 bg-[#fbbf24] rounded-xl flex items-center justify-center">
							<FileText className="w-5 h-5 text-white" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Quote
							</h1>
							<p className="text-sm text-gray-500">
								Review details and make payment
							</p>
						</div>
					</div>
				</div>

				{/* Quote Details */}
				<div className="bg-white border border-gray-200 rounded-2xl mb-6">
					<div className="border-b border-gray-100 px-8 py-5">
						<h3 className="text-base font-semibold text-gray-900">
							Quote Details
						</h3>
					</div>
					<div className="px-8 py-6 space-y-5">
						<div>
							<label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
								Category
							</label>
							<p className="text-gray-900 font-medium">
								{quote.category}
							</p>
						</div>

						{quote.description && (
							<div>
								<label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
									Description
								</label>
								<p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
									{quote.description}
								</p>
							</div>
						)}

						{quote.contactName && (
							<div>
								<label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
									Prepared for
								</label>
								<p className="text-gray-900 font-medium">
									{quote.contactName}
								</p>
							</div>
						)}

						{quote.expiresAt && (
							<div>
								<label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
									Valid until
								</label>
								<p className="text-gray-700">
									{new Date(
										quote.expiresAt
									).toLocaleDateString("en-GB", {
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</p>
							</div>
						)}

						<div className="text-xs text-gray-400">
							Quote sent on{" "}
							{new Date(quote.createdAt).toLocaleDateString(
								"en-GB",
								{
									day: "numeric",
									month: "short",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								}
							)}
						</div>
					</div>
				</div>

				{/* Amount */}
				<div className="bg-white border border-gray-200 rounded-2xl mb-6">
					<div className="px-8 py-6 flex items-center justify-between">
						<span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
							Total Amount
						</span>
						<span className="text-3xl font-bold text-[#fbbf24]">
							{formatCurrency(quote.amount, quote.currency)}
						</span>
					</div>
				</div>

				{/* Auth Gate + Payment */}
				{isPayable && (
					<div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
						{!user ? (
							/* ─── Not logged in — show auth prompt ────────── */
							<div className="text-center py-4">
								<div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<User className="w-7 h-7 text-gray-400" />
								</div>
								<h3 className="text-lg font-bold text-gray-900 mb-2">
									Sign in to continue
								</h3>
								<p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
									Please log in or create an account to make
									payment. This ensures your order is saved to
									your account and you can track it.
								</p>
								<div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
									<button
										onClick={() =>
											navigate(
												`/login?returnUrl=${encodeURIComponent(
													`/quote/pay/${token}`
												)}`
											)
										}
										className="flex-1 py-3 px-6 bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#f59e0b] transition-colors flex items-center justify-center gap-2"
									>
										<LogIn className="w-4 h-4" />
										Log In
									</button>
									<button
										onClick={() =>
											navigate(
												`/register?returnUrl=${encodeURIComponent(
													`/quote/pay/${token}`
												)}`
											)
										}
										className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
									>
										Create Account
									</button>
								</div>
								<button
									onClick={handleDecline}
									disabled={declining}
									className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
								>
									{declining
										? "Declining..."
										: "Decline this quote"}
								</button>
							</div>
						) : (
							/* ─── Logged in — show payment actions ────────── */
							<>
								{/* Logged in as */}
								<div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200 mb-5">
									<div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
										<CheckCircle className="w-4 h-4 text-green-600" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-green-800">
											Signed in as{" "}
											{user.firstName} {user.lastName}
										</p>
										<p className="text-xs text-green-600 truncate">
											{user.email}
										</p>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex flex-col sm:flex-row gap-3">
									<button
										onClick={handleDecline}
										disabled={declining || paying}
										className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{declining
											? "Declining..."
											: "Decline"}
									</button>
									<button
										onClick={handlePay}
										disabled={paying}
										className="flex-1 py-3 px-6 bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#f59e0b] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{paying ? (
											<>
												<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
												Processing...
											</>
										) : (
											<>
												<CheckCircle className="w-5 h-5" />
												Pay{" "}
												{formatCurrency(
													quote.amount,
													quote.currency
												)}
											</>
										)}
									</button>
								</div>
							</>
						)}
					</div>
				)}

				{/* Footer */}
				<p className="text-center text-xs text-gray-400 mt-4">
					Payments are processed securely via Paystack.
					{quote.branchPhone && (
						<>
							{" "}
							Questions? Call{" "}
							<a
								href={`tel:${quote.branchPhone}`}
								className="text-[#fbbf24] hover:underline"
							>
								{quote.branchPhone}
							</a>
						</>
					)}
				</p>
			</div>
		</div>
	);
};
