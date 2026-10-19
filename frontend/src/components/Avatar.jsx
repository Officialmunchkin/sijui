export default function Avatar({ member, size = 'md' }) {
  const color = member?.color || '#8B5CF6'
  const initial = member?.initial || (member?.name || '?').charAt(0)
  return (
    <div
      className={`avatar ${size}`}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
      aria-hidden="true"
    >
      {initial}
    </div>
  )
}
