import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnvelopeSimple, WarningCircle, ArrowRight } from '@phosphor-icons/react';
import { apiService } from '../services/api';
import { AuthLayout } from "../components/auth/AuthLayout";

export const SendOTP = () => {
	const [email, setEmail] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!email.trim()) {
			setError('Please enter your email address');
			return;
		}

		setIsLoading(true);

		try {
			const response = await apiService.sendOtp(email.trim());
			if (response.success) {
				// Navigate to verify OTP page with email
				navigate('/verify-otp', { state: { email: email.trim() } });
			} else {
				setError(
					response.data?.message || "Failed to send OTP. Please try again."
				);
			}
		} catch (err: unknown) {
			const errorMessage =
				(err as { response?: { data?: { message?: string } } })?.response?.data
					?.message || 'An error occurred. Please try again.';
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthLayout art="mailbox" title="Create your account" subtitle={<>Start with your email. We'll send you a code.</>}>
			{error && (
				<div className="mb-6 p-3 bg-bad-tint text-bad rounded-xl flex items-center">
					<WarningCircle size={20} weight="regular" className="mr-3 shrink-0" />
					<p className="text-sm font-medium">{error}</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-5">
				<div>
					<label className="block text-sm text-ink-2 mb-1.5">
						Email
					</label>
					<div className="relative">
						<EnvelopeSimple size={20} weight="regular" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							className="w-full h-12 pl-10 pr-4 bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink"
							required
							disabled={isLoading}
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="tap w-full h-12 rounded-xl text-base font-semibold text-black bg-brand hover:bg-brand-press disabled:opacity-45 flex items-center justify-center"
				>
					{isLoading ? (
						<>
							<div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2"></div>
							Sending…
						</>
					) : (
						<>
							Send code
							<ArrowRight size={20} weight="bold" className="ml-2" />
						</>
					)}
				</button>
			</form>

			<div className="mt-6 text-center">
				<p className="text-sm text-ink-2">
					Already have an account?{' '}
					<Link
						to="/login"
						className="font-semibold text-ink underline underline-offset-2"
					>
						Sign in
					</Link>
				</p>
			</div>
		</AuthLayout>
	);
};

