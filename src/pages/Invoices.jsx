import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Download, FileArchive, FolderClosed, Search, Tag } from 'lucide-react'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import { invoicesAPI } from '../services/api'

const fmtDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

const downloadTextFile = (filename, content, type) => {
  const blob = new Blob([content], { type })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function Invoices() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [applied, setApplied] = useState({ from: '', to: '' })
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInvoices()
  }, [query, applied])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await invoicesAPI.getAll(query, applied.from, applied.to)
      setInvoices(data)
    } catch (err) {
      setError('Failed to fetch invoices')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilter = () => {
    setApplied({ from, to })
  }

  const clearFilters = () => {
    setQuery('')
    setFrom('')
    setTo('')
    setApplied({ from: '', to: '' })
  }

  const exportCsv = async () => {
    try {
      const data = await invoicesAPI.exportCSV(query, applied.from, applied.to)
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (err) {
      alert('Failed to export invoices')
      console.error(err)
    }
  }

  const openReport = (row) => {
    const search = row.invoiceNumber || row.customer?.name || ''
    navigate(`/report?search=${encodeURIComponent(search)}`)
  }

  const downloadLabelCsv = (row) => {
    const headers = ['Invoice Number', 'Customer', 'Date', 'Status', 'Amount']
    const values = [
      row.invoiceNumber,
      row.customer?.name || '',
      fmtDate(row.issueDate),
      row.status || '',
      row.amount || 0,
    ]
    const csv = `${headers.map(csvEscape).join(',')}\n${values.map(csvEscape).join(',')}\n`

    downloadTextFile(
      `${String(row.invoiceNumber || 'invoice').replace(/[<>:"/\\|?*]+/g, '-')}-label.csv`,
      csv,
      'text/csv;charset=utf-8;'
    )
  }

  const showClear = query || from || to || applied.from || applied.to

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 gap-4 md:grid-cols-3">
          <label className="relative block">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Certificate"
              className="h-[58px] w-full rounded-2xl border border-slate-200 bg-white pl-5 pr-12 text-base text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
            <Search
              size={22}
              className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-ink"
            />
          </label>

          {[
            { label: 'From', value: from, onChange: setFrom },
            { label: 'To', value: to, onChange: setTo },
          ].map((field) => (
            <label className="relative block" key={field.label}>
              <span className="sr-only">{field.label}</span>
              <input
                type="date"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                aria-label={field.label}
                className="h-[58px] w-full rounded-2xl border border-slate-200 bg-white pl-5 pr-12 text-base text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <Calendar
                size={21}
                className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-ink"
              />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 xl:justify-end">
          <Button onClick={handleApplyFilter} size="lg" className="min-w-[166px]">
            Show reports
          </Button>
          <Button onClick={exportCsv} variant="secondary" size="lg">
            <Download size={18} /> Export CSV
          </Button>
          {showClear ? (
            <Button onClick={clearFilters} variant="ghost" size="lg">
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">All Invoices</h2>
          <p className="text-sm text-ink-faint">
            {loading
              ? 'Loading invoices...'
              : `${invoices.length} invoice${invoices.length === 1 ? '' : 's'} found`}
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden border-t border-slate-100">
        <DataTable
          rowKey={(r) => r.id}
          data={invoices}
          emptyMessage={loading ? 'Loading...' : 'No invoices found.'}
          columns={[
            {
              key: 'sr',
              header: 'Sr',
              render: (_, i) => i + 1,
              className: 'w-14 text-ink',
              headerClassName: 'text-brand-300',
            },
            {
              key: 'invoiceNumber',
              header: 'Invoice Number',
              className: 'font-medium',
              headerClassName: 'text-brand-300',
              render: (row) => (
                <div>
                  <div>{row.invoiceNumber}</div>
                  <div className="mt-1 text-xs font-normal text-ink-faint">
                    {row.customer?.name || 'N/A'}
                  </div>
                </div>
              ),
            },
            {
              key: 'issueDate',
              header: 'Date',
              render: (row) => fmtDate(row.issueDate),
              className: 'text-ink',
              headerClassName: 'text-brand-300',
            },
            {
              key: 'statusReport',
              header: 'Status Report',
              align: 'center',
              headerClassName: 'text-brand-300',
              render: (row) => (
                <button
                  type="button"
                  onClick={() => openReport(row)}
                  className="inline-flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition hover:bg-amber-50"
                  title={`Open report search for ${row.invoiceNumber}`}
                >
                  <FolderClosed size={26} className="text-amber-400" />
                  <StatusBadge status={row.status} />
                </button>
              ),
            },
            {
              key: 'archive',
              header: 'Archive',
              align: 'center',
              headerClassName: 'text-brand-300',
              render: (row) => (
                <button
                  type="button"
                  onClick={() => openReport(row)}
                  className="inline-flex rounded-lg p-2 text-ink transition hover:bg-slate-100"
                  title={`Open report for ${row.invoiceNumber}`}
                >
                  <FileArchive size={26} />
                </button>
              ),
            },
            {
              key: 'labels',
              header: 'Labels',
              align: 'center',
              headerClassName: 'text-brand-300',
              render: (row) => (
                <button
                  type="button"
                  onClick={() => downloadLabelCsv(row)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-ink transition hover:bg-slate-100"
                  title={`Download CSV label for ${row.invoiceNumber}`}
                >
                  <Tag size={24} />
                  <span className="rounded border-2 border-ink px-1 py-0.5 text-[10px] font-black leading-none">
                    CSV
                  </span>
                </button>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              className: 'text-ink-soft',
              headerClassName: 'text-brand-300',
              render: (row) => `Rs. ${row.amount || 0}`,
            },
          ]}
        />
      </div>
    </div>
  )
}
