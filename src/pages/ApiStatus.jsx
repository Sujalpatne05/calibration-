import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  RefreshCw,
  Save,
  Server,
  ShieldCheck,
  Wifi,
  XCircle,
} from 'lucide-react'
import Button from '../components/Button'
import { erpnextAPI } from '../services/api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const ERP_PO_API_URL = import.meta.env.VITE_ERPNEXT_PO_API_URL || `${API_BASE}/erpnext/purchase-orders`
const PO_ITEMS_PER_PAGE = 5

const CHECKS = [
  {
    id: 'api',
    label: 'API Gateway',
    description: 'Core backend service',
    endpoint: '/health',
    icon: Server,
  },
  {
    id: 'auth',
    label: 'Authentication',
    description: 'Session validation endpoint',
    endpoint: '/auth/validate-session',
    icon: ShieldCheck,
    requiresAuth: true,
  },
  {
    id: 'dashboard',
    label: 'Dashboard Data',
    description: 'KPI and activity service',
    endpoint: '/dashboard/kpis',
    icon: Activity,
    requiresAuth: true,
  },
  {
    id: 'customers',
    label: 'Customer Records',
    description: 'Database-backed customer API',
    endpoint: '/customers',
    icon: Database,
    requiresAuth: true,
  },
]

const STATUS_STYLES = {
  online: {
    label: 'Online',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  degraded: {
    label: 'Degraded',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  offline: {
    label: 'Offline',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
  },
  checking: {
    label: 'Checking',
    icon: RefreshCw,
    className: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
  },
}

const fmtTime = (value) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value)
}

const fmtDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const getStatus = (ok, ms) => {
  if (!ok) return 'offline'
  return ms > 1200 ? 'degraded' : 'online'
}

const normalizePurchaseOrders = (payload) => {
  const rawRows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.message)
        ? payload.message
        : Array.isArray(payload?.purchaseOrders)
          ? payload.purchaseOrders
          : []

  return rawRows.map((po, index) => ({
    id: po.id || po.name || po.poNumber || po.purchase_order || index,
    poNumber: po.poNumber || po.po_number || po.purchase_order || po.name || '-',
    poDate: po.poDate || po.po_date || po.transaction_date || po.purchase_date || '',
    customer: po.customer || po.customerName || po.customer_name || po.company || '-',
    invoiceNumber: po.invoiceNumber || po.invoice_number || po.name || '-',
    invoiceDate: po.invoiceDate || po.invoice_date || po.posting_date || po.date || '',
    quantity: po.totalQuantity || po.quantity || po.qty || '-',
    itemCount: po.itemCount || po.items?.length || 0,
    status: po.status || po.workflow_state || po.docstatus || '-',
  }))
}

function StatusPill({ status }) {
  const style = STATUS_STYLES[status]
  const Icon = style.icon

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style.className}`}>
      <Icon size={14} className={status === 'checking' ? 'animate-spin' : ''} />
      {style.label}
    </span>
  )
}

function ApiCard({ check }) {
  const Icon = check.icon

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-200 hover:shadow-card-hover animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 text-brand-600 transition group-hover:scale-105">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-ink">{check.label}</h3>
            <p className="mt-0.5 text-xs text-ink-faint">{check.description}</p>
          </div>
        </div>
        <StatusPill status={check.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
        <div>
          <p className="text-xs font-medium text-ink-faint">Latency</p>
          <p className="mt-1 font-semibold text-ink">{check.ms ? `${check.ms} ms` : '-'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-ink-faint">HTTP</p>
          <p className="mt-1 font-semibold text-ink">{check.httpStatus || '-'}</p>
        </div>
      </div>

      <p className="mt-4 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink-soft">
        {API_BASE}{check.endpoint}
      </p>
    </div>
  )
}

export default function ApiStatus() {
  const [checks, setChecks] = useState(() => CHECKS.map((check) => ({ ...check, status: 'checking' })))
  const [erpPo, setErpPo] = useState({
    status: 'checking',
    httpStatus: '-',
    ms: null,
    rows: [],
    error: '',
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)
  const [poPage, setPoPage] = useState(1)

  const summary = useMemo(() => {
    const allStatuses = [...checks.map((check) => check.status), erpPo.status]
    const online = allStatuses.filter((status) => status === 'online').length
    const degraded = allStatuses.filter((status) => status === 'degraded').length
    const offline = allStatuses.filter((status) => status === 'offline').length

    return {
      online,
      degraded,
      offline,
      total: allStatuses.length,
      overall: offline > 0 ? 'offline' : degraded > 0 ? 'degraded' : 'online',
    }
  }, [checks, erpPo.status])

  const runChecks = async () => {
    setLoading(true)
    setChecks((current) => current.map((check) => ({ ...check, status: 'checking' })))
    setErpPo((current) => ({ ...current, status: 'checking', error: '' }))

    const token = localStorage.getItem('token')
    const checksPromise = Promise.all(
      CHECKS.map(async (check) => {
        const started = performance.now()

        try {
          const response = await fetch(`${API_BASE}${check.endpoint}`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              ...(check.requiresAuth && token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })
          const ms = Math.round(performance.now() - started)

          return {
            ...check,
            status: getStatus(response.ok, ms),
            httpStatus: response.status,
            ms,
          }
        } catch (error) {
          return {
            ...check,
            status: 'offline',
            httpStatus: 'Failed',
            ms: Math.round(performance.now() - started),
          }
        }
      })
    )

    const erpStarted = performance.now()
    const erpPromise = fetch(ERP_PO_API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (response) => {
        const ms = Math.round(performance.now() - erpStarted)
        let payload = null

        try {
          payload = await response.json()
        } catch {
          payload = null
        }

        return {
          status: getStatus(response.ok, ms),
          httpStatus: response.status,
          ms,
          rows: response.ok ? normalizePurchaseOrders(payload) : [],
          error: response.ok ? '' : response.statusText || 'ERPNext API request failed',
        }
      })
      .catch((error) => ({
        status: 'offline',
        httpStatus: 'Failed',
        ms: Math.round(performance.now() - erpStarted),
        rows: [],
        error: error?.message || 'ERPNext API is not reachable',
      }))

    const [results, erpResult] = await Promise.all([checksPromise, erpPromise])

    setChecks(results)
    setErpPo(erpResult)
    setPoPage(1)
    setLastChecked(new Date())
    setLoading(false)
  }

  const syncErpInvoices = async () => {
    try {
      setSyncing(true)
      setSyncResult(null)
      const result = await erpnextAPI.syncInvoices(50)
      setSyncResult({
        type: 'success',
        message: `Synced ${result.saved || 0} of ${result.fetched || 0} ERPNext invoices into DB.`,
      })
      await runChecks()
    } catch (error) {
      setSyncResult({
        type: 'error',
        message: error?.message || 'Failed to sync ERPNext invoices.',
      })
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    runChecks()
  }, [])

  const poTotalPages = Math.max(1, Math.ceil(erpPo.rows.length / PO_ITEMS_PER_PAGE))
  const poStartIndex = (poPage - 1) * PO_ITEMS_PER_PAGE
  const poEndIndex = poStartIndex + PO_ITEMS_PER_PAGE
  const paginatedPoRows = erpPo.rows.slice(poStartIndex, poEndIndex)

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-up">
      <section className="overflow-hidden rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-sm">
                <Wifi size={22} />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">API Status</h1>
                <p className="mt-1 text-sm text-ink-faint">Live health checks for connected backend services</p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button onClick={syncErpInvoices} disabled={syncing || loading} variant="secondary" className="w-full sm:w-auto">
              <Save size={18} className={syncing ? 'animate-pulse' : ''} />
              {syncing ? 'Syncing...' : 'Sync ERP'}
            </Button>
            <Button onClick={runChecks} disabled={loading || syncing} className="w-full sm:w-auto">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {syncResult && (
          <div
            className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ring-1 ${
              syncResult.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                : 'bg-red-50 text-red-700 ring-red-100'
            }`}
          >
            {syncResult.message}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 p-4">
            <p className="text-xs font-semibold uppercase text-ink-faint">Overall</p>
            <div className="mt-2">
              <StatusPill status={loading ? 'checking' : summary.overall} />
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-700/70">Online</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{summary.online}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase text-amber-700/70">Degraded</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{summary.degraded}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-ink-faint">Last Checked</p>
            <p className="mt-2 font-semibold text-ink">{fmtTime(lastChecked)}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 text-brand-600">
              <FileText size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-ink sm:text-xl">ERPNext Purchase Orders</h2>
              <p className="mt-1 text-sm text-ink-faint">
                Customer-provided ERPNext API feed for PO data
              </p>
            </div>
          </div>
          <StatusPill status={loading ? 'checking' : erpPo.status} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-ink-faint">PO Count</p>
            <p className="mt-1 text-2xl font-bold text-ink">{erpPo.rows.length}</p>
          </div>
          <div className={`rounded-xl p-4 ${erpPo.status === 'online' ? 'bg-emerald-50' : erpPo.status === 'degraded' ? 'bg-amber-50' : 'bg-red-50'}`}>
            <p className="text-xs font-semibold uppercase text-ink-faint">API Status</p>
            <p className={`mt-1 text-lg font-bold ${erpPo.status === 'online' ? 'text-emerald-700' : erpPo.status === 'degraded' ? 'text-amber-700' : 'text-red-700'}`}>
              {STATUS_STYLES[loading ? 'checking' : erpPo.status].label}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-ink-faint">HTTP</p>
            <p className="mt-1 font-semibold text-ink">{erpPo.httpStatus}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-ink-faint">Latency</p>
            <p className="mt-1 font-semibold text-ink">{erpPo.ms ? `${erpPo.ms} ms` : '-'}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink-soft">
          <span className="font-semibold text-ink">Endpoint:</span> {ERP_PO_API_URL}
        </div>
        {erpPo.error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-100">
            {erpPo.error}
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-ink-faint">
                <th className="px-3 py-3 font-semibold">SR</th>
                <th className="px-3 py-3 font-semibold">PO Number</th>
                <th className="px-3 py-3 font-semibold">Customer</th>
                <th className="px-3 py-3 font-semibold">Invoice No</th>
                <th className="px-3 py-3 font-semibold">Invoice Date</th>
                <th className="px-3 py-3 font-semibold">Qty</th>
                <th className="px-3 py-3 font-semibold">ERP Status</th>
                <th className="px-3 py-3 font-semibold">API</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPoRows.length > 0 ? (
                paginatedPoRows.map((po, index) => (
                  <tr key={po.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 text-ink-faint">{poStartIndex + index + 1}</td>
                    <td className="px-3 py-3 font-semibold text-ink">{po.poNumber}</td>
                    <td className="px-3 py-3 text-ink-soft">{po.customer}</td>
                    <td className="px-3 py-3 text-ink-soft">{po.invoiceNumber}</td>
                    <td className="px-3 py-3 text-ink-soft">{fmtDate(po.invoiceDate || po.poDate)}</td>
                    <td className="px-3 py-3 text-ink-soft">
                      {po.quantity}
                      {po.itemCount ? <span className="ml-1 text-xs text-ink-faint">({po.itemCount} items)</span> : null}
                    </td>
                    <td className="px-3 py-3 text-ink-soft">{po.status}</td>
                    <td className="px-3 py-3">
                      <StatusPill status={erpPo.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-ink-faint">
                    No PO data received. When the customer ERPNext API is online, purchase orders will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {erpPo.rows.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-soft">
              Showing <span className="font-semibold text-ink">{poStartIndex + 1}</span> to{' '}
              <span className="font-semibold text-ink">{Math.min(poEndIndex, erpPo.rows.length)}</span> of{' '}
              <span className="font-semibold text-ink">{erpPo.rows.length}</span> purchase orders
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPoPage((page) => Math.max(1, page - 1))}
                disabled={poPage === 1}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-ink">
                {poPage} / {poTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setPoPage((page) => Math.min(poTotalPages, page + 1))}
                disabled={poPage === poTotalPages}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {checks.map((check, index) => (
          <div key={check.id} style={{ animationDelay: `${index * 0.05}s` }}>
            <ApiCard check={check} />
          </div>
        ))}
      </section>
    </div>
  )
}
