/** Returns true if the string is an http/https URL. */
export function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatOccasionDate(
  recurrence: "one_off" | "annual",
  month: number | null,
  day: number | null
): string {
  return recurrence === "annual" && month && day
    ? `${MONTH_NAMES[month - 1]} ${day}`
    : "One-off";
}
