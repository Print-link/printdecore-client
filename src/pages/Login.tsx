import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from "react-toastify";

export const Login = () => {
	// Load last login email from localStorage if available
	const [email, setEmail] = useState(() => {
		try {
			return localStorage.getItem("lastLoginEmail") || "";
		} catch {
			return "";
		}
	});
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			const result = await login(email, password);
			if (result.success) {
				toast.success("Login successful");
				// Redirect to returnUrl if provided, otherwise go to home
				const returnUrl = searchParams.get('returnUrl');
				navigate(returnUrl || "/", { replace: true });
			} else {
				setError(result.message || "Invalid email or password");
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
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Welcome Back
					</h1>
					<p className="text-gray-600">Sign in to your account</p>
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
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
								required
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
								placeholder="Enter your password"
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
								required
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
								Signing in...
							</span>
						) : (
							"Sign In"
						)}
					</button>
				</form>

				<div className="mt-6 text-center">
					<p className="text-sm text-gray-600">
						Don't have an account?{" "}
						<Link
							to="/send-otp"
							className="text-[#fbbf24] font-semibold hover:text-[#fbbf24]"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

