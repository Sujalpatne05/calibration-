import { useState, useRef, useEffect } from 'react'
import { FileText, ClipboardCheck, Download, Printer, Search, X } from 'lucide-react'
import SancLogo from '../components/SancLogo'
import CalibrationCertificate from '../components/CalibrationCertificate'
import TestConformanceCertificate from '../components/TestConformanceCertificate'
import Button from '../components/Button'
import { reportsAPI } from '../services/api'

const TABS = [
  { id: 'calibration', label: 'Calibration Certificate', icon: ClipboardCheck },
  { id: 'test', label: 'Test & Conformance', icon: FileText },
]

export default function Report() {
  const [tab, setTab] = useState('calibration')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const printRef = useRef(null)

  // Fetch reports on mount
  useEffect(() => {
    fetchReports()
  }, [tab])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportsAPI.getAll(tab)
      setReports(data)
    } catch (err) {
      setError('Failed to fetch reports')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Filter reports based on search query
  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      report.certificateNo?.toLowerCase().includes(q) ||
      report.tcNumber?.toLowerCase().includes(q) ||
      report.customer?.name?.toLowerCase().includes(q) ||
      report.instrumentName?.toLowerCase().includes(q)
    )
  })

  const handleSelectReport = (report) => {
    setSelectedReport(report)
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const handleClearSelection = () => {
    setSelectedReport(null)
    setSearchQuery('')
  }

  async function exportPdf() {
    const wrapper = printRef.current
    if (!wrapper) {
      console.error('No wrapper ref found')
      return
    }

    const element = wrapper.firstElementChild || wrapper

    try {
      document.body.classList.add('pdf-export-mode')
      wrapper.scrollLeft = 0
      wrapper.scrollTop = 0

      await new Promise((resolve) => requestAnimationFrame(resolve))

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: Math.max(element.scrollWidth, 1200),
        windowHeight: element.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)

      const filename = selectedReport.certificateNo || selectedReport.tcNumber || 'certificate'
      pdf.save(`${filename}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF')
    } finally {
      document.body.classList.remove('pdf-export-mode')
    }
  }

  function printReport() {
    window.print()
  }

  const certificateData = selectedReport ? {
    ...selectedReport,
    customer_name: selectedReport.customer?.name,
    customer_address: selectedReport.customer?.address,
    customer_contact: selectedReport.customer?.phone,
    po_number: selectedReport.poNumber,
    tc_number: selectedReport.tcNumber,
    tc_date: selectedReport.tcDate ? new Date(selectedReport.tcDate).toLocaleDateString('en-GB') : '',
    items: selectedReport.items ? JSON.parse(selectedReport.items) : [],
    note: selectedReport.notes,
    legal: selectedReport.legalDisclaimer,
  } : null

  return (
    <div className="report-page grid min-h-screen gap-6 lg:grid-cols-3">
      {/* Sidebar - Search */}
      <div className="report-search-panel lg:col-span-1">
        <div className="sticky top-0 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Search Reports</h2>

          {/* Tabs */}
          <div className="mb-4 flex gap-2">
            {TABS.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id)
                    setSelectedReport(null)
                  }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === t.id
                      ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200'
                      : 'bg-slate-50 text-ink-faint hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={16} className="text-ink-faint" />
            </div>
            <input
              type="text"
              placeholder="Certificate no, TC no, customer..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(true)
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Search Results */}
          {showSearchResults && searchQuery && (
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
              {loading ? (
                <div className="py-2 text-center text-sm text-ink-faint">Loading...</div>
              ) : filteredReports.length === 0 ? (
                <div className="py-2 text-center text-sm text-ink-faint">No reports found</div>
              ) : (
                filteredReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => handleSelectReport(report)}
                    className="w-full rounded-lg bg-white p-2 text-left text-sm hover:bg-slate-100"
                  >
                    <p className="font-medium text-ink">{report.certificateNo || report.tcNumber}</p>
                    <p className="text-xs text-ink-faint">{report.customer?.name}</p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Recent Reports */}
          {!showSearchResults && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-ink-faint">Recent</p>
              {loading ? (
                <div className="text-sm text-ink-faint">Loading...</div>
              ) : reports.length === 0 ? (
                <div className="text-sm text-ink-faint">No reports available</div>
              ) : (
                reports.slice(0, 5).map((report) => (
                  <button
                    key={report.id}
                    onClick={() => handleSelectReport(report)}
                    className="w-full rounded-lg bg-slate-50 p-2 text-left text-sm hover:bg-slate-100"
                  >
                    <p className="font-medium text-ink">{report.certificateNo || report.tcNumber}</p>
                    <p className="text-xs text-ink-faint">{report.customer?.name}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Certificate Display */}
      <div className="report-main-panel lg:col-span-2">
        {selectedReport ? (
          <div className="report-card rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
            {/* Toolbar */}
            <div className="report-toolbar flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  {selectedReport.certificateNo || selectedReport.tcNumber}
                </h2>
                <p className="text-sm text-ink-faint">{selectedReport.customer?.name}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={printReport} variant="secondary" size="sm">
                  <Printer size={16} /> Print
                </Button>
                <Button onClick={exportPdf} variant="secondary" size="sm">
                  <Download size={16} /> PDF
                </Button>
                <button
                  onClick={handleClearSelection}
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Certificate */}
            <div className="report-print-area overflow-auto p-6" ref={printRef}>
              {tab === 'calibration' && certificateData ? (
                <CalibrationCertificate data={certificateData} />
              ) : tab === 'test' && certificateData ? (
                <TestConformanceCertificate data={certificateData} />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl bg-white p-12 shadow-card ring-1 ring-slate-100">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <FileText size={32} className="text-ink-faint" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-ink">No Report Selected</h3>
              <p className="text-sm text-ink-faint">Search and select a report to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
