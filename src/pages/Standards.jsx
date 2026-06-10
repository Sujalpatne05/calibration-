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
  instrument: '',
  calibrationDate: '',
  reportNo: '',
  certificateNo: '',
}

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

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

  useEffect(() => {
    fetchStandards()
    fetchInstruments()
  }, [query])

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
    setForm({ ...row })
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

  const handleSave = async () => {
    if (!form.instrumentId || !form.certificateNo.trim()) return
    try {
      setLoading(true)
      if (editing) {
        const updated = await standardsAPI.update(editing.id, form)
        setRows((r) => r.map((x) => (x.id === editing.id ? updated : x)))
      } else {
        const created = await standardsAPI.create(form)
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
        data={results}
        emptyMessage={loading ? 'Loading...' : 'No standards match your search.'}
        columns={[
          { key: 'sr', header: 'Sr', render: (_, i) => i + 1, className: 'text-ink-faint w-12' },
          { key: 'instrument', header: 'Instrument', className: 'font-medium' },
          { key: 'instrumentId', header: 'Instrument ID', className: 'text-ink-soft' },
          { key: 'calibrationDate', header: 'Cal. Date', render: (r) => fmtDate(r.calibrationDate) },
          { key: 'reportNo', header: 'Report No', className: 'text-ink-soft' },
          { key: 'certificateNo', header: 'Certificate No', className: 'font-medium' },
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
        title={editing ? 'Edit Standard' : 'Add Standard'}
        maxWidth="max-w-lg"
        footer={
          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">Instrument</label>
            <select
              value={form.instrumentId}
              onChange={(e) => {
                const instrument = instruments.find((i) => i.id === parseInt(e.target.value))
                setForm({ ...form, instrumentId: parseInt(e.target.value), instrument: instrument?.name || '' })
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select instrument…</option>
              {instruments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
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
            placeholder="e.g. CAL-001"
          />
          <FormInput
            label="Certificate Number"
            value={form.certificateNo}
            onChange={(e) => setForm({ ...form, certificateNo: e.target.value })}
            placeholder="e.g. CERT-001"
          />
        </div>
      </Modal>
    </div>
  )
}
