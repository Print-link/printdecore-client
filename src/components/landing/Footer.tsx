import { MapPin, EnvelopeSimple, Phone, FacebookLogo, TwitterLogo, InstagramLogo, LinkedinLogo } from "@phosphor-icons/react";
import { Logo } from "../Logo";

const footerLinks = {
	product: [
		{ name: "How It Works", href: "#how-it-works" },
		{ name: "Services", href: "#services" },
		{ name: "Pricing", href: "#pricing" },
		{ name: "Features", href: "#features" },
	],
	company: [
		{ name: "About Us", href: "#about" },
		{ name: "Contact", href: "#contact" },
		{ name: "Careers", href: "#careers" },
		{ name: "Blog", href: "#blog" },
	],
	support: [
		{ name: "Help Center", href: "#help" },
		{ name: "FAQs", href: "#faqs" },
		{ name: "Privacy Policy", href: "#privacy" },
		{ name: "Terms of Service", href: "#terms" },
	],
	forPrintStations: [
		{ name: "Join as Print Station", href: "/register" },
		{ name: "Partner Program", href: "#partners" },
		{ name: "Resources", href: "#resources" },
		{ name: "API Documentation", href: "#api" },
	],
};

const socialLinks = [
	{ name: "Facebook", icon: FacebookLogo, href: "#" },
	{ name: "Twitter", icon: TwitterLogo, href: "#" },
	{ name: "Instagram", icon: InstagramLogo, href: "#" },
	{ name: "LinkedIn", icon: LinkedinLogo, href: "#" },
];

export const Footer = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="bg-black text-white dark:bg-[var(--black-primary)]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
				{/* Main Footer Content */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-8">
					{/* Brand Section */}
					<div className="lg:col-span-2">
						<div className="mb-4">
							<Logo size="lg" className="mb-2" />
							<p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
								by piper & co
							</p>
						</div>
						<p className="text-gray-400 dark:text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
							Connecting customers with local print stations across Africa.
							Order custom print jobs, get instant quotes, and track your orders in real-time.
						</p>

						{/* Contact Info */}
						<div className="space-y-3 mb-6">
							<div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500">
								<EnvelopeSimple size={16} weight="regular" className="text-[#fbbf24]" />
								<a href="mailto:printdecoreofficial@gmail.com" className="hover:text-[#fbbf24] transition-colors">
									printdecoreofficial@gmail.com
								</a>
							</div>
							<div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500">
								<Phone size={16} weight="regular" className="text-[#fbbf24]" />
								<a href="tel:+233123456789" className="hover:text-[#fbbf24] transition-colors">
									+233 123 456 789
								</a>
							</div>
							<div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500">
								<MapPin size={16} weight="regular" className="text-[#fbbf24]" />
								<span>Accra, Ghana</span>
							</div>
						</div>

						{/* Social Links */}
						<div className="flex items-center gap-4">
							{socialLinks.map((social) => {
								const Icon = social.icon;
								return (
									<a
										key={social.name}
										href={social.href}
										aria-label={social.name}
										className="w-10 h-10 rounded-full bg-gray-800 dark:bg-gray-900 flex items-center justify-center hover:bg-[#fbbf24] hover:text-black transition-all group"
									>
										<Icon size={20} weight="regular" className="text-gray-400 group-hover:text-black transition-colors" />
									</a>
								);
							})}
						</div>
					</div>

					{/* Product Links */}
					<div>
						<h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
							Product
						</h4>
						<ul className="space-y-3">
							{footerLinks.product.map((link) => (
								<li key={link.name}>
									<a
										href={link.href}
										className="text-gray-400 dark:text-gray-500 hover:text-[#fbbf24] transition-colors text-sm"
									>
										{link.name}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Company Links */}
					<div>
						<h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
							Company
						</h4>
						<ul className="space-y-3">
							{footerLinks.company.map((link) => (
								<li key={link.name}>
									<a
										href={link.href}
										className="text-gray-400 dark:text-gray-500 hover:text-[#fbbf24] transition-colors text-sm"
									>
										{link.name}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Support & Print Stations */}
					<div>
						<h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
							Support
						</h4>
						<ul className="space-y-3 mb-6">
							{footerLinks.support.map((link) => (
								<li key={link.name}>
									<a
										href={link.href}
										className="text-gray-400 dark:text-gray-500 hover:text-[#fbbf24] transition-colors text-sm"
									>
										{link.name}
									</a>
								</li>
							))}
						</ul>
						<h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider mt-6">
							For Print Stations
						</h4>
						<ul className="space-y-3">
							{footerLinks.forPrintStations.map((link) => (
								<li key={link.name}>
									<a
										href={link.href}
										className="text-gray-400 dark:text-gray-500 hover:text-[#fbbf24] transition-colors text-sm"
									>
										{link.name}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Divider */}
				<div className="border-t border-gray-800 dark:border-gray-700 my-8"></div>

				{/* Bottom Section */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4">
					<div className="text-sm text-gray-400 dark:text-gray-500">
						<p>
							© {currentYear} <span className="text-[#fbbf24]">piper & co</span>. All rights reserved.
						</p>
					</div>
					<div className="flex items-center gap-6 text-sm">
						<a
							href="#privacy"
							className="text-gray-400 dark:text-gray-500 hover:text-[#fbbf24] transition-colors"
						>
							Privacy Policy
						</a>
						<a
							href="#terms"
							className="text-gray-400 dark:text-gray-500 hover:text-[#fbbf24] transition-colors"
						>
							Terms of Service
						</a>
						<a
							href="#cookies"
							className="text-gray-400 dark:text-gray-500 hover:text-[#fbbf24] transition-colors"
						>
							Cookie Policy
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

