const { chromium } = require("playwright");

const seeds = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const base = "https://sanand0.github.io/tdsdata/js_table/?seed=";

// Parse numbers like 1,234 or -56.78 (also handles stray commas)
function extractNumbers(text) {
  if (!text) return [];
  const matches = text.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches
    .map((m) => Number(m.replace(/,/g, "")))
    .filter((n) => Number.isFinite(n));
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let grandTotal = 0;

  for (const seed of seeds) {
    const url = `${base}${seed}`;
    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for tables to appear (the page generates tables via JS)
    await page.waitForSelector("table", { timeout: 30000 });

    // Grab all table text and extract all numbers from it
    const tableTexts = await page.$$eval("table", (tables) =>
      tables.map((t) => t.innerText)
    );

    let pageSum = 0;
    for (const t of tableTexts) {
      const nums = extractNumbers(t);
      for (const n of nums) pageSum += n;
    }

    grandTotal += pageSum;
    console.log(`seed=${seed} pageSum=${pageSum}`);
  }

  console.log(`TOTAL_SUM=${grandTotal}`);
  console.log(`Sum=${grandTotal}`);
  await browser.close();
})();
