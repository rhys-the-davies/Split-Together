import type { Enums } from "@/lib/database.types";

const STATUS_CONFIG: Record<
  Enums<"instance_status">,
  { label: string; classes: string }
> = {
  planning: {
    label: "Planning",
    classes: "bg-neutral-100 text-neutral-600",
  },
  decided: {
    label: "Decided",
    classes: "bg-primary/10 text-primary",
  },
  purchased: {
    label: "Purchased",
    classes: "bg-warning/10 text-warning",
  },
  done: {
    label: "Done",
    classes: "bg-success/10 text-success",
  },
};

interface StatusPillProps {
  status: Enums<"instance_status">;
}

export function StatusPill({ status }: StatusPillProps) {
  const { label, classes } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
