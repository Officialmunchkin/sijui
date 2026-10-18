const fs = require('fs');
const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';
let s = fs.readFileSync(file, 'utf8');
let changes = 0;
function rep(oldStr, newStr, label) {
  if (!s.includes(oldStr)) { console.log('NOT FOUND:', label); return; }
  s = s.split(oldStr).join(newStr);
  changes++;
  console.log('applied:', label);
}

// ---- 10. pagination ----
rep('function homeHTML(){\n  const list = filteredPhotos();\n  const last = list[0];',
'function homeHTML(){\n  const list = filteredPhotos();\n  const visible = list.slice(0, 100);\n  const last = visible[0];', 'fix 10 home slice');

const oldHomeTail = '  ${list.length ? `<div class="masonry">${list.map(photoCardHTML).join("")}</div>`\n                 : `<div class="empty">NO PHOTOS IN THIS TAB</div>`}`;\n}';
const newHomeTail = '  ${visible.length ? `<div class="masonry">${visible.map(photoCardHTML).join("")}</div>`\n                 : `<div class="empty">NO PHOTOS IN THIS TAB</div>`}\n  ${list.length > 100 ? `<button class="btn" style="margin:16px auto;display:block" data-action="show-more">\\u2192 SHOW MORE (${list.length - 100} REMAINING)</button>` : ""}`;\n}';
rep(oldHomeTail, newHomeTail, 'fix 10 home show-more');

rep('function albumsHTML(){\n  const list = filteredPhotos();\n  const chips = ["ALL", ...state.albums];',
'function albumsHTML(){\n  const list = filteredPhotos();\n  const visible = list.slice(0, 100);\n  const chips = ["ALL", ...state.albums];', 'fix 10 albums slice');

const oldAlbumsGrid = '  <div class="album-grid">\n    ${state.albums.map(a => {';
const newAlbumsGrid = '  ${list.length > 100 ? `<button class="btn" style="margin:16px auto;display:block" data-action="show-more">\\u2192 SHOW MORE (${list.length - 100} REMAINING)</button>` : ""}\n  <div class="album-grid">\n    ${state.albums.map(a => {';
rep(oldAlbumsGrid, newAlbumsGrid, 'fix 10 albums show-more');

// ---- 11. download via blob fetch ----
const oldDl = 'function downloadPhoto(p){\n  if(isGuest()){ toast("GUESTS CANNOT DOWNLOAD"); return; }\n  const name = `${p.caption || "photo"}_${p.album}_${p.date}`.replace(/\\s+/g,"_").slice(0,80) + ".jpg";\n  const a = document.createElement("a");\n  a.href = p.src || fileURL(p.key);\n  a.download = name;\n  a.target = "_blank";\n  document.body.appendChild(a);\n  a.click();\n  a.remove();\n}';
const newDl = ['async function downloadPhoto(p){',
'  if(isGuest()){ toast("GUESTS CANNOT DOWNLOAD"); return; }',
'  const name = `${p.caption || "photo"}_${p.album}_${p.date}`.replace(/\\s+/g,"_").slice(0,80) + ".jpg";',
'  try{',
'    // fetch as blob so the Worker\'s CORS headers apply, then save locally',
'    const res = await fetch(p.src || fileURL(p.key));',
'    if(!res.ok) throw new Error("FETCH FAILED");',
'    const blob = await res.blob();',
'    const url = URL.createObjectURL(blob);',
'    const a = document.createElement("a");',
'    a.href = url;',
'    a.download = name;',
'    document.body.appendChild(a);',
'    a.click();',
'    a.remove();',
'    URL.revokeObjectURL(url);',
'  }catch(e){',
'    // fallback: direct link',
'    const a = document.createElement("a");',
'    a.href = p.src || fileURL(p.key);',
'    a.download = name;',
'    a.target = "_blank";',
'    document.body.appendChild(a);',
'    a.click();',
'    a.remove();',
'  }',
'}'].join('\n');
rep(oldDl, newDl, 'fix 11 blob download');

fs.writeFileSync(file, s, 'utf8');
console.log('total changes:', changes);
