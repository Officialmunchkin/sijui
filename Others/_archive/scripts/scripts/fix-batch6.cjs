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

// ---------- FIX 1: removeMember ----------
rep(`function removeMember(id){
  if(!isAdmin() && !isHerman()){ toast("ONLY ADMIN CAN REMOVE"); return; }
  if(id === me()?.id){ toast("CANNOT REMOVE YOURSELF"); return; }
  const m = state.members.find(x => x.id === id);
  if(!m){ toast("MEMBER NOT FOUND"); return; }
  if(m.isAdmin && state.members.filter(x => x.isAdmin).length <= 1){ toast("CANNOT REMOVE LAST ADMIN"); return; }
  if(!confirm("REMOVE MEMBER? THIS CANNOT BE UNDONE.")) return;
  state.members = state.members.filter(x => x.id !== id);
  delete state.passwords[id];
  saveMembers(); savePasswords();
  toast("MEMBER REMOVED");
  render();
}`,
`function removeMember(id){
  if(!isAdmin() && !isHerman()){ toast("ONLY ADMIN CAN REMOVE"); return; }
  if(id === me()?.id){ toast("CANNOT REMOVE YOURSELF"); return; }
  const m = state.members.find(x => x.id === id);
  if(!m){ toast("MEMBER NOT FOUND"); return; }
  const adminCount = state.members.filter(x => x.isAdmin && !x.isGuest).length;
  if(m.isAdmin && adminCount <= 1){ toast("CANNOT REMOVE LAST ADMIN - MAKE ANOTHER ADMIN FIRST"); return; }
  if(!confirm("REMOVE MEMBER " + m.name + "? THIS CANNOT BE UNDONE.")) return;
  state.members = state.members.filter(x => x.id !== id);
  delete state.passwords[id];
  saveMembers(); savePasswords();
  toast(m.name + " REMOVED");
  render();
}`, 'fix1 removeMember');

// ---------- FIX 3: onUploadFiles dedupe ----------
rep(`function onUploadFiles(fileList){
  const files = Array.from(fileList || []).filter(f => f && (f.type.startsWith("image/") || f.type.startsWith("video/")));
  if(!files.length) return;
  state.uploadFiles = (state.uploadFiles || []).concat(files).slice(0,50);`,
`function onUploadFiles(fileList){
  const files = Array.from(fileList || []).filter(f => f && (f.type.startsWith("image/") || f.type.startsWith("video/")));
  if(!files.length) return;
  const deduped = [];
  const seen = new Set();
  for(const f of files){
    const k = f.name + "|" + f.size + "|" + f.lastModified;
    if(!seen.has(k)){ seen.add(k); deduped.push(f); }
  }
  if(state.uploadPreview) URL.revokeObjectURL(state.uploadPreview);
  state.uploadFiles = deduped.slice(0,50);`, 'fix3 onUploadFiles dedupe');

// ---------- FIX 3: doUpload clear on both outcomes ----------
rep(`  } catch(e) {
    toast("UPLOAD FAILED: " + e.message);
    state.uploadFiles = null;
  }`,
`  } catch(e) {
    toast("UPLOAD FAILED: " + e.message);
  } finally {
    state.uploadFiles = null;
    if(state.uploadPreview) URL.revokeObjectURL(state.uploadPreview);
    state.uploadPreview = null;
  }`, 'fix3 doUpload finally cleanup');

fs.writeFileSync(file, s, 'utf8');
console.log('total changes:', changes);
