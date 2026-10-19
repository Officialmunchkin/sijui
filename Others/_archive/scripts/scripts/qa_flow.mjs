export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message));
  await page.waitForTimeout(1500);
  evts.push(await page.evaluate(() => document.body.innerText.slice(0,300)));
  await page.locator('text=HERMAN ADMIN').first().click();
  await page.waitForTimeout(1000);
  evts.push(await page.evaluate(() => document.body.innerText.slice(0,400)));
  const pwd = page.locator('input[type="password"]').first();
  if (await pwd.count()) {
    await pwd.fill('h1999');
    await pwd.press('Enter');
    await page.waitForTimeout(1500);
    evts.push(await page.evaluate(() => document.body.innerText.slice(0,500)));
    // now click ADMIN tab
    const admin = page.locator('button', { hasText: /^ADMIN$/ }).first();
    if (await admin.count()) {
      await admin.click();
      await page.waitForTimeout(1500);
      evts.push('AFTER ADMIN CLICK: ' + await page.evaluate(() => document.body.innerText.slice(0,600)));
    } else { evts.push('NO ADMIN BUTTON FOUND'); }
  } else { evts.push('NO PASSWORD FIELD'); }
  return evts;
}
