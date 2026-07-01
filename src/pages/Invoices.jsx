import { useState, useEffect } from 'react'
import * as ReactDOMServer from 'react-dom/server'
import { useNavigate } from 'react-router-dom'
import { Calendar, Download, FileArchive, FolderClosed, Search, Tag, X, RefreshCw } from 'lucide-react'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import CalibrationCertificate from '../components/CalibrationCertificate'
import TestConformanceCertificate from '../components/TestConformanceCertificate'
import { invoicesAPI, reportsAPI } from '../services/api'

const fmtDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
const ITEMS_PER_PAGE = 10

const safeFileName = (value, fallback = 'file') =>
  String(value || fallback)
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/^-+|-+$/g, '') || fallback

const buildCertificatePdfFilename = (report) => {
  const prefix = report?.type === 'test' ? 'SANC-TC' : 'SANC-CC'
  const certificateNumber = report?.type === 'test'
    ? report?.tcNumber || report?.certificateNo
    : report?.certificateNo || report?.tcNumber

  return `${prefix}-${safeFileName(String(certificateNumber || 'certificate').replace(new RegExp(`^${prefix}-`, 'i'), ''), 'certificate')}`
}

const collectDocumentStyles = () =>
  Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join('\n')
      } catch {
        return ''
      }
    })
    .filter(Boolean)
    .join('\n')

const downloadTextFile = (filename, content, type) => {
  const blob = new Blob([content], { type })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const parseItems = (value) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'string') return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getCertificateStatus = (invoice) => {
  const reports = Array.isArray(invoice?.reports) ? invoice.reports : []
  const testReports = reports.filter((report) => report.type === 'test')
  const calibrationReports = reports.filter((report) => report.type === 'calibration')
  const testItems = testReports.flatMap((report) => parseItems(report.items))
  const totalItems = Math.max(testItems.length, calibrationReports.length, 1)
  const calibrationDone = Math.min(calibrationReports.length, totalItems)
  const testDone = testReports.length > 0
  const allDone = calibrationDone >= totalItems && testDone

  return {
    totalItems,
    calibrationDone,
    testDone,
    allDone,
    label: allDone ? 'Done' : 'Pending',
  }
}

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

const crc32 = (bytes) => {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const uint16 = (value) => [value & 0xff, (value >>> 8) & 0xff]
const uint32 = (value) => [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]

const dosDateTime = (date = new Date()) => {
  const time = ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1f)
  const year = Math.max(date.getFullYear(), 1980)
  const day = ((year - 1980) << 9) | (((date.getMonth() + 1) & 0xf) << 5) | (date.getDate() & 0x1f)
  return { time, day }
}

const createZipBlob = async (files) => {
  const encoder = new TextEncoder()
  const chunks = []
  const central = []
  let offset = 0
  const stamp = dosDateTime()

  for (const file of files) {
    const nameBytes = encoder.encode(file.name)
    const data = new Uint8Array(await file.blob.arrayBuffer())
    const crc = crc32(data)
    const localHeader = new Uint8Array([
      ...uint32(0x04034b50),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(stamp.time),
      ...uint16(stamp.day),
      ...uint32(crc),
      ...uint32(data.length),
      ...uint32(data.length),
      ...uint16(nameBytes.length),
      ...uint16(0),
    ])

    chunks.push(localHeader, nameBytes, data)
    central.push({ nameBytes, crc, size: data.length, offset })
    offset += localHeader.length + nameBytes.length + data.length
  }

  const centralStart = offset
  for (const file of central) {
    const header = new Uint8Array([
      ...uint32(0x02014b50),
      ...uint16(20),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(stamp.time),
      ...uint16(stamp.day),
      ...uint32(file.crc),
      ...uint32(file.size),
      ...uint32(file.size),
      ...uint16(file.nameBytes.length),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(0),
      ...uint32(file.offset),
    ])
    chunks.push(header, file.nameBytes)
    offset += header.length + file.nameBytes.length
  }

  const centralSize = offset - centralStart
  chunks.push(new Uint8Array([
    ...uint32(0x06054b50),
    ...uint16(0),
    ...uint16(0),
    ...uint16(files.length),
    ...uint16(files.length),
    ...uint32(centralSize),
    ...uint32(centralStart),
    ...uint16(0),
  ]))

  return new Blob(chunks, { type: 'application/zip' })
}

const buildReportData = (invoice, report) => ({
  ...report,
  customer: report.customer || invoice.customer,
  invoice: {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
  },
  customer_name: report.customer?.name || invoice.customer?.name,
  customer_address: report.customer?.address || invoice.customer?.address,
  customer_contact: report.customer?.phone || invoice.customer?.phone,
  po_number: report.poNumber,
  tc_number: report.tcNumber,
  tc_date: report.invoice?.issueDate || report.tcDate || invoice.issueDate,
  items: parseItems(report.items),
  note: report.notes,
  legal: report.legalDisclaimer,
})

const renderReportHtml = (invoice, report) => {
  const data = buildReportData(invoice, report)
  const component = report.type === 'calibration'
    ? <CalibrationCertificate data={data} />
    : <TestConformanceCertificate data={data} />
  const markup = ReactDOMServer.renderToStaticMarkup(component)

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <base href="${window.location.origin}/" />
  <style>${collectDocumentStyles()}</style>
</head>
<body class="pdf-export-mode">
  <div class="report-print-area">${markup}</div>
</body>
</html>`
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
  const [currentPage, setCurrentPage] = useState(1)
  const [certificateModalOpen, setCertificateModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [archivingId, setArchivingId] = useState(null)

  // Calculate pagination
  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedInvoices = invoices.slice(startIndex, endIndex)

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [query, applied])

  // Load search query from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const searchParam = params.get('search')
    if (searchParam) {
      setQuery(searchParam)
    }
  }, [])

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
    // Open modal instead of navigating
    setSelectedInvoice(row)
    setCertificateModalOpen(true)
  }

  const downloadLabelCsv = (row) => {
    const headers = ['Invoice Number', 'Customer', 'Date', 'Status']
    const values = [
      row.invoiceNumber,
      row.customer?.name || '',
      fmtDate(row.issueDate),
      row.status || '',
    ]
    const csv = `${headers.map(csvEscape).join(',')}\n${values.map(csvEscape).join(',')}\n`

    downloadTextFile(
      `${String(row.invoiceNumber || 'invoice').replace(/[<>:"/\\|?*]+/g, '-')}-label.csv`,
      csv,
      'text/csv;charset=utf-8;'
    )
  }

  const downloadArchive = async (row) => {
    const reports = Array.isArray(row.reports) ? row.reports : []
    const archiveReports = reports.filter((report) => report.type === 'calibration' || report.type === 'test')

    if (!archiveReports.length) {
      alert('No generated calibration or test certificates found for this invoice.')
      return
    }

    try {
      setArchivingId(row.id)
      const files = []

      for (const report of archiveReports) {
        const filename = buildCertificatePdfFilename(report)
        const html = renderReportHtml(row, report)
        const blob = await reportsAPI.renderPdf({ html, filename })
        files.push({ name: `${filename}.pdf`, blob })
      }

      const zip = await createZipBlob(files)
      downloadBlob(zip, `${safeFileName(row.invoiceNumber, 'invoice')}-certificates.zip`)
    } catch (err) {
      alert(err?.message || 'Failed to download certificate archive.')
      console.error(err)
    } finally {
      setArchivingId(null)
    }
  }

  const showClear = query || from || to || applied.from || applied.to
  const selectedStatus = selectedInvoice ? getCertificateStatus(selectedInvoice) : null

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
          data={paginatedInvoices}
          emptyMessage={loading ? 'Loading...' : 'No invoices found.'}
          columns={[
            {
              key: 'sr',
              header: 'Sr',
              render: (_, i) => startIndex + i + 1,
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
                  onClick={() => downloadArchive(row)}
                  disabled={archivingId === row.id}
                  className="inline-flex rounded-lg p-2 text-ink transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
                  title={`Download certificate ZIP for ${row.invoiceNumber}`}
                >
                  <FileArchive size={26} className={archivingId === row.id ? 'animate-pulse' : ''} />
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
          ]}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
            <div className="text-xs sm:text-sm text-ink-soft text-center sm:text-left">
              Showing <span className="font-medium text-ink">{startIndex + 1}</span> to{' '}
              <span className="font-medium text-ink">{Math.min(endIndex, invoices.length)}</span> of{' '}
              <span className="font-medium text-ink">{invoices.length}</span> invoices
            </div>
            <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const showPage = 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  
                  if (!showPage && (page === currentPage - 2 || page === currentPage + 2)) {
                    return <span key={page} className="px-1 sm:px-2 py-1.5 sm:py-2 text-ink-faint text-xs sm:text-sm">...</span>
                  }
                  
                  if (!showPage) return null
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[2rem] sm:min-w-[2.5rem] rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition ${
                        currentPage === page
                          ? 'bg-brand-500 text-white'
                          : 'border border-slate-300 text-ink hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Status Modal */}
      <Modal
        open={certificateModalOpen}
        onClose={() => {
          setCertificateModalOpen(false)
          setSelectedInvoice(null)
        }}
        title="Certificate Status"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-ink-soft">
                Items: {selectedStatus.totalItems}
              </p>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-4">
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-400">Instrument</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-400">Calibration Certificate</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-400">Testing Certificate</p>
              </div>
            </div>

            {/* Status Display */}
            <div className="grid grid-cols-3 gap-4 py-8 text-center">
              <div>
                <p className="text-lg font-bold text-slate-600">
                  {selectedStatus.calibrationDone}/{selectedStatus.totalItems}
                </p>
                <p className={`mt-2 text-sm ${selectedStatus.allDone ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {selectedStatus.label}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-600">
                  {selectedStatus.calibrationDone > 0 ? `${selectedStatus.calibrationDone}/${selectedStatus.totalItems}` : '-'}
                </p>
              </div>
              <div>
                <p className={`text-lg font-bold ${selectedStatus.testDone ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {selectedStatus.testDone ? 'Done' : 'Not Done'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchInvoices}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
