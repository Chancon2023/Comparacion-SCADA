// src/components/ReviewBadge.jsx
export default function ReviewBadge({ pros = "", cons = "", notes = "" }) {
  const hasPros = pros && String(pros).trim().length;
  const hasCons = cons && String(cons).trim().length;
  const hasNotes = notes && String(notes).trim().length;

  if (!hasPros && !hasCons && !hasNotes) return null;

  return (
    <div className="mt-3 grid gap-2 md:grid-cols-3">
      {hasPros && (
        <div className="rounded-2xl bg-green-50 text-green-900 border border-green-200 p-3">
          <div className="text-sm font-semibold mb-1">Pros (reseña)</div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{pros}</div>
        </div>
      )}
      {hasCons && (
        <div className="rounded-2xl bg-red-50 text-red-900 border border-red-200 p-3">
          <div className="text-sm font-semibold mb-1">Contras (reseña)</div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{cons}</div>
        </div>
      )}
      {hasNotes && (
        <div className="rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 p-3 md:col-span-3">
          <div className="text-sm font-semibold mb-1">Notas</div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{notes}</div>
        </div>
      )}
    </div>
  );
}
