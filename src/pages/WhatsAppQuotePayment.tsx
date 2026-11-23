import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	FileText,
	CheckCircle,
	WarningCircle,
	Clock,
	XCircle,
	MapPin,
	EnvelopeSimple,
	Phone,
	ClockCounterClockwise,
} from "@phosphor-icons/react";
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

const TRANSACTION_FEE_RATE = 0.0195; // 1.95%

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

const calcTransactionFee = (amount: number) =>
	Math.round(amount * TRANSACTION_FEE_RATE * 100) / 100;


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
	const [guestEmail, setGuestEmail] = useState("");

	const paymentWindowRef = useRef<Window | null>(null);
	const messageHandlerRef = useRef<((e: MessageEvent) => void) | null>(null);
	const windowCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const paymentRefRef = useRef<string | null>(null);
	const hasVerifiedRef = useRef(false);

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

	const cleanupListeners = useCallback(() => {
		if (messageHandlerRef.current) {
			window.removeEventListener("message", messageHandlerRef.current);
			messageHandlerRef.current = null;
		}
		if (windowCheckRef.current) {
			clearInterval(windowCheckRef.current);
			windowCheckRef.current = null;
		}
	}, []);

	useEffect(() => cleanupListeners, [cleanupListeners]);

	// ─── Poll payment status (webhook-first approach) ───────────────────
	// After the Paystack popup closes, we poll the backend status endpoint.
	// The webhook processes the charge.success event server-side, so the
	// quote flips to "paid" without the frontend needing to call /verify.
	// If polling finds it paid, we're done. If not after ~30s, we call
	// /verify as a fallback to trigger verification manually.

	const pollStatusRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const pollCountRef = useRef(0);
	const MAX_POLLS = 15; // 15 × 2s = 30s

	const stopPolling = useCallback(() => {
		if (pollStatusRef.current) {
			clearInterval(pollStatusRef.current);
			pollStatusRef.current = null;
		}
		pollCountRef.current = 0;
	}, []);

	const startPolling = useCallback(
		(reference: string) => {
			if (!token) return;
			setVerifying(true);
			cleanupListeners();
			pollCountRef.current = 0;

			pollStatusRef.current = setInterval(async () => {
				pollCountRef.current += 1;

				try {
					const res = await axios.get(
						`${BASE_URL}/whatsapp-quotes/pay/${token}/status`
					);
					if (res.data?.data?.paymentStatus === "paid") {
						stopPolling();
						setPaymentSuccess(true);
						setVerifying(false);
						setPaying(false);
						toast.success("Payment confirmed! Your order has been recorded.");
						return;
					}
				} catch {
					// Network blip — keep polling
				}

				// Fallback: if webhook hasn't processed after MAX_POLLS, call /verify directly
				if (pollCountRef.current >= MAX_POLLS) {
					stopPolling();
					try {
						const verifyRes = await axios.post(
							`${BASE_URL}/whatsapp-quotes/pay/${token}/verify`,
							{ reference },
							{ headers: authHeaders() }
						);
						if (verifyRes.data.success) {
							setPaymentSuccess(true);
							toast.success("Payment confirmed! Your order has been recorded.");
						} else {
							toast.error("Payment could not be verified. Please contact the business.");
						}
					} catch {
						toast.error("Payment verification timed out. If you were charged, the business will be notified automatically.");
					} finally {
						setVerifying(false);
						setPaying(false);
					}
				}
			}, 2000);
		},
		[token, cleanupListeners, stopPolling]
	);

	// Cleanup polling on unmount
	useEffect(() => () => stopPolling(), [stopPolling]);

	// ─── Initialize payment ─────────────────────────────────────────────

	const handlePay = useCallback(async () => {
		if (!token || !quote) return;
		const email = user?.email || guestEmail.trim() || undefined;

		setPaying(true);
		hasVerifiedRef.current = false;

		try {
			const response = await axios.post(
				`${BASE_URL}/whatsapp-quotes/pay/${token}/initialize`,
				email ? { email } : {}
			);

			if (
				response.data.success &&
				response.data.data?.authorization_url
			) {
				paymentRefRef.current = response.data.data.reference || null;

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
					sessionStorage.setItem("payment_return_url", `/quote/pay/${token}`);
					window.location.href = response.data.data.authorization_url;
					return;
				}

				// When popup closes, start polling — the webhook will have
				// already verified the payment server-side in most cases.
				windowCheckRef.current = setInterval(() => {
					if (paymentWindowRef.current?.closed) {
						cleanupListeners();
						if (!hasVerifiedRef.current && paymentRefRef.current) {
							hasVerifiedRef.current = true;
							startPolling(paymentRefRef.current);
						}
					}
				}, 1000);

				// Also listen for postMessage as a fast-path
				const handleMessage = (event: MessageEvent) => {
					if (event.origin !== window.location.origin) return;
					const ref = event.data?.reference;
					if (!ref) return;

					if (event.data?.type === "PAYSTACK_SUCCESS") {
						hasVerifiedRef.current = true;
						cleanupListeners();
						startPolling(ref);
					} else if (
						event.data?.type === "PAYSTACK_FAILED" ||
						event.data?.type === "PAYSTACK_ERROR"
					) {
						cleanupListeners();
						setPaying(false);
						toast.error("Payment was cancelled or failed. Please try again.");
					}
				};

				messageHandlerRef.current = handleMessage;
				window.addEventListener("message", handleMessage);
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
	}, [token, quote, user, guestEmail, cleanupListeners, startPolling]);

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
			<div className="min-h-screen flex items-center justify-center bg-fill">
				<div className="text-center">
					<div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-ink-2 text-sm">Loading quote...</p>
				</div>
			</div>
		);
	}

	// ─── Error ──────────────────────────────────────────────────────────

	if (error && !quote) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-fill px-4">
				<div className="max-w-md w-full bg-surface border border-line rounded-xl p-8 text-center">
					<div className="w-16 h-16 bg-bad-tint rounded-full flex items-center justify-center mx-auto mb-4">
						<WarningCircle size={32} weight="regular" className="text-bad" />
					</div>
					<h2 className="text-xl font-bold text-ink mb-2">
						Quote Unavailable
					</h2>
					<p className="text-ink-2 mb-6">{error}</p>
					<button
						onClick={() => navigate("/")}
						className="px-6 py-3 bg-brand text-white rounded-lg font-semibold hover:bg-brand-press transition-colors"
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
			<div className="min-h-screen flex items-center justify-center bg-fill px-4">
				<div className="max-w-md w-full bg-surface border border-line rounded-xl p-8 text-center">
					<div className="w-20 h-20 bg-ok-tint rounded-full flex items-center justify-center mx-auto mb-6">
						<CheckCircle size={40} weight="regular" className="text-ok" />
					</div>
					<h2 className="text-2xl font-bold text-ink mb-2">
						Payment Confirmed
					</h2>
					<p className="text-ink-2 mb-2">
						Your payment of{" "}
						<span className="font-bold text-ink">
							{formatCurrency(quote.amount + calcTransactionFee(quote.amount), quote.currency)}
						</span>{" "}
						has been received.
					</p>
					<p className="text-ink-2 text-sm mb-6">
						{user
							? "This order is now in your order history. The business has been notified and will process it."
							: "The business has been notified and will process your order. A confirmation has been sent to your email."}
					</p>
					{user ? (
						<button
							onClick={() => navigate("/home/history")}
							className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-lg font-semibold hover:bg-brand-press transition-colors"
						>
							<ClockCounterClockwise size={16} weight="bold" />
							View Order History
						</button>
					) : (
						<p className="text-xs text-ink-3">
							{quote.contactName && (
								<span className="font-medium text-ink-2">
									{quote.contactName}
								</span>
							)}
							{quote.contactName && " — "}
							Payment reference saved to your WhatsApp chat.
						</p>
					)}
				</div>
			</div>
		);
	}

	// ─── Expired / Cancelled / Declined ─────────────────────────────────

	if (isExpiredOrCancelled) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-fill px-4">
				<div className="max-w-md w-full bg-surface border border-line rounded-xl p-8 text-center">
					<div className="w-16 h-16 bg-fill rounded-full flex items-center justify-center mx-auto mb-4">
						{quote.status === "expired" ? (
							<Clock size={32} weight="regular" className="text-ink-3" />
						) : (
							<XCircle size={32} weight="regular" className="text-ink-3" />
						)}
					</div>
					<h2 className="text-xl font-bold text-ink mb-2">
						Quote{" "}
						{quote.status.charAt(0).toUpperCase() +
							quote.status.slice(1)}
					</h2>
					<p className="text-ink-2 mb-6">
						{quote.status === "expired"
							? "This quote has expired. Please contact the business for a new quote."
							: quote.status === "declined"
							? "You have declined this quote."
							: "This quote has been cancelled by the business."}
					</p>
					{quote.branchPhone && (
						<a
							href={`tel:${quote.branchPhone}`}
							className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-lg font-semibold hover:bg-brand-press transition-colors"
						>
							<Phone size={16} weight="bold" />
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
			<div className="min-h-screen flex items-center justify-center bg-fill px-4">
				<div className="max-w-md w-full bg-surface border border-line rounded-xl p-8 text-center">
					<div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<h2 className="text-xl font-bold text-ink mb-2">
						Verifying Payment
					</h2>
					<p className="text-ink-2">
						Please wait while we confirm your payment...
					</p>
				</div>
			</div>
		);
	}

	// ─── Main payment view ──────────────────────────────────────────────

	return (
		<div className="min-h-screen bg-fill py-8 px-4">
			<div className="max-w-2xl mx-auto">
				{/* Business Header */}
				<div className="bg-surface border border-line rounded-xl mb-6 overflow-hidden">
					<div className="px-8 py-6">
						<div className="flex items-start gap-5">
							{quote.branchCoverImage && !logoError ? (
								<img
									src={quote.branchCoverImage}
									alt={quote.branchName || "Business"}
									className="w-16 h-16 object-contain rounded-xl border border-line flex-shrink-0"
									onError={() => setLogoError(true)}
								/>
							) : (
								<div className="w-16 h-16 bg-brand/10 rounded-xl border border-line flex items-center justify-center flex-shrink-0">
									<FileText size={32} weight="regular" className="text-brand-ink" />
								</div>
							)}
							<div className="flex-1 min-w-0">
								<h2 className="text-xl font-bold text-ink mb-1">
									{quote.branchName || "Business Quote"}
								</h2>
								{quote.branchAddress && (
									<p className="text-sm text-ink-2 flex items-center gap-1.5">
										<MapPin size={14} weight="regular" className="flex-shrink-0" />
										{quote.branchAddress}
									</p>
								)}
								{quote.branchEmail && (
									<p className="text-sm text-ink-2 flex items-center gap-1.5 mt-0.5">
										<EnvelopeSimple size={14} weight="regular" className="flex-shrink-0" />
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
						<div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
							<FileText size={20} weight="regular" className="text-white" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-ink">
								Quote
							</h1>
							<p className="text-sm text-ink-2">
								Review details and make payment
							</p>
						</div>
					</div>
				</div>

				{/* Quote Details */}
				<div className="bg-surface border border-line rounded-xl mb-6">
					<div className="border-b border-line px-8 py-5">
						<h3 className="text-base font-semibold text-ink">
							Quote Details
						</h3>
					</div>
					<div className="px-8 py-6 space-y-5">
						<div>
							<label className="block text-sm text-ink-2 mb-1.5">
								Category
							</label>
							<p className="text-ink font-medium">
								{quote.category}
							</p>
						</div>

						{quote.description && (
							<div>
								<label className="block text-sm text-ink-2 mb-1.5">
									Description
								</label>
								<p className="text-ink leading-relaxed whitespace-pre-wrap">
									{quote.description}
								</p>
							</div>
						)}

						{quote.contactName && (
							<div>
								<label className="block text-sm text-ink-2 mb-1.5">
									Prepared for
								</label>
								<p className="text-ink font-medium">
									{quote.contactName}
								</p>
							</div>
						)}

						{quote.expiresAt && (
							<div>
								<label className="block text-sm text-ink-2 mb-1.5">
									Valid until
								</label>
								<p className="text-ink">
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

						<div className="text-xs text-ink-3">
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

				{/* Amount Breakdown */}
				{(() => {
					const transactionFee = calcTransactionFee(quote.amount);
					const total = quote.amount + transactionFee;
					return (
						<div className="bg-surface border border-line rounded-xl mb-6">
							<div className="px-8 py-6 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm text-ink-2">
										Service fee
									</span>
									<span className="text-sm font-medium text-ink">
										{formatCurrency(quote.amount, quote.currency)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-ink-2">
										Transaction fee (1.95%)
									</span>
									<span className="text-sm font-medium text-ink">
										{formatCurrency(transactionFee, quote.currency)}
									</span>
								</div>
								<div className="border-t border-line pt-3 flex items-center justify-between">
									<span className="text-sm font-semibold text-ink-2">
										Total
									</span>
									<span className="text-3xl font-bold text-brand-ink">
										{formatCurrency(total, quote.currency)}
									</span>
								</div>
							</div>
						</div>
					);
				})()}

				{/* Payment */}
				{isPayable && (
					<div className="bg-surface border border-line rounded-xl p-6 mb-6">
						{user ? (
							/* ─── Logged in — show identity ────────────────── */
							<div className="flex items-center gap-3 p-3 rounded-lg bg-ok-tint mb-5">
								<div className="w-8 h-8 bg-ok-tint rounded-full flex items-center justify-center flex-shrink-0">
									<CheckCircle size={16} weight="regular" className="text-ok" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-ok">
										Signed in as {user.firstName} {user.lastName}
									</p>
									<p className="text-xs text-ok truncate">
										{user.email}
									</p>
								</div>
							</div>
						) : (
							/* ─── Guest — email input ──────────────────────── */
							<div className="mb-5">
								<label className="block text-sm font-semibold text-ink mb-2">
									Email for receipt <span className="text-ink-3 font-normal">(optional)</span>
								</label>
								<div className="relative">
									<EnvelopeSimple
										size={18}
										weight="regular"
										className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
									/>
									<input
										type="email"
										value={guestEmail}
										onChange={(e) => setGuestEmail(e.target.value)}
										placeholder="Enter your email address"
										className="w-full pl-10 pr-4 py-3 bg-fill border border-line rounded-xl text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink transition-all"
									/>
								</div>
								{quote.contactName && (
									<p className="text-xs text-ink-3 mt-2 flex items-center gap-1.5">
										<Phone size={12} />
										Paying as {quote.contactName}
									</p>
								)}
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row gap-3">
							<button
								onClick={handleDecline}
								disabled={declining || paying}
								className="flex-1 py-3 px-6 border border-line-strong text-ink rounded-xl font-semibold hover:bg-fill transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{declining ? "Declining..." : "Decline"}
							</button>
							<button
								onClick={handlePay}
								disabled={paying}
								className="flex-1 py-3 px-6 bg-brand text-white rounded-lg font-semibold hover:bg-brand-press transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{paying ? (
									<>
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										Processing...
									</>
								) : (
									<>
										<CheckCircle size={20} weight="bold" />
										Pay{" "}
										{formatCurrency(
											quote.amount + calcTransactionFee(quote.amount),
											quote.currency
										)}
									</>
								)}
							</button>
						</div>
					</div>
				)}

				{/* Footer */}
				<p className="text-center text-xs text-ink-3 mt-4">
					Payments are processed securely via Paystack.
					{quote.branchPhone && (
						<>
							{" "}
							Questions? Call{" "}
							<a
								href={`tel:${quote.branchPhone}`}
								className="text-brand-ink hover:underline"
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
