export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 300)); });
  page.on('dialog', async d => { r.dialogs.push(d.message()); await d.accept(); });

  const fileUrl = 'file:///C:/Users/Admin/OneDrive/Desktop/Wallpaper/Famvault-Readable-Version.html';
  const r = { errs, dialogs: [] };

  // Pre-seed localStorage EXACTLY like the admin console's seed() does
  // (members WITHOUT "handle" field), then load the app.
  await page.goto('about:blank');
  await page.evaluate(() => {
    const mem = [
      { id: "jermaine", name: "JERMAINE", color: "#6366F1", initial: "J", isAdmin: !1, isGuest: !1, relation: "FATHER", birthday: "05-12", bio: "" },
      { id: "lucy", name: "LUCY", color: "#06B6D4", initial: "L", isAdmin: !1, isGuest: !1, relation: "MOTHER", birthday: "08-22", bio: "" },
      { id: "faith", name: "FAITH", color: "#EC4899", initial: "F", isAdmin: !1, isGuest: !1, relation: "1ST BORN", birthday: "02-14", bio: "" },
      { id: "herman", name: "HERMAN", color: "#F59E0B", initial: "H", isAdmin: !0, isGuest: !1, relation: "2ND BORN - ME", birthday: "11-03", bio: "" },
      { id: "hossam", name: "HOSSAM", color: "#8B5CF6", initial: "H", isAdmin: !1, isGuest: !1, relation: "3RD BORN", birthday: "07-19", bio: "" },
      { id: "amber", name: "AMBER", color: "#10B981", initial: "A", isAdmin: !1, isGuest: !1, relation: "LAST BORN", birthday: "09-28", bio: "" }
    ];
    localStorage.setItem('famvault_members', JSON.stringify(mem));
    localStorage.removeItem('famvault_photos');
    localStorage.removeItem('famvault_who');
    localStorage.removeItem('famvault_session');
  });
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  r.startText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  r.startErrs = errs.slice();
  errs.length = 0;

  // Click the herman member tile
  r.clicked = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button,div,a')];
    const t = els.find(el => el.textContent.trim() === 'HERMAN' && el.offsetParent !== null);
    if (t) { t.click(); return 'clicked HERMAN'; }
    return 'HERMAN TILE NOT FOUND';
  });
  await page.waitForTimeout(800);
  r.afterPickText = await page.evaluate(() => document.body.innerText.slice(0, 300));

  // Click LOGIN →
  r.loginClicked = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button,div,a')];
    const t = els.find(el => el.textContent.trim().includes('LOGIN') && el.offsetParent !== null);
    if (t) { t.click(); return 'clicked LOGIN'; }
    return 'LOGIN BUTTON NOT FOUND';
  });
  await page.waitForTimeout(1500);
  r.afterLoginText = await page.evaluate(() => document.body.innerText.slice(0, 400));
  r.errs = errs;
  return r;
}
