import { useState } from "react";
import { Check, CircleNotch, DownloadSimple, Eye, Paperclip } from "@phosphor-icons/react";
import { formatBytes, saveFile, type OrderFile } from "../../utils/files";
import { FileTypeIcon } from "./FileTypeIcon";

interface FileListProps {
	files: OrderFile[];
	title?: string;
}

type RowState = "idle" | "saving" | "saved";

/** An illustration of the kind of file it is (follows light/dark) */
const FileTile = ({ file }: { file: OrderFile }) => (
	<span className="shrink-0">
		<FileTypeIcon kind={file.kind} ext={file.ext} className="dark:hidden" />
		<FileTypeIcon kind={file.kind} ext={file.ext} dark className="hidden dark:block" />
	</span>
);

const iconBtn =
	"inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 hover:bg-fill hover:text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand";

/**
 * Files on an order or request: what each one is, how big, and buttons to
 * open or download it — or download them all.
 */
export const FileList = ({ files, title = "Files" }: FileListProps) => {
	const [state, setState] = useState<Record<number, RowState>>({});
	const [savingAll, setSavingAll] = useState(false);

	if (files.length === 0) return null;

	const total = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
	const set = (i: number, s: RowState) => setState((prev) => ({ ...prev, [i]: s }));

	const download = async (i: number) => {
		set(i, "saving");
		await saveFile(files[i]);
		set(i, "saved");
		setTimeout(() => set(i, "idle"), 2000);
	};

	const downloadAll = async () => {
		setSavingAll(true);
		// One after another: browsers block a burst of downloads at once
		for (let i = 0; i < files.length; i++) {
			await download(i);
			await new Promise((r) => setTimeout(r, 300));
		}
		setSavingAll(false);
	};

	return (
		<section aria-label={title} className="rounded-xl border border-line overflow-hidden">
			<header className="flex items-center justify-between gap-2 px-4 py-2.5 bg-fill border-b border-line">
				<p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
					<Paperclip size={14} weight="bold" />
					{title}
					<span className="font-normal text-ink-2">
						· {files.length}
						{total > 0 ? ` · ${formatBytes(total)}` : ""}
					</span>
				</p>
				{files.length > 1 && (
					<button
						type="button"
						onClick={downloadAll}
						disabled={savingAll}
						className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-ink hover:bg-fill transition-colors disabled:opacity-60"
					>
						{savingAll ? <CircleNotch size={14} className="animate-spin" /> : <DownloadSimple size={14} weight="bold" />}
						{savingAll ? "Downloading…" : "Download all"}
					</button>
				)}
			</header>

			<ul className="divide-y divide-line">
				{files.map((file, i) => {
					const s = state[i] ?? "idle";
					const meta = [file.ext, formatBytes(file.size), file.width && file.height ? `${file.width}×${file.height}px` : ""].filter(Boolean);
					return (
						<li key={`${file.url}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
							<FileTile file={file} />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-ink" title={file.name}>
									{file.name}
								</p>
								<p className="text-xs text-ink-2">{meta.join(" · ")}</p>
							</div>
							<div className="flex shrink-0 items-center gap-0.5">
								<a href={file.url} target="_blank" rel="noreferrer" className={iconBtn} aria-label={`Open ${file.name}`} title="Open">
									<Eye size={18} />
								</a>
								<button
									type="button"
									onClick={() => download(i)}
									disabled={s === "saving"}
									className={iconBtn}
									aria-label={`Download ${file.name}`}
									title="Download"
								>
									{s === "saving" ? (
										<CircleNotch size={18} className="animate-spin" />
									) : s === "saved" ? (
										<Check size={18} weight="bold" className="text-ok" />
									) : (
										<DownloadSimple size={18} />
									)}
								</button>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
};
