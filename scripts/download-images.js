import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT_FILE = path.join(__dirname, "links.txt");
const OUTPUT_DIR = path.join(__dirname, "output");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

function toPngUrl(webpUrl) {
  try {
    const url = new URL(webpUrl);

    const parts = url.pathname.split("/thumb/");
    if (parts.length !== 2) return null;

    const base = parts[0];
    const rest = parts[1].split("/");

    if (rest.length < 3) return null;

    const [dir1, dir2, filename] = rest;

    url.pathname = `${base}/${dir1}/${dir2}/${filename}`;
    return url.toString();
  } catch {
    return null;
  }
}

function download(url, outputPath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed: ${url} (${res.statusCode})`));
          return;
        }

        const file = fs.createWriteStream(outputPath);
        res.pipe(file);

        file.on("finish", () => file.close(resolve));
      })
      .on("error", reject);
  });
}

const lines = fs
  .readFileSync(INPUT_FILE, "utf-8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);

for (const webpUrl of lines) {
  const pngUrl = toPngUrl(webpUrl);
  if (!pngUrl) {
    console.log(`Skipping invalid: ${webpUrl}`);
    continue;
  }

  const rawName = path.basename(pngUrl);

  function normalizeFilename(name) {
    return decodeURIComponent(name)
      .toLowerCase()
      .replace(/['"]/g, "") // remove quotes + apostrophes
      .replace(/\s+/g, "_"); // optional: spaces → underscores
  }

  const filename = normalizeFilename(rawName);

  const outputPath = path.join(OUTPUT_DIR, filename);

  try {
    console.log(`Downloading ${filename}`);
    await download(pngUrl, outputPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

console.log("Done");
