const resp = await fetch('https://familyalbumvault.netlify.app');
const s = await resp.text();
// capture every render-time throw: wrap console and catch errors thrown inside React render phase
// easier: instrument the ADMIN-block's accessors. Instead, use page.evaluate to override Array.prototype[Symbol.iterator]? too broad.
// better: find what else the ADMIN block reads: pe, _, Ot, L. Check their types in the live app right after login, before clicking admin.
