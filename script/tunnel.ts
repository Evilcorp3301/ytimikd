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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || "5000";
const TUNNEL_TYPE = process.env.TUNNEL_TYPE || "cloudflare";

function startCloudflareTunnel() {
  console.log("🌐 Starting Cloudflare Tunnel...");
  console.log("   This will create a temporary public URL");
  console.log("   Press Ctrl+C to stop the tunnel\n");

  const cloudflared = spawn("cloudflared", [
    "tunnel",
    "--url",
    `http://localhost:${PORT}`,
  ], {
    stdio: "inherit",
    shell: true,
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

