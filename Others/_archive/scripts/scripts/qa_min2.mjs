export default async function run(page, ui) {
  await page.goto('file:///C:/Users/Admin/OneDrive/Desktop/Wallpaper/test_min2.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const txt = await page.evaluate(() => document.body.innerText);
  return { txt };
}
