/**
 * Utility for building paths with base path support.
 *
 * On Netlify, the app is served under a base path (e.g., /app).
 * This utility ensures all paths work correctly regardless of the base path.
 *
 * Usage:
 *   import { getPath } from "@/lib/paths";
 *   <Link href={getPath("/queue")}>Queue</Link>
 */

/**
 * Gets the base path from environment variable or defaults to empty string.
 * Set VITE_BASE_PATH in your environment (e.g., "/app" for Netlify).
 */
function getBasePath(): string {
  // Check for base path in environment variable
  const envBasePath = import.meta.env.VITE_BASE_PATH;
  if (envBasePath) {
    // Ensure it starts with / and doesn't end with /
    return envBasePath.startsWith("/")
      ? envBasePath.endsWith("/")
        ? envBasePath.slice(0, -1)
        : envBasePath
      : `/${envBasePath}`;
  }

  // Try to detect base path from current location
  // This is useful for Netlify deployments where the base path might be in the URL
  // Currently not implemented - better to set VITE_BASE_PATH explicitly

  return "";
}

let cachedBasePath: string | null = null;

/**
 * Gets the base path (cached for performance).
 */
export function getBasePathCached(): string {
  if (cachedBasePath === null) {
    cachedBasePath = getBasePath();
  }
  return cachedBasePath;
}

/**
 * Builds a path with the base path prepended.
 *
 * @param path - The path to build (should start with /)
 * @returns The full path with base path
 *
 * @example
 * getPath("/queue") // "/app/queue" if base path is "/app"
 * getPath("/") // "/app" if base path is "/app" (not "/app/")
 * getPath("/queue") // "/queue" if base path is ""
 */
export function getPath(path: string): string {
  const basePath = getBasePathCached();

  // If no base path, return path as-is
  if (!basePath) {
    return path;
  }

  // Handle root path specially
  if (path === "/" || path === "") {
    return basePath;
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Combine base path and path
  return `${basePath}${normalizedPath}`;
}

/**
 * Gets a relative path (for use when you want to navigate relative to current location).
 * This is useful when you don't want to include the base path.
 *
 * @param path - The relative path
 * @returns The relative path (no base path prepended)
 */
export function getRelativePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}
