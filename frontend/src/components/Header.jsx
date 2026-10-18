import { useVault } from "../VaultContext";
import Avatar from "./Avatar";

const TABS = ["HOME", "ALBUMS", "MEMBERS", "BOARD"];

export default function Header() {
  const v = useVault();
  const { me, isGuest, canModerate, tab, setTab, search, setSearch, logout, selectMode, setSelectMode } = v;

  function go(t) {
    setTab(t);
    if (t !== "HOME") setSelectMode(false);
  }

  return (
    <div className="header">
      <div className="header-in">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div
            style={{
              fontSize: 18, fontWeight: 800, letterSpacing: ".12em", cursor: "pointer",
              background: "linear-gradient(180deg,#C4B5FD,#8B5CF6,#6366F1)",
              WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            }}
            onClick={() => go("HOME")}
          >
            FAM VAULT
          </div>

          {me && (
            <div className="who desktop-only">
              <Avatar member={me} cls="sm" />
              <div>
                <div className="who-b">{me.name}</div>
                <div style={{ fontSize: 9, color: "var(--dim)" }}>
                  {me.relation}
                </div>
              </div>
              {me.is_admin && <span className="tag admin">ADMIN</span>}
              {isGuest && <span className="tag guest">GUEST</span>}
            </div>
          )}
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`tab ${tab === t ? "active" : ""}`}
              onClick={() => go(t)}
            >
              {t}
            </button>
          ))}

          {canModerate && (
            <>
              <button
                className={`tab danger-tab ${tab === "TRASH" ? "active" : ""}`}
                onClick={() => go("TRASH")}
              >
                TRASH
              </button>
              <button
                className={`tab ${tab === "ADMIN" ? "active" : ""}`}
                onClick={() => go("ADMIN")}
              >
                ADMIN
              </button>
            </>
          )}

          <button className="btn mini" onClick={logout}>
            LOG OUT
          </button>
        </div>
      </div>

      <div className="hero">
        <div className="hero-row" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="input search"
            placeholder="SEARCH MEMBERS OR PHOTOS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {tab === "HOME" && !isGuest && (
            <button
              className={`btn mini ${selectMode ? "primary" : ""}`}
              onClick={() => {
                setSelectMode(!selectMode);
                v.setSelected({});
              }}
            >
              {selectMode ? "EXIT SELECT" : "SELECT"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
