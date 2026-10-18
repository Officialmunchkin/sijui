export default async function run(page, ui) {
  const logs = [];
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  // map out where ADMIN tab button lives and what its ancestors are
  return await page.evaluate(() => {
    const all = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'ADMIN');
    return all.map(b => {
      let a = [];
      let el = b;
      while (el && el !== document.body) { a.push(el.tagName + '.' + (el.className || '').slice(0, 80)); el = el.parentElement; }
      return a;
    });
  });
}
