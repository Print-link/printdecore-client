import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from "react-toastify";
import { WarningCircle, EnvelopeSimple, LockSimple } from '@phosphor-icons/react';
import { AuthLayout } from "../components/auth/AuthLayout";

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
				navigate(returnUrl || "/home", { replace: true });
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
		<AuthLayout art="print" title="Welcome back" subtitle={<>Sign in to order prints from shops near you</>}>
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
						/>
					</div>
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
							placeholder="Enter your password"
							className="w-full h-12 pl-10 pr-4 bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink"
							required
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
							Signing in...
						</span>
					) : (
						"Sign in"
					)}
				</button>
			</form>

			<div className="mt-6 text-center">
				<p className="text-sm text-ink-2">
					Don't have an account?{" "}
					<Link
						to="/send-otp"
						className="font-semibold text-ink underline underline-offset-2"
					>
						Sign up
					</Link>
				</p>
			</div>
		</AuthLayout>
	);
};

