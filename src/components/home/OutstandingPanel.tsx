import Link from "next/link";

export interface OwedToMeItem {
  contributionId: string;
  instanceId: string;
  occasionId: string;
  occasionTitle: string;
  year: number;
  contributorName: string;
  amount: number;
}

interface OutstandingPanelProps {
  owedToMe: OwedToMeItem[];
}

export function OutstandingPanel({ owedToMe }: OutstandingPanelProps) {
  if (owedToMe.length === 0) return null;

  const totalOwedToMe = owedToMe.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="mb-8">
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
          You&rsquo;re owed &middot; £{totalOwedToMe.toFixed(2)}
        </p>
        <ul className="flex flex-col divide-y divide-primary/10">
          {owedToMe.map((item) => (
            <li key={item.contributionId} className="py-2.5 first:pt-0 last:pb-0">
              <Link
                href={`/occasion/${item.occasionId}/${item.year}`}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-app-text">
                    {item.occasionTitle}
                  </p>
                  <p className="text-xs text-neutral-500">from {item.contributorName}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-app-text">
                  £{item.amount.toFixed(2)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
