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
}

export function FileDisplay({ file }: FileDisplayProps) {
  const fileUrl = useQuery(api.files.getFileUrl, { storageId: file.storageId });

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