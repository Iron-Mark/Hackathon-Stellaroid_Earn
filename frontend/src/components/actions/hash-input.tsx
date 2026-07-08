"use client";

import { useId, useRef, useState } from "react";

function isValidHash(hash: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(hash.trim().replace(/^0x/i, ""));
}

interface HashInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  helper?: string;
  touched?: boolean;
}

export function HashInput({ value, onChange, onBlur, error, helper, touched }: HashInputProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hashing, setHashing] = useState(false);

  async function handleHashFromFile(file: File) {
    setHashing(true);
    try {
      const buf = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buf);
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      onChange(hex);
    } finally {
      setHashing(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleHashFromFile(file);
  }

  const clean = value.replace(/\s/g, "");

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-[13px] font-medium text-text-muted">
        Certificate hash (64 hex)
      </label>
      <div
        className={[
          "relative rounded-lg border overflow-hidden bg-surface-2 transition-colors duration-150",
          dragging
            ? "border-primary bg-primary/5"
            : error
              ? "border-danger"
              : "border-border focus-within:border-primary",
        ].join(" ")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface/90 backdrop-blur-sm pointer-events-none">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-[13px] font-medium text-primary">Drop to compute SHA-256</span>
          </div>
        )}

        {hashing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-surface/90 backdrop-blur-sm pointer-events-none">
            <svg className="w-4 h-4 text-primary animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-[13px] text-text-muted">Computing hash…</span>
          </div>
        )}

        <textarea
          id={inputId}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="0a1b2c3d4e5f… (64 hex characters)"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? "true" : undefined}
          className="w-full px-3 py-2.5 font-mono text-[13px] max-lg:text-base text-text placeholder:text-text-muted/50 bg-transparent resize-none focus:outline-none leading-relaxed"
        />
        <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-surface">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-[12px] text-text-muted hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 font-[inherit]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload file
          </button>
          <span className="text-[11px] text-text-muted/50">or drag and drop</span>
          <span className={[
            "ml-auto font-mono text-[10px] tabular-nums transition-colors duration-150",
            isValidHash(value) ? "text-verified" : clean ? "text-text-muted/60" : "text-text-muted/25",
          ].join(" ")}>
            {isValidHash(value) ? "Valid ✓" : `${clean.length} / 64`}
          </span>
        </div>
      </div>
      {error ? (
        <p className="text-[12px] text-danger" role="alert">{error}</p>
      ) : helper && !touched && !value ? (
        <p className="text-[12px] text-text-muted">{helper}</p>
      ) : null}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleHashFromFile(f);
        }}
      />
    </div>
  );
}
