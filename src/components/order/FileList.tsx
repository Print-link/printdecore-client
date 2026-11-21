import { useState } from "react";
import { Check, CircleNotch, DownloadSimple, Eye, Paperclip } from "@phosphor-icons/react";
import { formatBytes, KIND_ACCENT, previewUrl, saveFile, type OrderFile } from "../../utils/files";
import { FileTypeIcon } from "./FileTypeIcon";

interface FileListProps {
	files: OrderFile[];
	title?: string;
}

type RowState = "idle" | "saving" | "saved";

/**
 * The file's picture: a real thumbnail where there is one (images, the first
 * page of a PDF), otherwise an illustration of that kind of file.
 */
const FileTile = ({ file }: { file: OrderFile }) => {
	const [broken, setBroken] = useState(false);
	const src = previewUrl(file);
	if (src && !broken) {
		return (
			<span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 shadow-sm">
				<img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
				<span
					className="absolute bottom-0.5 left-0.5 rounded-[3px] px-1 text-[8px] font-extrabold leading-[12px] tracking-wide text-white"
					style={{ backgroundColor: KIND_ACCENT[file.kind] }}
				>
					{file.ext.slice(0, 4)}
				</span>
			</span>
		);
	}
	return (
		<span className="shrink-0">
			<FileTypeIcon kind={file.kind} ext={file.ext} className="dark:hidden" />
			<FileTypeIcon kind={file.kind} ext={file.ext} dark className="hidden dark:block" />
		</span>
	);
};

const iconBtn =
	"inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97706]";

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
		<section aria-label={title} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
			<header className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800">
				<p className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
					<Paperclip size={14} weight="bold" />
					{title}
					<span className="font-normal text-gray-500">
						· {files.length}
						{total > 0 ? ` · ${formatBytes(total)}` : ""}
					</span>
				</p>
				{files.length > 1 && (
					<button
						type="button"
						onClick={downloadAll}
						disabled={savingAll}
						className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#b45309] dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
					>
						{savingAll ? <CircleNotch size={14} className="animate-spin" /> : <DownloadSimple size={14} weight="bold" />}
						{savingAll ? "Downloading…" : "Download all"}
					</button>
				)}
			</header>

			<ul className="divide-y divide-gray-100 dark:divide-gray-800">
				{files.map((file, i) => {
					const s = state[i] ?? "idle";
					const meta = [file.ext, formatBytes(file.size), file.width && file.height ? `${file.width}×${file.height}px` : ""].filter(Boolean);
					return (
						<li key={`${file.url}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
							<FileTile file={file} />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100" title={file.name}>
									{file.name}
								</p>
								<p className="text-xs text-gray-500">{meta.join(" · ")}</p>
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
										<Check size={18} weight="bold" className="text-emerald-500" />
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
