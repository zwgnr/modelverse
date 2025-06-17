import type { ReactNode } from "react";


import { Card, CardContent } from "@/components/ui/card";

export function Bubble({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<Card className={className}>
			<CardContent className="p-3">{children}</CardContent>
		</Card>
	);
}
