export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message + '\nSTACK:\n' + (e.stack || '').split('\n').slice(0, 20).join('\n')));
  page.on('console', m => evts.push('CONSOLE-' + m.type() + ': ' + m.text().slice(0, 400)));
  page.on('dialog', async d => { evts.push('DIALOG ' + d.type() + ': ' + d.message()); await d.accept('1999').catch(() => { }); });
  await page.addInitScript(() => {
    window.__errs = [];
    window.addEventListener('error', e => window.__errs.push('win.onerror: ' + e.message + ' @ ' + e.filename + ':' + e.lineno + '\n' + (e.error && e.error.stack || '')));
    window.addEventListener('unhandledrejection', e => window.__errs.push('unhandledrejection: ' + (e.reason && (e.reason.stack || e.reason.message) || String(e.reason))));
  });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  let snap = await ui.snapshot();
  const e4 = snap.match(/@(e\d+) button [^\n]*HERMAN ADMIN/)?.[1];
  await ui.click('@' + e4);
  await page.waitForTimeout(600);
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
  const errs = await page.evaluate(() => window.__errs);
  await page.screenshot({ path: 'C:/Users/Admin/OneDrive/Desktop/Wallpaper/qa_admin_screen.png' });
  return { evts, errs };
}
