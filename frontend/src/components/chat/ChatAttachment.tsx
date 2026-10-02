"use client";

import { useEffect, useState } from "react";
import { apiPath, authHeaders } from "@/lib/api";

export type Attachment = { fileId: string; name: string; mimeType?: string; size?: number; expiresAt?: string };

export const CHAT_FILE_MAX_BYTES = 10 * 1024 * 1024;

const PREVIEWABLE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const formatBytes = (n = 0) =>
  n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`;

const iconFor = (mime = "", name = "") => {
  if (mime.startsWith("image/")) return "ti-photo";
  if (mime === "application/pdf" || /\.pdf$/i.test(name)) return "ti-file-type-pdf";
  if (/zip|compressed|rar|7z/.test(mime) || /\.(zip|rar|7z)$/i.test(name)) return "ti-file-zip";
  return "ti-file";
};

// Files are fetched with the login token (never a public link), turned into a
// local blob, and saved with <a download> — never opened as a page.
async function fetchFile(fileId: string) {
  return fetch(apiPath(`/api/consultations/files/${fileId}`), { headers: authHeaders() });
}

/** A file sent in the consultation chat: image preview or file card, then "expired" after 30 days. */
export default function ChatAttachment({ attachment, mine }: { attachment: Attachment; mine: boolean }) {
  const [expired, setExpired] = useState(() => !!attachment.expiresAt && new Date(attachment.expiresAt) <= new Date());
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canPreview = !expired && PREVIEWABLE.has(attachment.mimeType || "");

  useEffect(() => {
    if (!canPreview) return;
    let url: string | null = null;
    let cancelled = false;
    fetchFile(attachment.fileId)
      .then(async (res) => {
        if (res.status === 410) return setExpired(true);
        if (!res.ok || cancelled) return;
        url = URL.createObjectURL(await res.blob());
        if (!cancelled) setPreview(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [attachment.fileId, canPreview]);

  const download = async () => {
    if (busy || expired) return;
    setBusy(true);
    try {
      const res = await fetchFile(attachment.fileId);
      if (res.status === 410) return setExpired(true);
      if (!res.ok) return;
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setBusy(false);
    }
  };

  const until = attachment.expiresAt
    ? new Date(attachment.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : "";

  if (expired) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-200/15 bg-emerald-950/30 px-3.5 py-3 text-emerald-50/45">
        <i className="ti ti-file-off text-xl" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-sm line-through decoration-emerald-50/30">{attachment.name}</p>
          <p className="text-[11px]">File expired · files are kept for 30 days</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border ${mine ? "border-emerald-300/25 bg-emerald-500/12" : "border-emerald-200/12 bg-emerald-950/50"}`}>
      {canPreview && (
        <button type="button" onClick={download} className="block w-full" aria-label={`Download ${attachment.name}`}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={attachment.name} className="max-h-72 w-full bg-black/20 object-contain" />
          ) : (
            <div className="h-40 w-full animate-pulse bg-emerald-950/60" />
          )}
        </button>
      )}
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <i className={`ti ${iconFor(attachment.mimeType, attachment.name)} text-xl text-emerald-200/80`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-emerald-50/90">{attachment.name}</p>
          <p className="text-[11px] text-emerald-50/45">
            {formatBytes(attachment.size)}
            {until && ` · available until ${until}`}
          </p>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={busy}
          aria-label={`Download ${attachment.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200/15 text-emerald-100/80 transition hover:border-emerald-300/50 hover:text-white disabled:opacity-50"
        >
          <i className={`ti ${busy ? "ti-loader-2 animate-spin" : "ti-download"}`} aria-hidden />
        </button>
      </div>
    </div>
  );
}
