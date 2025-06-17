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

import {
	FileImage,
	FileText,
	Globe,
	Paperclip,
	Send,
	Square,
	X,
} from "lucide-react";

import { DEFAULT_MODEL } from "@/lib/models";
import { cn } from "@/lib/utils";

import { ModelPicker } from "@/components/chat/model-picker";
import { Button } from "@/components/ui/button";
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
	conversationModel?: Infer<typeof modelId>;
	onModelChange?: (model: Infer<typeof modelId>) => void;
	userDefaultModel?: Infer<typeof modelId>;
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
		conversationModel,
		onModelChange,
		userDefaultModel,
	} = props;

	const [text, setText] = useState("");
	const [files, setFiles] = useState<{ file: File; dataUrl?: string }[]>([]);
	const [web, setWeb] = useState(false);
	// Use user's default model from database, fallback to DEFAULT_MODEL
	const defaultModel = userDefaultModel || DEFAULT_MODEL;
	// For new conversations, track model selection locally
	const [newConversationModel, setNewConversationModel] = useState<
		Infer<typeof modelId> | undefined
	>(undefined);

	// Derive the current model based on context
	const currentModel =
		conversationModel ||
		(createNewConversation
			? newConversationModel || defaultModel
			: defaultModel);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const createConversation = useMutation(api.conversations.create);
	const sendMessage = useMutation(api.messages.send);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const openFileDialog = useCallback(() => fileInputRef.current?.click(), []);

	const toggleWeb = useCallback(() => setWeb((v) => !v), []);

	const changeModel = useCallback(
		(val: Infer<typeof modelId>) => {
			if (createNewConversation) {
				// For new conversations, update local state
				setNewConversationModel(val);
			} else if (onModelChange && conversationId) {
				// For existing conversations, update the conversation model
				onModelChange(val);
			}
		},
		[createNewConversation, onModelChange, conversationId],
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

	/*  submit / stop  */
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
			web && !currentModel.includes(":online")
				? `${currentModel}:online`
				: currentModel
		) as Infer<typeof modelId>;

		if (createNewConversation && onNavigateToChat) {
			const newId = await createConversation({ model: modelIdToUse });
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
		currentModel,
		createNewConversation,
		conversationId,
		onSendMessage,
		onNavigateToChat,
		createConversation,
		sendMessage,
		uploadToStorage,
	]);

	const handleStop = useCallback(() => onStopStream?.(), [onStopStream]);

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
					"container mx-auto max-w-3xl",
					createNewConversation && "px-0",
				)}
			>
				{/*  input container  */}
				<div className="relative overflow-hidden rounded-4xl border border-black/10 bg-black/[0.01] shadow-black/5 shadow-xl backdrop-blur-md backdrop-saturate-150 before:absolute before:inset-0 before:rounded-4xl before:bg-gradient-to-br before:from-black/2 before:via-transparent before:to-transparent dark:border-white/10 dark:bg-white/[0.01] dark:shadow-black/30 dark:before:from-white/2">
					{/*  Text area  */}
					<PromptInput
						value={text}
						onValueChange={setText}
						onSubmit={handleSubmit}
						isLoading={isStreaming}
						className="relative z-10 border-0 bg-transparent p-4 shadow-none"
					>
						<PromptInputTextarea
							placeholder={currentPlaceholder}
							autoComplete="off"
							disabled={
								(!createNewConversation && !conversationId) || isStreaming
							}
							className="border-0 bg-transparent! text-foreground placeholder:text-foreground/70 focus:ring-0 dark:placeholder:text-foreground/60"
						/>
					</PromptInput>

					{/*  Below the textarea (memo)  */}
					<MemoPreviewAndActions
						files={files}
						onRemoveFile={removeFile}
						openFileDialog={openFileDialog}
						fileInputRef={fileInputRef}
						onFileUpload={handleFileUpload}
						web={web}
						onToggleWeb={toggleWeb}
						model={currentModel}
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
				<div className="relative z-10 flex flex-wrap gap-2 border-black/5 border-t px-2 py-2 dark:border-white/5">
					{files.map(({ file }, i) => (
						<div
							key={file.name}
							className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/[0.01] px-3 py-2 text-foreground text-sm dark:border-white/10 dark:bg-white/[0.02]"
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
								className="h-4 w-4 p-0 hover:bg-destructive/30 hover:text-destructive-foreground"
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
					"relative z-10 flex items-center justify-between px-3 py-3",
					files.length > 0 && "border-black/5 border-t dark:border-white/5",
				)}
			>
				{/* left side buttons */}
				<div className="flex items-center gap-2">
					{/* upload */}
					<Button
						variant="ghost"
						size="icon"
						onClick={openFileDialog}
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
					>
						<Globe
							className={cn(
								"h-4 w-4",
								web ? "text-primary" : "text-muted-foreground",
							)}
						/>
					</Button>

					{/* model picker */}
					<ModelPicker
						className="w-48"
						value={model}
						onValueChange={onModelChange}
					/>
				</div>

				{/* right side send / stop */}
				{isStreaming ? (
					<Button
						size="icon"
						onClick={onStop}
					>
						<Square className="h-4 w-4" />
					</Button>
				) : (
					<Button
						size="icon"
						onClick={onSubmit}
						disabled={!canSend || isStreaming}
					>
						<Send className="h-4 w-4" />
					</Button>
				)}
			</div>
		</Fragment>
	);
});
