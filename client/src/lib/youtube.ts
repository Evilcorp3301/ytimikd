export function extractYouTubeVideoId(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  // If user pasted a bare video id
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  // Try URL parsing first
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    // youtu.be/<id>
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : id || null;
    }

    // *.youtube.com/*
    if (host.endsWith("youtube.com")) {
      // watch?v=<id>
      const v = url.searchParams.get("v");
      if (v) return v;

      // /shorts/<id>, /embed/<id>, /live/<id>
      const parts = url.pathname.split("/").filter(Boolean);
      const markerIdx = parts.findIndex((p) => ["shorts", "embed", "live"].includes(p));
      if (markerIdx >= 0 && parts[markerIdx + 1]) return parts[markerIdx + 1];

      // /v/<id>
      if (parts[0] === "v" && parts[1]) return parts[1];
    }
  } catch {
    // Fall back to regex below
  }

  // Fallback regex for common cases and malformed URLs
  const match =
    raw.match(/[?&]v=([a-zA-Z0-9_-]{6,})/) ||
    raw.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/) ||
    raw.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/) ||
    raw.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/) ||
    raw.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{6,})/);

  return match?.[1] || null;
}
