function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const BG_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function getColorClass(name: string): string {
  return BG_COLORS[name.charCodeAt(0) % BG_COLORS.length];
}

interface AvatarProps {
  name: string;
  size?: "sm" | "md";
}

export function Avatar({ name, size = "md" }: AvatarProps) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-medium ${getColorClass(name)} ${sizeClass}`}
      aria-label={name}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
