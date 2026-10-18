export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  // inject a tiny error boundary recorder by wrapping HTMLElement.prototype.appendChild? too much.
  // Instead, React logs to console.error with component stack. Let's listen to console via playwright with strict filtering:
  const lines = [];
  page.on('console', m => lines.push(m.type() + ': ' + m.text().slice(0, 2000)));
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'ADMIN');
    btn && btn.click();
  });
  await page.waitForTimeout(3000);
  return { lines: lines.filter(l => /error|Error|at |warn|Warning/.test(l)).slice(0, 40), errs };
}
