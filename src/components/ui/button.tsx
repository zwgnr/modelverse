import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[transform,opacity,box-shadow,background] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden",
	{
		variants: {
			variant: {
				default:
					"border border-primary/20 bg-primary/10 text-primary shadow-md shadow-primary/25 hover:bg-primary/20 disabled:shadow-none disabled:bg-primary/5 disabled:text-primary/50 dark:border-primary/30 dark:bg-primary/5 dark:shadow-primary/20 dark:hover:bg-primary/15",
				destructive:
					"border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:shadow-destructive/10 focus-visible:ring-destructive/20 dark:border-destructive/30 dark:bg-destructive/5 dark:hover:bg-destructive/15",
				outline:
					"border border-black/10 bg-black/[0.01] shadow-lg shadow-black/5 hover:bg-black/[0.05] hover:shadow-black/10 text-secondary-foreground dark:border-white/10 dark:bg-white/[0.01] dark:shadow-black/30 dark:hover:bg-white/[0.03]",
				secondary:
					"border border-secondary/20 bg-secondary/10 text-secondary-foreground shadow-lg shadow-secondary/5 hover:bg-secondary/20 hover:shadow-secondary/10 dark:border-secondary/30 dark:bg-secondary/5 dark:shadow-secondary/20 dark:hover:bg-secondary/15",
				ghost:
					"border border-transparent text-secondary-foreground hover:border-black/5 hover:bg-black/[0.03] hover:shadow-lg hover:shadow-black/5 dark:hover:border-white/5 dark:hover:bg-white/[0.02] dark:hover:shadow-black/20",
				flat:
					"border-transparent bg-transparent text-secondary-foreground hover:bg-secondary transition-colors",
				link: "text-primary underline-offset-4 hover:underline bg-transparent border-transparent",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
				lg: "h-10 rounded-xl px-6 has-[>svg]:px-4",
				icon: "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
