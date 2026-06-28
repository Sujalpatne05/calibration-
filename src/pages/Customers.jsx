import { useState, useEffect } from 'react'
import { Plus, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import RowActions from '../components/RowActions'
import { useSearch } from '../hooks/useSearch'
import { customersAPI, invoicesAPI } from '../services/api'

const EMPTY = { name: '', address: '', email: '', phone: '' }
const ITEMS_PER_PAGE = 10

export default function Customers() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { query, setQuery, results } = useSearch(rows, ['name', 'email', 'phone'])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerInvoices, setCustomerInvoices] = useState([])
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

  // Fetch customers on mount only
  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await customersAPI.getAll()
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
    setForm({ 
      name: row.name || '', 
      address: row.address || '', 
      email: row.email || '', 
      phone: row.phone || '' 
    })
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

  const viewInvoices = async (customer) => {
    try {
      setSelectedCustomer(customer)
      setCustomerInvoices([])
      setInvoiceModalOpen(true)
      
      // Fetch invoices for this customer
      const data = await invoicesAPI.getAll(customer.name)
      setCustomerInvoices(data)
    } catch (err) {
      console.error('Error fetching invoices:', err)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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
        data={paginatedResults}
        emptyMessage={loading ? 'Loading...' : 'No customers match your search.'}
        columns={[
          { key: 'sr', header: 'Sr', render: (_, i) => startIndex + i + 1, className: 'text-ink-faint w-12' },
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
            key: 'invoiceHistory',
            header: 'Invoice History',
            align: 'center',
            render: (row) => {
              const count = row._count?.invoices || row.invoices?.length || 0
              return (
                <button
                  type="button"
                  onClick={() => viewInvoices(row)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-brand-50 hover:text-brand-600"
                  title={`View ${count} invoice${count !== 1 ? 's' : ''} for ${row.name}`}
                >
                  <FileText size={18} />
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
                    {count}
                  </span>
                </button>
              )
            },
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
          <div className="text-xs sm:text-sm text-ink-soft text-center sm:text-left">
            Showing <span className="font-medium text-ink">{startIndex + 1}</span> to{' '}
            <span className="font-medium text-ink">{Math.min(endIndex, results.length)}</span> of{' '}
            <span className="font-medium text-ink">{results.length}</span> customers
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
                // Show first page, last page, current page, and pages around current
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                
                // Show ellipsis
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
        title={editing ? 'Update Customer' : 'Add Customer'}
        footer={
          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : editing ? 'Update' : 'Save'}
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

      {/* Invoice History Modal */}
      <Modal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title={`Invoice History - ${selectedCustomer?.name || ''}`}
        maxWidth="max-w-4xl"
      >
        {customerInvoices.length === 0 ? (
          <div className="py-8 text-center text-ink-faint">
            No invoices found for this customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-ink">Invoice Number</th>
                  <th className="px-4 py-3 font-semibold text-ink">Date</th>
                  <th className="px-4 py-3 font-semibold text-ink">Due Date</th>
                  <th className="px-4 py-3 font-semibold text-ink">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-ink">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customerInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-ink">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatDate(invoice.issueDate)}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatDate(invoice.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {invoice.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setInvoiceModalOpen(false)
                          navigate(`/report?search=${encodeURIComponent(invoice.invoiceNumber)}`)
                        }}
                        className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}
