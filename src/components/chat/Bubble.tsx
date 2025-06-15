import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";

export function Bubble({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<Card className={cn("w-full whitespace-pre-wrap break-words", className)}>
			<CardContent className="p-3">{children}</CardContent>
		</Card>
	);
}
