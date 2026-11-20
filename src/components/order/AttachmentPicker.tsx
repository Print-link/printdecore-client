import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Paperclip, SpinnerGap, X } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { uploadMultipleFiles, type FileInfo } from "../../services/orderApi";

interface AttachmentPickerProps {
	files: FileInfo[];
	onChange: (files: FileInfo[]) => void;
	onUploadingChange?: (uploading: boolean) => void;
	label?: string;
}

/** Design files for the job, uploaded as soon as they're picked (needs an account) */
export const AttachmentPicker = ({ files, onChange, onUploadingChange, label = "Design files (optional)" }: AttachmentPickerProps) => {
	const { user } = useAuth();
	const location = useLocation();
	const input = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);

	const pick = async (list: FileList | null) => {
		if (!list?.length) return;
		setUploading(true);
		onUploadingChange?.(true);
		try {
			const res = await uploadMultipleFiles(Array.from(list), `orders/staging/${Date.now()}`);
			if (!res.success || !res.data) throw new Error(res.message || "Upload failed");
			onChange([...files, ...res.data]);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't upload your files");
		} finally {
			setUploading(false);
			onUploadingChange?.(false);
			if (input.current) input.current.value = "";
		}
	};

	return (
		<div>
			<p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{label}</p>
			{files.length > 0 && (
				<ul className="mb-2 space-y-1.5">
					{files.map((f, i) => (
						<li key={f.publicId || i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
							<Paperclip size={14} className="text-gray-400 shrink-0" />
							<span className="flex-1 truncate text-gray-800 dark:text-gray-200">{f.name}</span>
							<button
								type="button"
								onClick={() => onChange(files.filter((_, j) => j !== i))}
								className="p-1 text-gray-400 hover:text-red-500"
								aria-label={`Remove ${f.name}`}
							>
								<X size={14} />
							</button>
						</li>
					))}
				</ul>
			)}
			{user ? (
				<>
					<button
						type="button"
						onClick={() => input.current?.click()}
						disabled={uploading}
						className="w-full flex items-center justify-center gap-2 px-3 py-3 text-sm rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#fbbf24] disabled:opacity-60"
					>
						{uploading ? <SpinnerGap size={16} className="animate-spin" /> : <Paperclip size={16} />}
						{uploading ? "Uploading…" : "Attach files"}
					</button>
					<input ref={input} type="file" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
				</>
			) : (
				<p className="text-sm text-gray-500">
					<Link to={`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`} className="text-[#d97706] font-semibold hover:underline">
						Sign in
					</Link>{" "}
					to attach your design files.
				</p>
			)}
		</div>
	);
};
