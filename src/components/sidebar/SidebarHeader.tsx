import { Planet } from "@/components/ui/svg/planet";

export function SidebarHeader() {
	return (
		<div className="flex-shrink-0">
			<div className="flex items-center justify-between p-3">
				<div className="flex items-center justify-center gap-2">
					<Planet />
					<div className="font-bold text-foreground text-xl">
						<span className="text-foreground">modelverse</span>
					</div>
				</div>
			</div>
		</div>
	);
}
