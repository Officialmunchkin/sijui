export default function Toast({ toasts }) {
  return (
    <>
      {toasts.map((t) => (
        <div key={t.id} className="toast show">
          {t.text}
        </div>
      ))}
    </>
  );
}
