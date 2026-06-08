import { useMemo, useState } from 'react'

/**
 * useSearch — simple client-side search/filter over an array of objects.
 *
 * @param {Array}  data    source rows
 * @param {Array}  fields  object keys to match the query against
 * @returns { query, setQuery, results }
 */
export function useSearch(data, fields) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter((row) =>
      fields.some((f) => String(row[f] ?? '').toLowerCase().includes(q)),
    )
  }, [data, fields, query])

  return { query, setQuery, results }
}
