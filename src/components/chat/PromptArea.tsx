import {
	type ChangeEvent,
	Fragment,
	memo,
	useCallback,
	useRef,
	useState,
} from "react";

import { useMutation } from "convex/react";
import type { modelId } from "convex/schema";
import type { Infer } from "convex/values";

import { useAtom } from "jotai";
import {
	FileImage,
	FileText,
	Globe,
	Paperclip,
	Send,
	Square,
	X,
} from "lucide-react";

import { models, selectedModelAtom } from "@/lib/models";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface PromptAreaProps {
	conversationId?: string;
	isStreaming?: boolean;
	onSendMessage?: (payload: {
		body: string;
		author: "User";
		conversationId: Id<"conversations">;
		model: Infer<typeof modelId>;
		files?: { name: string; contentType: string; url: string }[];
		fileData?: {
			filename: string;
			fileType: string;
			storageId: Id<"_storage">;
		}[];
	}) => Promise<void>;
	onStopStream?: () => void;
	className?: string;
	placeholder?: {
		default?: string;
		streaming?: string;
		withFiles?: string;
	};
	createNewConversation?: boolean;
	onNavigateToChat?: (conversationId: string) => void;
}

export function PromptArea(props: PromptAreaProps) {
	const {
		conversationId,
		isStreaming = false,
		onSendMessage,
		onStopStream,
		createNewConversation = false,
		onNavigateToChat,
		className,
		placeholder = {
			default: "Type your message…",
			streaming: "AI is responding…",
			withFiles: "Ask about your files…",
		},
	} = props;

	/* -------- tiny local states that change per keystroke -------- */
	const [text, setText] = useState("");
	const [files, setFiles] = useState<{ file: File; dataUrl?: string }[]>([]);
	const [web, setWeb] = useState(false);
	const [model, setModel] = useAtom(selectedModelAtom);

	/* ---------------- convex mutations (stable) ------------------ */
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const createConversation = useMutation(api.conversations.create);
	const sendMessage = useMutation(api.messages.send);

	/* ------------------ stable refs & callbacks ------------------- */
	const fileInputRef = useRef<HTMLInputElement>(null);

	const openFileDialog = useCallback(() => fileInputRef.current?.click(), []);

	const toggleWeb = useCallback(() => setWeb((v) => !v), []);

	const changeModel = useCallback(
		(val: Infer<typeof modelId>) => setModel(val),
		[setModel],
	);

	const removeFile = useCallback(
		(idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx)),
		[],
	);

	const handleFileUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		const selected = Array.from(e.target.files || []);
		selected.forEach((file) => {
			if (!file.type.startsWith("image/") && file.type !== "application/pdf")
				return;
			const reader = new FileReader();
			reader.onload = () =>
				setFiles((prev) => [
					...prev,
					{ file, dataUrl: reader.result as string },
				]);
			reader.readAsDataURL(file);
		});
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, []);

	const uploadToStorage = useCallback(
		async (file: File): Promise<Id<"_storage">> => {
			const url = await generateUploadUrl();
			const result = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});
			const { storageId } = await result.json();
			return storageId;
		},
		[generateUploadUrl],
	);

	/* ---------------- submit / stop ---------------- */
	const handleSubmit = useCallback(async () => {
		if (!text.trim() && files.length === 0) return;

		// upload files
		const fileData = await Promise.all(
			files.map(async ({ file }) => ({
				filename: file.name,
				fileType: file.type,
				storageId: await uploadToStorage(file),
			})),
		);

		const modelIdToUse = (
			web && !model.includes(":online") ? `${model}:online` : model
		) as Infer<typeof modelId>;

		if (createNewConversation && onNavigateToChat) {
			const newId = await createConversation({});
			await sendMessage({
				prompt: text,
				conversationId: newId,
				model: modelIdToUse,
				files: fileData,
			});
			setText("");
			setFiles([]);
			onNavigateToChat(newId);
			return;
		}

		if (conversationId && onSendMessage) {
			const attachments = fileData.map((f) => ({
				name: f.filename,
				contentType: f.fileType,
				url: `convex-storage://${f.storageId}`,
			}));
			await onSendMessage({
				body: text,
				author: "User",
				conversationId: conversationId as Id<"conversations">,
				model: modelIdToUse,
				files: attachments,
				fileData,
			});
			setText("");
			setFiles([]);
		}
	}, [
		text,
		files,
		web,
		model,
		createNewConversation,
		conversationId,
		onSendMessage,
		onNavigateToChat,
		createConversation,
		sendMessage,
		uploadToStorage,
	]);

	const handleStop = useCallback(() => onStopStream?.(), [onStopStream]);

	/* --------------- helpers --------------- */
	const currentPlaceholder = isStreaming
		? placeholder.streaming
		: files.length
			? placeholder.withFiles
			: placeholder.default;

	const canSend = text.trim().length > 0 || files.length > 0;

	return (
		<div
			className={cn(
				createNewConversation ? "w-full" : "sticky bottom-0 w-full px-4 py-6",
				className,
			)}
		>
			<div
				className={cn(
					"container mx-auto max-w-4xl",
					createNewConversation && "px-0",
				)}
			>
				{/* --------------- Cohesive input container --------------- */}
				<div className="overflow-hidden rounded-3xl border bg-background/80 shadow-black/5 shadow-xl backdrop-blur-lg">
					{/* --------------- Text area --------------- */}
					<PromptInput
						value={text}
						onValueChange={setText}
						onSubmit={handleSubmit}
						isLoading={isStreaming}
						className="border-0 bg-transparent p-4 shadow-none"
					>
						<PromptInputTextarea
							placeholder={currentPlaceholder}
							autoComplete="off"
							disabled={
								(!createNewConversation && !conversationId) || isStreaming
							}
							className="border-0 bg-transparent text-base text-foreground focus:ring-0"
						/>
					</PromptInput>

					{/* --------------- Below the textarea (memo) --------------- */}
					<MemoPreviewAndActions
						files={files}
						onRemoveFile={removeFile}
						openFileDialog={openFileDialog}
						fileInputRef={fileInputRef}
						onFileUpload={handleFileUpload}
						web={web}
						onToggleWeb={toggleWeb}
						model={model}
						onModelChange={changeModel}
						isStreaming={isStreaming}
						onSubmit={handleSubmit}
						onStop={handleStop}
						canSend={canSend}
					/>
				</div>
			</div>
		</div>
	);
}

interface PreviewProps {
	files: { file: File; dataUrl?: string }[];
	onRemoveFile: (i: number) => void;
	openFileDialog: () => void;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	web: boolean;
	onToggleWeb: () => void;
	model: string;
	onModelChange: (m: Infer<typeof modelId>) => void;
	isStreaming: boolean;
	onSubmit: () => void;
	onStop: () => void;
	canSend: boolean;
}

const MemoPreviewAndActions = memo(function PreviewAndActions(p: PreviewProps) {
	const {
		files,
		onRemoveFile,
		openFileDialog,
		fileInputRef,
		onFileUpload,
		web,
		onToggleWeb,
		model,
		onModelChange,
		isStreaming,
		onSubmit,
		onStop,
		canSend,
	} = p;

	return (
		<Fragment>
			{files.length > 0 && (
				<div className="flex flex-wrap gap-2 border-border/50 border-t px-4 py-3">
					{files.map(({ file }, i) => (
						<div
							key={file.name}
							className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-secondary-foreground text-sm"
						>
							{file.type.startsWith("image/") ? (
								<FileImage className="h-4 w-4" />
							) : (
								<FileText className="h-4 w-4" />
							)}
							<span className="max-w-32 truncate">{file.name}</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
								onClick={() => onRemoveFile(i)}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					))}
				</div>
			)}

			<div
				className={cn(
					"flex items-center justify-between px-4 py-3",
					files.length > 0 && "border-border/50 border-t",
				)}
			>
				{/* left side buttons */}
				<div className="flex items-center gap-2">
					{/* upload */}
					<Button
						variant="ghost"
						size="icon"
						onClick={openFileDialog}
						className="h-8 w-8 rounded-lg hover:bg-accent!"
					>
						<Paperclip className="h-4 w-4 text-muted-foreground" />
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/png,image/jpeg,image/webp,application/pdf"
						multiple
						hidden
						onChange={onFileUpload}
					/>

					{/* web toggle */}
					<Button
						variant={web ? "default" : "ghost"}
						size="icon"
						onClick={onToggleWeb}
						className={cn(
							"h-8 w-8 rounded-lg transition-colors",
							web
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "hover:bg-accent! hover:text-secondary-foreground",
						)}
					>
						<Globe className="h-4 w-4" />
					</Button>

					{/* model picker */}
					<Combobox
						className="w-48"
						groupedOptions={models.map((m) => ({
							value: m.id,
							label: m.name,
							group: m.company,
						}))}
						value={model}
						onValueChange={(value) =>
							onModelChange(value as Infer<typeof modelId>)
						}
						placeholder="Select model…"
					/>
				</div>

				{/* right side send / stop */}
				{isStreaming ? (
					<Button
						size="icon"
						onClick={onStop}
						className="h-9 w-9 rounded-lg bg-foreground hover:bg-foreground/80"
					>
						<Square className="h-4 w-4" />
					</Button>
				) : (
					<Button
						size="icon"
						onClick={onSubmit}
						disabled={!canSend || isStreaming}
						className="h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-primary/30"
					>
						<Send className="h-4 w-4" />
					</Button>
				)}
			</div>
		</Fragment>
	);
});
