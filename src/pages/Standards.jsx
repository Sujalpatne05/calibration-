import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import RowActions from '../components/RowActions'
import { useSearch } from '../hooks/useSearch'
import { standardsAPI, instrumentsAPI } from '../services/api'

const EMPTY = {
  instrumentId: '',
  instrumentCode: '',
  instrument: '',
  calibrationDate: '',
  reportNo: '',
  certificateNo: '',
}
const ITEMS_PER_PAGE = 10

const STANDARD_MASTER_BY_KEY = {
  'ASC-400': {
    masterName: 'Multifunctional Calibrator',
    model: 'ASC-400',
    reportNo: 'CAL-25050083/ET/01',
    calibrationDate: '2025-05-13',
    dueDate: '2026-05-12',
  },
  'CAL-25050083/ET/01': {
    masterName: 'Multifunctional Calibrator',
    model: 'ASC-400',
    reportNo: 'CAL-25050083/ET/01',
    calibrationDate: '2025-05-13',
    dueDate: '2026-05-12',
  },
  '68281901172': {
    masterName: 'Multifunctional Calibrator',
    model: 'ASC-400',
    reportNo: 'CAL-25050083/ET/01',
    calibrationDate: '2025-05-13',
    dueDate: '2026-05-12',
  },
  '477AV-00': {
    masterName: 'Digital Manometer',
    model: '477AV-00',
    reportNo: 'CAL-25100187/PR/03',
    calibrationDate: '2025-10-18',
    dueDate: '2026-10-17',
  },
  'CAL-25100187/PR/03': {
    masterName: 'Digital Manometer',
    model: '477AV-00',
    reportNo: 'CAL-25100187/PR/03',
    calibrationDate: '2025-10-18',
    dueDate: '2026-10-17',
  },
  '005TTW': {
    masterName: 'Digital Manometer',
    model: '477AV-00',
    reportNo: 'CAL-25100187/PR/03',
    calibrationDate: '2025-10-18',
    dueDate: '2026-10-17',
  },
  '477B-1': {
    masterName: 'Digital Manometer',
    model: '477B-1',
    reportNo: 'CAL-25100187/PR/02',
    calibrationDate: '2025-10-18',
    dueDate: '2026-10-17',
  },
  'CAL-25100187/PR/02': {
    masterName: 'Digital Manometer',
    model: '477B-1',
    reportNo: 'CAL-25100187/PR/02',
    calibrationDate: '2025-10-18',
    dueDate: '2026-10-17',
  },
  '014L56': {
    masterName: 'Digital Manometer',
    model: '477B-1',
    reportNo: 'CAL-25100187/PR/02',
    calibrationDate: '2025-10-18',
    dueDate: '2026-10-17',
  },
  '477AV-2': {
    masterName: 'Digital Manometer',
    model: '477AV-2',
    reportNo: 'CAL-25100187/PR/01',
    calibrationDate: '2025-10-18',
    dueDate: '2026-10-17',
  },
  'CAL-25100187/PR/01': {
    masterName: 'Digital Manometer',
    model: '477AV-2',
    reportNo: 'CAL-25100187/PR/01',
    calibrationDate: '2025-10-18',
    dueDate: '2026-10-17',
  },
  '005PWD': {
    masterName: 'Digital Manometer',
    model: '477AV-2',
    reportNo: 'CAL-25100187/PR/01',
    calibrationDate: '2025-10-18',
    dueDate: '2026-10-17',
  },
}

const BASE_STANDARD_ROWS = [
  {
    id: 'base-asc-400',
    instrument: 'Multifunctional Calibrator',
    certificateNo: '68281901172',
    instrumentCode: '68281901172',
    displayMasterName: 'Multifunctional Calibrator',
    displayModel: 'ASC-400',
    displayReportNo: 'CAL-25050083/ET/01',
    displayCalibrationDate: '2025-05-13',
    displayDueDate: '2026-05-12',
  },
  {
    id: 'base-477av-00',
    instrument: 'Digital Manometer',
    certificateNo: '005TTW',
    instrumentCode: '005TTW',
    displayMasterName: 'Digital Manometer',
    displayModel: '477AV-00',
    displayReportNo: 'CAL-25100187/PR/03',
    displayCalibrationDate: '2025-10-18',
    displayDueDate: '2026-10-17',
  },
  {
    id: 'base-477b-1',
    instrument: 'Digital Manometer',
    certificateNo: '014L56',
    instrumentCode: '014L56',
    displayMasterName: 'Digital Manometer',
    displayModel: '477B-1',
    displayReportNo: 'CAL-25100187/PR/02',
    displayCalibrationDate: '2025-10-18',
    displayDueDate: '2026-10-17',
  },
  {
    id: 'base-477av-2',
    instrument: 'Digital Manometer',
    certificateNo: '005PWD',
    instrumentCode: '005PWD',
    displayMasterName: 'Digital Manometer',
    displayModel: '477AV-2',
    displayReportNo: 'CAL-25100187/PR/01',
    displayCalibrationDate: '2025-10-18',
    displayDueDate: '2026-10-17',
  },
]

const normalizeKey = (value) => String(value || '').trim().toUpperCase()

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

const addOneYear = (d) => {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  date.setFullYear(date.getFullYear() + 1)
  return date
}

const resolveStandardMaster = (row) => {
  const keys = [
    row.reportNo,
    row.certificateNo,
    row.model,
    row.instrumentCode,
    typeof row.instrumentId === 'string' ? row.instrumentId : '',
  ]

  for (const key of keys) {
    const master = STANDARD_MASTER_BY_KEY[normalizeKey(key)]
    if (master) return master
  }

  return null
}

const decorateStandard = (row) => {
  const master = resolveStandardMaster(row)

  if (master) {
    return {
      ...row,
      displayMasterName: master.masterName,
      displayModel: master.model,
      displayReportNo: master.reportNo,
      displayCalibrationDate: master.calibrationDate,
      displayDueDate: master.dueDate,
    }
  }

  return {
    ...row,
    displayMasterName: row.instrument || '-',
    displayModel: row.model || (typeof row.instrumentId === 'string' ? row.instrumentId : '-') || '-',
    displayReportNo: row.reportNo || '-',
    displayCalibrationDate: row.calibrationDate,
    displayDueDate: row.certExpiry || addOneYear(row.calibrationDate),
  }
}

export default function Standards() {
  const [rows, setRows] = useState([])
  const [instruments, setInstruments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { query, setQuery, results } = useSearch(rows, [
    'instrument',
    'displayMasterName',
    'displayModel',
    'displayReportNo',
    'instrumentId',
    'reportNo',
    'certificateNo',
  ])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate pagination
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedResults = results.slice(startIndex, endIndex)

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  // Fetch standards when query changes
  useEffect(() => {
    fetchStandards()
  }, [query])

  // Fetch instruments once on mount
  useEffect(() => {
    fetchInstruments()
  }, [])

  const fetchStandards = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await standardsAPI.getAll()
      setRows(data.length ? data.map(decorateStandard) : BASE_STANDARD_ROWS)
    } catch (err) {
      setError('Failed to fetch standards')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchInstruments = async () => {
    try {
      const data = await instrumentsAPI.getAll()
      setInstruments(data)
    } catch (err) {
      console.error('Failed to fetch instruments:', err)
    }
  }

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    // Convert ISO date to yyyy-MM-dd format for date input
    const sourceDate = row.calibrationDate || row.displayCalibrationDate
    const dateValue = sourceDate
      ? new Date(sourceDate).toISOString().split('T')[0] 
      : ''
    
    setForm({
      instrumentId: row.instrumentId || '',
      instrumentCode: row.instrumentRef?.instrumentId || row.instrumentCode || row.instrumentId || '',
      instrument: row.instrument || row.displayMasterName || '',
      calibrationDate: dateValue,
      reportNo: row.reportNo || row.displayReportNo || '',
      certificateNo: row.certificateNo || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (row) => {
    if (String(row.id).startsWith('base-')) {
      alert('Base standards cannot be deleted from this list.')
      return
    }

    if (window.confirm(`Delete standard "${row.certificateNo}"?`)) {
      try {
        await standardsAPI.delete(row.id)
        setRows((r) => r.filter((x) => x.id !== row.id))
      } catch (err) {
        alert('Failed to delete standard')
        console.error(err)
      }
    }
  }

  const findInstrumentForStandard = () => {
    const instrumentCode = String(form.instrumentCode || '').trim().toLowerCase()
    const instrumentName = String(form.instrument || '').trim().toLowerCase()

    return instruments.find((instrument) => {
      const codeMatches = instrumentCode && String(instrument.instrumentId || '').trim().toLowerCase() === instrumentCode
      const nameMatches = instrumentName && String(instrument.name || '').trim().toLowerCase() === instrumentName
      return codeMatches || nameMatches
    })
  }

  const handleSave = async () => {
    if (!form.instrument.trim()) return
    try {
      setLoading(true)
      
      if (editing) {
        if (String(editing.id).startsWith('base-')) {
          const updatedRow = {
            ...editing,
            instrument: form.instrument,
            instrumentCode: form.instrumentCode,
            certificateNo: form.reportNo || form.instrumentCode || form.instrument,
            reportNo: form.reportNo,
            calibrationDate: form.calibrationDate,
            displayMasterName: form.instrument,
            displayReportNo: form.reportNo,
            displayCalibrationDate: form.calibrationDate,
            displayDueDate: addOneYear(form.calibrationDate),
          }
          setRows((r) => r.map((x) => (x.id === editing.id ? updatedRow : x)))
          setModalOpen(false)
          setForm(EMPTY)
          return
        }

        // When updating, don't send instrumentId or instrument (they shouldn't change)
        const payload = {
          calibrationDate: form.calibrationDate,
          reportNo: form.reportNo,
          certificateNo: form.reportNo || form.instrumentCode || form.instrument,
        }
        const updated = await standardsAPI.update(editing.id, payload)
        setRows((r) => r.map((x) => (x.id === editing.id ? decorateStandard(updated) : x)))
      } else {
        const selectedInstrument = findInstrumentForStandard()

        const payload = {
          instrumentId: selectedInstrument?.id || null,
          instrument: form.instrument || selectedInstrument?.name,
          calibrationDate: form.calibrationDate,
          reportNo: form.reportNo,
          certificateNo: form.reportNo || form.instrumentCode || form.instrument,
        }
        const created = await standardsAPI.create(payload)
        setRows((r) => [decorateStandard(created), ...r])
      }
      setModalOpen(false)
      setForm(EMPTY)
    } catch (err) {
      alert('Failed to save standard')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="standards-page rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100 sm:p-8 lg:p-10">
      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Certificate no"
          className="w-full sm:max-w-md"
        />
        <Button onClick={openAdd} disabled={loading}>
          <Plus size={18} /> Add Standard
        </Button>
      </div>

      <h2 className="mb-4 mt-8 font-display text-2xl font-semibold text-ink">All Standards</h2>

      <DataTable
        rowKey={(r) => r.id}
        data={paginatedResults}
        emptyMessage={loading ? 'Loading...' : 'No standards match your search.'}
        columns={[
          { key: 'sr', header: 'SR', render: (_, i) => startIndex + i + 1, align: 'center', className: 'text-ink-faint w-12' },
          {
            key: 'instrument',
            header: 'Master name',
            align: 'center',
            className: 'font-medium',
            render: (r) => r.displayMasterName,
          },
          {
            key: 'instrumentId',
            header: 'Model',
            align: 'center',
            className: 'text-ink-soft',
            render: (r) => r.displayModel,
          },
          { key: 'reportNo', header: 'Report no', align: 'center', className: 'text-ink-soft', render: (r) => r.displayReportNo },
          { key: 'calibrationDate', header: 'CAL DATE', align: 'center', render: (r) => fmtDate(r.displayCalibrationDate) },
          { key: 'certExpiry', header: 'DUE DATE', align: 'center', render: (r) => fmtDate(r.displayDueDate) },
          {
            key: 'actions',
            header: 'Actions',
            align: 'center',
            render: (row) => (
              <RowActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} />
            ),
          },
        ]}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
          <div className="text-xs sm:text-sm text-ink-soft text-center sm:text-left">
            Showing <span className="font-medium text-ink">{startIndex + 1}</span> to{' '}
            <span className="font-medium text-ink">{Math.min(endIndex, results.length)}</span> of{' '}
            <span className="font-medium text-ink">{results.length}</span> standards
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

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Update Standard' : 'Add Standard'}
        maxWidth="max-w-lg"
        footer={
          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : editing ? 'Update' : 'Save'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">Instrument name</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={form.instrument}
                  onChange={(e) => setForm({ ...form, instrument: e.target.value })}
                  placeholder="Search instrument..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
                {false && (
                  <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {instruments
                      .filter(i => 
                        `${i.name} ${i.serial} ${i.customer?.name || ''}`.toLowerCase().includes(instrumentSearch.toLowerCase())
                      )
                      .map((i) => (
                        <div
                          key={i.id}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setForm({
                              ...form,
                              instrumentId: i.id,
                              instrumentCode: i.instrumentId || '',
                              instrument: i.name,
                            })
                            setInstrumentSearch(`${i.name} - ${i.serial} (${i.customer?.name || 'No Customer'})`)
                            setShowInstrumentDropdown(false)
                          }}
                          className="px-4 py-3 cursor-pointer hover:bg-brand-50 border-b border-slate-100 last:border-b-0"
                        >
                          <div className="font-medium text-ink">{i.name}</div>
                          <div className="text-xs text-ink-soft">Serial: {i.serial} • {i.customer?.name || 'No Customer'}</div>
                        </div>
                      ))
                    }
                    {instruments.filter(i => 
                      `${i.name} ${i.serial} ${i.customer?.name || ''}`.toLowerCase().includes(instrumentSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="px-4 py-3 text-sm text-ink-faint">No instruments found</div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600"
                title="Add new instrument"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">
              Previous Calibration Date{' '}
              {editing && form.calibrationDate && (
                <span className="text-red-400">{fmtDate(form.calibrationDate)}</span>
              )}
            </label>
            <input
              type="date"
              value={form.calibrationDate}
              onChange={(e) => setForm({ ...form, calibrationDate: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <FormInput
            label="Report NO"
            value={form.reportNo}
            onChange={(e) => setForm({ ...form, reportNo: e.target.value })}
            placeholder="CAL-25100187/PR/02"
          />

          <FormInput
            label="Instrument Id"
            value={form.instrumentCode}
            onChange={(e) => setForm({ ...form, instrumentCode: e.target.value })}
            placeholder="Instrument Id"
          />

        </div>
      </Modal>
    </div>
  )
}
