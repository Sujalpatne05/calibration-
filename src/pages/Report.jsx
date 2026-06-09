import { useState, useRef } from 'react'
import { FileText, ClipboardCheck, Download, Printer, Search, X } from 'lucide-react'
import SancLogo from '../components/SancLogo'
import CalibrationCertificate from '../components/CalibrationCertificate'
import TestConformanceCertificate from '../components/TestConformanceCertificate'
import { calibrationCertificateData, testCertificateData, reportsList } from '../data/reports'
import Button from '../components/Button'

const TABS = [
  { id: 'calibration', label: 'Calibration Certificate', icon: ClipboardCheck },
  { id: 'test', label: 'Test & Conformance', icon: FileText },
]

export default function Report() {
  const [tab, setTab] = useState('calibration')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const printRef = useRef(null)

  // Filter reports based on search query and current tab
  const filteredReports = reportsList.filter(report => {
    const matchesTab = report.type === tab
    const matchesQuery = !searchQuery || 
      report.certificate_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.tc_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.instrument_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.item_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesQuery
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
    console.log('Element to capture:', element, 'Size:', element.offsetWidth, 'x', element.offsetHeight)

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const filename =
        tab === 'calibration'
          ? `calibration-certificate-${calibrationCertificateData.certificate_no}.pdf`
          : `test-certificate-${testCertificateData.tc_number}.pdf`

      // Capture the element - use element's actual dimensions
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: '#ffffff',
      })

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty after html2canvas')
        window.print()
        return
      }

      console.log('Canvas created:', canvas.width, 'x', canvas.height)

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const A4_W = 210
      const A4_H = 297

      // Calculate dimensions to fit A4 while maintaining aspect ratio
      const imgWidth = A4_W
      const imgHeight = (canvas.height / canvas.width) * imgWidth

      if (imgHeight > A4_H) {
        // Image is taller than one page - scale it down
        const scale = A4_H / imgHeight
        const w = imgWidth * scale
        const h = A4_H
        const x = (A4_W - w) / 2
        pdf.addImage(imgData, 'JPEG', x, 0, w, h)
      } else {
        // Image fits on one page
        const x = (A4_W - imgWidth) / 2
        pdf.addImage(imgData, 'JPEG', x, 0, imgWidth, imgHeight)
      }

      pdf.save(filename)
      console.log('PDF saved successfully')
    } catch (err) {
      console.error('PDF export failed:', err)
      window.print()
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <SancLogo size={52} />
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Certificates</h1>
            <p className="text-sm text-ink-faint">Generate &amp; export calibration and test certificates</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer size={18} /> Print
          </Button>
          <Button onClick={exportPdf}>
            <Download size={18} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id)
                setSelectedReport(null)
                setSearchQuery('')
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-brand-600 text-white shadow-ring'
                  : 'bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 ring-1 ring-slate-200 focus-within:ring-brand-600 focus-within:ring-2">
            <Search size={18} className="text-ink-faint" />
            <input
              type="text"
              placeholder={`Search by certificate number, customer name, or ${tab === 'calibration' ? 'instrument' : 'item'}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(true)
              }}
              onFocus={() => setShowSearchResults(true)}
              className="flex-1 bg-transparent outline-none text-ink placeholder-ink-faint"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                }}
                className="text-ink-faint hover:text-ink"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery && filteredReports.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg ring-1 ring-slate-200 z-10 max-h-80 overflow-y-auto">
              {filteredReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => handleSelectReport(report)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold text-ink">
                      {report.certificate_no || report.tc_number}
                    </div>
                    <div className="text-sm text-ink-faint">{report.customer_name}</div>
                    {report.instrument_name && (
                      <div className="text-xs text-ink-faint">{report.instrument_name}</div>
                    )}
                    {report.item_name && (
                      <div className="text-xs text-ink-faint">{report.item_name}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSearchResults && searchQuery && filteredReports.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg ring-1 ring-slate-200 z-10 p-4 text-center text-ink-faint">
              No reports found matching your search.
            </div>
          )}
        </div>

        {/* Selected Report Info */}
        {selectedReport && (
          <div className="mt-4 p-3 bg-brand-50 rounded-lg border border-brand-200 flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-semibold text-brand-900">
                {selectedReport.certificate_no || selectedReport.tc_number}
              </div>
              <div className="text-xs text-brand-700 mt-1">{selectedReport.customer_name}</div>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-brand-600 hover:text-brand-900 p-1"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Certificate preview — scrollable container with grey background */}
      <div className="overflow-x-auto rounded-2xl bg-slate-200/60 p-4">
        <div ref={printRef}>
          {tab === 'calibration' ? (
            <CalibrationCertificate {...calibrationCertificateData} />
          ) : (
            <TestConformanceCertificate {...testCertificateData} />
          )}
        </div>
      </div>
    </div>
  )
}
