import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import RowActions from '../components/RowActions'
import { useSearch } from '../hooks/useSearch'
import { customersAPI } from '../services/api'

const EMPTY = { name: '', address: '', email: '', phone: '' }

export default function Customers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { query, setQuery, results } = useSearch(rows, ['name', 'email', 'phone'])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  // Fetch customers on mount and when search changes
  useEffect(() => {
    fetchCustomers()
  }, [query])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await customersAPI.getAll(query)
      setRows(data)
    } catch (err) {
      setError('Failed to fetch customers')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

  const handleDelete = async (row) => {
    if (window.confirm(`Delete customer "${row.name}"?`)) {
      try {
        await customersAPI.delete(row.id)
        setRows((r) => r.filter((c) => c.id !== row.id))
      } catch (err) {
        alert('Failed to delete customer')
        console.error(err)
      }
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    try {
      setLoading(true)
      if (editing) {
        const updated = await customersAPI.update(editing.id, form)
        setRows((r) => r.map((c) => (c.id === editing.id ? updated : c)))
      } else {
        const created = await customersAPI.create(form)
        setRows((r) => [created, ...r])
      }
      setModalOpen(false)
      setForm(EMPTY)
    } catch (err) {
      alert('Failed to save customer')
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
          placeholder="Customer name"
          className="w-full sm:max-w-sm"
        />
        <Button onClick={openAdd} className="w-full sm:w-auto" disabled={loading}>
          <Plus size={18} /> Add Customer
        </Button>
      </div>

      <h2 className="mb-2 mt-6 font-display text-lg font-semibold text-ink">All Customers</h2>

      <DataTable
        rowKey={(r) => r.id}
        data={results}
        emptyMessage={loading ? 'Loading...' : 'No customers match your search.'}
        columns={[
          { key: 'sr', header: 'Sr', render: (_, i) => i + 1, className: 'text-ink-faint w-12' },
          { key: 'name', header: 'Name', className: 'font-medium max-w-[16rem]' },
          {
            key: 'address',
            header: 'Address',
            className: 'text-ink-soft text-xs max-w-sm',
            render: (row) => row.address || '-',
          },
          { key: 'email', header: 'Email', className: 'text-ink-soft', render: (row) => row.email || '-' },
          { key: 'phone', header: 'Phone', render: (row) => row.phone || '-' },
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
          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
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
