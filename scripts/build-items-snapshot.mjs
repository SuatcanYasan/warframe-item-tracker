import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");
const outDir = path.join(root, "data");
const outFile = path.join(outDir, "items.snapshot.json");

const SOURCES = [
  "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json",
  "https://cdn.jsdelivr.net/gh/WFCD/warframe-items@master/data/json/All.json",
];

async function fetchSource(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchArraySource(url) {
  const payload = await fetchSource(url);
  if (!Array.isArray(payload)) {
    throw new Error("Invalid payload format");
  }
  return payload;
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  // --- Items snapshot ---
  let lastError = null;
  let items = null;

  for (const source of SOURCES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      items = await fetchArraySource(source);
      console.log(`Items snapshot source selected: ${source}`);
      break;
    } catch (error) {
      lastError = error;
      console.warn(`Items snapshot source failed: ${source} -> ${error.message}`);
    }
  }

  if (!items) {
    throw lastError || new Error("No items snapshot source is reachable");
  }

  await fs.writeFile(outFile, JSON.stringify(items), "utf8");
  console.log(`Items snapshot written: ${outFile}`);
  console.log(`Item count: ${items.length}`);
}

main().catch((error) => {
  console.error("Snapshot generation failed:", error.message || error);
  process.exit(1);
});

