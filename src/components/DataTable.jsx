/**
 * DataTable — generic, responsive table.
 *
 * props:
 *  - columns: [{ key, header, render?(row, index), align?, className?, headerClassName? }]
 *  - data:    array of row objects
 *  - rowKey:  (row, i) => key
 *  - emptyMessage
 *
 * On screens < md the table collapses into stacked cards so it stays
 * readable on tablet and mobile.
 */
export default function DataTable({
  columns,
  data,
  rowKey = (_, i) => i,
  emptyMessage = 'No records found.',
}) {
  const alignCls = (a) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

  if (!data?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center text-sm text-ink-faint">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`table-head px-4 py-3 ${alignCls(col.align)} ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className="group border-b border-slate-50 transition-colors hover:bg-brand-50/40"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-4 text-sm text-ink ${alignCls(col.align)} ${col.className || ''}`}
                  >
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 md:hidden">
        {data.map((row, i) => (
          <div
            key={rowKey(row, i)}
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className="flex items-start justify-between gap-4 border-b border-slate-50 py-2 last:border-0"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {col.header}
                </span>
                <span className="text-right text-sm text-ink">
                  {col.render ? col.render(row, i) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
