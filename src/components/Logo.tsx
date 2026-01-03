import { useTheme } from "../contexts/ThemeContext";

interface LogoProps {
	className?: string;
	size?: "sm" | "md" | "lg" | "xl" | "2xl";
	onClick?: () => void;
}

const sizeClasses = {
	sm: "h-8 w-auto",
	md: "h-12 w-auto",
	lg: "h-16 w-auto",
	xl: "h-20 w-auto",
	"2xl": "h-24 w-auto",
};

export const Logo = ({ className = "", size = "md", onClick }: LogoProps) => {
	const { theme } = useTheme();
	const logoPath = theme === "dark" 
		? "/paperlink-light.svg" 
		: "/paperlink-dark.svg";

	return (
		<img
			src={logoPath}
			alt="PaperLink Logo"
			className={`${sizeClasses[size]} ${className} ${onClick ? "cursor-pointer" : ""} object-contain`}
			onClick={onClick}
		/>
	);
};

