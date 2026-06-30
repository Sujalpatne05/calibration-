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

export default function Standards() {
  const [rows, setRows] = useState([])
  const [instruments, setInstruments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { query, setQuery, results } = useSearch(rows, [
    'instrument',
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
      const data = await standardsAPI.getAll(query)
      setRows(data)
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
    const dateValue = row.calibrationDate 
      ? new Date(row.calibrationDate).toISOString().split('T')[0] 
      : ''
    
    setForm({
      instrumentId: row.instrumentId || '',
      instrumentCode: row.instrumentRef?.instrumentId || row.instrumentId || '',
      instrument: row.instrument || '',
      calibrationDate: dateValue,
      reportNo: row.reportNo || '',
      certificateNo: row.certificateNo || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (row) => {
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
    if (!form.instrument.trim() || !form.certificateNo.trim()) return
    try {
      setLoading(true)
      
      if (editing) {
        // When updating, don't send instrumentId or instrument (they shouldn't change)
        const payload = {
          calibrationDate: form.calibrationDate,
          reportNo: form.reportNo,
          certificateNo: form.certificateNo,
        }
        const updated = await standardsAPI.update(editing.id, payload)
        setRows((r) => r.map((x) => (x.id === editing.id ? updated : x)))
      } else {
        const selectedInstrument = findInstrumentForStandard()

        if (!selectedInstrument) {
          alert('No matching instrument found. Please enter an existing Instrument Id or exact Instrument name.')
          return
        }

        const payload = {
          instrumentId: selectedInstrument.id,
          instrument: form.instrument || selectedInstrument.name,
          calibrationDate: form.calibrationDate,
          reportNo: form.reportNo,
          certificateNo: form.certificateNo,
        }
        const created = await standardsAPI.create(payload)
        setRows((r) => [created, ...r])
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
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Certificate no"
          className="w-full sm:max-w-sm"
        />
        <Button onClick={openAdd} disabled={loading}>
          <Plus size={18} /> Add Standard
        </Button>
      </div>

      <h2 className="mb-2 mt-6 font-display text-lg font-semibold text-ink">All Standards</h2>

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
            render: (r) => r.instrumentRef?.name || r.instrument,
          },
          {
            key: 'model',
            header: 'Model',
            align: 'center',
            className: 'text-ink-soft',
            render: (r) => r.instrumentRef?.model || r.model || '-',
          },
          { key: 'reportNo', header: 'Report no', align: 'center', className: 'text-ink-soft' },
          { key: 'calibrationDate', header: 'CAL DATE', align: 'center', render: (r) => fmtDate(r.calibrationDate) },
          { key: 'certExpiry', header: 'DUE DATE', align: 'center', render: (r) => fmtDate(r.certExpiry || addOneYear(r.calibrationDate)) },
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
                  disabled={!!editing}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
              Calibration Date{' '}
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

          <FormInput
            label="Certificate Number"
            value={form.certificateNo}
            onChange={(e) => setForm({ ...form, certificateNo: e.target.value })}
            placeholder="014L56"
          />
        </div>
      </Modal>
    </div>
  )
}
