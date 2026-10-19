export default async function run(page, ui) {
  await page.goto('file:///C:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.getByText('HERMAN ADMIN').first().click().catch(() => {});
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('vault2024').catch(() => {});
  await page.waitForTimeout(200);
  await page.getByText('SET & LOGIN').first().click().catch(() => {});
  await page.waitForTimeout(2500);
  // go to BOARD tab
  await page.getByText('BOARD', { exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(1200);
  const before = await page.evaluate(() => document.body.innerText.slice(0, 800));
  // type a post
  await page.locator('input[placeholder*="WRITE ON BOARD"]').first().fill('TEST POST FROM QA').catch(e => String(e).slice(0,60));
  await page.waitForTimeout(300);
  // click POST
  await page.getByText('POST', { exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => document.body.innerText.slice(0, 900));
  return { postedOK: after.includes('TEST POST FROM QA'), after };
}
