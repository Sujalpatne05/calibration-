import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, FolderClosed, FileText, Tag, Eye } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import DateRangeFilter from '../components/DateRangeFilter'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import { invoices as seed } from '../data/invoices'

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export default function Invoices() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [applied, setApplied] = useState({ from: '', to: '' })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return seed.filter((r) => {
      const matchQ =
        !q ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q)
      const afterFrom = !applied.from || r.date >= applied.from
      const beforeTo = !applied.to || r.date <= applied.to
      return matchQ && afterFrom && beforeTo
    })
  }, [query, applied])

  const exportCsv = () => {
    const header = ['Sr', 'Invoice Number', 'Date', 'Status', 'Customer']
    const lines = results.map((r, i) =>
      [i + 1, r.invoiceNumber, r.date, r.status, `"${r.customer}"`].join(','),
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calibration-reports-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const iconBtn =
    'grid h-9 w-9 place-items-center rounded-lg transition hover:bg-slate-100 mx-auto'

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search Certificate"
          className="w-full xl:max-w-xs"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DateRangeFilter
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
            className="w-full sm:w-auto"
          />
          <div className="flex gap-3">
            <Button onClick={() => setApplied({ from, to })}>Show reports</Button>
            <Button variant="secondary" onClick={exportCsv}>
              <Download size={18} /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        rowKey={(r) => r.id}
        data={results}
        emptyMessage="No reports for the selected filters."
        columns={[
          { key: 'sr', header: 'Sr', render: (_, i) => i + 1, className: 'text-ink-faint w-12' },
          { key: 'invoiceNumber', header: 'Invoice Number', className: 'font-medium' },
          { key: 'customer', header: 'Customer', className: 'text-ink-soft max-w-[16rem]' },
          { key: 'date', header: 'Date', render: (r) => fmtDate(r.date) },
          {
            key: 'status',
            header: 'Status',
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            key: 'report',
            header: 'Status Report',
            align: 'center',
            render: () => (
              <button className={iconBtn} title="Open folder">
                <FolderClosed size={18} className="text-amber-500" />
              </button>
            ),
          },
          {
            key: 'archive',
            header: 'Archive',
            align: 'center',
            render: () => (
              <button className={iconBtn} title="Archived document">
                <FileText size={18} className="text-ink-soft" />
              </button>
            ),
          },
          {
            key: 'labels',
            header: 'Labels',
            align: 'center',
            render: () => (
              <button className={iconBtn} title="Print labels">
                <Tag size={18} className="text-brand-500" />
              </button>
            ),
          },
          {
            key: 'view',
            header: 'View',
            align: 'right',
            render: (r) => (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/report')}
              >
                <Eye size={16} /> View
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}
