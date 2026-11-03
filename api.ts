import type { Category, District, Listing } from './types'

const base = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}/api${path}`, {
    ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' })) as { error?: string }
    throw new Error(data.error ?? `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}
export const api = {
  districts: () => request<District[]>('/districts'),
  categories: () => request<Category[]>('/categories'),
  listings: (params: { district?: string; category?: string; q?: string }) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v) })
    return request<Listing[]>(`/listings?${query.toString()}`)
  },
  submit: (data: { name: string; description: string; phone: string; address: string; district_id: number; category_id: number }) =>
    request<{ id: string; status: string }>('/listings', { method: 'POST', body: JSON.stringify(data) }),
}
