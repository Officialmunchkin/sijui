export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message));
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  let snap = await ui.snapshot();
  const e4 = snap.match(/@(e\d+) button [^\n]*HERMAN ADMIN/)?.[1];
  await ui.click('@' + e4);
  await page.waitForTimeout(800);
  snap = await ui.snapshot();
  const pwdRef = snap.match(/@(e\d+) textbox "CREATE PASSWORD"/)?.[1];
  const setRef = snap.match(/@(e\d+) button "SET & LOGIN/)?.[1];
  await ui.fill('@' + pwdRef, 'h1999');
  await ui.click('@' + setRef);
  await page.waitForTimeout(2500);
  snap = await ui.snapshot();
  const adminRef = snap.match(/@(e\d+) button "ADMIN"/)?.[1];
  if (!adminRef) return { evts, fail: 'no ADMIN button', snap };
  await ui.click('@' + adminRef);
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      rootLen: root.innerHTML.length,
      rootStart: root.innerHTML.slice(0, 800),
      iframes: [...document.querySelectorAll('iframe')].map(f => ({ src: f.src, style: f.getAttribute('style') })),
      bodyText: document.body.innerText.slice(0, 300)
    };
  });
  return { evts, adminRef, info };
}
