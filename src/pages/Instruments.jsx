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
          { key: 'dueDate', header: 'Cal. Due', render: (r) => fmtDate(r.dueDate) },
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
        title={editing ? 'Edit Instrument' : 'Add Instrument'}
        maxWidth="max-w-lg"
        footer={
          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            label="Instrument Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Pressure Gauge"
          />
          <FormInput
            label="Serial Number"
            value={form.serial}
            onChange={(e) => setForm({ ...form, serial: e.target.value })}
            placeholder="e.g. PG-1187"
          />
          <FormInput
            label="Make"
            value={form.make}
            onChange={(e) => setForm({ ...form, make: e.target.value })}
            placeholder="e.g. Wika"
          />
          <FormInput
            label="Model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="e.g. A-308"
          />
          <FormInput
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Pressure"
          />
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
          <FormInput
            label="Calibration Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  )
}
