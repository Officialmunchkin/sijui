export default async function run(page, ui) {
  await page.goto('file:///C:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.getByText('HERMAN ADMIN').first().click().catch(() => {});
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('vault2024').catch(() => {});
  await page.waitForTimeout(200);
  await page.getByText('SET & LOGIN').first().click().catch(() => {});
  await page.waitForTimeout(2500);
  const navText = await page.evaluate(() => document.body.innerText.slice(0, 1500));
  const hasAdmin = navText.includes('ADMIN');
  const hasBoard = navText.includes('BOARD');
  return { hasAdmin, hasBoard, navText: navText.slice(0, 900) };
}
