import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, EyeOff, ListChecks } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import RowActions from '../components/RowActions'
import { instrumentsAPI, customersAPI, standardsAPI } from '../services/api'

const EMPTY = {
  name: '',
  serial: '',
  make: '',
  model: '',
  category: '',
  customerId: '',
  dueDate: '',
  ignored: false,
  series: '',
  rangeStart: '',
  rangeEnd: '',
  rangeUnit: '',
  accuracy: '',
  accuracyType: '±',
  resolution: '',
  type: 'Analog',
  instrumentId: '',
  calibrationPoints: '',
  readingAccuracy: '',
  description: '',
  calibrationPeriod: '12',
}

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

// Default options for dropdowns (defined outside component to prevent re-renders)
const DEFAULT_CATEGORIES = ['Gauges', 'Transmitter', 'Switches', 'Humidity transmitter']
const DEFAULT_MAKES = ['Dwyer']
const DEFAULT_UNITS = ['inWC', 'inwc', 'Pa', 'psi']
const DEFAULT_STANDARDS = [
  'Multifunctional Calibrator (68281901172)',
  'Digital Manometer (005TTW)',
  'Digital Manometer (014L56)',
  'Digital Manometer (005PWD)',
  'Digital Multimeter (QTS-22020169)',
]
const ITEMS_PER_PAGE = 10

const STANDARD_MASTER_BY_KEY = {
  'ASC-400': { masterName: 'Multifunctional Calibrator', model: 'ASC-400' },
  'CAL-25050083/ET/01': { masterName: 'Multifunctional Calibrator', model: 'ASC-400' },
  '68281901172': { masterName: 'Multifunctional Calibrator', model: 'ASC-400' },
  '477AV-00': { masterName: 'Digital Manometer', model: '477AV-00' },
  'CAL-25100187/PR/03': { masterName: 'Digital Manometer', model: '477AV-00' },
  '005TTW': { masterName: 'Digital Manometer', model: '477AV-00' },
  '477B-1': { masterName: 'Digital Manometer', model: '477B-1' },
  'CAL-25100187/PR/02': { masterName: 'Digital Manometer', model: '477B-1' },
  '014L56': { masterName: 'Digital Manometer', model: '477B-1' },
  '477AV-2': { masterName: 'Digital Manometer', model: '477AV-2' },
  'CAL-25100187/PR/01': { masterName: 'Digital Manometer', model: '477AV-2' },
  '005PWD': { masterName: 'Digital Manometer', model: '477AV-2' },
}

const normalizeKey = (value) => String(value || '').trim().toUpperCase()

const resolveStandardMaster = (standard) => {
  if (!standard) return null

  const keys = [
    standard.reportNo,
    standard.certificateNo,
    standard.model,
    standard.instrumentCode,
    typeof standard.instrumentId === 'string' ? standard.instrumentId : '',
  ]

  for (const key of keys) {
    const master = STANDARD_MASTER_BY_KEY[normalizeKey(key)]
    if (master) return master
  }

  return null
}

const decorateInstrumentsWithStandards = (instruments, standards) => {
  const standardsByInstrument = new Map()

  standards.forEach((standard) => {
    const master = resolveStandardMaster(standard)
    if (!master) return

    const keys = [
      standard.instrumentId,
      standard.instrumentRef?.id,
      standard.instrumentRef?.instrumentId,
    ]

    keys.forEach((key) => {
      if (key !== undefined && key !== null && key !== '') {
        standardsByInstrument.set(normalizeKey(key), master)
      }
    })
  })

  return instruments.map((instrument) => {
    const master =
      standardsByInstrument.get(normalizeKey(instrument.id)) ||
      standardsByInstrument.get(normalizeKey(instrument.instrumentId))

    if (!master) return instrument

    return {
      ...instrument,
      displayName: master.masterName,
      displayModel: master.model,
    }
  })
}

export default function Instruments() {
  const [rows, setRows] = useState([])
  const [customers, setCustomers] = useState([])
  const [query, setQuery] = useState('')
  const [showIgnored, setShowIgnored] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  
  // Dynamic options for dropdowns - initialize with defaults
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [makes, setMakes] = useState(DEFAULT_MAKES)
  const [units, setUnits] = useState(DEFAULT_UNITS)

  // Fetch instruments when query or filter changes
  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        setLoading(true)
        setError(null)
        const [instrumentData, standardData] = await Promise.all([
          instrumentsAPI.getAll(query, showIgnored ? true : null),
          standardsAPI.getAll(),
        ])
        setRows(decorateInstrumentsWithStandards(instrumentData, standardData))
      } catch (err) {
        setError('Failed to fetch instruments')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchInstruments()
  }, [query, showIgnored])

  // Fetch customers once on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customersAPI.getAll()
        setCustomers(data)
      } catch (err) {
        console.error('Failed to fetch customers:', err)
      }
    }
    fetchCustomers()
  }, [])

  const results = useMemo(() => {
    return rows
  }, [rows])

  // Calculate pagination
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedResults = results.slice(startIndex, endIndex)

  // Reset to page 1 when search query or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [query, showIgnored])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY, ignored: showIgnored, customerId: customers[0]?.id || '' })
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      name: row.name || '',
      serial: row.serial || '',
      make: row.make || '',
      model: row.model || '',
      category: row.category || '',
      customerId: row.customerId || '',
      dueDate: row.dueDate || '',
      ignored: row.ignored || false,
      series: row.series || '',
      rangeStart: row.rangeStart || '',
      rangeEnd: row.rangeEnd || '',
      rangeUnit: row.rangeUnit || '',
      accuracy: row.accuracy || '',
      accuracyType: row.accuracyType || '±',
      resolution: row.resolution || '',
      type: row.type || 'Analog',
      instrumentId: row.instrumentId || '',
      calibrationPoints: row.calibrationPoints || '',
      readingAccuracy: row.readingAccuracy || '',
      description: row.description || '',
      calibrationPeriod: row.calibrationPeriod || '12',
    })
    setModalOpen(true)
  }

  const handleDelete = async (row) => {
    if (window.confirm(`Delete instrument "${row.name}"?`)) {
      try {
        await instrumentsAPI.delete(row.id)
        setRows((r) => r.filter((x) => x.id !== row.id))
      } catch (err) {
        alert('Failed to delete instrument')
        console.error(err)
      }
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    try {
      setLoading(true)
      const payload = {
        ...form,
        customerId: form.customerId || customers[0]?.id,
      }

      if (!payload.customerId) {
        alert('Please add at least one customer before saving an instrument.')
        return
      }

      if (editing) {
        const updated = await instrumentsAPI.update(editing.id, payload)
        setRows((r) => r.map((x) => (x.id === editing.id ? updated : x)))
      } else {
        const created = await instrumentsAPI.create(payload)
        setRows((r) => [created, ...r])
      }
      setModalOpen(false)
      setForm(EMPTY)
    } catch (err) {
      alert('Failed to save instrument')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search instruments..."
          className="w-full lg:max-w-sm"
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant={showIgnored ? 'secondary' : 'danger'}
            onClick={() => setShowIgnored((s) => !s)}
          >
            {showIgnored ? <ListChecks size={18} /> : <EyeOff size={18} />}
            {showIgnored ? 'View Active' : 'View Ignored'}
          </Button>
          <Button onClick={openAdd} disabled={loading}>
            <Plus size={18} /> Add Instrument
          </Button>
        </div>
      </div>

      <h2 className="mb-2 mt-6 font-display text-lg font-semibold text-ink">
        {showIgnored ? 'Ignored Instruments' : 'All Instruments'}
      </h2>

      <DataTable
        rowKey={(r) => r.id}
        data={paginatedResults}
        emptyMessage={loading ? 'Loading...' : 'No instruments to show.'}
        columns={[
          { key: 'sr', header: 'Sr', render: (_, i) => startIndex + i + 1, className: 'text-ink-faint w-12' },
          { key: 'name', header: 'Instrument', className: 'font-medium', render: (r) => r.displayName || r.name },
          { key: 'serial', header: 'Serial', className: 'text-ink-soft' },
          { key: 'make', header: 'Make', className: 'text-ink-soft' },
          { key: 'model', header: 'Model', render: (r) => r.displayModel || r.model },
          { key: 'category', header: 'Category', className: 'text-ink-soft' },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
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
            <span className="font-medium text-ink">{results.length}</span> instruments
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
        title={editing ? 'Update Instrument' : 'Add Instrument'}
        maxWidth="max-w-5xl"
        footer={
          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Basic Info Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormInput
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
            />
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">Category</label>
              <div className="flex gap-2">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Select category…</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const newCategory = prompt('Enter new category name:')
                    if (newCategory && newCategory.trim()) {
                      const trimmed = newCategory.trim()
                      if (!categories.includes(trimmed)) {
                        setCategories([...categories, trimmed])
                      }
                      setForm({ ...form, category: trimmed })
                    }
                  }}
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600"
                  title="Add new category"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-orange-500">Calibration period in month</label>
              <div className="flex gap-2">
                <select
                  value={form.calibrationPeriod}
                  onChange={(e) => setForm({ ...form, calibrationPeriod: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="3">3</option>
                  <option value="6">6</option>
                  <option value="12">12</option>
                  <option value="24">24</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const newPeriod = prompt('Enter calibration period in months:', '12')
                    if (newPeriod && !isNaN(newPeriod)) {
                      setForm({ ...form, calibrationPeriod: newPeriod })
                    }
                  }}
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600"
                  title="Add custom period"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Make, Model, Series Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">Make</label>
              <div className="flex gap-2">
                <select
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Select make…</option>
                  {makes.map((make) => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const newMake = prompt('Enter new make name:')
                    if (newMake && newMake.trim()) {
                      const trimmed = newMake.trim()
                      if (!makes.includes(trimmed)) {
                        setMakes([...makes, trimmed])
                      }
                      setForm({ ...form, make: trimmed })
                    }
                  }}
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600"
                  title="Add new make"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <FormInput
              label="Model"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="Model"
            />
            <FormInput
              label="Series"
              value={form.series}
              onChange={(e) => setForm({ ...form, series: e.target.value })}
              placeholder="Series"
            />
          </div>

          {/* Range Section */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Range</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormInput
                label="Start"
                value={form.rangeStart}
                onChange={(e) => setForm({ ...form, rangeStart: e.target.value })}
                placeholder="0"
              />
              <FormInput
                label="End"
                value={form.rangeEnd}
                onChange={(e) => setForm({ ...form, rangeEnd: e.target.value })}
                placeholder="100"
              />
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-ink-soft">Unit</label>
                <div className="flex gap-2">
                  <select
                    value={form.rangeUnit}
                    onChange={(e) => setForm({ ...form, rangeUnit: e.target.value })}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Select unit…</option>
                    {units.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const newUnit = prompt('Enter new unit:')
                      if (newUnit && newUnit.trim()) {
                        const trimmed = newUnit.trim()
                        if (!units.includes(trimmed)) {
                          setUnits([...units, trimmed])
                        }
                        setForm({ ...form, rangeUnit: trimmed })
                      }
                    }}
                    className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600"
                    title="Add new unit"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Accuracy, Resolution, Type Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">Accuracy</label>
              <div className="flex items-center gap-2">
                <select
                  value={form.accuracyType}
                  onChange={(e) => setForm({ ...form, accuracyType: e.target.value })}
                  className="w-16 rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="±">±</option>
                  <option value="+">+</option>
                  <option value="-">-</option>
                </select>
                <input
                  type="text"
                  value={form.accuracy}
                  onChange={(e) => setForm({ ...form, accuracy: e.target.value })}
                  placeholder="± 5%"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
                <span className="text-lg text-ink-soft font-medium">%</span>
              </div>
            </div>
            <FormInput
              label="Resolution"
              value={form.resolution}
              onChange={(e) => setForm({ ...form, resolution: e.target.value })}
              placeholder="0.1"
            />
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">Type</label>
              <div className="flex gap-4 pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="Analog"
                    checked={form.type === 'Analog'}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="h-4 w-4 text-brand-600"
                  />
                  <span className="text-sm text-ink">Analog</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="Digital"
                    checked={form.type === 'Digital'}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="h-4 w-4 text-brand-600"
                  />
                  <span className="text-sm text-ink">Digital</span>
                </label>
              </div>
            </div>
          </div>

          {/* Standard Details Section */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Standard details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-ink-soft">Standard</label>
                <select
                  value={form.instrumentId}
                  onChange={(e) => setForm({ ...form, instrumentId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Standard</option>
                  {DEFAULT_STANDARDS.map((standard) => (
                    <option key={standard} value={standard}>
                      {standard}
                    </option>
                  ))}
                </select>
              </div>
              <FormInput
                label="Calibration Points"
                value={form.calibrationPoints}
                onChange={(e) => setForm({ ...form, calibrationPoints: e.target.value })}
                placeholder="0, 25, 50, 75, 100"
              />
              <FormInput
                label="Reading Accuracy"
                value={form.readingAccuracy}
                onChange={(e) => setForm({ ...form, readingAccuracy: e.target.value })}
                placeholder="±0.5"
              />
            </div>
          </div>

          <div className="hidden">
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">Customer</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: parseInt(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Additional notes or description..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
