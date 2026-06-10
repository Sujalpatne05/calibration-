import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, FolderClosed, FileText, Tag, Eye } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import DateRangeFilter from '../components/DateRangeFilter'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import { invoicesAPI } from '../services/api'

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 p-2.5">
            <FileText size={24} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Invoices</h1>
            <p className="text-sm text-ink-faint">Calibration invoices and reports</p>
          </div>
        </div>
        <Button onClick={exportCsv} variant="secondary">
          <Download size={18} /> Export CSV
        </Button>
      </div>

      {error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}

      {/* Filters */}
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Invoice or customer"
            className="lg:col-span-2"
          />
          <DateRangeFilter
            from={from}
            to={to}
            onChangeFrom={setFrom}
            onChangeTo={setTo}
            onApply={handleApplyFilter}
          />
        </div>
      </div>

      {/* Data table */}
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
        <h2 className="mb-6 font-display text-lg font-semibold text-ink">All Invoices</h2>

        <DataTable
          rowKey={(r) => r.id}
          data={invoices}
          emptyMessage={loading ? 'Loading...' : 'No invoices found.'}
          columns={[
            {
              key: 'sr',
              header: 'Sr',
              render: (_, i) => i + 1,
              className: 'text-ink-faint w-12',
            },
            {
              key: 'invoiceNumber',
              header: 'Invoice Number',
              className: 'font-medium',
            },
            {
              key: 'issueDate',
              header: 'Date',
              render: (r) => fmtDate(r.issueDate),
              className: 'text-ink-soft',
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <StatusBadge status={r.status} />
              ),
            },
            {
              key: 'customer',
              header: 'Customer',
              render: (r) => r.customer?.name || 'N/A',
              className: 'text-ink-soft max-w-sm',
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (r) => `₹${r.amount || 0}`,
            },
          ]}
        />
      </div>
    </div>
  )
}
