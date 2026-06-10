// API Service - Centralized API calls for all endpoints
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_VERSION = '1.0.0'

// Get token from localStorage
const getToken = () => {
  const token = localStorage.getItem('token')
  if (token) {
    console.log(`[API] Retrieved token from localStorage: ${token.substring(0, 30)}...`)
  }
  return token
}

// Make API call with auth
const apiCall = async (endpoint, options = {}) => {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add auth header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`
    console.log(`[API] Adding token to ${endpoint}: ${token.substring(0, 30)}...`)
  } else {
    console.warn(`[API] No token available for ${endpoint}`)
  }

  // Add cache-busting parameter for GET requests
  let url = `${API_BASE}${endpoint}`
  if (!options.method || options.method === 'GET') {
    const separator = endpoint.includes('?') ? '&' : '?'
    url = `${url}${separator}_t=${Date.now()}`
  }

  console.log(`[API] Calling ${options.method || 'GET'} ${url}`, { 
    hasToken: !!token,
    headers: Object.keys(headers)
  })

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    console.error(`[API] Error [${response.status}]: ${endpoint}`, {
      token: token ? `present (${token.length} chars)` : 'missing',
      status: response.statusText,
    })
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}

// ===== CUSTOMERS API =====
export const customersAPI = {
  // GET all customers with optional search
  getAll: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    return apiCall(`/customers${params}`)
  },

  // POST create new customer
  create: (data) => apiCall('/customers', { method: 'POST', body: JSON.stringify(data) }),

  // PUT update customer
  update: (id, data) => apiCall(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // DELETE customer
  delete: (id) => apiCall(`/customers/${id}`, { method: 'DELETE' }),
}

// ===== INSTRUMENTS API =====
export const instrumentsAPI = {
  // GET all instruments with optional search and ignored filter
  getAll: (search = '', ignored = null) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (ignored !== null) params.append('ignored', ignored)
    const queryStr = params.toString()
    return apiCall(`/instruments${queryStr ? '?' + queryStr : ''}`)
  },

  // POST create new instrument
  create: (data) => apiCall('/instruments', { method: 'POST', body: JSON.stringify(data) }),

  // PUT update instrument
  update: (id, data) => apiCall(`/instruments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // DELETE instrument
  delete: (id) => apiCall(`/instruments/${id}`, { method: 'DELETE' }),
}

// ===== STANDARDS API =====
export const standardsAPI = {
  // GET all standards with optional search
  getAll: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    return apiCall(`/standards${params}`)
  },

  // POST create new standard
  create: (data) => apiCall('/standards', { method: 'POST', body: JSON.stringify(data) }),

  // PUT update standard
  update: (id, data) => apiCall(`/standards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // DELETE standard
  delete: (id) => apiCall(`/standards/${id}`, { method: 'DELETE' }),
}

// ===== INVOICES API =====
export const invoicesAPI = {
  // GET all invoices with optional search and date range
  getAll: (search = '', fromDate = '', toDate = '') => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (fromDate) params.append('from', fromDate)
    if (toDate) params.append('to', toDate)
    const queryStr = params.toString()
    return apiCall(`/invoices${queryStr ? '?' + queryStr : ''}`)
  },

  // GET export invoices as CSV
  exportCSV: (search = '', fromDate = '', toDate = '') => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (fromDate) params.append('from', fromDate)
    if (toDate) params.append('to', toDate)
    const queryStr = params.toString()
    return apiCall(`/invoices/export-csv${queryStr ? '?' + queryStr : ''}`)
  },
}

// ===== REPORTS API =====
export const reportsAPI = {
  // GET all reports with optional type filter and search
  getAll: (type = '', search = '') => {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (search) params.append('search', search)
    const queryStr = params.toString()
    return apiCall(`/reports${queryStr ? '?' + queryStr : ''}`)
  },

  // GET single report by ID
  getById: (id) => apiCall(`/reports/${id}`),

  // POST create new report
  create: (data) => apiCall('/reports', { method: 'POST', body: JSON.stringify(data) }),

  // PUT update report
  update: (id, data) => apiCall(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // DELETE report
  delete: (id) => apiCall(`/reports/${id}`, { method: 'DELETE' }),
}

// ===== DASHBOARD API =====
export const dashboardAPI = {
  // GET KPIs
  getKPIs: () => apiCall('/dashboard/kpis'),

  // GET quick tasks
  getQuickTasks: () => apiCall('/dashboard/quick-tasks'),

  // GET recent activities
  getRecentActivities: () => apiCall('/dashboard/recent-activities'),
}

// ===== AUTH API =====
export const authAPI = {
  // POST login (no auth required)
  login: async (username, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`)
    }
    return response.json()
  },

  // POST logout
  logout: () => apiCall('/auth/logout', { method: 'POST' }),

  // GET validate session
  validateSession: () => apiCall('/auth/validate-session'),

  // POST change password
  changePassword: (currentPassword, newPassword) =>
    apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
}
