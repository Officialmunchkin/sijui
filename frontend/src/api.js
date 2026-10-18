// API client for the FAM VAULT Laravel backend.
// Mirrors the R2 Worker API used by the original album.html.
const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export const fileURL = (key) => (key ? `${API}/file/${key}` : "");

async function j(res) {
  if (!res.ok) {
    let msg = "REQUEST FAILED";
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/* ---- Auth ---- */
export async function apiLogin(memberId, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId, password }),
  });
  return j(res);
}

export async function apiGuest() {
  const res = await fetch(`${API}/guest`, { method: "POST" });
  return j(res);
}

/* ---- Members ---- */
export async function apiListMembers() {
  const res = await fetch(`${API}/members`);
  return j(res); // { members, passwords }
}
export async function apiCreateMember(form) {
  const res = await fetch(`${API}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  return j(res);
}
export async function apiUpdateMember(id, form) {
  const res = await fetch(`${API}/members/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  return j(res);
}
export async function apiDeleteMember(id) {
  const res = await fetch(`${API}/members/${encodeURIComponent(id)}`, { method: "DELETE" });
  return j(res);
}
export async function apiSetPassword(id, password) {
  const res = await fetch(`${API}/members/${encodeURIComponent(id)}/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return j(res);
}

/* ---- Albums ---- */
export async function apiListAlbums() {
  const res = await fetch(`${API}/albums`);
  return j(res); // { albums }
}
export async function apiCreateAlbum(name) {
  const res = await fetch(`${API}/albums`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return j(res);
}
export async function apiRenameAlbum(oldName, newName) {
  const res = await fetch(`${API}/albums/${encodeURIComponent(oldName)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
  return j(res);
}
export async function apiDeleteAlbum(name) {
  const res = await fetch(`${API}/albums/${encodeURIComponent(name)}`, { method: "DELETE" });
  return j(res);
}

/* ---- Photos ---- */
export async function apiListPhotos() {
  const res = await fetch(`${API}/photos`);
  return j(res); // { photos }
}
export async function apiListTrash() {
  const res = await fetch(`${API}/photos/trash`);
  return j(res); // { photos }
}
export async function apiUpload(file, caption, album, uploadedBy, taggedIds) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("caption", caption);
  fd.append("album", album);
  fd.append("uploadedBy", uploadedBy);
  fd.append("tagged", (taggedIds || []).join(","));
  const res = await fetch(`${API}/upload`, { method: "POST", body: fd });
  return j(res);
}
export async function apiDeletePhoto(id) {
  const res = await fetch(`${API}/photos/${encodeURIComponent(id)}`, { method: "DELETE" });
  return j(res);
}
export async function apiTrashAction(ids, action) {
  const res = await fetch(`${API}/photos/trash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, action }),
  });
  return j(res);
}
export async function apiUpdateAlbum(from, to) {
  const res = await fetch(`${API}/photos/update-album`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to }),
  });
  return j(res);
}

/* ---- Board ---- */
export async function apiListBoard() {
  const res = await fetch(`${API}/board`);
  return j(res); // { posts }
}
export async function apiSaveBoard(posts) {
  const res = await fetch(`${API}/board`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ posts }),
  });
  return j(res);
}
