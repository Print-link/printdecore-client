import { useNavigate } from "react-router-dom";
import {
	HeroSection,
	HowItWorksSection,
	ServicesShowcaseSection,
	KeyFeaturesSection,
	TestimonialsSection,
	StatisticsSection,
	PrintStationCTA,
	FinalCTASection,
	Footer,
} from "../components/landing";

export const Landing = () => {
	const navigate = useNavigate();

	const handleGetStarted = () => {
		navigate("/search");
	};

	const handleJoinClick = () => {
		navigate("/register");
	};

	return (
		<div className="min-h-screen bg-white">
			<HeroSection onGetStarted={handleGetStarted} />
			<HowItWorksSection />
			<ServicesShowcaseSection />
			<KeyFeaturesSection />
			<TestimonialsSection />
			<StatisticsSection />
			<PrintStationCTA onJoinClick={handleJoinClick} />
			<FinalCTASection onGetStarted={handleGetStarted} />
			<Footer />
		</div>
	);
};
