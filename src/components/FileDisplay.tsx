import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { FileImage, FileText } from "lucide-react";

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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileImage className="h-3 w-3" />
          {file.filename}
        </div>
        <div className="h-32 w-full animate-pulse bg-muted rounded border" />
      </div>
    );
  }

  if (file.fileType.startsWith('image/')) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileImage className="h-3 w-3" />
          {file.filename}
        </div>
        {fileUrl && (
          <img
            src={fileUrl}
            alt={file.filename}
            className="max-w-full h-auto rounded border"
            style={{ maxHeight: '200px' }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <FileText className="h-3 w-3" />
      {file.filename}
    </div>
  );
} 