export default async function run(page) {
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const step = {};
  step.start = await page.evaluate(() => document.body.innerText.slice(0, 200));

  // Click HERMAN (admin member)
  await page.locator('text=HERMAN').first().click();
  await page.waitForTimeout(1200);
  step.afterClick = await page.evaluate(() => document.body.innerText.slice(0, 300));

  // Fill password if present
  const pwd = page.locator('input[type="password"]');
  if (await pwd.count()) {
    await pwd.first().fill('test123');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
  }
  step.afterLogin = await page.evaluate(() => document.body.innerText.slice(0, 400));

  // Look for ADMIN tab button and click it
  const adminBtn = page.getByRole('button', { name: /ADMIN/ }).first();
  step.adminBtnCount = await adminBtn.count();
  if (await adminBtn.count()) {
    await adminBtn.click();
    await page.waitForTimeout(1500);
    step.adminTab = await page.evaluate(() => document.body.innerText.slice(0, 500));
    step.bodyBg = await page.evaluate(() => {
      const el = document.querySelector('#root > div');
      return el ? getComputedStyle(el).backgroundColor : 'no-root-div';
    });
    step.rootHTMLlen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  }
  return { step, logs };
}
