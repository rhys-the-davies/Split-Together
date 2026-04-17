/** Returns true if the string is an http/https URL. */
export function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}
