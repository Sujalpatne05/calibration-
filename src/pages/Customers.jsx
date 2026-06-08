import { useState } from 'react'
import { Plus } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import RowActions from '../components/RowActions'
import { useSearch } from '../hooks/useSearch'
import { customers as seed } from '../data/customers'

const EMPTY = { name: '', address: '', email: '', phone: '' }

export default function Customers() {
  const [rows, setRows] = useState(seed)
  const { query, setQuery, results } = useSearch(rows, ['name', 'email', 'phone'])
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
    setForm({ name: row.name, address: row.address, email: row.email, phone: row.phone })
    setModalOpen(true)
  }

  const handleDelete = (row) => {
    if (window.confirm(`Delete customer “${row.name}”?`)) {
      setRows((r) => r.filter((c) => c.id !== row.id))
    }
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editing) {
      setRows((r) => r.map((c) => (c.id === editing.id ? { ...c, ...form } : c)))
    } else {
      setRows((r) => [{ id: Date.now(), ...form }, ...r])
    }
    setModalOpen(false)
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Customer name"
          className="w-full sm:max-w-sm"
        />
        <Button onClick={openAdd} className="w-full sm:w-auto">
          <Plus size={18} /> Add Customer
        </Button>
      </div>

      <h2 className="mb-2 mt-6 font-display text-lg font-semibold text-ink">All Customers</h2>

      <DataTable
        rowKey={(r) => r.id}
        data={results}
        emptyMessage="No customers match your search."
        columns={[
          { key: 'sr', header: 'Sr', render: (_, i) => i + 1, className: 'text-ink-faint w-12' },
          { key: 'name', header: 'Name', className: 'font-medium max-w-[16rem]' },
          {
            key: 'address',
            header: 'Address',
            className: 'text-ink-soft text-xs max-w-sm',
          },
          { key: 'email', header: 'Email', className: 'text-ink-soft' },
          { key: 'phone', header: 'Phone' },
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
        title={editing ? 'Edit Customer' : 'Add Customer'}
        footer={
          <Button className="w-full" onClick={handleSave}>
            Save
          </Button>
        }
      >
        <FormInput
          label="Customer Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
        />
        <FormInput
          label="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Address"
        />
        <FormInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
        />
        <FormInput
          label="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Phone Number"
        />
      </Modal>
    </div>
  )
}
