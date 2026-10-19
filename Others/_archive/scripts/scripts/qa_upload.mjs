export default async function run(page, ui) {
  await page.goto('file:///C:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.getByText('HERMAN ADMIN').first().click().catch(() => {});
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('vault2024').catch(() => {});
  await page.waitForTimeout(200);
  await page.getByText('SET & LOGIN').first().click().catch(() => {});
  await page.waitForTimeout(2500);
  await page.getByText('UPLOAD', { exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(800);
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'browser-test.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFUlEQVR42mNkYPjPgAyYGBgYABYAAXYBBh7s0AAAAABJRU5ErkJggg==', 'base64'),
  }).catch(e => String(e).slice(0, 80));
  await page.waitForTimeout(400);
  await page.locator('input[placeholder*="BACKYARD"]').first().fill('UI UPLOAD TEST').catch(() => {});
  await page.waitForTimeout(200);
  await page.getByText('UPLOAD TO VAULT').first().click().catch(() => {});
  await page.waitForTimeout(4000);
  const imgCount = await page.evaluate(() => document.querySelectorAll('img').length);
  const captions = await page.evaluate(() => [...document.querySelectorAll('img')].map(i => i.src.slice(0, 95)));
  return { imgCount, captions };
}
