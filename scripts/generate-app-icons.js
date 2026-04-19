/**
 * Rasterizes assets/amwal-pay-logo.svg into build/icon.png (1024²) for Electron
 * and electron-builder. Run: npm run icons
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const svgPath = path.join(root, "assets", "amwal-pay-logo.svg");
const outDir = path.join(root, "build");
const outPng = path.join(outDir, "icon.png");

async function main() {
  if (!fs.existsSync(svgPath)) {
    console.error("Missing:", svgPath);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(svgPath)
    .resize(1024, 1024, {
      fit: "contain",
      background: { r: 254, g: 254, b: 254, alpha: 1 },
    })
    .png()
    .toFile(outPng);
  console.log("Wrote", outPng);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
