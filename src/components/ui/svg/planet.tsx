import { useId } from "react";

export function Planet() {
	const gradientId = useId();
	const strokeId = useId();

	return (
		<svg
			aria-label="Planet"
			aria-hidden="true"
			role="presentation"
			xmlns="http://www.w3.org/2000/svg"
			width="36"
			height="36"
			viewBox="0 0 24 24"
			fill="none"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="lucide lucide-planet"
		>
			<defs>
				<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#ff00ff" stopOpacity="0.8" />
					<stop offset="25%" stopColor="#00ffff" stopOpacity="0.8" />
					<stop offset="50%" stopColor="#ffff00" stopOpacity="0.8" />
					<stop offset="75%" stopColor="#ff00ff" stopOpacity="0.8" />
					<stop offset="100%" stopColor="#00ffff" stopOpacity="0.8" />
				</linearGradient>
				<linearGradient id={strokeId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#ff00ff" />
					<stop offset="33%" stopColor="#00ffff" />
					<stop offset="66%" stopColor="#ffff00" />
					<stop offset="100%" stopColor="#ff00ff" />
				</linearGradient>
			</defs>
			<circle
				cx="12"
				cy="12"
				r="8"
				stroke={`url(#${strokeId})`}
				fill={`url(#${gradientId})`}
				className="opacity-70"
			/>
			<path
				d="M4.05 13c-1.7 1.8-2.5 3.5-1.8 4.5 1.1 1.9 6.4 1 11.8-2s8.9-7.1 7.7-9c-.6-1-2.4-1.2-4.7-.7"
				stroke={`url(#${strokeId})`}
				className="opacity-90"
			/>
		</svg>
	);
}
