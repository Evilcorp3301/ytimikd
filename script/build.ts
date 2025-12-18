import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "date-fns",
  "date-fns-tz",
  "drizzle-orm",
  "drizzle-zod",
  "dotenv",
  "express",
  "nanoid",
  "node-cron",
  "pg",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  const startTime = Date.now();
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Build Netlify functions if they exist
  const netlifyFunctions = ["netlify/functions/server.ts", "netlify/functions/scheduled-check.ts"];
  for (const func of netlifyFunctions) {
    try {
      const funcPath = await import("path").then(m => m.default);
      const funcName = funcPath.basename(func, ".ts");
      console.log(`building Netlify function: ${funcName}...`);
      
      await esbuild({
        entryPoints: [func],
        platform: "node",
        bundle: true,
        format: "cjs",
        outfile: `netlify/functions/${funcName}.js`,
        define: {
          "process.env.NODE_ENV": '"production"',
        },
        minify: true,
        external: [...externals, "@netlify/functions", "serverless-http", "pg-native"],
        logLevel: "info",
      });
    } catch (err) {
      console.warn(`Skipping ${func}: ${err}`);
    }
  }

  const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Build completed in ${buildTime}s`);
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
