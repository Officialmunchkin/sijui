export default function Avatar({ member, cls = "md" }) {
  if (!member) return null;
  return (
    <div
      className={`avatar ${cls}`}
      style={{ background: member.color, boxShadow: `0 0 18px ${member.color}80` }}
    >
      {member.initial || (member.name || "?")[0]}
    </div>
  );
}
