import * as React from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxOption {
	value: string;
	label: string;
}

interface ComboboxGroupedOption {
	value: string;
	label: string;
	group: string;
}

interface ComboboxProps {
	options?: ComboboxOption[];
	groupedOptions?: ComboboxGroupedOption[];
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	className?: string;
}

export function Combobox({
	options,
	groupedOptions,
	value,
	onValueChange,
	placeholder = "Select option...",
	searchPlaceholder = "Search...",
	className,
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false);

	// Group options by their group property if using groupedOptions
	const groupedData = React.useMemo(() => {
		if (groupedOptions) {
			return groupedOptions.reduce(
				(acc, option) => {
					if (!acc[option.group]) {
						acc[option.group] = [];
					}
					acc[option.group].push(option);
					return acc;
				},
				{} as Record<string, ComboboxGroupedOption[]>,
			);
		}
		return null;
	}, [groupedOptions]);

	// Find the selected option label
	const selectedLabel = React.useMemo(() => {
		if (options) {
			return options.find((option) => option.value === value)?.label;
		}
		if (groupedOptions) {
			return groupedOptions.find((option) => option.value === value)?.label;
		}
		return null;
	}, [options, groupedOptions, value]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					// biome-ignore lint/a11y/useSemanticElements: /
					role="combobox"
					aria-expanded={open}
					className={cn("w-[200px] justify-between", className)}
				>
					{selectedLabel || placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>No option found.</CommandEmpty>

						{/* Render grouped options */}
						{groupedData &&
							Object.entries(groupedData).map(([group, groupOptions]) => (
								<CommandGroup key={group} heading={group}>
									{groupOptions.map((option) => (
										<CommandItem
											key={option.value}
											value={option.value}
											onSelect={(currentValue) => {
												onValueChange?.(currentValue);
												setOpen(false);
											}}
										>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													value === option.value ? "opacity-100" : "opacity-0",
												)}
											/>
											{option.label}
										</CommandItem>
									))}
								</CommandGroup>
							))}

						{/* Render simple options (backwards compatibility) */}
						{options && !groupedOptions && (
							<CommandGroup>
								{options.map((option) => (
									<CommandItem
										key={option.value}
										value={option.value}
										onSelect={(currentValue) => {
											onValueChange?.(currentValue);
											setOpen(false);
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === option.value ? "opacity-100" : "opacity-0",
											)}
										/>
										{option.label}
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
