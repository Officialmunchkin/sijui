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

// ---- 1. fileURL 404 bug ----
rep('function fileURL(key){\n  if(!key) return "";\n  return `${R2_CONFIG.API}/file/${encodeURIComponent(key)}`;\n}',
`function fileURL(key){
  if(!key) return "";
  return \`\${R2_CONFIG.API}/file/\${key.split('/').map(encodeURIComponent).join('/')}\`;
}`, 'fix 1 fileURL');

// ---- 2. remove secrets from R2_CONFIG ----
rep(`const R2_CONFIG = {
  API: "https://famvault-r2.famvault.workers.dev",
  ACCOUNT_ID: "c182611151de4f958fb6256518753d85",
  BUCKET: "familyvault",
};`,
`const R2_CONFIG = {
  API: "https://famvault-r2.famvault.workers.dev",
};`, 'fix 2 R2_CONFIG');

// ---- 3. revoke object URLs after upload ----
rep(`  state.uploading = false;
  state.uploadDone = 0; state.uploadTotal = 0;
  render();
}`,
`  if(state.uploadPreview){ URL.revokeObjectURL(state.uploadPreview); state.uploadPreview = null; }
  (state.uploadFiles || []).forEach(f => { if(f._previewUrl) URL.revokeObjectURL(f._previewUrl); });
  state.uploading = false;
  state.uploadDone = 0; state.uploadTotal = 0;
  render();
}`, 'fix 3 revoke URLs');

// ---- 4. normalize size on fetch ----
rep(`    const data = await res.json();
    if(Array.isArray(data.photos)){
      state.photos = data.photos;
    }`,
`    const data = await res.json();
    if(Array.isArray(data.photos)){
      state.photos = data.photos.map(p => ({ ...p, size: p.size || p.fileSize || 0 }));
    }`, 'fix 4 normalize size');

// ---- 5. deleteAlbum persists to worker ----
rep(`function deleteAlbum(name){
  if(!confirm(\`DELETE ALBUM "\${name}"? PHOTOS WILL MOVE TO "UNSORTED".\`)) return;
  state.albums = state.albums.filter(a => a !== name);
  if(!state.albums.includes("UNSORTED")) state.albums.push("UNSORTED");
  state.photos = state.photos.map(p => p.album === name ? { ...p, album:"UNSORTED" } : p);
  if(state.albumFilter === name) state.albumFilter = "ALL";
  if(state.uploadAlbum === name) state.uploadAlbum = "UNSORTED";
  saveAlbums();
  render();
}`,
`async function deleteAlbum(name){
  if(!confirm(\`DELETE ALBUM "\${name}"? PHOTOS WILL MOVE TO "UNSORTED".\`)) return;
  const oldName = name;
  state.albums = state.albums.filter(a => a !== oldName);
  if(!state.albums.includes("UNSORTED")) state.albums.push("UNSORTED");
  state.photos = state.photos.map(p => p.album === oldName ? { ...p, album:"UNSORTED" } : p);
  if(state.albumFilter === oldName) state.albumFilter = "ALL";
  if(state.uploadAlbum === oldName) state.uploadAlbum = "UNSORTED";
  saveAlbums();
  // Persist album reassignment to R2 via Worker
  try{
    await fetch(\`\${R2_CONFIG.API}/photos/update-album\`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "X-Famvault-Role":"member" },
      body: JSON.stringify({ from: oldName, to: "UNSORTED" })
    });
  }catch(e){ console.warn("update-album failed, local only", e); }
  render();
}`, 'fix 5 deleteAlbum persist');

// ---- 6. verify delete handler exists (frontend check only, worker is separate) ----
rep('fetch(`${R2_CONFIG.API}/photos/${encodeURIComponent(id)}`, { method:"DELETE"',
    'fetch(`${R2_CONFIG.API}/photos/${encodeURIComponent(id)}`, { method:"DELETE"',
    'fix 6 delete path confirmed');

// ---- 7. upload limits + compression ----
rep(`function onUploadFiles(fileList){
  const files = Array.from(fileList || []).filter(f => f && (f.type.startsWith("image/") || f.type.startsWith("video/")));
  if(!files.length) return;
  // bulk selection stacks onto any already-picked files (cap 50 per batch)
  state.uploadFiles = (state.uploadFiles || []).concat(files).slice(0, 50);
  if(!state.uploadPreview) state.uploadPreview = URL.createObjectURL(files[0]);
  render();
}`,
`function onUploadFiles(fileList){
  const files = Array.from(fileList || []).filter(f => f && (f.type.startsWith("image/") || f.type.startsWith("video/")));
  if(!files.length) return;
  // reject files over 100MB before queueing
  const tooBig = files.filter(f => f.size > 100*1024*1024);
  if(tooBig.length){
    toast(tooBig[0].name + " TOO BIG >100MB - COMPRESS FIRST");
    return;
  }
  // replace selection (cap 50 per batch)
  state.uploadFiles = files.slice(0, 50);
  if(files.length > 50) toast("MAX 50 FILES PER BATCH");
  state.uploadPreview = state.uploadFiles[0].type.startsWith("image/")
    ? URL.createObjectURL(state.uploadFiles[0])
    : null;
  render();
}

/* client-side image compression: downscale to 1920px max side, jpeg q0.8 */
async function compressImage(file){
  if(file.type.startsWith("video/") || file.size < 2*1024*1024) return file;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 1920;
      let w = img.width, h = img.height;
      if(w > max || h > max){
        if(w > h){ h = h * max / w; w = max; } else { w = w * max / h; h = max; }
      }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      c.toBlob(b => resolve(b ? new File([b], file.name, { type:"image/jpeg" }) : file), "image/jpeg", 0.8);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}`, 'fix 7 onUploadFiles + compressImage');

rep(`    const results = await uploadPool(files, f => apiUpload(f, state.uploadCaption || "", album, uploadedBy), 4);`,
`    const results = await uploadPool(files, async f => {
      const fileToUpload = await compressImage(f);
      return apiUpload(fileToUpload, state.uploadCaption || "", album, uploadedBy);
    }, 4);`, 'fix 7 doUpload compress');

// ---- 8. uploadPool: throttle re-renders ----
rep(`      try{ results[idx] = await worker(files[idx]); }
      catch(e){ results[idx] = { error: e.message || "UPLOAD FAILED" }; }
      state.uploadDone = (state.uploadDone || 0) + 1;
      render();`,
`      try{ results[idx] = await worker(files[idx]); }
      catch(e){ results[idx] = { error: e.message || "UPLOAD FAILED" }; }
      state.uploadDone = (state.uploadDone || 0) + 1;
      // update progress bar in place to avoid full re-render flicker
      const bar = document.getElementById("upload-progress");
      if(bar && state.uploadTotal){
        const pct = Math.round((state.uploadDone / state.uploadTotal) * 100);
        bar.querySelector("#upload-pct").textContent = pct + "%";
        bar.querySelector("#upload-count").textContent = "UPLOADING \\u2022 " + state.uploadDone + " / " + state.uploadTotal;
        bar.querySelector("#upload-bar-fill").style.width = pct + "%";
      } else if(state.uploadDone % 2 === 0){
        render();
      }`, 'fix 8 progress in place');

// ---- 9. guest silent fail in doUpload ----
rep(`async function doUpload(){
  if(isGuest()) return;
  const files = state.uploadFiles || [];`,
`async function doUpload(){
  if(isGuest()){ toast("GUESTS CANNOT UPLOAD"); return; }
  const files = state.uploadFiles || [];`, 'fix 9 guest toast');

fs.writeFileSync(file, s, 'utf8');
console.log('total changes:', changes);
