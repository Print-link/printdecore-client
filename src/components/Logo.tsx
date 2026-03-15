// import { useTheme } from "../contexts/ThemeContext";
import logoArt from "../assets/LogoArt.png";
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
	return (
		<img
			src={logoArt}
			alt="Printdecore Logo"
			className={`${sizeClasses[size]} ${className} ${onClick ? "cursor-pointer" : ""} object-contain`}
			onClick={onClick}
		/>
	);
};

