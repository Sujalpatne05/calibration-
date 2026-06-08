import { Pencil, Trash2 } from 'lucide-react'

/**
 * RowActions — compact edit / delete icon buttons shown in table rows.
 */
export default function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={onEdit}
        className="rounded-lg p-2 text-brand-500 transition hover:bg-brand-50"
        aria-label="Edit"
        title="Edit"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={onDelete}
        className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
        aria-label="Delete"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
