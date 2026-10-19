// Live end-to-end test: upload a tiny PNG, list, delete it, confirm gone.
const API = "https://famvault-r2.famvault.workers.dev";
const H = { "X-Famvault-Role": "member" };

// 1x1 red PNG
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

(async () => {
  const fd = new FormData();
  fd.append("file", new Blob([png], { type: "image/png" }), "live-test-" + Date.now() + ".png");
  fd.append("album", "TEST");
  fd.append("uploadedBy", "herman");
  const up = await fetch(API + "/upload", { method: "POST", headers: H, body: fd });
  const upJ = await up.json();
  console.log("UPLOAD:", up.status, JSON.stringify(upJ).slice(0, 200));
  if (!up.ok) return;

  const id = upJ.photo.id;
  const list1 = await (await fetch(API + "/photos")).json();
  const count1 = list1.photos.filter(p => p.id === id).length;
  console.log("AFTER UPLOAD, occurrences of id in meta:", count1, "(should be 1)");

  const del = await fetch(API + "/photos/" + id, { method: "DELETE", headers: H });
  console.log("DELETE:", del.status, await del.text());

  const list2 = await (await fetch(API + "/photos")).json();
  const count2 = list2.photos.filter(p => p.id === id).length;
  console.log("AFTER DELETE, occurrences:", count2, "(should be 0)");

  // guest delete should fail
  const fd2 = new FormData();
  fd2.append("file", new Blob([png], { type: "image/png" }), "guest-test.png");
  const up2 = await fetch(API + "/upload", { method: "POST", body: fd2 });
  console.log("GUEST UPLOAD:", up2.status, "(should be 403)");
})();
