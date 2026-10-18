export default async function run(page, ui) {
  const logs = [];
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await page.locator('button:text-is("ADMIN")').first().click();
  await page.waitForTimeout(2500);
  // walk all children of body
  return await page.evaluate(() => {
    return [...document.body.children].map(c => ({
      tag: c.tagName,
      id: c.id,
      cls: (c.className || '').toString().slice(0, 60),
      text: (c.innerText || '').slice(0, 100).replace(/\n/g, '|'),
      display: getComputedStyle(c).display,
      html: c.outerHTML.slice(0, 150)
    }));
  });
}
