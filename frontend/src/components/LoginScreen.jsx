import { useState } from "react";
import Avatar from "./Avatar";

export default function LoginScreen({ members, passwordSet, onLogin, onGuest }) {
  const [pending, setPending] = useState(null); // {member, isNew}
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function pick(m) {
    const isNew = !passwordSet.includes(m.id);
    setPending({ member: m, isNew });
    setPw("");
    setPw2("");
    setErr("");
  }

  async function submit(e) {
    e.preventDefault();
    if (!pending) return;
    if (pending.isNew && pw !== pw2) {
      setErr("PASSWORDS DO NOT MATCH");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await onLogin(pending.member.id, pw);
    } catch (e2) {
      setErr(e2.message === "WRONG PASSWORD" ? "WRONG PASSWORD" : "LOGIN FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-inner">
        <div className="logo-big">FAM VAULT</div>
        <div className="login-sub">Private family photo vault</div>

        <div className="member-grid">
          {members.map((m) => (
            <button
              key={m.id}
              className="member-card"
              onClick={() => pick(m)}
              disabled={busy}
            >
              <div className="member-top">
                <Avatar member={m} cls="md" />
                <span className="dot" />
              </div>
              <div className="member-name">
                {m.name}
                {m.is_admin && <span className="tag admin">ADMIN</span>}
              </div>
              <div className="member-handle">@{m.handle}</div>
              <div className="member-relation">{m.relation}</div>
            </button>
          ))}
        </div>

        <div className="login-actions">
          <button className="btn" onClick={onGuest} disabled={busy}>
            CONTINUE AS GUEST
          </button>
        </div>
        {members.length === 0 && (
          <div className="empty" style={{ marginTop: 24 }}>
            NO MEMBERS YET — START THE BACKEND SERVER
          </div>
        )}
      </div>

      {pending && (
        <div className="overlay">
          <div className="backdrop" onClick={() => !busy && setPending(null)} />
          <form className="modal" onSubmit={submit}>
            <button
              type="button"
              className="x"
              onClick={() => setPending(null)}
              disabled={busy}
            >
              ×
            </button>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <Avatar member={pending.member} cls="md" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: ".14em", color: "#fff" }}>
                {pending.member.name}
              </div>
              <div style={{ fontSize: 10, letterSpacing: ".2em", color: "var(--dim)", marginTop: 6 }}>
                {pending.isNew
                  ? "FIRST TIME — SET YOUR PASSWORD"
                  : "ENTER YOUR PASSWORD TO UNLOCK"}
              </div>
            </div>

            <div className="field-label">PASSWORD</div>
            <input
              className="input"
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
            />

            {pending.isNew && (
              <>
                <div className="field-label" style={{ marginTop: 14 }}>
                  CONFIRM PASSWORD
                </div>
                <input
                  className="input"
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="••••••••"
                />
              </>
            )}

            {err && <div className="err-box">{err}</div>}

            <button
              className="btn primary"
              type="submit"
              disabled={busy || !pw || (pending.isNew && !pw2)}
              style={{ width: "100%", marginTop: 18 }}
            >
              {busy ? "CHECKING..." : pending.isNew ? "SET PASSWORD & ENTER" : "UNLOCK"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
