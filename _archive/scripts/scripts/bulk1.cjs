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

// ---- 1. bulk upload logic ----
rep(`/* upload */
function onUploadFile(file){
  if(!file) return;
  state.uploadFile = file;
  state.uploadPreview = URL.createObjectURL(file);
  render();
}

async function doUpload(){
  if(isGuest()) return;
  if(!state.uploadFile){ toast("PICK A PHOTO FIRST"); return; }
  state.uploading = true;
  render();
  try{
    const album = state.uploadAlbum || state.albums[0] || "UNSORTED";
    const data = await apiUpload(state.uploadFile, state.uploadCaption || "", album, me()?.id || ADMIN_ID);
    if(data.photo) state.photos.unshift(data.photo);
    state.uploadOpen = false;
    state.uploadFile = null; state.uploadPreview = null;
    state.uploadCaption = "";
    toast("UPLOADED TO VAULT \\u2714");
  }catch(err){
    toast("UPLOAD FAILED: " + err.message);
  }
  state.uploading = false;
  render();
}`,
`/* upload (bulk-capable: pick many photos/videos at once) */
function onUploadFiles(fileList){
  const files = Array.from(fileList || []).filter(f => f && (f.type.startsWith("image/") || f.type.startsWith("video/")));
  if(!files.length) return;
  // bulk selection stacks onto any already-picked files (cap 50 per batch)
  state.uploadFiles = (state.uploadFiles || []).concat(files).slice(0, 50);
  if(!state.uploadPreview) state.uploadPreview = URL.createObjectURL(files[0]);
  render();
}

/* concurrency pool: uploads N files in parallel (default 4) for speed */
async function uploadPool(files, worker, concurrency){
  const results = new Array(files.length);
  let next = 0;
  async function lane(){
    while(next < files.length){
      const idx = next++;
      try{ results[idx] = await worker(files[idx]); }
      catch(e){ results[idx] = { error: e.message || "UPLOAD FAILED" }; }
      state.uploadDone = (state.uploadDone || 0) + 1;
      render();
    }
  }
  const lanes = [];
  for(let k = 0; k < Math.min(concurrency || 4, files.length); k++) lanes.push(lane());
  await Promise.all(lanes);
  return results;
}

async function doUpload(){
  if(isGuest()) return;
  const files = state.uploadFiles || [];
  if(!files.length){ toast("PICK A PHOTO FIRST"); return; }
  state.uploading = true;
  state.uploadDone = 0;
  state.uploadTotal = files.length;
  render();
  try{
    const album = state.uploadAlbum || state.albums[0] || "UNSORTED";
    const uploadedBy = me()?.id || ADMIN_ID;
    const results = await uploadPool(files, f => apiUpload(f, state.uploadCaption || "", album, uploadedBy), 4);
    const ok = results.filter(r => r && r.photo);
    const bad = results.filter(r => r && r.error);
    ok.forEach(r => state.photos.unshift(r.photo));
    if(ok.length) toast(ok.length + (ok.length === 1 ? " MEMORY UPLOADED \\u2714" : " MEMORIES UPLOADED \\u2714"));
    if(bad.length) toast(bad.length + " FAILED: " + (bad[0].error || "ERROR"));
    if(ok.length){
      state.uploadOpen = false;
      state.uploadFiles = null; state.uploadPreview = null;
      state.uploadCaption = "";
    }
  }catch(err){
    toast("UPLOAD FAILED: " + err.message);
  }
  state.uploading = false;
  state.uploadDone = 0; state.uploadTotal = 0;
  render();
}`, 'bulk upload logic');

fs.writeFileSync(file, s, 'utf8');
console.log('total changes:', changes);
