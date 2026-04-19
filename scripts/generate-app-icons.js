/**
 * Builds build/icon.png (1024², opaque white background) for Electron + electron-builder.
 * Uses assets/app-icon.svg (purple mark) when present.
 *
 * Run: npm run icons
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const markSvg = path.join(root, "assets", "app-icon.svg");
const fallbackSvg = path.join(root, "assets", "amwal-pay-logo.svg");
const outDir = path.join(root, "build");
const outPng = path.join(outDir, "icon.png");

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function main() {
  const usePath = fs.existsSync(markSvg) ? markSvg : fallbackSvg;
  if (!fs.existsSync(usePath)) {
    console.error("Missing:", markSvg, "and", fallbackSvg);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  let buf = fs.readFileSync(usePath);
  if (usePath === fallbackSvg) {
    const text = fs.readFileSync(fallbackSvg, "utf8");
    const stripped = text
      .split(/\r?\n/)
      .filter((line) => !line.includes('id="object-0"'))
      .join("\n")
      .replace(
        /<svg(\s[^>]*?)width="1280"(\s[^>]*?)height="288"/,
        '<svg$1width="1024"$2height="1024" viewBox="72 0 400 288" preserveAspectRatio="xMidYMid meet"'
      );
    buf = Buffer.from(stripped, "utf8");
  }

  await sharp(buf)
    .resize(1024, 1024, {
      fit: "contain",
      background: WHITE,
    })
    .flatten({ background: "#ffffff" })
    .trim()
    .resize(1024, 1024, {
      fit: "contain",
      background: WHITE,
    })
    .flatten({ background: "#ffffff" })
    .png({ compressionLevel: 9 })
    .toFile(outPng);

  console.log("Wrote", outPng, usePath === markSvg ? "(app-icon.svg)" : "(fallback wordmark)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
