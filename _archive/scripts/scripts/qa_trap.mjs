export default async function run(page, ui) {
  await page.addInitScript(() => {
    window.__events = [];
    const rec = (type, info) => { try { window.__events.push({ type, info: String(info).slice(0, 900), stack: (new Error().stack || '').split('\n').slice(2, 10).join(' | ').slice(0, 900) }); } catch {} };
    window.addEventListener('error', e => rec('WINERR', e.message + ' @ ' + e.filename + ':' + e.lineno));
    window.addEventListener('unhandledrejection', e => rec('REJECT', e.reason && (e.reason.stack || e.reason.message)));
    window.reportError = function (e) { rec('REPORTERROR', e && (e.stack || e.message)); };
    for (const m of ['error', 'warn', 'log']) {
      const orig = console[m].bind(console);
      console[m] = (...a) => { rec('CE-' + m, a.map(x => String(x && (x.stack || x)).slice(0, 400)).join(' ~ ')); orig(...a); };
    }
    const origRemove = Element.prototype.remove;
    Element.prototype.remove = function () {
      const p = this.parentElement;
      if (p && p.id === 'root') rec('ELREMOVE', this.tagName + '.' + String(this.className).slice(0, 60));
      return origRemove.apply(this, arguments);
    };
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML') || Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerHTML');
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set(v) { if (this.id === 'root') rec('INNERHTML', v.slice(0, 200)); return desc.set.call(this, v); },
      get() { return desc.get.call(this); }, configurable: true
    });
  });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  const before = await page.evaluate(() => window.__events.filter(e => e.type !== 'CE-log').length);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3000);
  const r = await page.evaluate(() => ({ rootLen: document.getElementById('root').innerHTML.length, events: window.__events.slice(-12) }));
  r.eventsBeforeClick = before;
  return r;
}
