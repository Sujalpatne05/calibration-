import { useState, useRef, useEffect } from 'react'
import { FileText, ClipboardCheck, Download, Printer, Search, X, PencilLine, Plus, Trash2 } from 'lucide-react'
import SancLogo from '../components/SancLogo'
import CalibrationCertificate from '../components/CalibrationCertificate'
import TestConformanceCertificate from '../components/TestConformanceCertificate'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import { reportsAPI } from '../services/api'

const TABS = [
  { id: 'calibration', label: 'Calibration Certificate', icon: ClipboardCheck },
  { id: 'test', label: 'Test & Conformance', icon: FileText },
]

const TABLE_TYPE_OPTIONS = [
  { value: 'gauge', label: 'Gauge' },
  { value: 'transmitter', label: 'Transmitter' },
  { value: 'switch', label: 'Switch' },
  { value: 'humidityTemperature', label: 'Humidity Temperature' },
  { value: 'humidityHumidity', label: 'Humidity Humidity' },
]

const DUMMY_REPORT_OPTIONS = [
  { value: 'gauge', label: 'Gauge' },
  { value: 'transmitter', label: 'Transmitter' },
  { value: 'switch', label: 'Switch' },
  { value: 'humidity', label: 'Humidity' },
]

function buildCertificatePdfFilename(report, type) {
  const prefix = type === 'test' ? 'SANC-TC' : 'SANC-CC'
  const certificateNumber = type === 'test'
    ? report?.tcNumber || report?.certificateNo || 'certificate'
    : report?.certificateNo || report?.tcNumber || 'certificate'
  const cleanCertificateNumber = String(certificateNumber)
    .replace(new RegExp(`^${prefix}-`, 'i'), '')
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/^-+|-+$/g, '')

  return `${prefix}-${cleanCertificateNumber || 'certificate'}`
}

const numberValue = (value) => {
  if (value === undefined || value === null || value === '') return null
  const numeric = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(numeric) ? numeric : null
}

const formatNumber = (value) => {
  const numeric = numberValue(value)
  if (numeric === null) return String(value ?? '')
  return numeric.toFixed(4).replace(/\.?0+$/, '')
}

const parseJsonValue = (value) => {
  if (!value || typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const parseRange = (range) => {
  const matches =
    String(range ?? '')
      .replace(/(\d)\s*-\s*(\d)/g, '$1 $2')
      .match(/-?\d+(?:\.\d+)?/g) || []
  const values = matches.map(Number)
  const unit = String(range ?? '').replace(/[-\d.,\s]+/g, '').trim()
  return {
    start: values.length ? values[0] : 0,
    end: values.length ? Math.max(...values) : null,
    unit,
  }
}

const tableTypeForReport = (report, payload) => {
  const raw = [
    payload?.tableType,
    report?.instrument?.category,
    report?.instrumentName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (raw.includes('humidity')) return 'humidity'
  if (raw.includes('switch')) return 'switch'
  if (raw.includes('transmitter')) return 'transmitter'
  if (raw.includes('gauge')) return 'gauge'
  return 'gauge'
}

const fallbackRangeEnd = (type) =>
  type === 'transmitter'
    ? 750
    : type === 'humidity'
      ? 100
      : type === 'switch'
        ? 20
        : 60

const defaultPoints = (type, start, end) => {
  const resolvedEnd = end && end > start ? end : fallbackRangeEnd(type)
  if (type === 'transmitter' && start === 0 && resolvedEnd === 750) {
    return [0, 175, 375, 550, 750]
  }
  const count = type === 'gauge' ? 7 : type === 'switch' ? 3 : 5
  const step = (resolvedEnd - start) / (count - 1)
  return Array.from({ length: count }, (_, index) => start + step * index)
}

const EXCEL_SAMPLE_ROWS = {
  gauge: [
    { set: '0', up: '0', down: '0' },
    { set: '10', up: '10.05', down: '10.03' },
    { set: '20', up: '20.04', down: '20.02' },
    { set: '30', up: '30.1', down: '30.2' },
    { set: '40', up: '40.3', down: '40.2' },
    { set: '50', up: '50.2', down: '50.3' },
    { set: '60', up: '59.9', down: '59.9' },
  ],
  transmitter: [
    { set: '0', up: '4.1', down: '4.1' },
    { set: '175', up: '7.9', down: '7.9' },
    { set: '375', up: '12.15', down: '12.15' },
    { set: '550', up: '15.85', down: '15.85' },
    { set: '750', up: '20', down: '20' },
  ],
  switch: [
    { set: '0', up: '0', down: '0' },
    { set: '10', up: '10.05', down: '10.03' },
    { set: '20', up: '20.04', down: '20.02' },
  ],
  humidityTemperature: [
    { set: '0', up: '0.1', down: '0.2' },
    { set: '25', up: '7.9', down: '7.9' },
    { set: '50', up: '12.15', down: '12.15' },
    { set: '75', up: '15.85', down: '15.85' },
    { set: '100', up: '20', down: '20' },
  ],
  humidityHumidity: [
    { set: '0', up: '0.1', down: '0.2' },
    { set: '25', up: '7.9', down: '7.9' },
    { set: '50', up: '12.15', down: '12.15' },
    { set: '75', up: '15.85', down: '15.85' },
    { set: '100', up: '20', down: '20' },
  ],
}

const normalizeReadingEditorSections = (report) => {
  const payload = parseJsonValue(report?.readings)
  const range = parseRange(report?.instrumentRange)

  if (payload?.sections?.length) {
    return payload.sections.map((section) => ({
      title: section.title || section.tableType || 'Readings',
      tableType: section.tableType || section.type || 'gauge',
      unit: section.unit || payload.unit || range.unit,
      highestRange: section.highestRange || payload.highestRange || range.end || '',
      rows: (section.rows || []).map((row, index) => ({
        sr: index + 1,
        set: formatNumber(row.set ?? row.master ?? row.calibrationPoint),
        up: formatNumber(row.up ?? row.standardUp ?? row.switchingUp),
        down: formatNumber(row.down ?? row.standardDown ?? row.switchingDown),
        unc: row.unc ?? row.uncertainty ?? payload.uncertainty ?? '',
      })),
    }))
  }

  const type = tableTypeForReport(report, payload)
  const existingRows = Array.isArray(payload) ? payload : payload?.rows || []
  const points = existingRows.length
    ? existingRows.map((row) => row.set ?? row.master ?? row.calibrationPoint)
    : defaultPoints(type, range.start, payload?.highestRange || range.end)

  if (type === 'humidity') {
    const baseRows = points.map((point, index) => {
      const source = existingRows[index] || {}
      return {
        sr: index + 1,
        set: formatNumber(point),
        up: formatNumber(source.up ?? source.standardUp ?? source.switchingUp),
        down: formatNumber(source.down ?? source.standardDown ?? source.switchingDown),
        unc: source.unc ?? source.uncertainty ?? payload?.uncertainty ?? report?.instrumentAccuracy ?? '',
      }
    })

    return [
      {
        title: 'Humidity Transmitter - Temperature',
        tableType: 'humidityTemperature',
        unit: '\u00b0C',
        highestRange: payload?.highestRange || range.end || 100,
        rows: baseRows,
      },
      {
        title: 'Humidity Transmitter - Humidity',
        tableType: 'humidityHumidity',
        unit: '%RH',
        highestRange: payload?.highestRange || range.end || 100,
        rows: baseRows,
      },
    ]
  }

  return [
    {
      title: type === 'transmitter' ? 'Transmitter' : type === 'switch' ? 'Switch' : type === 'humidity' ? 'Humidity' : 'Gauge',
      tableType: type,
      unit: payload?.unit || range.unit || '',
      highestRange: payload?.highestRange || range.end || fallbackRangeEnd(type),
      rows: points.map((point, index) => {
        const source = existingRows[index] || {}
        return {
          sr: index + 1,
          set: formatNumber(point),
          up: formatNumber(source.up ?? source.standardUp ?? source.switchingUp),
          down: formatNumber(source.down ?? source.standardDown ?? source.switchingDown),
          unc: source.unc ?? source.uncertainty ?? payload?.uncertainty ?? report?.instrumentAccuracy ?? '',
        }
      }),
    },
  ]
}

export default function Report() {
  const [tab, setTab] = useState('calibration')
  const initialSearchQuery = new URLSearchParams(window.location.search).get('search') || ''
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showSearchResults, setShowSearchResults] = useState(Boolean(initialSearchQuery))
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [readingModalOpen, setReadingModalOpen] = useState(false)
  const [readingSections, setReadingSections] = useState([])
  const [dummyCase, setDummyCase] = useState('gauge')
  const printRef = useRef(null)

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchReports(searchQuery)
    }, searchQuery ? 250 : 0)

    return () => clearTimeout(handle)
  }, [tab, searchQuery])

  const fetchReports = async (search = '') => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportsAPI.getAll(tab, search, search ? 100 : 50)
      setReports(data)
    } catch (err) {
      setError('Failed to fetch reports')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports

  const handleSelectReport = (report) => {
    setSelectedReport(report)
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const handleClearSelection = () => {
    setSelectedReport(null)
    setSearchQuery('')
  }

  const loadDummyReport = async () => {
    try {
      setLoading(true)
      setError(null)
      const report =
        tab === 'test'
          ? await reportsAPI.getDummyTest()
          : await reportsAPI.getDummyCalibration(dummyCase)
      setSelectedReport(report)
      setShowSearchResults(false)
      setSearchQuery('')
    } catch (err) {
      setError('Failed to load dummy report')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openReadingsEditor = () => {
    setReadingSections(normalizeReadingEditorSections(selectedReport))
    setReadingModalOpen(true)
  }

  const updateReadingRow = (sectionIndex, rowIndex, patch) => {
    setReadingSections((sections) =>
      sections.map((section, sIndex) =>
        sIndex === sectionIndex
          ? {
              ...section,
              rows: section.rows.map((row, rIndex) =>
                rIndex === rowIndex ? { ...row, ...patch } : row
              ),
            }
          : section
      )
    )
  }

  const loadExcelSample = (sectionIndex) => {
    setReadingSections((sections) =>
      sections.map((section, index) => {
        if (index !== sectionIndex) return section
        const rows = EXCEL_SAMPLE_ROWS[section.tableType] || EXCEL_SAMPLE_ROWS.gauge
        const highestRange =
          section.tableType === 'transmitter'
            ? '750'
            : section.tableType?.startsWith('humidity')
              ? '100'
              : section.tableType === 'switch'
                ? '20'
                : '60'

        return {
          ...section,
          highestRange,
          rows: rows.map((row, rowIndex) => ({
            sr: rowIndex + 1,
            set: row.set,
            up: row.up,
            down: row.down,
            unc: section.rows[rowIndex]?.unc ?? selectedReport?.instrumentAccuracy ?? '',
          })),
        }
      })
    )
  }

  const addReadingRow = (sectionIndex) => {
    setReadingSections((sections) =>
      sections.map((section, index) => {
        if (index !== sectionIndex) return section
        const last = section.rows[section.rows.length - 1]
        const previous = section.rows[section.rows.length - 2]
        const lastSet = numberValue(last?.set)
        const previousSet = numberValue(previous?.set)
        const step =
          lastSet !== null && previousSet !== null && lastSet !== previousSet
            ? lastSet - previousSet
            : 1
        const nextSet = lastSet !== null ? formatNumber(lastSet + step) : ''

        return {
          ...section,
          rows: [
            ...section.rows,
            {
              sr: section.rows.length + 1,
              set: nextSet,
              up: '',
              down: '',
              unc: last?.unc ?? selectedReport?.instrumentAccuracy ?? '',
            },
          ],
        }
      })
    )
  }

  const removeReadingRow = (sectionIndex, rowIndex) => {
    setReadingSections((sections) =>
      sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              rows: section.rows
                .filter((_, currentIndex) => currentIndex !== rowIndex)
                .map((row, nextIndex) => ({ ...row, sr: nextIndex + 1 })),
            }
          : section
      )
    )
  }

  const saveReadings = async () => {
    if (!selectedReport) return

    const payload = readingSections.length > 1
      ? {
          tableType: 'humidity',
          sections: readingSections.map((section) => ({
            tableType: section.tableType,
            title: section.title,
            unit: section.unit,
            highestRange: numberValue(section.highestRange),
            rows: section.rows.map((row) => ({
              set: row.set,
              master: row.set,
              unit: section.unit,
              up: row.up,
              down: row.down,
              unc: row.unc,
            })),
          })),
        }
      : {
          tableType: readingSections[0]?.tableType || 'gauge',
          unit: readingSections[0]?.unit || '',
          highestRange: numberValue(readingSections[0]?.highestRange),
          rows: (readingSections[0]?.rows || []).map((row) => ({
            set: row.set,
            master: row.set,
            unit: readingSections[0]?.unit || '',
            up: row.up,
            down: row.down,
            unc: row.unc,
          })),
        }

    if (String(selectedReport.id).startsWith('dummy-')) {
      const updated = {
        ...selectedReport,
        readings: JSON.stringify(payload),
      }

      setSelectedReport(updated)
      setReadingModalOpen(false)
      return
    }

    try {
      setLoading(true)
      const updated = await reportsAPI.update(selectedReport.id, {
        readings: JSON.stringify(payload),
      })
      setSelectedReport(updated)
      setReports((items) => items.map((item) => (item.id === updated.id ? updated : item)))
      setReadingModalOpen(false)
    } catch (err) {
      alert('Failed to save readings')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function exportPdf() {
    const wrapper = printRef.current
    if (!wrapper) {
      console.error('No wrapper ref found')
      return
    }

    const element = wrapper.firstElementChild || wrapper
    let exportHost = null

    try {
      document.body.classList.add('pdf-export-mode')
      wrapper.scrollLeft = 0
      wrapper.scrollTop = 0

      exportHost = document.createElement('div')
      exportHost.className = 'pdf-export-host'
      const exportElement = element.cloneNode(true)
      exportHost.appendChild(exportElement)
      document.body.appendChild(exportHost)

      await new Promise((resolve) => requestAnimationFrame(resolve))
      await document.fonts?.ready

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(exportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: exportElement.scrollWidth,
        height: exportElement.scrollHeight,
        windowWidth: Math.max(exportElement.scrollWidth, 1200),
        windowHeight: exportElement.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)

      const filename = buildCertificatePdfFilename(selectedReport, tab)
      pdf.save(`${filename}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF')
    } finally {
      exportHost?.remove()
      document.body.classList.remove('pdf-export-mode')
    }
  }

  function printReport() {
    document.body.classList.add('pdf-export-mode')

    const cleanup = () => {
      document.body.classList.remove('pdf-export-mode')
      window.removeEventListener('afterprint', cleanup)
    }

    window.addEventListener('afterprint', cleanup)
    requestAnimationFrame(() => {
      window.print()
      setTimeout(cleanup, 1000)
    })
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

          <div className="mb-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
              Dummy API Test
            </p>
            <div className="flex gap-2">
              {tab === 'calibration' ? (
                <select
                  value={dummyCase}
                  onChange={(e) => setDummyCase(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  {DUMMY_REPORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink">
                  Test &amp; Conformance
                </div>
              )}
              <Button type="button" size="sm" onClick={loadDummyReport} disabled={loading}>
                Load
              </Button>
            </div>
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
                {tab === 'calibration' ? (
                  <Button onClick={openReadingsEditor} variant="secondary" size="sm">
                    <PencilLine size={16} /> Readings
                  </Button>
                ) : null}
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

            <Modal
              open={readingModalOpen}
              onClose={() => setReadingModalOpen(false)}
              title="Calibration Readings"
              maxWidth="max-w-5xl"
              footer={
                <Button className="w-full" onClick={saveReadings} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Readings'}
                </Button>
              }
            >
              <div className="space-y-5">
                {readingSections.map((section, sectionIndex) => (
                  <div key={`${section.tableType}-${sectionIndex}`} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">
                        {section.title || 'Readings'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => loadExcelSample(sectionIndex)}
                        >
                          <PencilLine size={16} /> Load Excel Sample
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => addReadingRow(sectionIndex)}
                        >
                          <Plus size={16} /> Row
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                          Table Type
                        </label>
                        <select
                          value={section.tableType}
                          onChange={(e) =>
                            setReadingSections((sections) =>
                              sections.map((item, index) =>
                                index === sectionIndex
                                  ? {
                                      ...item,
                                      tableType: e.target.value,
                                      title:
                                        TABLE_TYPE_OPTIONS.find(
                                          (option) => option.value === e.target.value
                                        )?.label ?? item.title,
                                    }
                                  : item
                              )
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                        >
                          {TABLE_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <FormInput
                        label="Unit"
                        value={section.unit}
                        onChange={(e) =>
                          setReadingSections((sections) =>
                            sections.map((item, index) =>
                              index === sectionIndex
                                ? { ...item, unit: e.target.value }
                                : item
                            )
                          )
                        }
                      />
                      <FormInput
                        label="Highest Range"
                        value={section.highestRange}
                        onChange={(e) =>
                          setReadingSections((sections) =>
                            sections.map((item, index) =>
                              index === sectionIndex
                                ? { ...item, highestRange: e.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </div>

                    <div className="overflow-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase text-ink-faint">
                          <tr>
                            <th className="px-3 py-2">Sr.</th>
                            <th className="px-3 py-2">Master / Point</th>
                            <th className="px-3 py-2">Up</th>
                            <th className="px-3 py-2">Down</th>
                            <th className="px-3 py-2">Uncertainty</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t border-slate-100">
                              <td className="px-3 py-2 text-ink-faint">{rowIndex + 1}</td>
                              {['set', 'up', 'down', 'unc'].map((key) => (
                                <td className="px-3 py-2" key={key}>
                                  <input
                                    value={row[key] ?? ''}
                                    onChange={(e) =>
                                      updateReadingRow(sectionIndex, rowIndex, {
                                        [key]: e.target.value,
                                      })
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                                  />
                                </td>
                              ))}
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeReadingRow(sectionIndex, rowIndex)}
                                  className="inline-flex rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                                  aria-label="Remove row"
                                  disabled={section.rows.length <= 1}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </Modal>
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
