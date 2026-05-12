const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed', error: 'Unknown error' }))
    throw new Error(error.error || error.message || `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── Auth ────────────────────────────────────────────────────────

export async function signUp(data: { name: string; email: string; password: string }) {
  return request<{ success: boolean; user: { id: string; email: string; name: string } }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function signIn(data: { email: string; password: string }) {
  return request<{ user: any }>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function resetPassword(data: { email: string; newPassword: string }) {
  return request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── Documents ───────────────────────────────────────────────────

export async function uploadDocument(formData: FormData) {
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser sets it with boundary for FormData
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<{
    success: boolean
    document: {
      id: string
      filename: string
      fileType: string
      fileSize: number
      status: string
      uploadDate: string
      textLength: number
      textContent?: string
    }
  }>
}

export async function getDocument(id: string) {
  return request<{ document: any }>(`/documents/${id}`)
}

export async function deleteDocument(id: string) {
  return request<{ message: string }>(`/documents/${id}`, {
    method: 'DELETE',
  })
}

// ─── Audio ───────────────────────────────────────────────────────

export async function convertAudio(data: { documentId: string; voiceChoice: string }) {
  return request<{
    success: boolean
    audioFile: {
      id: string
      voiceChoice: string
      voiceName: string
      fileUrl: string
      duration: number
      fileSize: number
      status: string
    }
  }>('/audio/convert', {
    method: 'POST',
    body: JSON.stringify({
      document_id: data.documentId,
      voice_choice: data.voiceChoice,
    }),
  })
}

export async function downloadAudio(id: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/audio/${id}/download`)
  if (!res.ok) throw new Error('Download failed')
  return res.blob()
}

// ─── Payments ────────────────────────────────────────────────────

export async function createPaymentSession(data: { plan: string; billing: 'monthly' | 'annual' }) {
  return request<{ success: boolean; sessionUrl: string; sessionId: string }>('/payments/create-session', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getPaymentStatus(id: string) {
  return request<{ status: string; plan: string }>(`/payments/${id}/status`)
}

// ─── Admin ───────────────────────────────────────────────────────

export interface AdminAnalytics {
  totalUsers: number
  totalDocuments: number
  totalConversions: number
  totalRevenue: number
  recentSignups: number
  recentConversions: number
  usersByPlan: { plan: string; count: number }[]
  documentsByStatus: { status: string; count: number }[]
}

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  plan: string
  oauthProvider: string | null
  documentCount: number
  paymentCount: number
  createdAt: string
  updatedAt: string
}

export interface SystemHealth {
  uptime: {
    seconds: number
    formatted: string
  }
  database: {
    sizeBytes: number
    sizeMB: number
  }
  storage: {
    uploadsBytes: number
    uploadsMB: number
    audioOutputBytes: number
    audioOutputMB: number
    totalBytes: number
    totalMB: number
  }
  memory: {
    process: {
      heapUsedMB: number
      heapTotalMB: number
      rssMB: number
    }
    system: {
      totalMB: number
      freeMB: number
      usedPercent: number
    }
  }
  nodeVersion: string
  platform: string
}

export interface MaintenanceResult {
  success: boolean
  message: string
  details?: any
}

export async function getAdminAnalytics() {
  const res = await request<{ analytics: AdminAnalytics }>('/admin/analytics')
  return res.analytics
}

export async function getAdminUsers(params?: { search?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.page) query.set('page', params.page.toString())
  if (params?.limit) query.set('limit', params.limit.toString())
  const qs = query.toString()
  return request<{ users: AdminUser[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/admin/users${qs ? `?${qs}` : ''}`)
}

export async function updateUser(id: string, data: { role?: string; plan?: string; name?: string }) {
  return request<{ success: boolean; user: AdminUser; message: string }>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteUser(id: string) {
  return request<{ success: boolean; message: string }>(`/admin/users/${id}`, {
    method: 'DELETE',
  })
}

export async function getSystemHealth() {
  const res = await request<{ systemHealth: SystemHealth }>('/admin/system-health')
  return res.systemHealth
}

export async function runMaintenance(action: string) {
  return request<MaintenanceResult>('/admin/maintenance', {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}
