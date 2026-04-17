"use client";

import { useActionState, useState, useTransition } from "react";
import { type ActionState } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

interface SuggestionCardProps {
  id: string;
  title: string;
  url: string | null;
  price: number;
  voteCount: number;
  hasVoted: boolean;
  isOwn: boolean;
  isDecided?: boolean;
  readOnly?: boolean;
  toggleVoteAction?: (fd: FormData) => Promise<void>;
  editAction?: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  deleteAction?: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  markDecidedAction?: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}

export function SuggestionCard({
  id,
  title,
  url,
  price,
  voteCount,
  hasVoted,
  isOwn,
  isDecided = false,
  readOnly = false,
  toggleVoteAction,
  editAction,
  deleteAction,
  markDecidedAction,
}: SuggestionCardProps) {
  const [editing, setEditing] = useState(false);
  const [editState, editFormAction, isEditing] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      if (!editAction) return prev;
      const result = await editAction(prev, fd);
      if (!result) setEditing(false);
      return result;
    },
    null
  );
  const [, deleteFormAction, isDeleting] = useActionState(
    deleteAction ?? (async (s: ActionState) => s),
    null
  );
  const [, markDecidedFormAction, isMarkingDecided] = useActionState(
    markDecidedAction ?? (async (s: ActionState) => s),
    null
  );
  const [isVoting, startVoteTransition] = useTransition();

  if (editing && editAction) {
    return (
      <form
        action={editFormAction}
        className="rounded-xl border border-primary/30 bg-white p-4 flex flex-col gap-4"
      >
        {editState?.status === "error" && (
          <p role="alert" className="text-sm text-danger">{editState.error}</p>
        )}

        <FormField label="Gift title" htmlFor={`edit-title-${id}`} required>
          <Input
            id={`edit-title-${id}`}
            name="title"
            type="text"
            defaultValue={title}
            required
            disabled={isEditing}
          />
        </FormField>

        <FormField label="URL" htmlFor={`edit-url-${id}`}>
          <Input
            id={`edit-url-${id}`}
            name="url"
            type="url"
            defaultValue={url ?? ""}
            disabled={isEditing}
          />
        </FormField>

        <FormField label="Price (£)" htmlFor={`edit-price-${id}`} required>
          <Input
            id={`edit-price-${id}`}
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={price}
            required
            disabled={isEditing}
          />
        </FormField>

        <div className="flex gap-2">
          <Button type="submit" loading={isEditing}>Save</Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={isEditing}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className={[
      "rounded-xl border bg-white p-4",
      isDecided ? "border-primary/40 ring-1 ring-primary/20" : "border-neutral-200",
    ].join(" ")}>
      {isDecided && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
          Decided gift
        </p>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-app-text">{title}</p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-700">
            £{price.toFixed(2)}
          </p>
          {url && <ExternalLink href={url} className="mt-1 block" />}
        </div>

        {/* Vote button — only when not read-only */}
        {!readOnly && toggleVoteAction && (
          <form
            action={(fd) => {
              startVoteTransition(() => toggleVoteAction(fd));
            }}
          >
            <button
              type="submit"
              disabled={isVoting}
              className={[
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                hasVoted
                  ? "bg-primary text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                isVoting ? "opacity-50" : "",
              ].join(" ")}
              aria-label={hasVoted ? "Remove vote" : "Vote for this"}
            >
              <span>👍</span>
              <span>{voteCount}</span>
            </button>
          </form>
        )}

        {/* Vote count (read-only) */}
        {readOnly && voteCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600">
            <span>👍</span>
            <span>{voteCount}</span>
          </span>
        )}
      </div>

      {/* Controls */}
      {!readOnly && (isOwn || markDecidedAction) && (
        <div className="mt-3 flex items-center gap-3 border-t border-neutral-100 pt-3">
          {isOwn && editAction && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Edit
            </button>
          )}
          {isOwn && deleteAction && (
            <form action={deleteFormAction}>
              <button
                type="submit"
                disabled={isDeleting}
                className="text-xs text-danger hover:text-danger/80 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </form>
          )}
          {markDecidedAction && (
            <form action={markDecidedFormAction} className="ml-auto">
              <button
                type="submit"
                disabled={isMarkingDecided}
                className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
              >
                {isMarkingDecided ? "Deciding…" : "Mark as decided"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
