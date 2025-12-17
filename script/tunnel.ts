#!/usr/bin/env tsx
/**
 * Tunnel script for public preview
 * Supports Cloudflare Tunnel (cloudflared) and ngrok
 * 
 * Usage:
 *   npm run tunnel:cloudflare
 *   npm run tunnel:ngrok
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, readdirSync } from "fs";
import { execSync } from "child_process";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || "5000";
const TUNNEL_TYPE = process.env.TUNNEL_TYPE || "cloudflare";

/**
 * Find cloudflared executable in common Windows installation locations
 */
function findCloudflared(): string | null {
  // Try direct command first (if in PATH)
  try {
    if (os.platform() === "win32") {
      execSync("where cloudflared >nul 2>&1", { shell: true });
      return "cloudflared";
    } else {
      execSync("which cloudflared >/dev/null 2>&1");
      return "cloudflared";
    }
  } catch {
    // Not in PATH, try common Windows locations
    if (os.platform() === "win32") {
      const localAppData = process.env.LOCALAPPDATA || "";
      const winGetPath = join(localAppData, "Microsoft", "WinGet", "Packages");

      // Try to find in WinGet packages directory
      try {
        const dirs = readdirSync(winGetPath, { withFileTypes: true });
        for (const dir of dirs) {
          if (dir.isDirectory() && dir.name.includes("cloudflared")) {
            const exePath = join(winGetPath, dir.name, "cloudflared.exe");
            if (existsSync(exePath)) {
              return exePath;
            }
          }
        }
      } catch {
        // Ignore errors
      }

      // Try static paths
      const commonPaths = [
        join(process.env.ProgramFiles || "C:\\Program Files", "Cloudflare", "cloudflared.exe"),
        join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Cloudflare", "cloudflared.exe"),
        join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "cloudflared", "cloudflared.exe"),
        join(process.env.ProgramFiles || "C:\\Program Files", "cloudflared", "cloudflared.exe"),
      ];

      for (const path of commonPaths) {
        if (existsSync(path)) {
          return path;
        }
      }
    }
  }
  return null;
}

function startCloudflareTunnel() {
  console.log("🌐 Starting Cloudflare Tunnel...");
  console.log("   This will create a temporary public URL");
  console.log("   Press Ctrl+C to stop the tunnel\n");

  const cloudflaredPath = findCloudflared();
  if (!cloudflaredPath) {
    console.error("\n❌ Error: cloudflared not found!");
    console.error("   Install it from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/");
    console.error("   Or use: npm run tunnel:ngrok");
    console.error("\n   After installation, you may need to restart your terminal.");
    process.exit(1);
  }

  const cloudflared = spawn(cloudflaredPath, [
    "tunnel",
    "--url",
    `http://localhost:${PORT}`,
  ], {
    stdio: "inherit",
    shell: false,
  });

  cloudflared.on("error", (err) => {
    if ((err as any).code === "ENOENT") {
      console.error("\n❌ Error: cloudflared not found!");
      console.error("   Install it from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/");
      console.error("   Or use: npm run tunnel:ngrok");
      process.exit(1);
    } else {
      console.error("Error starting tunnel:", err);
      process.exit(1);
    }
  });

  cloudflared.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ Tunnel exited with code ${code}`);
      process.exit(code);
    }
  });

  process.on("SIGINT", () => {
    console.log("\n\n🛑 Stopping tunnel...");
    cloudflared.kill();
    process.exit(0);
  });
}

function startNgrokTunnel() {
  console.log("🌐 Starting ngrok tunnel...");
  console.log("   This will create a temporary public URL");
  console.log("   Press Ctrl+C to stop the tunnel\n");

  const ngrok = spawn("ngrok", ["http", PORT], {
    stdio: "inherit",
    shell: true,
  });

  ngrok.on("error", (err) => {
    if ((err as any).code === "ENOENT") {
      console.error("\n❌ Error: ngrok not found!");
      console.error("   Install it from: https://ngrok.com/download");
      console.error("   Or use: npm run tunnel:cloudflare");
      process.exit(1);
    } else {
      console.error("Error starting tunnel:", err);
      process.exit(1);
    }
  });

  ngrok.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ Tunnel exited with code ${code}`);
      process.exit(code);
    }
  });

  process.on("SIGINT", () => {
    console.log("\n\n🛑 Stopping tunnel...");
    ngrok.kill();
    process.exit(0);
  });
}

// Main
if (TUNNEL_TYPE === "ngrok") {
  startNgrokTunnel();
} else {
  startCloudflareTunnel();
}

