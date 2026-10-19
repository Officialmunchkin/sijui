export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') evts.push('CONSOLE: ' + m.text().slice(0, 300)); });
  page.on('framenavigated', f => evts.push('NAV: ' + f.url()));
  await page.waitForTimeout(2500);
  const herman = page.locator('text=HERMAN ADMIN').first();
  if (await herman.count()) { await herman.click(); await page.waitForTimeout(800); }
  const pwd = page.locator('input[type="password"]').first();
  if (await pwd.count()) { await pwd.fill('h1999'); await pwd.press('Enter'); await page.waitForTimeout(2500); }
  evts.push('STATE before admin click: ' + await page.evaluate(() => window.location.href + ' | rootKids=' + (document.getElementById('root')||{}).children?.length));
  const adminBtn = page.locator('button', { hasText: /^ADMIN$/ }).first();
  if (await adminBtn.count()) {
    await adminBtn.click();
    // watch state every 500ms for 4s
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(500);
      const st = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
          url: window.location.href,
          ready: document.readyState,
          rootKids: root ? root.children.length : 'no-root',
          bodyLen: document.body.innerText.length,
          bodyBg: getComputedStyle(document.body).backgroundColor,
          htmlOverflow: document.documentElement.innerHTML.length,
        };
      });
      evts.push(`t+${(i+1)*500}ms: ` + JSON.stringify(st));
    }
    await page.screenshot({ path: 'admin_after.png' });
  } else {
    evts.push('no admin button');
  }
  return evts;
}
