import { useQuery } from "convex/react";

import { FileImage, FileText } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface FileDisplayProps {
	file: {
		filename: string;
		fileType: string;
		storageId: Id<"_storage">;
	};
	messageId: Id<"messages">;
}

export function FileDisplay({ file, messageId }: FileDisplayProps) {
	const fileUrl = useQuery(api.files.getFileUrl, {
		storageId: file.storageId,
		messageId: messageId,
	});

	if (!fileUrl) {
		return (
			<div className="space-y-1">
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					<FileImage className="h-3 w-3" />
					{file.filename}
				</div>
				<div className="h-32 w-full animate-pulse rounded border bg-muted" />
			</div>
		);
	}

	if (file.fileType.startsWith("image/")) {
		return (
			<div className="space-y-1">
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					<FileImage className="h-3 w-3" />
					{file.filename}
				</div>
				{fileUrl && (
					<img
						src={fileUrl}
						alt={file.filename}
						className="h-auto max-w-full rounded border"
						style={{ maxHeight: "200px" }}
					/>
				)}
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2 text-muted-foreground text-xs">
			<FileText className="h-3 w-3" />
			{file.filename}
		</div>
	);
}
