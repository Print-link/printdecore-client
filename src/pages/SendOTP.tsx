import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';
import { Logo } from '../components/Logo';

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
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="w-full max-w-md bg-white rounded-2xl p-8">
				<div className="text-center mb-8">
					<div className="flex justify-center mb-4">
						<Logo size="lg" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Verify Your Email
					</h1>
					<p className="text-gray-600">
						We'll send a verification code to your email address
					</p>
				</div>

				{error && (
					<div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-center">
						<AlertCircle className="w-5 h-5 mr-3 shrink-0" />
						<p className="text-sm font-medium">{error}</p>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Email Address
						</label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
								required
								disabled={isLoading}
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center ${
							isLoading
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-[#fbbf24] hover:bg-[#fbbf24] '
						}`}
					>
						{isLoading ? (
							<>
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
								Sending OTP...
							</>
						) : (
							<>
								Send Verification Code
								<ArrowRight className="w-5 h-5 ml-2" />
							</>
						)}
					</button>
				</form>

				<div className="mt-6 text-center">
					<p className="text-sm text-gray-600">
						Already have an account?{' '}
						<Link
							to="/login"
							className="text-[#fbbf24] font-semibold hover:text-[#fbbf24]"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

