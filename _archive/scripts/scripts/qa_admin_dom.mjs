export default async function run(page, ui) {
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(2500);

  return await page.evaluate(() => {
    const out = {};
    // find top-level children of #root
    const root = document.getElementById('root');
    out.rootKids = [...root.children].map(c => {
      const cs = getComputedStyle(c);
      return c.tagName + '#' + (c.id || '') + '.' + (c.className && c.className.slice ? c.className.slice(0, 80) : '') +
        ' pos=' + cs.position + ' z=' + cs.zIndex + ' bg=' + cs.backgroundColor + ' display=' + cs.display +
        ' size=' + c.offsetWidth + 'x' + c.offsetHeight + ' opacity=' + cs.opacity;
    });
    // any element covering the viewport on top?
    const mid = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    out.elementAtCenter = mid ? mid.tagName + '#' + (mid.id || '') + '.' + (mid.className && mid.className.slice ? String(mid.className).slice(0, 120) : '') : 'none';
    out.centerChain = [];
    let e = mid;
    while (e && e !== document.body) { const cs = getComputedStyle(e); out.centerChain.push(e.tagName + '.' + String(e.className).slice(0, 60) + ' pos=' + cs.position + ' z=' + cs.zIndex + ' bg=' + cs.backgroundColor + ' op=' + cs.opacity); e = e.parentElement; }
    // count big elements
    out.bigEls = [...document.querySelectorAll('div')].filter(d => d.offsetHeight > innerHeight * 0.8).slice(0, 10).map(d => d.tagName + '#' + (d.id || '') + '.' + String(d.className).slice(0, 80) + ' size=' + d.offsetWidth + 'x' + d.offsetHeight + ' bg=' + getComputedStyle(d).backgroundColor + ' pos=' + getComputedStyle(d).position + ' z=' + getComputedStyle(d).zIndex);
    out.textSample = document.body.innerText.slice(0, 300);
    return out;
  });
}
