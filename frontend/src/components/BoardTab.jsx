import { useState } from "react";
import { useVault } from "../VaultContext";
import Avatar from "./Avatar";

const COLORS = ["#8B5CF6", "#06B6D4", "#EC4899", "#F59E0B", "#10B981", "#6366F1"];

export default function BoardTab() {
  const v = useVault();
  const { boardPosts, me, isGuest } = v;
  const [text, setText] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  async function post(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await v.syncBoard([
      {
        id: Date.now().toString(36),
        user: me?.name || "GUEST",
        text: text.toUpperCase(),
        at: Date.now(),
        color,
      },
      ...boardPosts,
    ]);
    setText("");
  }

  async function edit(i, t) {
    const next = window.prompt("EDIT POST:", boardPosts[i].text);
    if (next == null || !next.trim()) return;
    await v.syncBoard(boardPosts.map((p, idx) => (idx === i ? { ...p, text: next.toUpperCase() } : p)));
  }

  async function remove(i) {
    if (!window.confirm("DELETE THIS POST?")) return;
    await v.syncBoard(boardPosts.filter((_, idx) => idx !== i));
  }

  function memberFor(user) {
    return v.members.find((m) => m.name === user) || { name: user, color: COLORS[0], initial: user?.[0] || "?" };
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".18em", color: "#fff", marginBottom: 16 }}>
        FAMILY BOARD
      </div>

      {!isGuest && (
        <form className="card" onSubmit={post} style={{ marginBottom: 18 }}>
          <textarea
            className="input"
            rows={3}
            placeholder="POST A NOTE FOR THE FAMILY..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 22, height: 22, borderRadius: "50%", background: c,
                    border: color === c ? "2px solid #fff" : "1px solid var(--line)",
                  }}
                />
              ))}
            </div>
            <button className="btn primary mini" type="submit" disabled={!text.trim()}>
              POST
            </button>
          </div>
        </form>
      )}

      {isGuest && (
        <div className="err-box" style={{ marginBottom: 16 }}>
          GUESTS CAN READ THE BOARD BUT CANNOT POST
        </div>
      )}

      {boardPosts.length === 0 ? (
        <div className="empty">NO POSTS YET</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {boardPosts.map((p, i) => (
            <div key={p.id || i} className="board-post">
              <Avatar member={memberFor(p.user)} cls="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: p.color || "#fff" }}>
                    {p.user}
                  </span>
                  <span style={{ fontSize: 9, color: "var(--dim)" }}>
                    {p.at ? new Date(p.at).toLocaleString() : ""}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--txt)", marginTop: 6, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {p.text}
                </div>
                {!isGuest && (
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button className="btn mini" onClick={() => edit(i, p.text)}>EDIT</button>
                    <button className="btn danger mini" onClick={() => remove(i)}>DELETE</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
