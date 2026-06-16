// Generates the single QR poster pointing at the /request page.
// Usage:
//   npm run qr                         (uses NEXT_PUBLIC_BASE_URL or localhost)
//   npm run qr -- https://your.app     (override the base URL)
//
// Outputs qr/office-restock.png and qr/office-restock.svg.

import { mkdir, writeFile } from "node:fs/promises";
import QRCode from "qrcode";

const base =
  process.argv[2] ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

const target = `${base.replace(/\/$/, "")}/request`;

await mkdir("qr", { recursive: true });

await QRCode.toFile("qr/office-restock.png", target, {
  width: 1000,
  margin: 2,
  errorCorrectionLevel: "M",
});

const svg = await QRCode.toString(target, { type: "svg", margin: 2, width: 1000 });
await writeFile("qr/office-restock.svg", svg);

console.log(`✓ QR codes written for: ${target}`);
console.log("  qr/office-restock.png  (print this — drop it into a poster)");
console.log("  qr/office-restock.svg  (vector, for large/sharp printing)");
