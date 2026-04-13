/**
 * Generate PNG icon from SVG for Electron packaging.
 * Uses a canvas-based approach via sharp or falls back to a simple copy.
 * 
 * For proper .ico generation, install: npm install sharp png-to-ico
 * If not available, electron-builder will use the PNG directly.
 */

const fs = require("fs");
const path = require("path");

const svgPath = path.join(__dirname, "..", "public", "icon-512.svg");
const pngPath = path.join(__dirname, "..", "build", "icon.png");
const icoPath = path.join(__dirname, "..", "build", "icon.ico");

// Ensure build dir exists
fs.mkdirSync(path.join(__dirname, "..", "build"), { recursive: true });

async function generate() {
  try {
    // Try using sharp for proper SVG→PNG conversion
    const sharp = require("sharp");
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Generate 256x256 PNG (standard for Windows icons)
    await sharp(svgBuffer)
      .resize(256, 256)
      .png()
      .toFile(pngPath);
    
    console.log("✓ Generated build/icon.png (256x256)");
    
    // Try generating .ico
    try {
      const { default: pngToIco } = require("png-to-ico");
      const icoBuffer = await pngToIco(pngPath);
      fs.writeFileSync(icoPath, icoBuffer);
      console.log("✓ Generated build/icon.ico");
    } catch {
      console.log("⚠ png-to-ico not available, using PNG for electron-builder");
      // Copy PNG as fallback
      fs.copyFileSync(pngPath, icoPath);
    }
  } catch {
    console.log("⚠ sharp not available, copying SVG as placeholder");
    // If no sharp, just copy the SVG — electron-builder may still work
    fs.copyFileSync(svgPath, pngPath);
  }
}

generate();
