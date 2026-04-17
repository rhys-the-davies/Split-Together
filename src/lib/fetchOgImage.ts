/**
 * Fetches the og:image URL for a given page via the Microlink API.
 * Best-effort — returns null on any error or if no image is found.
 * No API key required for the free tier (50 req/day).
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    // Strip query params — og:image is part of the page, not the query string,
    // and tracking params can contain characters that confuse the Microlink API.
    const cleanUrl = url.split("?")[0];
    const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.log("[fetchOgImage] microlink status:", res.status);
      return null;
    }

    const json = await res.json() as {
      status: string;
      data?: { image?: { url?: string } };
    };

    console.log("[fetchOgImage] microlink response:", JSON.stringify(json).slice(0, 300));
    return json.status === "success" ? (json.data?.image?.url ?? null) : null;
  } catch (e) {
    console.error("[fetchOgImage] error:", e);
    return null;
  }
}
