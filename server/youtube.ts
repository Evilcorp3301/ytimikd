/**
 * YouTube API utilities for server-side use
 */

/**
 * Extracts YouTube video ID from URL or direct ID string
 */
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

export interface YouTubeVideoMetadata {
  title: string;
  thumbnailUrl: string;
}

/**
 * Fetches video metadata from YouTube Data API v3
 * Returns null if API key is not configured or video not found
 */
export async function fetchYouTubeVideoMetadata(
  videoId: string,
  apiKey: string
): Promise<YouTubeVideoMetadata | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`
    );

    if (!response.ok) {
      console.error(`YouTube API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.error(`YouTube video not found: ${videoId}`);
      return null;
    }

    const video = data.items[0];
    const thumbnailUrl =
      video.snippet.thumbnails?.maxres?.url ||
      video.snippet.thumbnails?.high?.url ||
      video.snippet.thumbnails?.medium?.url ||
      video.snippet.thumbnails?.default?.url ||
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    return {
      title: video.snippet.title,
      thumbnailUrl,
    };
  } catch (error) {
    console.error(`Error fetching YouTube video metadata for ${videoId}:`, error);
    return null;
  }
}

/**
 * Channel identifier types for YouTube API
 */
export type ChannelIdentifier = 
  | { type: "id"; value: string }      // UC... channel ID
  | { type: "handle"; value: string }  // @channelname (without @)
  | { type: "username"; value: string } // legacy username
  | { type: "custom"; value: string }  // custom URL (c/channelname)
  | null;

/**
 * Extracts channel identifier from YouTube channel URL
 * Supports:
 * - https://www.youtube.com/channel/UC...
 * - https://www.youtube.com/@channelname
 * - https://www.youtube.com/c/channelname
 * - https://www.youtube.com/user/username
 * - https://youtube.com/@channelname
 */
export function extractYouTubeChannelIdentifier(input: string): ChannelIdentifier {
  const raw = (input || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (!host.endsWith("youtube.com")) {
      return null;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);

    // /channel/UC... (channel ID)
    if (pathParts[0] === "channel" && pathParts[1]) {
      return { type: "id", value: pathParts[1] };
    }

    // /@channelname (handle)
    if (pathParts[0]?.startsWith("@")) {
      return { type: "handle", value: pathParts[0].substring(1) };
    }

    // /c/channelname (custom URL)
    if (pathParts[0] === "c" && pathParts[1]) {
      return { type: "custom", value: pathParts[1] };
    }

    // /user/username (legacy)
    if (pathParts[0] === "user" && pathParts[1]) {
      return { type: "username", value: pathParts[1] };
    }
  } catch {
    // Not a valid URL, might be a direct identifier
  }

  // If it looks like a channel ID (starts with UC and is 24 chars)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(raw)) {
    return { type: "id", value: raw };
  }

  // If it looks like a handle (starts with @)
  if (raw.startsWith("@")) {
    return { type: "handle", value: raw.substring(1) };
  }

  return null;
}

export interface YouTubeChannelMetadata {
  name: string;
  thumbnailUrl?: string;
}

/**
 * Fetches channel metadata from YouTube Data API v3
 * Returns null if API key is not configured or channel not found
 */
export async function fetchYouTubeChannelMetadata(
  identifier: ChannelIdentifier,
  apiKey: string
): Promise<YouTubeChannelMetadata | null> {
  if (!identifier) {
    return null;
  }

  try {
    let apiUrl: string;

    // Build API URL based on identifier type
    switch (identifier.type) {
      case "id":
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?id=${identifier.value}&part=snippet&key=${apiKey}`;
        break;
      case "handle":
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?forHandle=${identifier.value}&part=snippet&key=${apiKey}`;
        break;
      case "username":
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?forUsername=${identifier.value}&part=snippet&key=${apiKey}`;
        break;
      case "custom":
        // Custom URLs need to be resolved first - try as handle first, then username
        // This is a limitation: custom URLs might not work directly
        // We'll try to resolve it, but it may require additional steps
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?forUsername=${identifier.value}&part=snippet&key=${apiKey}`;
        break;
      default:
        return null;
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`YouTube API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.error(`YouTube channel not found: ${identifier.type}=${identifier.value}`);
      return null;
    }

    const channel = data.items[0];
    const thumbnailUrl =
      channel.snippet.thumbnails?.high?.url ||
      channel.snippet.thumbnails?.medium?.url ||
      channel.snippet.thumbnails?.default?.url;

    return {
      name: channel.snippet.title,
      thumbnailUrl,
    };
  } catch (error) {
    console.error(`Error fetching YouTube channel metadata:`, error);
    return null;
  }
}

