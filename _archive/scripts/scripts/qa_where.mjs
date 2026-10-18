export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message));
  await page.waitForTimeout(2500);
  const herman = page.locator('text=HERMAN ADMIN').first();
  await herman.click(); await page.waitForTimeout(800);
  const pwd = page.locator('input[type="password"]').first();
  if (await pwd.count()) { await pwd.fill('h1999'); await pwd.press('Enter'); await page.waitForTimeout(2000); }
  const adminBtn = page.locator('button', { hasText: /^ADMIN$/ }).first();
  await adminBtn.click();
  await page.waitForTimeout(1200);
  evts.push(await page.evaluate(() => {
    const out = { body: [...document.body.children].map(c => c.tagName + '#' + c.id + '.' + c.className + ' kids=' + c.children.length) };
    const root = document.getElementById('root');
    out.rootHTML = root ? root.outerHTML.slice(0, 500) : 'no root';
    // look for any script tags / iframes
    out.scripts = [...document.querySelectorAll('script')].map(s => s.src || ('inline:' + (s.textContent||'').slice(0,80)));
    out.iframes = [...document.querySelectorAll('iframe')].map(f => f.src);
    out.stylesheets = [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href);
    out.hasReactRoot = !!(root && root._reactRootContainer || (root && Object.keys(root).find(k=>k.startsWith('__reactContainer'))));
    return JSON.stringify(out, null, 1).slice(0, 3000);
  }));
  return evts;
}
