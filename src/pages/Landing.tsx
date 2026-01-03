import { useNavigate } from "react-router-dom";
import {
	HeroSection,
	HowItWorksSection,
	ServicesShowcaseSection,
	KeyFeaturesSection,
	TestimonialsSection,
	PrintStationCTA,
	FinalCTASection,
	Footer,
} from "../components/landing";

export const Landing = () => {
	const navigate = useNavigate();

	const handleGetStarted = () => {
		navigate("/home/search");
	};

	const handleJoinClick = () => {
		navigate("/register");
	};

	return (
		<main className="min-h-screen bg-white">
			<HeroSection onGetStarted={handleGetStarted} />
			<HowItWorksSection />
			<ServicesShowcaseSection />
			<KeyFeaturesSection />
			<TestimonialsSection />
			<PrintStationCTA onJoinClick={handleJoinClick} />
			<FinalCTASection onGetStarted={handleGetStarted} />
			<Footer />
		</main>
	);
};
