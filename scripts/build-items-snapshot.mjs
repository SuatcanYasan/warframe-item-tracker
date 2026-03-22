import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");
const outDir = path.join(root, "data");
const outFile = path.join(outDir, "items.snapshot.json");
const i18nOutFile = path.join(outDir, "i18n.snapshot.json");

const SOURCES = [
  "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json",
  "https://cdn.jsdelivr.net/gh/WFCD/warframe-items@master/data/json/All.json",
];

const I18N_SOURCES = [
  "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/i18n.json",
  "https://cdn.jsdelivr.net/gh/WFCD/warframe-items@master/data/json/i18n.json",
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

async function fetchObjectSource(url) {
  const payload = await fetchSource(url);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
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

  // --- i18n snapshot ---
  let i18nLastError = null;
  let i18nData = null;

  for (const source of I18N_SOURCES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      i18nData = await fetchObjectSource(source);
      console.log(`i18n snapshot source selected: ${source}`);
      break;
    } catch (error) {
      i18nLastError = error;
      console.warn(`i18n snapshot source failed: ${source} -> ${error.message}`);
    }
  }

  if (!i18nData) {
    console.warn("i18n snapshot could not be downloaded:", i18nLastError?.message || i18nLastError);
  } else {
    await fs.writeFile(i18nOutFile, JSON.stringify(i18nData), "utf8");
    console.log(`i18n snapshot written: ${i18nOutFile}`);
    console.log(`i18n entry count: ${Object.keys(i18nData).length}`);
  }
}

main().catch((error) => {
  console.error("Snapshot generation failed:", error.message || error);
  process.exit(1);
});

