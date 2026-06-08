import { useState } from 'react'
import { Plus } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import RowActions from '../components/RowActions'
import { useSearch } from '../hooks/useSearch'
import { standards as seed } from '../data/standards'

const EMPTY = {
  instrument: '',
  instrumentId: '',
  calibrationDate: '',
  reportNo: '',
  certificateNo: '',
}

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

export default function Standards() {
  const [rows, setRows] = useState(seed)
  const { query, setQuery, results } = useSearch(rows, [
    'instrument',
    'instrumentId',
    'reportNo',
    'certificateNo',
  ])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ ...row })
    setModalOpen(true)
  }

  const handleDelete = (row) => {
    if (window.confirm(`Delete standard “${row.instrument}”?`)) {
      setRows((r) => r.filter((x) => x.id !== row.id))
    }
  }

  const handleSave = () => {
    if (!form.instrument.trim()) return
    if (editing) {
      setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...form } : x)))
    } else {
      setRows((r) => [{ id: Date.now(), ...form }, ...r])
    }
    setModalOpen(false)
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Instrument name"
          className="w-full sm:max-w-sm"
        />
        <Button onClick={openAdd} className="w-full sm:w-auto">
          <Plus size={18} /> Add Standard
        </Button>
      </div>

      <h2 className="mb-2 mt-6 font-display text-lg font-semibold text-ink">All Standards</h2>

      <DataTable
        rowKey={(r) => r.id}
        data={results}
        emptyMessage="No standards match your search."
        columns={[
          { key: 'sr', header: 'Sr', render: (_, i) => i + 1, className: 'text-ink-faint w-12' },
          { key: 'instrument', header: 'Instrument', className: 'font-medium' },
          { key: 'instrumentId', header: 'Instrument ID', className: 'text-ink-soft' },
          {
            key: 'calibrationDate',
            header: 'Calibration Date',
            render: (r) => fmtDate(r.calibrationDate),
          },
          { key: 'reportNo', header: 'Report No', className: 'text-ink-soft' },
          { key: 'certificateNo', header: 'Certificate No' },
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Standard' : 'Add Standard'}
        maxWidth="max-w-lg"
        footer={
          <Button className="w-full" onClick={handleSave}>
            Save
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            label="Instrument"
            value={form.instrument}
            onChange={(e) => setForm({ ...form, instrument: e.target.value })}
            placeholder="e.g. Digital Manometer"
          />
          <FormInput
            label="Instrument ID"
            value={form.instrumentId}
            onChange={(e) => setForm({ ...form, instrumentId: e.target.value })}
            placeholder="e.g. 477AV-2"
          />
          <FormInput
            label="Calibration Date"
            type="date"
            value={form.calibrationDate}
            onChange={(e) => setForm({ ...form, calibrationDate: e.target.value })}
          />
          <FormInput
            label="Report Number"
            value={form.reportNo}
            onChange={(e) => setForm({ ...form, reportNo: e.target.value })}
            placeholder="e.g. CAL-25100187/PR/01"
          />
          <FormInput
            label="Certificate Number"
            value={form.certificateNo}
            onChange={(e) => setForm({ ...form, certificateNo: e.target.value })}
            placeholder="e.g. 005PWD"
            className="sm:col-span-2"
          />
        </div>
      </Modal>
    </div>
  )
}
