import { useState, useEffect, useRef, useCallback } from "react";
import * as api from "./api";
import { VaultContext } from "./VaultContext";
import { bdayInfo } from "./utils";
import LoginScreen from "./components/LoginScreen";
import Header from "./components/Header";
import HomeTab from "./components/HomeTab";
import AlbumsTab from "./components/AlbumsTab";
import MembersTab from "./components/MembersTab";
import BoardTab from "./components/BoardTab";
import AdminTab from "./components/AdminTab";
import TrashTab from "./components/TrashTab";
import UploadModal from "./components/UploadModal";
import Lightbox from "./components/Lightbox";
import MemberModal from "./components/MemberModal";
import NewAlbumModal from "./components/NewAlbumModal";
import Toast from "./components/Toast";

const SEED_ALBUMS = ["SUMMER 24", "XMAS 23", "BIRTHDAYS", "WEEKENDS", "FAMILY BBQ", "ARCHIVE"];
const SYSTEM_ALBUMS = ["UNSORTED", "TRASH"];
export const ADMIN_ID = "herman";

export default function App() {
  /* ---------------- session ---------------- */
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem("famvault_session");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  /* ---------------- data ---------------- */
  const [members, setMembers] = useState([]);
  const [passwordSet, setPasswordSet] = useState([]);
  const [albums, setAlbums] = useState(SEED_ALBUMS);
  const [albumErr, setAlbumErr] = useState("");
  const [photos, setPhotos] = useState([]);
  const [trash, setTrash] = useState([]);
  const [boardPosts, setBoardPosts] = useState([]);

  /* ---------------- ui ---------------- */
  const [tab, setTab] = useState("HOME");
  const [albumFilter, setAlbumFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(100);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [memberModal, setMemberModal] = useState(null); // {mode:'add'|'edit', member?}
  const [newAlbumOpen, setNewAlbumOpen] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState({}); // {id:true}

  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  /* ---------------- helpers ---------------- */
  const toast = useCallback((text) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const me = session?.member || null;
  const isGuest = session?.role === "guest";
  const isAdmin = !!me?.is_admin;
  const isHerman = me?.id === ADMIN_ID;
  const canModerate = isAdmin || isHerman;

  /* ---------------- loaders ---------------- */
  const loadMembers = useCallback(async () => {
    try {
      const d = await api.apiListMembers();
      setMembers(d.members || []);
      setPasswordSet(d.passwords || []);
    } catch {
      /* keep previous */
    }
  }, []);

  const loadAlbums = useCallback(async () => {
    try {
      const d = await api.apiListAlbums();
      const list = d.albums || [];
      setAlbums(list.length ? list : SEED_ALBUMS);
      setAlbumErr("");
    } catch {
      setAlbumErr("CANNOT REACH SERVER");
    }
  }, []);

  const loadBoard = useCallback(async () => {
    try {
      const d = await api.apiListBoard();
      setBoardPosts((d.posts || []).slice().sort((a, b) => (b.at || 0) - (a.at || 0)));
    } catch {
      /* ignore */
    }
  }, []);

  const loadMedia = useCallback(async () => {
    try {
      const d = await api.apiListPhotos();
      setPhotos(d.photos || []);
    } catch {
      toast("FAILED TO LOAD PHOTOS");
    }
    try {
      const d = await api.apiListTrash();
      setTrash(d.photos || []);
    } catch {
      /* ignore */
    }
  }, [toast]);

  useEffect(() => {
    loadMembers();
    loadAlbums();
  }, [loadMembers, loadAlbums]);

  useEffect(() => {
    if (session) loadBoard();
  }, [session, loadBoard]);

  useEffect(() => {
    if (session) loadMedia();
  }, [session, loadMedia]);

  /* ---------------- auth ---------------- */
  const login = useCallback(
    async (memberId, password) => {
      const d = await api.apiLogin(memberId, password);
      const sess = { role: "member", memberId, member: d.member };
      setSession(sess);
      localStorage.setItem("famvault_session", JSON.stringify(sess));
      loadMembers();
      setTab("HOME");
      return d;
    },
    [loadMembers]
  );

  const guest = useCallback(async () => {
    const d = await api.apiGuest();
    const sess = { role: "guest", memberId: d.member.id, member: d.member };
    setSession(sess);
    localStorage.setItem("famvault_session", JSON.stringify(sess));
    setTab("HOME");
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem("famvault_session");
    setTab("HOME");
    setAlbumFilter("ALL");
    setSearch("");
    setSelectMode(false);
    setSelected({});
  }, []);

  /* ---------------- photo ops ---------------- */
  const trashPhotos = useCallback(
    async (ids) => {
      if (!ids.length) return;
      await api.apiTrashAction(ids, "trash");
      setLightbox((lb) => (lb && ids.includes(lb.id) ? null : lb));
      await loadMedia();
      toast(`MOVED ${ids.length} TO TRASH`);
    },
    [loadMedia, toast]
  );

  const restorePhoto = useCallback(
    async (id) => {
      await api.apiTrashAction([id], "restore");
      await loadMedia();
      toast("RESTORED");
    },
    [loadMedia, toast]
  );

  const restoreAll = useCallback(async () => {
    if (!trash.length) return;
    await api.apiTrashAction(trash.map((t) => t.id), "restore");
    await loadMedia();
    toast("RESTORED ALL");
  }, [trash, loadMedia, toast]);

  const deleteForever = useCallback(
    async (id) => {
      await api.apiDeletePhoto(id);
      await loadMedia();
      toast("DELETED FOREVER");
    },
    [loadMedia, toast]
  );

  const emptyTrash = useCallback(async () => {
    if (!trash.length) return;
    for (const t of trash) {
      try {
        await api.apiDeletePhoto(t.id);
      } catch {
        /* ignore */
      }
    }
    await loadMedia();
    toast("TRASH EMPTIED");
  }, [trash, loadMedia, toast]);

  /* ---------------- album ops ---------------- */
  const createAlbum = useCallback(
    async (name) => {
      const n = name.trim().toUpperCase();
      if (!n) return { ok: false, error: "ALBUM NAME REQUIRED" };
      try {
        const d = await api.apiCreateAlbum(n);
        if (d.error) return { ok: false, error: d.error };
        await loadAlbums();
        toast("ALBUM CREATED");
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message || "FAILED" };
      }
    },
    [loadAlbums, toast]
  );

  const renameAlbum = useCallback(
    async (from, to) => {
      const n = to.trim().toUpperCase();
      if (!n) return { ok: false, error: "ALBUM NAME REQUIRED" };
      try {
        const d = await api.apiRenameAlbum(from, n);
        if (d.error) return { ok: false, error: d.error };
        await api.apiUpdateAlbum(from, n);
        await Promise.all([loadAlbums(), loadMedia()]);
        if (albumFilter === from) setAlbumFilter(n);
        toast("ALBUM RENAMED");
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message || "FAILED" };
      }
    },
    [albumFilter, loadAlbums, loadMedia, toast]
  );

  const deleteAlbum = useCallback(
    async (name) => {
      if (SYSTEM_ALBUMS.includes(name)) return { ok: false, error: "SYSTEM ALBUM" };
      try {
        await api.apiUpdateAlbum(name, "UNSORTED");
        await api.apiDeleteAlbum(name);
        await Promise.all([loadAlbums(), loadMedia()]);
        if (albumFilter === name) setAlbumFilter("ALL");
        toast("ALBUM DELETED");
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message || "FAILED" };
      }
    },
    [albumFilter, loadAlbums, loadMedia, toast]
  );

  /* ---------------- member ops ---------------- */
  const saveMember = useCallback(
    async (payload, mode, id) => {
      const d =
        mode === "edit"
          ? await api.apiUpdateMember(id, payload)
          : await api.apiCreateMember(payload);
      if (d.error) return { ok: false, error: d.error };
      await loadMembers();
      toast(mode === "edit" ? "MEMBER UPDATED" : "MEMBER ADDED");
      return { ok: true, member: d.member };
    },
    [loadMembers, toast]
  );

  const removeMember = useCallback(
    async (id) => {
      const d = await api.apiDeleteMember(id);
      if (d.error) return { ok: false, error: d.error };
      await loadMembers();
      toast("MEMBER REMOVED");
      return { ok: true };
    },
    [loadMembers, toast]
  );

  const setMemberPassword = useCallback(
    async (id, password) => {
      const d = await api.apiSetPassword(id, password);
      if (d.error) return { ok: false, error: d.error };
      await loadMembers();
      toast("PASSWORD UPDATED");
      return { ok: true };
    },
    [loadMembers, toast]
  );

  /* ---------------- board ops ---------------- */
  const syncBoard = useCallback(
    async (posts) => {
      const sorted = posts.slice().sort((a, b) => (b.at || 0) - (a.at || 0));
      setBoardPosts(sorted);
      try {
        await api.apiSaveBoard(sorted);
      } catch {
        toast("BOARD SYNC FAILED");
      }
    },
    [toast]
  );

  /* ---------------- context value ---------------- */
  const vault = {
    session, me, isGuest, isAdmin, isHerman, canModerate,
    members, passwordSet, albums, albumErr, photos, trash, boardPosts,
    tab, setTab, albumFilter, setAlbumFilter, search, setSearch,
    visibleCount, setVisibleCount,
    uploadOpen, setUploadOpen, lightbox, setLightbox,
    memberModal, setMemberModal, newAlbumOpen, setNewAlbumOpen,
    selectMode, setSelectMode, selected, setSelected,
    toast, login, guest, logout,
    loadMembers, loadAlbums, loadBoard, loadMedia,
    trashPhotos, restorePhoto, restoreAll, deleteForever, emptyTrash,
    createAlbum, renameAlbum, deleteAlbum,
    saveMember, removeMember, setMemberPassword,
    syncBoard,
  };

  /* ---------------- render ---------------- */
  if (!session) {
    return (
      <>
        <LoginScreen members={members} passwordSet={passwordSet} onLogin={login} onGuest={guest} />
        <Toast toasts={toasts} />
      </>
    );
  }

  const bdays = members.map((m) => ({ m, info: bdayInfo(m) })).filter((x) => x.info.isToday);

  return (
    <VaultContext.Provider value={vault}>
      <div>
        {bdays.length > 0 && (
          <div
            style={{
              position: "relative", zIndex: 50, width: "100%",
              background: "linear-gradient(90deg,#8B5CF6,#6366F1,#EC4899)",
              borderBottom: "1px solid rgba(196,181,253,.3)",
              padding: "12px 16px", textAlign: "center",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".2em", color: "#fff" }}>
              🎉 IT&apos;S {bdays.map((x) => x.m.name).join(" & ")}&apos;S BIRTHDAY TODAY! 🎉
            </span>
          </div>
        )}

        {isGuest && (
          <div className="guest-bar">
            <div className="guest-bar-in" style={{ justifyContent: "space-between" }}>
              <span>GUEST VIEW • VIEW ONLY • CANNOT DOWNLOAD • CANNOT EDIT • CANNOT UPLOAD</span>
              <span style={{ fontSize: 9, color: "var(--dim)" }}>INVITED VIA GUEST BUTTON • VIEW ONLY</span>
            </div>
          </div>
        )}

        <Header />

        <div className="content">
          {tab === "HOME" && <HomeTab />}
          {tab === "ALBUMS" && <AlbumsTab />}
          {tab === "MEMBERS" && <MembersTab />}
          {tab === "BOARD" && <BoardTab />}
          {tab === "TRASH" && (canModerate ? <TrashTab /> : <HomeTab />)}
          {tab === "ADMIN" && (canModerate ? <AdminTab /> : <HomeTab />)}
        </div>

        {!isGuest && (
          <button className="fab" onClick={() => setUploadOpen(true)} aria-label="Upload">
            +
          </button>
        )}

        {uploadOpen && <UploadModal />}
        {lightbox && <Lightbox />}
        {memberModal && <MemberModal />}
        {newAlbumOpen && <NewAlbumModal />}
        <Toast toasts={toasts} />
      </div>
    </VaultContext.Provider>
  );
}
