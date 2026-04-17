"use client";

import { useState, useTransition } from "react";
import { regenerateToken } from "@/app/occasion/[id]/actions";

interface InvitePanelProps {
  inviteUrl: string;
  occasionId: string;
}

export function InvitePanel({ inviteUrl, occasionId }: InvitePanelProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleRegen() {
    startTransition(async () => {
      const fd = new FormData();
      await regenerateToken(occasionId, fd);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
        <span className="flex-1 truncate text-sm text-neutral-600 font-mono">
          {inviteUrl}
        </span>
        <button
          onClick={handleCopy}
          className="shrink-0 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <button
        onClick={handleRegen}
        disabled={isPending}
        className="self-start text-xs text-neutral-400 hover:text-neutral-600 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Regenerating…" : "Regenerate link (invalidates old link)"}
      </button>
    </div>
  );
}
