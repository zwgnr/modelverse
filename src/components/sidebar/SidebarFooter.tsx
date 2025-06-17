import { Github } from "lucide-react";

export function SidebarFooter() {
	return (
		<div className="flex-shrink-0 border-border border-t p-3 px-4">
			<div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
				<span>v0.1.0</span>
				<a
					href="https://github.com/zwgnr/modelverse"
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-1 hover:text-foreground"
				>
					<Github className="h-3 w-3" />
					<span>View on GitHub</span>
				</a>
			</div>
		</div>
	);
}
