import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from "react-toastify";

export const Register = () => {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isVerified, setIsVerified] = useState(false);
	const { register } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

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
			const result = await register(
				firstName,
				lastName,
				email,
				password,
				phoneNumber
			);
			if (result.success) {
				toast.success("Account created successfully");
				navigate("/");
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
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="w-full max-w-md bg-white rounded-2xl p-8">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
						<UserPlus className="w-8 h-8 text-[#fbbf24]" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Create Account
					</h1>
					<p className="text-gray-600">Complete your registration</p>
					{isVerified && (
						<div className="mt-3 inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
							<CheckCircle className="w-4 h-4 mr-1.5" />
							Email verified
						</div>
					)}
				</div>

				{error && (
					<div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-center">
						<AlertCircle className="w-5 h-5 mr-3" />
						<p className="text-sm font-medium">{error}</p>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							First Name
						</label>
						<div className="relative">
							<User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
							<input
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="Enter your first name"
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
								required
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Last Name
						</label>
						<div className="relative">
							<User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
							<input
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder="Enter your last name"
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
								required
							/>
						</div>
					</div>

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
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-gray-50"
								required
								disabled
								readOnly
							/>
							{isVerified && (
								<CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600" />
							)}
						</div>
						<p className="mt-1 text-xs text-gray-500">
							Email verified and locked
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Phone Number
						</label>
						<div className="relative">
							<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
							<input
								type="tel"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
								placeholder="Enter your phone number"
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
								required
								maxLength={15}
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Password
						</label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Create a password"
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
								required
								minLength={6}
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Confirm Password
						</label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
							<input
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm your password"
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
								required
								minLength={6}
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
							isLoading
								? "bg-gray-400 cursor-not-allowed"
								: "bg-[#fbbf24] hover:bg-[#fbbf24] "
						}`}
					>
						{isLoading ? (
							<span className="flex items-center justify-center">
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
								Creating account...
							</span>
						) : (
							"Create Account"
						)}
					</button>
				</form>

				<div className="mt-6 text-center">
					<p className="text-sm text-gray-600">
						Already have an account?{" "}
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

