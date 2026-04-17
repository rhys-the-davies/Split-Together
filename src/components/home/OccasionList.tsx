import Link from "next/link";
import { OccasionCard } from "./OccasionCard";
import type { Enums } from "@/lib/database.types";

interface Occasion {
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

interface OccasionListProps {
  occasions: Occasion[];
}

const linkButtonClass =
  "inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-md font-medium text-sm transition-colors bg-primary text-white hover:bg-primary/90 active:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function OccasionList({ occasions }: OccasionListProps) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-app-text">
          Your occasions
        </h1>
        {occasions.length > 0 && (
          <Link href="/occasion/new" className={linkButtonClass}>
            New occasion
          </Link>
        )}
      </div>

      {occasions.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold text-app-text">
            No occasions yet
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Create one to start coordinating a group gift.
          </p>
          <div className="mt-6">
            <Link href="/occasion/new" className={linkButtonClass}>
              Create an occasion
            </Link>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {occasions.map((occasion) => (
            <li key={occasion.id}>
              <OccasionCard {...occasion} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
