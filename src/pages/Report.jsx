import { useState, useRef, useEffect } from 'react'
import { FileText, ClipboardCheck, Download, Printer, Search, X, PencilLine, RefreshCw } from 'lucide-react'
import SancLogo from '../components/SancLogo'
import CalibrationCertificate from '../components/CalibrationCertificate'
import TestConformanceCertificate from '../components/TestConformanceCertificate'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import { erpnextAPI, reportsAPI } from '../services/api'

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

const REQUIRED_READING_ROWS = 4

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

const compactSpecs = (specs) => specs.filter((spec) => String(spec.value ?? '').trim())

const buildErpReportItems = (items = []) =>
  items.map((item, index) => ({
    sr: index + 1,
    name: item.itemName || item.description || item.itemCode || 'Instrument',
    qty: item.quantity || 1,
    specs: compactSpecs([
      { key: 'ITEM CODE', value: item.itemCode },
      { key: 'MAKE', value: item.make },
      { key: 'MODEL', value: item.model },
      { key: 'RANGE', value: item.range },
      { key: 'ACCURACY', value: item.accuracy },
      { key: 'SERIAL NO', value: item.serialNumber },
    ]),
  }))

const erpInvoiceToReport = (invoice) => ({
  id: `erp-${invoice.invoiceNumber || invoice.id || Date.now()}`,
  tcNumber: invoice.invoiceNumber || invoice.id || '',
  certificateNo: invoice.invoiceNumber || invoice.id || '',
  poNumber: invoice.poNumber || '',
  tcDate: invoice.invoiceDate || invoice.poDate || '',
  issueDate: invoice.invoiceDate || '',
  customer: {
    name: invoice.customerName || invoice.customer || '',
    address: invoice.customerAddress || '',
    phone: invoice.customerPhone || '',
    email: invoice.customerEmail || '',
  },
  invoice: {
    invoiceNumber: invoice.invoiceNumber || '',
    issueDate: invoice.invoiceDate || '',
  },
  items: JSON.stringify(buildErpReportItems(invoice.items || [])),
  notes: 'This is to certify that the material has been checked for Visual, Dimensional and Performance tests and found within accuracy.',
  legalDisclaimer:
    'We confirm the specifications and performance for a period of 12 months from the date of commissioning or 18 months from the date of dispatch, whichever is earlier, for manufacturing defects only. We reserve the right of repair or to replace the defective material in parts or in full depending upon the nature of the defect & observation. Furthermore, all warranties cease to apply if the instruction manual is not followed.',
  erpSource: invoice,
})

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

const erpListTitle = (record) =>
  record.invoice?.invoiceNumber || record.invoiceNumber || record.tcNumber || record.id || '-'

const erpListCustomer = (record) =>
  record.customer?.name || record.customerName || record.customer || '-'

const erpListQuantity = (record) => {
  if (record.totalQuantity) return record.totalQuantity
  const items = parseItems(record.items)
  const total = items.reduce((sum, item) => sum + (Number(item.qty ?? item.quantity) || 0), 0)
  return total || '-'
}

const reportItems = (record) => parseItems(record.items)

const uniqueReportKey = (record) =>
  String(record.invoice?.invoiceNumber || record.invoiceNumber || record.certificateNo || record.tcNumber || record.id)

const mergeUniqueReports = (...groups) => {
  const seen = new Set()
  return groups.flat().filter((record) => {
    const key = uniqueReportKey(record)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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
  const step = (resolvedEnd - start) / (REQUIRED_READING_ROWS - 1)
  return Array.from({ length: REQUIRED_READING_ROWS }, (_, index) => start + step * index)
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

const normalizeFourReadingRows = (rows = [], context = {}, report = {}) => {
  const normalized = rows.length >= REQUIRED_READING_ROWS
    ? Array.from({ length: REQUIRED_READING_ROWS }, (_, index) => {
        const sourceIndex =
          REQUIRED_READING_ROWS > 1
            ? Math.round((index / (REQUIRED_READING_ROWS - 1)) * (rows.length - 1))
            : 0
        return rows[Math.min(rows.length - 1, sourceIndex)]
      })
    : rows.slice()

  while (normalized.length < REQUIRED_READING_ROWS) {
    const last = normalized[normalized.length - 1]
    const previous = normalized[normalized.length - 2]
    const lastSet = numberValue(last?.set)
    const previousSet = numberValue(previous?.set)
    const step =
      lastSet !== null && previousSet !== null && lastSet !== previousSet
        ? lastSet - previousSet
        : 1
    const nextSet = lastSet !== null ? formatNumber(lastSet + step) : ''

    normalized.push({
      sr: normalized.length + 1,
      set: nextSet,
      up: '',
      down: '',
      unc: last?.unc ?? context.uncertainty ?? report?.instrumentAccuracy ?? '',
    })
  }

  return normalized.map((row, index) => ({ ...row, sr: index + 1 }))
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
      rows: normalizeFourReadingRows((section.rows || []).map((row, index) => ({
        sr: index + 1,
        set: formatNumber(row.set ?? row.master ?? row.calibrationPoint),
        up: formatNumber(row.up ?? row.standardUp ?? row.switchingUp),
        down: formatNumber(row.down ?? row.standardDown ?? row.switchingDown),
        unc: row.unc ?? row.uncertainty ?? payload.uncertainty ?? '',
      })), section, report),
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
        rows: normalizeFourReadingRows(baseRows, payload, report),
      },
      {
        title: 'Humidity Transmitter - Humidity',
        tableType: 'humidityHumidity',
        unit: '%RH',
        highestRange: payload?.highestRange || range.end || 100,
        rows: normalizeFourReadingRows(baseRows, payload, report),
      },
    ]
  }

  return [
    {
      title: type === 'transmitter' ? 'Transmitter' : type === 'switch' ? 'Switch' : type === 'humidity' ? 'Humidity' : 'Gauge',
      tableType: type,
      unit: payload?.unit || range.unit || '',
      highestRange: payload?.highestRange || range.end || fallbackRangeEnd(type),
      rows: normalizeFourReadingRows(points.map((point, index) => {
        const source = existingRows[index] || {}
        return {
          sr: index + 1,
          set: formatNumber(point),
          up: formatNumber(source.up ?? source.standardUp ?? source.switchingUp),
          down: formatNumber(source.down ?? source.standardDown ?? source.switchingDown),
          unc: source.unc ?? source.uncertainty ?? payload?.uncertainty ?? report?.instrumentAccuracy ?? '',
        }
      }), payload, report),
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
  const [erpInvoices, setErpInvoices] = useState([])
  const [testSourceQuery, setTestSourceQuery] = useState('')
  const [erpLoading, setErpLoading] = useState(false)
  const [erpError, setErpError] = useState('')
  const [calibrationSources, setCalibrationSources] = useState([])
  const [calibrationSourceId, setCalibrationSourceId] = useState('')
  const [calibrationSourceQuery, setCalibrationSourceQuery] = useState('')
  const [calibrationLoading, setCalibrationLoading] = useState(false)
  const [calibrationError, setCalibrationError] = useState('')
  const printRef = useRef(null)

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchReports(searchQuery)
    }, searchQuery ? 250 : 0)

    return () => clearTimeout(handle)
  }, [tab, searchQuery])

  useEffect(() => {
    if (tab === 'test') {
      fetchErpInvoices()
    } else if (tab === 'calibration') {
      fetchCalibrationSources()
    }
  }, [tab])

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
        const rows = (EXCEL_SAMPLE_ROWS[section.tableType] || EXCEL_SAMPLE_ROWS.gauge).slice(0, REQUIRED_READING_ROWS)
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
            rows: normalizeFourReadingRows(section.rows, section, selectedReport).map((row) => ({
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
          rows: normalizeFourReadingRows(readingSections[0]?.rows || [], readingSections[0], selectedReport).map((row) => ({
            set: row.set,
            master: row.set,
            unit: readingSections[0]?.unit || '',
            up: row.up,
            down: row.down,
            unc: row.unc,
          })),
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
      exportElement.style.width = '210mm'
      exportElement.style.height = '297mm'
      exportElement.style.minHeight = '297mm'
      exportElement.style.maxHeight = '297mm'
      exportElement.style.margin = '0'
      exportElement.style.transform = 'none'
      exportHost.appendChild(exportElement)
      document.body.appendChild(exportHost)

      await new Promise((resolve) => requestAnimationFrame(resolve))
      await document.fonts?.ready
      await Promise.all(
        Array.from(exportElement.querySelectorAll('img')).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        })
      )

      const filename = buildCertificatePdfFilename(selectedReport, tab)
      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <base href="${window.location.origin}/" />
  <style>${collectDocumentStyles()}</style>
</head>
<body class="pdf-export-mode">
  <div class="report-print-area">${exportElement.outerHTML}</div>
</body>
</html>`

      const blob = await reportsAPI.renderPdf({ html, filename })
      downloadBlob(blob, `${filename}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF')
    } finally {
      exportHost?.remove()
      document.body.classList.remove('pdf-export-mode')
    }
  }

  const fetchErpInvoices = async () => {
    try {
      setErpLoading(true)
      setErpError('')
      const data = await erpnextAPI.syncInvoices(50)
      setErpInvoices(data.reports || [])
      fetchReports(searchQuery)
    } catch (err) {
      setErpError('Failed to sync ERPNext invoices')
      console.error(err)
    } finally {
      setErpLoading(false)
    }
  }

  const handleSelectErpInvoice = (invoice) => {
    setTab('test')
    setSelectedReport(invoice.type === 'test' ? invoice : erpInvoiceToReport(invoice))
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const fetchCalibrationSources = async () => {
    try {
      setCalibrationLoading(true)
      setCalibrationError('')
      const sources = await erpnextAPI.getCalibrationSources()
      setCalibrationSources(sources)
      setCalibrationSourceId((current) =>
        current && sources.some((source) => String(source.id) === String(current)) ? current : ''
      )
    } catch (err) {
      setCalibrationError('Failed to load ERPNext PO data for calibration')
      console.error(err)
    } finally {
      setCalibrationLoading(false)
    }
  }

  const generateCalibrationFromItem = async (itemIndex) => {
    if (!calibrationSourceId) return

    try {
      setCalibrationLoading(true)
      setCalibrationError('')
      const report = await erpnextAPI.createCalibrationReport({
        sourceReportId: Number(calibrationSourceId),
        itemIndex,
      })
      setSelectedReport(report)
      setShowSearchResults(false)
      setSearchQuery('')
      fetchReports(searchQuery)
    } catch (err) {
      setCalibrationError(err?.message || 'Failed to generate calibration report')
      console.error(err)
    } finally {
      setCalibrationLoading(false)
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
    // Use invoice date if available, otherwise use tcDate
    tc_date: selectedReport.invoice?.issueDate 
      ? new Date(selectedReport.invoice.issueDate).toLocaleDateString('en-GB')
      : selectedReport.tcDate 
      ? new Date(selectedReport.tcDate).toLocaleDateString('en-GB') 
      : '',
    items: selectedReport.items ? JSON.parse(selectedReport.items) : [],
    note: selectedReport.notes,
    legal: selectedReport.legalDisclaimer,
  } : null
  const selectedCalibrationSource = calibrationSources.find(
    (source) => String(source.id) === String(calibrationSourceId)
  )
  const selectedCalibrationItems = reportItems(selectedCalibrationSource || {})
  const normalizedCalibrationQuery = calibrationSourceQuery.trim().toLowerCase()
  const combinedCalibrationSources = mergeUniqueReports(calibrationSources, reports)
  const filteredCalibrationSources = normalizedCalibrationQuery
    ? combinedCalibrationSources.filter((source) => {
        const itemText = reportItems(source)
          .map((item) =>
            [
              item.name,
              item.title,
              item.itemName,
              item.itemCode,
              item.code,
              ...(item.specs || []).map((spec) => `${spec.key} ${spec.value}`),
            ]
              .filter(Boolean)
              .join(' ')
          )
          .join(' ')

        return [
          source.invoice?.invoiceNumber,
          source.invoiceNumber,
          source.tcNumber,
          source.certificateNo,
          source.poNumber,
          source.customer?.name,
          source.instrument?.name,
          source.instrument?.model,
          source.instrument?.serial,
          itemText,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedCalibrationQuery)
      })
    : []
  const combinedTestSources = mergeUniqueReports(erpInvoices, reports)
  const normalizedTestQuery = testSourceQuery.trim().toLowerCase()
  const filteredTestSources = normalizedTestQuery
    ? combinedTestSources.filter((source) => {
        const itemText = reportItems(source)
          .map((item) =>
            [
              item.name,
              item.title,
              item.itemName,
              item.itemCode,
              item.code,
              ...(item.specs || []).map((spec) => `${spec.key} ${spec.value}`),
            ]
              .filter(Boolean)
              .join(' ')
          )
          .join(' ')

        return [
          source.invoice?.invoiceNumber,
          source.invoiceNumber,
          source.tcNumber,
          source.certificateNo,
          source.poNumber,
          source.customer?.name,
          source.customerName,
          itemText,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedTestQuery)
      })
    : []

  return (
    <div className="report-page w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 lg:grid lg:min-h-screen lg:gap-6 lg:grid-cols-3 lg:space-y-0">
      {/* Sidebar - Search */}
      <div className="report-search-panel lg:col-span-1 w-full max-w-full">
        <div className="sticky top-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-br from-white via-sky-50/70 to-indigo-50/60 p-4 sm:p-5 lg:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-500">
                  Reports
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-ink">Find Certificate</h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
                <Search size={18} />
              </div>
            </div>

          <div className="mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-white/80 p-1 shadow-inner ring-1 ring-slate-200/70">
            {TABS.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id)
                    setSelectedReport(null)
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                    tab === t.id
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-ink-faint hover:bg-white hover:text-ink'
                  }`}
                >
                  <Icon size={15} />
                  <span>{t.id === 'calibration' ? 'Calibration' : 'Test Certificate'}</span>
                </button>
              )
            })}
          </div>

          </div>

          <div className="p-4 sm:p-5 lg:p-6">
          {tab === 'calibration' && (
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/90 to-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">
                    ERPNext Calibration Source
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">ERPNext PO data and saved DB certificates combined</p>
                </div>
                <button
                  type="button"
                  onClick={fetchCalibrationSources}
                  disabled={calibrationLoading}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-brand-100 transition hover:bg-brand-50 disabled:opacity-50"
                  aria-label="Refresh ERPNext calibration sources"
                >
                  <RefreshCw size={15} className={calibrationLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {calibrationError ? (
                <div className="rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 ring-1 ring-red-100">
                  {calibrationError}
                </div>
              ) : null}

              {calibrationLoading && combinedCalibrationSources.length === 0 ? (
                <div className="rounded-lg bg-white/70 px-2.5 py-2 text-xs text-ink-faint">
                  Loading ERPNext PO data...
                </div>
              ) : combinedCalibrationSources.length === 0 ? (
                <div className="rounded-lg bg-white/70 px-2.5 py-2 text-xs text-ink-faint">
                  No ERPNext PO data or database calibration certificates found.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-400"
                    />
                    <input
                      value={calibrationSourceQuery}
                      onChange={(e) => {
                        setCalibrationSourceQuery(e.target.value)
                        setCalibrationSourceId('')
                      }}
                      placeholder="Search PO, invoice, customer, item..."
                      className="w-full rounded-xl border border-brand-100 bg-white py-3 pl-9 pr-3 text-xs font-medium text-ink shadow-sm outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>

                  {!normalizedCalibrationQuery ? (
                    <div className="rounded-xl bg-white/70 px-3 py-3 text-xs text-ink-faint ring-1 ring-brand-100">
                      Type to search ERPNext PO, invoice, customer, or item.
                    </div>
                  ) : filteredCalibrationSources.length === 0 ? (
                    <div className="rounded-xl bg-white/70 px-3 py-3 text-xs text-ink-faint ring-1 ring-brand-100">
                      No matching ERPNext source found.
                    </div>
                  ) : (
                    <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                      {filteredCalibrationSources.map((source) => {
                        const isSelected = String(source.id) === String(calibrationSourceId)
                        const isErpSource = calibrationSources.some(
                          (erpSource) => uniqueReportKey(erpSource) === uniqueReportKey(source)
                        )
                        const sourceItems = reportItems(source)
                        return (
                          <button
                            key={`${isErpSource ? 'erp' : 'db'}-${uniqueReportKey(source)}`}
                            type="button"
                            onClick={() => {
                              if (isErpSource) {
                                setCalibrationSourceId(String(source.id))
                              } else {
                                setCalibrationSourceId('')
                                handleSelectReport(source)
                              }
                            }}
                            className={`w-full rounded-xl p-3 text-left text-xs shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
                              isSelected
                                ? 'bg-brand-50 text-ink ring-brand-300'
                                : 'bg-white text-ink ring-brand-100 hover:bg-brand-50/70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold">
                                {source.invoice?.invoiceNumber || source.tcNumber || source.certificateNo || 'ERPNext Source'}
                              </span>
                              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-brand-700 ring-1 ring-brand-100">
                                {isErpSource
                                  ? `${sourceItems.length} item${sourceItems.length === 1 ? '' : 's'}`
                                  : 'DB'}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-ink-faint">
                              {source.customer?.name || 'Customer'}
                            </p>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <span className="truncate text-[11px] font-medium text-brand-700">
                                PO: {source.poNumber || '-'}
                              </span>
                              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-brand-600">
                                {isErpSource ? 'ERP + DB' : 'DB'}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {calibrationSourceId ? (
                    <div className="border-t border-brand-100 pt-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">
                        Purchased Instruments
                      </p>
                      <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                        {selectedCalibrationItems.length === 0 ? (
                          <div className="rounded-lg bg-white/70 px-2.5 py-2 text-xs text-ink-faint">
                            No purchased instruments found in selected PO.
                          </div>
                        ) : (
                          selectedCalibrationItems.map((item, index) => (
                            <button
                              key={`${item.name || item.title || 'item'}-${index}`}
                              type="button"
                              onClick={() => generateCalibrationFromItem(index)}
                              disabled={calibrationLoading}
                              className="w-full rounded-xl bg-white p-3 text-left text-xs shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:bg-brand-50/70 hover:shadow-md disabled:opacity-50"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="truncate font-semibold text-ink">
                                  {item.name || item.title || item.itemName || 'Instrument'}
                                </span>
                                <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                                  Qty {item.qty || item.quantity || '-'}
                                </span>
                              </div>
                              {item.specs?.length ? (
                                <p className="mt-0.5 truncate text-ink-faint">
                                  {item.specs.map((spec) => `${spec.key}: ${spec.value}`).join(' | ')}
                                </p>
                              ) : null}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {tab === 'test' && (
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                    ERPNext Test Certificate Source
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">ERPNext invoices and saved DB reports combined</p>
                </div>
                <button
                  type="button"
                  onClick={fetchErpInvoices}
                  disabled={erpLoading}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-50 disabled:opacity-50"
                  aria-label="Refresh ERPNext invoices"
                >
                  <RefreshCw size={15} className={erpLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="space-y-3">
                {erpError ? (
                  <div className="rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 ring-1 ring-red-100">
                    {erpError}
                  </div>
                ) : null}

                <div className="relative">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"
                  />
                  <input
                    value={testSourceQuery}
                    onChange={(e) => setTestSourceQuery(e.target.value)}
                    placeholder="Search invoice, PO, customer, item..."
                    className="w-full rounded-xl border border-emerald-100 bg-white py-3 pl-9 pr-3 text-xs font-medium text-ink shadow-sm outline-none transition placeholder:text-ink-faint focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {erpLoading ? (
                  <div className="rounded-xl bg-white/70 px-3 py-3 text-xs text-ink-faint ring-1 ring-emerald-100">
                    Syncing ERPNext invoices into database...
                  </div>
                ) : combinedTestSources.length === 0 ? (
                  <div className="rounded-xl bg-white/70 px-3 py-3 text-xs text-ink-faint ring-1 ring-emerald-100">
                    No ERPNext or database test certificates found.
                  </div>
                ) : !normalizedTestQuery ? (
                  <div className="rounded-xl bg-white/70 px-3 py-3 text-xs text-ink-faint ring-1 ring-emerald-100">
                    Type to search ERPNext invoice, PO, customer, or item.
                  </div>
                ) : filteredTestSources.length === 0 ? (
                  <div className="rounded-xl bg-white/70 px-3 py-3 text-xs text-ink-faint ring-1 ring-emerald-100">
                    No matching test certificate source found.
                  </div>
                ) : (
                  <div className="max-h-72 space-y-1.5 overflow-y-auto">
                    {filteredTestSources.map((invoice) => {
                      const isErpSynced = erpInvoices.some(
                        (erpInvoice) => uniqueReportKey(erpInvoice) === uniqueReportKey(invoice)
                      )

                      return (
                        <button
                          key={uniqueReportKey(invoice)}
                          type="button"
                          onClick={() => handleSelectErpInvoice(invoice)}
                          className="w-full rounded-xl bg-white p-3 text-left text-xs shadow-sm ring-1 ring-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="truncate font-semibold text-ink">
                              {erpListTitle(invoice)}
                            </span>
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Qty {erpListQuantity(invoice)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-ink-soft">
                            {erpListCustomer(invoice)}
                          </p>
                          <div className="mt-0.5 flex items-center justify-between gap-2 text-ink-faint">
                            <span className="truncate">PO: {invoice.poNumber || '-'}</span>
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                              {isErpSynced ? 'ERP + DB' : 'DB'}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          </div>
        </div>
      </div>

      {/* Main Content - Certificate Display */}
      <div className="report-main-panel lg:col-span-2 w-full max-w-full overflow-hidden">
        {selectedReport ? (
          <div className="report-card rounded-xl sm:rounded-2xl bg-white shadow-card ring-1 ring-slate-100 overflow-hidden">
            {/* Toolbar */}
            <div className="report-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-ink truncate">
                  {selectedReport.certificateNo || selectedReport.tcNumber}
                </h2>
                <p className="text-xs sm:text-sm text-ink-faint truncate">{selectedReport.customer?.name}</p>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap flex-shrink-0">
                {tab === 'calibration' ? (
                  <Button onClick={openReadingsEditor} variant="secondary" size="sm" className="text-xs sm:text-sm">
                    <PencilLine size={14} className="sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Readings</span>
                  </Button>
                ) : null}
                <Button onClick={printReport} variant="secondary" size="sm" className="text-xs sm:text-sm">
                  <Printer size={14} className="sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Print</span>
                </Button>
                <Button onClick={exportPdf} variant="secondary" size="sm" className="text-xs sm:text-sm">
                  <Download size={14} className="sm:w-4 sm:h-4" /> <span className="hidden xs:inline">PDF</span>
                </Button>
                <button
                  onClick={handleClearSelection}
                  className="rounded-lg p-1.5 sm:p-2 hover:bg-slate-100"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Certificate */}
            <div className="report-print-area overflow-x-auto p-0 sm:p-4 lg:p-6" ref={printRef}>
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
