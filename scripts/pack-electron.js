/**
 * Package SIOS as a standalone Windows executable using @electron/packager.
 * 
 * Prerequisites:
 *   npm run build   (generates .next/standalone)
 *   npm run icon    (generates build/icon.ico)
 * 
 * Usage:
 *   node scripts/pack-electron.js
 */

const { packager } = require("@electron/packager");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const STANDALONE = path.join(ROOT, ".next", "standalone");
const OUTPUT = path.join(ROOT, "dist-electron");

async function main() {
  // Verify standalone build exists
  if (!fs.existsSync(path.join(STANDALONE, "server.js"))) {
    console.error("❌ .next/standalone/server.js not found. Run 'npm run build' first.");
    process.exit(1);
  }

  // Verify icon exists
  const icoPath = path.join(ROOT, "build", "icon.ico");
  if (!fs.existsSync(icoPath)) {
    console.log("⚠ build/icon.ico not found. Run 'npm run icon' first. Using default icon.");
  }

  console.log("📦 Packaging SIOS for Windows...\n");

  const appPaths = await packager({
    dir: ROOT,
    name: "SIOS",
    platform: "win32",
    arch: "x64",
    out: OUTPUT,
    overwrite: true,
    icon: fs.existsSync(icoPath) ? icoPath : undefined,
    appVersion: require(path.join(ROOT, "package.json")).version || "1.0.0",
    appCopyright: "Copyright © 2025 SIOS Team",
    win32metadata: {
      ProductName: "SIOS - Social Intelligence OS",
      CompanyName: "SIOS Team",
      FileDescription: "AI-Powered Social Intelligence Operating System",
    },
    // Only keep electron/ and package.json in the app; everything else via extraResource
    ignore: (filePath) => {
      // Root always passes
      if (filePath === "") return false;
      // Keep electron main process
      if (filePath.startsWith("/electron")) return false;
      // Keep package.json (needed by Electron to find main)
      if (filePath === "/package.json") return false;
      // Ignore everything else in the app directory
      return true;
    },
    // Standalone server + public assets go into resources/
    extraResource: [
      STANDALONE,
      path.join(ROOT, "public"),
    ],
    asar: false,
  });

  console.log(`\n✅ Packaged successfully!`);
  console.log(`   Output: ${appPaths[0]}`);
  console.log(`\n📁 You can find SIOS.exe in the output directory.`);
  console.log(`   Users can run it directly — no installation needed!\n`);
}

main().catch((err) => {
  console.error("❌ Packaging failed:", err);
  process.exit(1);
});
