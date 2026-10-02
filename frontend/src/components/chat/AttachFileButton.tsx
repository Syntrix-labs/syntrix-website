"use client";

import { useRef, useState } from "react";
import { apiPath, authHeaders } from "@/lib/api";
import { CHAT_FILE_MAX_BYTES, formatBytes } from "./ChatAttachment";

/**
 * Paperclip button for the consultation composer. Sends the chosen file (plus
 * the current draft as an optional caption) to /api/consultations/attachment.
 * Staff pass `clientId` to choose which client's thread it goes into.
 */
export default function AttachFileButton({
  clientId,
  caption,
  onSent,
  onStatus,
  disabled,
}: {
  clientId?: string;
  caption: string;
  onSent: () => void | Promise<void>;
  onStatus: (text: string | null, isError?: boolean) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const send = async (file: File) => {
    if (file.size > CHAT_FILE_MAX_BYTES) {
      onStatus(`"${file.name}" is ${formatBytes(file.size)} — the limit is 10 MB.`, true);
      return;
    }
    setUploading(true);
    onStatus(`Sending ${file.name}…`);
    try {
      const form = new FormData();
      form.append("file", file);
      if (caption.trim()) form.append("message", caption.trim());
      if (clientId) form.append("client", clientId);
      const res = await fetch(apiPath("/api/consultations/attachment"), {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onStatus(data.message || "Couldn't send that file. Please try again.", true);
        return;
      }
      onStatus(null);
      await onSent();
    } catch {
      onStatus("Couldn't send that file. Check your connection and try again.", true);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) send(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        aria-label="Attach a file"
        title="Attach a file (max 10 MB, kept for 30 days)"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/15 text-emerald-100/75 transition hover:border-emerald-300/50 hover:text-white active:scale-95 disabled:opacity-50"
      >
        <i className={`ti ${uploading ? "ti-loader-2 animate-spin" : "ti-paperclip"}`} aria-hidden />
      </button>
    </>
  );
}
