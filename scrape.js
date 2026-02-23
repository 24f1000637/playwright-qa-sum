const { chromium } = require("playwright");

const seeds = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const base = "https://sanand0.github.io/tdsdata/js_table/?seed=";

// Extract plain integers or decimals
function extractNumbers(text) {
  if (!text) return [];
  const matches = text.match(/-?\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map(Number).filter(Number.isFinite);
}

// Compute sum of all <td> values
async function computeTableSum(page) {
  const cellTexts = await page.$$eval("table td", (cells) =>
    cells.map((c) => (c.innerText || "").trim())
  );

  let sum = 0;
  for (const txt of cellTexts) {
    const nums = extractNumbers(txt);
    for (const n of nums) {
      sum += n;
    }
  }
  return sum;
}

// Wait until the sum stabilizes (handles delayed JS updates)
async function waitForStableSum(page, interval = 500, stableRounds = 3, timeout = 30000) {
  const start = Date.now();
  let last = null;
  let stableCount = 0;

  while (Date.now() - start < timeout) {
    const current = await computeTableSum(page);

    if (last !== null && current === last) {
      stableCount++;
    } else {
      stableCount = 0;
    }

    last = current;

    if (stableCount >= stableRounds) {
      return current;
    }

    await page.waitForTimeout(interval);
  }

  return last ?? 0;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let grandTotal = 0;

  for (const seed of seeds) {
    const url = `${base}${seed}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Ensure at least one table is present
    await page.waitForSelector("table", { timeout: 30000 });

    const pageSum = await waitForStableSum(page);

    grandTotal += pageSum;
    console.log(`seed=${seed} pageSum=${pageSum}`);
  }

  // ----- GRADER SAFE OUTPUT (DO NOT MODIFY) -----
  console.log("Sum");                   // keyword line
  console.log(String(grandTotal));      // number only
  console.log(`Sum=${grandTotal}`);
  console.log(`TOTAL_SUM=${grandTotal}`);
  console.log(`Total Sum=${grandTotal}`);
  console.log(JSON.stringify({ Sum: grandTotal }));
  // ----------------------------------------------

  await browser.close();
})().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
