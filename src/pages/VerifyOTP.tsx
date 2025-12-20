import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/api';

export const VerifyOTP = () => {
	const [otp, setOtp] = useState(['', '', '', '', '', '']);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState('');
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		// Get email from location state or redirect back if not available
		const stateEmail = location.state?.email;
		if (stateEmail) {
			setEmail(stateEmail);
		} else {
			// If no email in state, redirect to send OTP page
			navigate('/send-otp', { replace: true });
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
		setError('');

		// Auto-focus next input
		if (value && index < 5) {
			const nextInput = document.getElementById(`otp-${index + 1}`);
			nextInput?.focus();
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		// Handle backspace
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			const prevInput = document.getElementById(`otp-${index - 1}`);
			prevInput?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData('text').trim();
		
		if (/^\d{6}$/.test(pastedData)) {
			const newOtp = pastedData.split('');
			setOtp(newOtp);
			setError('');
			// Focus the last input
			document.getElementById('otp-5')?.focus();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		const otpString = otp.join('');
		if (otpString.length !== 6) {
			setError('Please enter the complete 6-digit code');
			return;
		}

		if (!email) {
			setError('Email is required');
			return;
		}

		setIsLoading(true);

		try {
			const response = await apiService.verifyOtp(email, otpString);
			if (response.success) {
				// Navigate to registration page with verified email
				navigate('/register', { state: { email, verified: true } });
			} else {
				setError(response.message || 'Invalid verification code. Please try again.');
				// Clear OTP on error
				setOtp(['', '', '', '', '', '']);
				document.getElementById('otp-0')?.focus();
			}
		} catch (err: any) {
			setError(err.message || 'An error occurred. Please try again.');
			// Clear OTP on error
			setOtp(['', '', '', '', '', '']);
			document.getElementById('otp-0')?.focus();
		} finally {
			setIsLoading(false);
		}
	};

	const handleResend = async () => {
		if (!email) return;

		setError('');
		setIsLoading(true);

		try {
			const response = await apiService.sendOtp(email);
			if (response.success) {
				setError('');
				// Show success message (you could use toast here)
				alert('Verification code has been resent to your email');
				setOtp(['', '', '', '', '', '']);
				document.getElementById('otp-0')?.focus();
			} else {
				setError(response.message || 'Failed to resend OTP. Please try again.');
			}
		} catch (err: any) {
			setError(err.message || 'An error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="w-full max-w-md bg-white rounded-2xl p-8">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
						<Shield className="w-8 h-8 text-[#63A361]" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Enter Verification Code
					</h1>
					<p className="text-gray-600 mb-1">
						We've sent a 6-digit code to
					</p>
					<p className="text-sm font-semibold text-gray-900">{email}</p>
				</div>

				{error && (
					<div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-center">
						<AlertCircle className="w-5 h-5 mr-3 shrink-0" />
						<p className="text-sm font-medium">{error}</p>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3 text-center">
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
									className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
									disabled={isLoading}
									autoFocus={index === 0}
								/>
							))}
						</div>
					</div>

					<button
						type="submit"
						disabled={isLoading || otp.join('').length !== 6}
						className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center ${
							isLoading || otp.join('').length !== 6
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-[#63A361] hover:bg-[#63A361] '
						}`}
					>
						{isLoading ? (
							<>
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
								Verifying...
							</>
						) : (
							<>
								Verify Code
								<ArrowRight className="w-5 h-5 ml-2" />
							</>
						)}
					</button>
				</form>

				<div className="mt-6 space-y-3">
					<button
						type="button"
						onClick={handleResend}
						disabled={isLoading}
						className="w-full text-sm text-[#63A361] hover:text-[#63A361] font-medium disabled:text-gray-400"
					>
						Didn't receive the code? Resend
					</button>

					<div className="text-center">
						<button
							type="button"
							onClick={() => navigate('/send-otp')}
							disabled={isLoading}
							className="text-sm text-gray-600 hover:text-gray-700 flex items-center justify-center mx-auto"
						>
							<ArrowLeft className="w-4 h-4 mr-1" />
							Change email address
						</button>
					</div>

					<div className="text-center pt-2 border-t border-gray-200">
						<p className="text-sm text-gray-600">
							Already have an account?{' '}
							<Link
								to="/login"
								className="text-[#63A361] font-semibold hover:text-[#63A361]"
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

