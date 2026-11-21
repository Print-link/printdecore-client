import { useState } from "react";
import { Check, CircleNotch, DownloadSimple, Eye, Paperclip } from "@phosphor-icons/react";
import { formatBytes, saveFile, type FileKind, type OrderFile } from "../../utils/files";

interface FileListProps {
	files: OrderFile[];
	title?: string;
}

/** Badge colours per kind, so each file is recognisable at a glance */
const KIND_STYLE: Record<FileKind, string> = {
	pdf: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30",
	image: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30",
	doc: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30",
	sheet: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
	slides: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/30",
	design: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30",
	archive: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
	other: "bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600",
};

type RowState = "idle" | "saving" | "saved";

const FileTile = ({ file }: { file: OrderFile }) => {
	const [broken, setBroken] = useState(false);
	if (file.kind === "image" && !broken) {
		return (
			<img
				src={file.url}
				alt=""
				loading="lazy"
				onError={() => setBroken(true)}
				className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
			/>
		);
	}
	return (
		<span aria-hidden="true" className={`h-10 w-10 shrink-0 rounded-lg ring-1 flex items-center justify-center text-[10px] font-bold tracking-wide ${KIND_STYLE[file.kind]}`}>
			{file.ext.slice(0, 4)}
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
