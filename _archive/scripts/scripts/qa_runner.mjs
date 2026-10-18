import { chromium } from 'playwright';

const mod = await import('./' + process.argv[2]);
const browser = await chromium.launch();
const page = await browser.newPage();
const ui = { log: console.log };
try {
  const r = await mod.default(page, ui);
  console.log(JSON.stringify(r, null, 2));
} catch (e) {
  console.log('RUNNER ERROR: ' + e.message);
}
await browser.close();
