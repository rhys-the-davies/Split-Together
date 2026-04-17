import Link from "next/link";
import { StatusPill } from "@/components/ui/StatusPill";
import type { Enums } from "@/lib/database.types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface OccasionCardProps {
  id: string;
  title: string;
  recipient_name: string;
  recurrence: Enums<"recurrence_type">;
  recurrence_month: number | null;
  recurrence_day: number | null;
  instance: {
    id: string;
    year: number;
    status: Enums<"instance_status">;
  } | null;
}

export function OccasionCard({
  id,
  title,
  recipient_name,
  recurrence,
  recurrence_month,
  recurrence_day,
  instance,
}: OccasionCardProps) {
  const dateLabel =
    recurrence === "annual" && recurrence_month && recurrence_day
      ? `${MONTH_NAMES[recurrence_month - 1]} ${recurrence_day}`
      : "One-off";

  return (
    <Link
      href={`/occasion/${id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-app-text truncate">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-neutral-500">
            Gift for {recipient_name}
          </p>
        </div>
        {instance && <StatusPill status={instance.status} />}
      </div>
      <p className="mt-3 text-xs text-neutral-400">{dateLabel}</p>
    </Link>
  );
}
