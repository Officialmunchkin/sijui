export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 12).join('\n')));
  page.on('console', m => { if (m.type() === 'error') evts.push('CONSOLE: ' + m.text().slice(0, 500)); });
  page.on('dialog', async d => { evts.push('DIALOG ' + d.type() + ': ' + d.message()); await d.accept('1999').catch(() => { }); });
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
  await page.waitForTimeout(2000);
  snap = await ui.snapshot();
  return { evts, snap };
}
