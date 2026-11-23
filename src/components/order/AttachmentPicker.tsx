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
export const AttachmentPicker = ({ files, onChange, onUploadingChange, label = "Design files" }: AttachmentPickerProps) => {
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
			<p className="mb-3 text-lg font-bold title-tight text-ink">{label} <span className="text-sm font-normal text-ink-3">Optional</span></p>
			{files.length > 0 && (
				<ul className="mb-2 space-y-1.5">
					{files.map((f, i) => (
						<li key={f.publicId || i} className="flex items-center gap-2 h-11 px-3 rounded-xl bg-fill text-sm">
							<Paperclip size={16} className="text-ink-2 shrink-0" />
							<span className="flex-1 truncate text-ink">{f.name}</span>
							<button
								type="button"
								onClick={() => onChange(files.filter((_, j) => j !== i))}
								className="tap p-1.5 -mr-1 text-ink-3 hover:text-bad"
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
						className="tap w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl border border-dashed border-line-strong text-ink"
					>
						{uploading ? <SpinnerGap size={16} className="animate-spin" /> : <Paperclip size={16} />}
						{uploading ? "Uploading…" : "Attach files"}
					</button>
					<input ref={input} type="file" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
				</>
			) : (
				<p className="text-sm text-ink-2">
					<Link to={`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`} className="font-semibold text-ink underline underline-offset-2">
						Sign in
					</Link>{" "}
					to attach your design files.
				</p>
			)}
		</div>
	);
};
