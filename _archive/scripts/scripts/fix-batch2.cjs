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

// ---- 1. fileURL (single-line current form) ----
rep('function fileURL(key){ return `${R2_CONFIG.API}/file/${encodeURIComponent(key)}`; }',
`function fileURL(key){
  if(!key) return "";
  return \`\${R2_CONFIG.API}/file/\${key.split('/').map(encodeURIComponent).join('/')}\`;
}`, 'fix 1 fileURL');

// ---- 2. R2_CONFIG without secrets (field order differs) ----
rep(`const R2_CONFIG = {
  BUCKET: "familyvault",
  ACCOUNT_ID: "c182611151de4f958fb6256518753d85",
  API: "https://famvault-r2.famvault.workers.dev", // GET /photos, GET /file/<key>, POST /upload, DELETE /photos/<id>
};`,
`const R2_CONFIG = {
  API: "https://famvault-r2.famvault.workers.dev", // GET /photos, GET /file/<key>, POST /upload, DELETE /photos/<id>
};`, 'fix 2 R2_CONFIG');

// ---- 4. normalize size + better error surfacing ----
rep(`    const res = await fetch(\`\${R2_CONFIG.API}/photos\`);
    if(!res.ok) return;
    const data = await res.json();
    if(Array.isArray(data.photos)) state.photos = data.photos;
  }catch(e){ console.warn("apiListPhotos", e); }`,
`    const res = await fetch(\`\${R2_CONFIG.API}/photos\`);
    if(!res.ok) throw new Error("FETCH FAILED");
    const data = await res.json();
    if(Array.isArray(data.photos)){
      state.photos = data.photos.map(p => ({ ...p, size: p.size || p.fileSize || 0 }));
    }
  }catch(e){ toast("FAILED TO LOAD PHOTOS: " + e.message); console.warn(e); }`, 'fix 4 apiListPhotos');

fs.writeFileSync(file, s, 'utf8');
console.log('total changes:', changes);
