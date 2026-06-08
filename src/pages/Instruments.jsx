import { useState, useMemo } from 'react'
import { Plus, EyeOff, ListChecks } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import RowActions from '../components/RowActions'
import { instruments as seed } from '../data/instruments'
import { customers } from '../data/customers'

const EMPTY = {
  name: '',
  serial: '',
  make: '',
  model: '',
  category: '',
  customer: '',
  dueDate: '',
  ignored: false,
}

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

export default function Instruments() {
  const [rows, setRows] = useState(seed)
  const [query, setQuery] = useState('')
  const [showIgnored, setShowIgnored] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((r) => r.ignored === showIgnored)
      .filter((r) =>
        !q
          ? true
          : [r.name, r.serial, r.make, r.model, r.category, r.customer].some((f) =>
              String(f).toLowerCase().includes(q),
            ),
      )
  }, [rows, query, showIgnored])

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

  const handleDelete = (row) => {
    if (window.confirm(`Delete instrument “${row.name}”?`)) {
      setRows((r) => r.filter((x) => x.id !== row.id))
    }
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editing) {
      setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...form } : x)))
    } else {
      setRows((r) => [{ id: Date.now(), ...form }, ...r])
    }
    setModalOpen(false)
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
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
          <Button onClick={openAdd}>
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
        emptyMessage="No instruments to show."
        columns={[
          { key: 'sr', header: 'Sr', render: (_, i) => i + 1, className: 'text-ink-faint w-12' },
          { key: 'name', header: 'Instrument', className: 'font-medium' },
          { key: 'serial', header: 'Serial', className: 'text-ink-soft' },
          { key: 'make', header: 'Make', className: 'text-ink-soft' },
          { key: 'model', header: 'Model' },
          { key: 'category', header: 'Category', className: 'text-ink-soft' },
          { key: 'customer', header: 'Customer', className: 'text-ink-soft max-w-[14rem]' },
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
          <Button className="w-full" onClick={handleSave}>
            Save
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
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
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
