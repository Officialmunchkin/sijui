const fs = require('fs');
const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';
let s = fs.readFileSync(file, 'utf8');
let changes = 0;
function rep(oldStr, newStr, label) {
  if (!s.includes(oldStr)) { console.log('NOT FOUND:', label); return; }
  s = s.replace(oldStr, newStr);
  changes++;
  console.log('applied:', label);
}

// ---------- FIX 1: removeMember ----------
rep(`function removeMember(id){
  if(!isAdmin()) return;
  if(id === me()?.id){ toast("CANNOT REMOVE YOURSELF"); return; }
  const m = state.members.find(x => x.id === id);
  if(!m) return;
  if(m.isAdmin && state.members.filter(x => x.isAdmin).length <= 1){ toast("CANNOT REMOVE LAST ADMIN"); return; }
  if(!confirm(\`REMOVE MEMBER "\${m.name}"? THIS CANNOT BE UNDONE.\`)) return;
  state.members = state.members.filter(x => x.id !== id);
  delete state.passwords[id];
  saveMembers(); savePasswords();
  render();
}`,
`function removeMember(id){
  if(!isAdmin() && !isHerman()){ toast("ONLY ADMIN CAN REMOVE"); return; }
  if(id === me()?.id){ toast("CANNOT REMOVE YOURSELF"); return; }
  const m = state.members.find(x => x.id === id);
  if(!m){ toast("MEMBER NOT FOUND"); return; }
  const adminCount = state.members.filter(x => x.isAdmin && !x.isGuest).length;
  if(m.isAdmin && adminCount <= 1){ toast("CANNOT REMOVE LAST ADMIN - MAKE ANOTHER ADMIN FIRST"); return; }
  if(!confirm(\`REMOVE MEMBER "\${m.name}"? THIS CANNOT BE UNDONE. PASSWORD WILL BE DELETED.\`)) return;
  state.members = state.members.filter(x => x.id !== id);
  delete state.passwords[id];
  saveMembers(); savePasswords();
  toast(m.name + " REMOVED");
  render();
}`, 'fix1 removeMember');

// ---------- FIX 1: addMember - guest cannot be admin ----------
rep(`    isAdmin: !!f.isAdmin, isGuest: !!f.isGuest,
  });
  saveMembers();`,
`    isGuest: !!f.isGuest,
    isAdmin: f.isGuest ? false : !!f.isAdmin,
  });
  saveMembers();`, 'fix1 addMember guest-implies-not-admin');

// ---------- FIX 1: editMemberSave - guest cannot be admin ----------
rep(`  Object.assign(cur, {
    name: f.name.trim().toUpperCase() || cur.name,
    relation: f.relation.trim().toUpperCase() || cur.relation,
    birthday: f.birthday.trim() || cur.birthday,
    bio: f.bio.trim().toUpperCase() || cur.bio,
    color: f.color || cur.color,
    isGuest: !!f.isGuest,
    isAdmin: !!f.isAdmin,
    initial: (f.name.trim()[0] || cur.initial).toUpperCase(),
  });`,
`  Object.assign(cur, {
    name: f.name.trim().toUpperCase() || cur.name,
    relation: f.relation.trim().toUpperCase() || cur.relation,
    birthday: f.birthday.trim() || cur.birthday,
    bio: f.bio.trim().toUpperCase() || cur.bio,
    color: f.color || cur.color,
    isGuest: !!f.isGuest,
    isAdmin: f.isGuest ? false : !!f.isAdmin,
    initial: (f.name.trim()[0] || cur.initial).toUpperCase(),
  });`, 'fix1 editMemberSave guest-implies-not-admin');

// ---------- FIX 2: apiDeletePhoto with role header + key fallback ----------
rep(`async function apiDeletePhoto(id){
  const res = await fetch(\`\${R2_CONFIG.API}/photos/\${encodeURIComponent(id)}\`, { method:"DELETE" });
  if(!res.ok) throw new Error("DELETE FAILED");
}`,
`async function apiDeletePhoto(p){
  // p can be an id string or a full photo object
  const id = typeof p === "string" ? p : p.id;
  const key = typeof p === "object" ? p.key : null;
  const headers = { "X-Famvault-Role": "member" };
  let res = await fetch(\`\${R2_CONFIG.API}/photos/\${encodeURIComponent(id)}\`, { method:"DELETE", headers });
  // fallback: try deleting by R2 object key
  if(!res.ok && key){
    res = await fetch(\`\${R2_CONFIG.API}/file/\${(key.split("/").map(encodeURIComponent).join("/"))}\`, { method:"DELETE", headers });
  }
  if(!res.ok){
    let msg = "DELETE FAILED";
    try{ msg = (await res.json()).error || msg; }catch(e){}
    throw new Error(msg);
  }
}`, 'fix2 apiDeletePhoto');

// ---------- FIX 2: deleteCurrentPhoto passes full object ----------
rep(`  try{
    await apiDeletePhoto(p.id);
    state.photos = state.photos.filter(x => x.id !== p.id);
    state.lightbox = null;
    toast("PHOTO DELETED");
  }catch(e){ toast("DELETE FAILED"); }
  render();`,
`  try{
    await apiDeletePhoto(p);
    state.photos = state.photos.filter(x => x.id !== p.id);
    state.lightbox = null;
    toast("PHOTO DELETED");
  }catch(e){ toast(e.message || "DELETE FAILED"); }
  render();`, 'fix2 deleteCurrentPhoto pass object');

// ---------- FIX 3: onUploadFiles dedupe ----------
rep(`  // replace selection (cap 50 per batch)
  state.uploadFiles = files.slice(0, 50);
  if(files.length > 50) toast("MAX 50 FILES PER BATCH");
  state.uploadPreview = state.uploadFiles[0].type.startsWith("image/")
    ? URL.createObjectURL(state.uploadFiles[0])
    : null;
  render();`,
`  // dedupe by name+size+lastModified, REPLACE selection (cap 50 per batch)
  const seen = new Set();
  const deduped = [];
  for(const f of files){
    const k = f.name + "|" + f.size + "|" + f.lastModified;
    if(!seen.has(k)){ seen.add(k); deduped.push(f); }
  }
  state.uploadFiles = deduped.slice(0, 50);
  if(deduped.length > 50) toast("MAX 50 FILES PER BATCH");
  if(state.uploadPreview) URL.revokeObjectURL(state.uploadPreview);
  state.uploadPreview = state.uploadFiles[0].type.startsWith("image/")
    ? URL.createObjectURL(state.uploadFiles[0])
    : null;
  render();`, 'fix3 onUploadFiles dedupe');

// ---------- FIX 3: doUpload dedupe + always clear selection ----------
rep(`  try{
    const album = state.uploadAlbum || state.albums[0] || "UNSORTED";
    const uploadedBy = me()?.id || ADMIN_ID;
    const results = await uploadPool(files, async f => {`,
`  try{
    // dedupe again right before upload (belt & suspenders)
    const seen = new Set();
    const uniqueFiles = files.filter(f => {
      const k = f.name + "|" + f.size + "|" + f.lastModified;
      if(seen.has(k)) return false;
      seen.add(k); return true;
    });
    state.uploadTotal = uniqueFiles.length;
    const album = state.uploadAlbum || state.albums[0] || "UNSORTED";
    const uploadedBy = me()?.id || ADMIN_ID;
    const results = await uploadPool(uniqueFiles, async f => {`, 'fix3 doUpload dedupe before pool');

rep(`  }catch(err){
    toast("UPLOAD FAILED: " + err.message);
  }
  if(state.uploadPreview){ URL.revokeObjectURL(state.uploadPreview); state.uploadPreview = null; }
  (state.uploadFiles || []).forEach(f => { if(f._previewUrl) URL.revokeObjectURL(f._previewUrl); });
  state.uploading = false;`,
`  }catch(err){
    toast("UPLOAD FAILED: " + err.message);
  }finally{
    // always clear the selection so nothing can be double-submitted
    state.uploadFiles = null;
    if(state.uploadPreview){ URL.revokeObjectURL(state.uploadPreview); state.uploadPreview = null; }
  }
  (state.uploadFiles || []).forEach(f => { if(f._previewUrl) URL.revokeObjectURL(f._previewUrl); });
  state.uploading = false;`, 'fix3 doUpload finally clear');

fs.writeFileSync(file, s, 'utf8');
console.log('total changes:', changes);
