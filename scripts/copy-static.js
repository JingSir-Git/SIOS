/**
 * Post-build script: Copy static assets into the standalone output.
 * Next.js standalone output doesn't include `public/` and `.next/static/`
 * by default, so we need to copy them manually for Electron packaging.
 */

const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const root = path.resolve(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");

if (!fs.existsSync(standaloneDir)) {
  console.log("No standalone output found, skipping copy-static.");
  process.exit(0);
}

// Copy public/ → .next/standalone/public/
copyDir(
  path.join(root, "public"),
  path.join(standaloneDir, "public")
);

// Copy .next/static/ → .next/standalone/.next/static/
copyDir(
  path.join(root, ".next", "static"),
  path.join(standaloneDir, ".next", "static")
);

console.log("✓ Static assets copied to standalone output");
