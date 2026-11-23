import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { WarningCircle, ArrowRight, ArrowLeft } from '@phosphor-icons/react';
import { apiService } from '../services/api';
import { Logo } from "../components/Logo";

export const VerifyOTP = () => {
	const [otp, setOtp] = useState(["", "", "", "", "", ""]);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState("");
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		// Get email from location state or redirect back if not available
		const stateEmail = location.state?.email;
		if (stateEmail) {
			setEmail(stateEmail);
		} else {
			// If no email in state, redirect to send OTP page
			navigate("/send-otp", { replace: true });
		}
	}, [location.state, navigate]);

	const handleOtpChange = (index: number, value: string) => {
		// Only allow numbers
		if (value && !/^\d+$/.test(value)) {
			return;
		}

		const newOtp = [...otp];
		newOtp[index] = value.slice(-1); // Only take the last character
		setOtp(newOtp);
		setError("");

		// Auto-focus next input
		if (value && index < 5) {
			const nextInput = document.getElementById(`otp-${index + 1}`);
			nextInput?.focus();
		}
	};

	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		// Handle backspace
		if (e.key === "Backspace" && !otp[index] && index > 0) {
			const prevInput = document.getElementById(`otp-${index - 1}`);
			prevInput?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text").trim();

		if (/^\d{6}$/.test(pastedData)) {
			const newOtp = pastedData.split("");
			setOtp(newOtp);
			setError("");
			// Focus the last input
			document.getElementById("otp-5")?.focus();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		const otpString = otp.join("");
		if (otpString.length !== 6) {
			setError("Please enter the complete 6-digit code");
			return;
		}

		if (!email) {
			setError("Email is required");
			return;
		}

		setIsLoading(true);

		try {
			const response = await apiService.verifyOtp(email, otpString);
			if (response.success) {
				// Navigate to registration page with verified email
				navigate("/register", { state: { email, verified: true } });
			} else {
				setError(
					response.message || "Invalid verification code. Please try again."
				);
				// Clear OTP on error
				setOtp(["", "", "", "", "", ""]);
				document.getElementById("otp-0")?.focus();
			}
		} catch (err: unknown) {
			setError(
				(err as Error).message || "An error occurred. Please try again."
			);
			// Clear OTP on error
			setOtp(["", "", "", "", "", ""]);
			document.getElementById("otp-0")?.focus();
		} finally {
			setIsLoading(false);
		}
	};

	const handleResend = async () => {
		if (!email) return;

		setError("");
		setIsLoading(true);

		try {
			const response = await apiService.sendOtp(email);
			if (response.success) {
				setError("");
				// Show success message (you could use toast here)
				alert("Verification code has been resent to your email");
				setOtp(["", "", "", "", "", ""]);
				document.getElementById("otp-0")?.focus();
			} else {
				setError(response.message || "Failed to resend OTP. Please try again.");
			}
		} catch (err: unknown) {
			setError((err as Error).message || "An error occurred. Please try again.");
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
						Enter Verification Code
					</h1>
					<p className="text-ink-2 mb-1">We've sent a 6-digit code to</p>
					<p className="text-sm font-semibold text-ink">{email}</p>
				</div>

				{error && (
					<div className="mb-6 p-3 bg-bad-tint text-bad rounded-xl flex items-center">
						<WarningCircle size={20} weight="regular" className="mr-3 shrink-0" />
						<p className="text-sm font-medium">{error}</p>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label className="block text-sm font-medium text-ink mb-3 text-center">
							Enter the 6-digit code
						</label>
						<div className="flex justify-center gap-2 sm:gap-3">
							{otp.map((digit, index) => (
								<input
									key={index}
									id={`otp-${index}`}
									type="text"
									inputMode="numeric"
									maxLength={1}
									value={digit}
									onChange={(e) => handleOtpChange(index, e.target.value)}
									onKeyDown={(e) => handleKeyDown(index, e)}
									onPaste={handlePaste}
									className="num w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-fill text-ink border-2 border-transparent rounded-xl focus:outline-none focus:border-ink transition-colors"
									disabled={isLoading}
									autoFocus={index === 0}
								/>
							))}
						</div>
					</div>

					<button
						type="submit"
						disabled={isLoading || otp.join("").length !== 6}
						className="tap w-full h-12 rounded-xl text-base font-semibold text-black bg-brand hover:bg-brand-press disabled:opacity-45 flex items-center justify-center"
					>
						{isLoading ? (
							<>
								<div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2"></div>
								Verifying...
							</>
						) : (
							<>
								Verify Code
								<ArrowRight size={20} weight="bold" className="ml-2" />
							</>
						)}
					</button>
				</form>

				<div className="mt-6 space-y-3">
					<button
						type="button"
						onClick={handleResend}
						disabled={isLoading}
						className="w-full h-10 text-sm font-semibold text-ink disabled:text-ink-3"
					>
						Didn't receive the code? Resend
					</button>

					<div className="text-center">
						<button
							type="button"
							onClick={() => navigate("/send-otp")}
							disabled={isLoading}
							className="text-sm text-ink-2 hover:text-ink flex items-center justify-center mx-auto"
						>
							<ArrowLeft size={16} weight="bold" className="mr-1" />
							Change email address
						</button>
					</div>

					<div className="text-center pt-2 border-t border-line">
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
		</div>
	);
};

