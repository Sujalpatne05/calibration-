import { useState, useEffect, useMemo } from 'react'
import { Plus, EyeOff, ListChecks } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import RowActions from '../components/RowActions'
import { instrumentsAPI, customersAPI } from '../services/api'

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
}

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

export default function Instruments() {
  const [rows, setRows] = useState([])
  const [customers, setCustomers] = useState([])
  const [query, setQuery] = useState('')
  const [showIgnored, setShowIgnored] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  // Fetch instruments and customers on mount
  useEffect(() => {
    fetchInstruments()
    fetchCustomers()
  }, [query, showIgnored])

  const fetchInstruments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await instrumentsAPI.getAll(query, showIgnored ? true : null)
      setRows(data)
    } catch (err) {
      setError('Failed to fetch instruments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const data = await customersAPI.getAll()
      setCustomers(data)
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    }
  }

  const results = useMemo(() => {
    return rows
  }, [rows])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY, ignored: showIgnored })
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ ...row })
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
      if (editing) {
        const updated = await instrumentsAPI.update(editing.id, form)
        setRows((r) => r.map((x) => (x.id === editing.id ? updated : x)))
      } else {
        const created = await instrumentsAPI.create(form)
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

  const getCustomerName = (customerId) => {
    return customers.find((c) => c.id === customerId)?.name || ''
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Instrument name"
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
        data={results}
        emptyMessage={loading ? 'Loading...' : 'No instruments to show.'}
        columns={[
          { key: 'sr', header: 'Sr', render: (_, i) => i + 1, className: 'text-ink-faint w-12' },
          { key: 'name', header: 'Instrument', className: 'font-medium' },
          { key: 'serial', header: 'Serial', className: 'text-ink-soft' },
          { key: 'make', header: 'Make', className: 'text-ink-soft' },
          { key: 'model', header: 'Model' },
          { key: 'category', header: 'Category', className: 'text-ink-soft' },
          { 
            key: 'customerId', 
            header: 'Customer', 
            className: 'text-ink-soft max-w-[14rem]',
            render: (row) => getCustomerName(row.customerId)
          },
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
              placeholder="Instrument Name"
            />
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select category…</option>
                <option value="Pressure">Pressure</option>
                <option value="Temperature">Temperature</option>
                <option value="Flow">Flow</option>
                <option value="Level">Level</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <FormInput
              label="Serial Number"
              value={form.serial}
              onChange={(e) => setForm({ ...form, serial: e.target.value })}
              placeholder="12"
            />
          </div>

          {/* Make, Model, Series Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">Make</label>
              <select
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select make…</option>
                <option value="Dwyer">Dwyer</option>
                <option value="Wika">Wika</option>
                <option value="Ashcroft">Ashcroft</option>
                <option value="Fluke">Fluke</option>
                <option value="Other">Other</option>
              </select>
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
                <select
                  value={form.rangeUnit}
                  onChange={(e) => setForm({ ...form, rangeUnit: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Select unit…</option>
                  <option value="Pa">Pa</option>
                  <option value="PSI">PSI</option>
                  <option value="Bar">Bar</option>
                  <option value="°C">°C</option>
                  <option value="°F">°F</option>
                  <option value="mA">mA</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>
          </div>

          {/* Accuracy, Resolution, Type Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">Accuracy</label>
              <div className="flex gap-2">
                <select
                  value={form.accuracyType}
                  onChange={(e) => setForm({ ...form, accuracyType: e.target.value })}
                  className="w-20 rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="±">±</option>
                  <option value="+">+</option>
                  <option value="-">-</option>
                </select>
                <input
                  type="text"
                  value={form.accuracy}
                  onChange={(e) => setForm({ ...form, accuracy: e.target.value })}
                  placeholder="5%"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
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
              <FormInput
                label="Instrument Id"
                value={form.instrumentId}
                onChange={(e) => setForm({ ...form, instrumentId: e.target.value })}
                placeholder="Instrument Id"
              />
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

          {/* Customer */}
          <div className="w-full">
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
