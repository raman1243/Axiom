export interface Env {
  DB: D1Database
  ADMIN_TOKEN: string
  ALLOWED_ORIGINS?: string
}
type ListingBody = { name?: unknown; description?: unknown; phone?: unknown; address?: unknown; district_id?: unknown; category_id?: unknown }
const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } })
const uuid = () => crypto.randomUUID()
function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') ?? ''
  const allowed = (env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(x => x.trim()).filter(Boolean)
  const headers: Record<string, string> = { 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400' }
  if (allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}
function safeText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text || text.length > max) return null
  return text
}
function isValidPhone(value: string | null): boolean {
  return !value || /^[+\d() .-]{7,25}$/.test(value)
}
async function requireAdmin(request: Request, env: Env): Promise<boolean> {
  const expected = env.ADMIN_TOKEN
  const header = request.headers.get('Authorization') ?? ''
  if (!expected || !header.startsWith('Bearer ')) return false
  const supplied = header.slice(7)
  // Constant-time-ish comparison; use an identity provider/session system for production.
  const a = new TextEncoder().encode(supplied)
  const b = new TextEncoder().encode(expected)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}
function response(request: Request, env: Env, data: unknown, status = 200) {
  return json(data, status, corsHeaders(request, env))
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/+$/, '') || '/'
    const method = request.method.toUpperCase()
    const cors = corsHeaders(request, env)
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (url.pathname.startsWith('/api/') && request.headers.get('Origin') && !cors['Access-Control-Allow-Origin']) {
      return response(request, env, { error: 'Origin not allowed' }, 403)
    }
    try {
      if (method === 'GET' && path === '/api/health') return response(request, env, { ok: true, service: 'axom-one-api' })
      if (method === 'GET' && path === '/api/districts') {
        const result = await env.DB.prepare('SELECT id, name_en, name_as, slug FROM districts WHERE active = 1 ORDER BY name_en').all()
        return response(request, env, result.results)
      }
      if (method === 'GET' && path === '/api/categories') {
        const result = await env.DB.prepare('SELECT id, name_en, name_as, slug FROM categories WHERE active = 1 ORDER BY id').all()
        return response(request, env, result.results)
      }
      if (method === 'GET' && path === '/api/listings') {
        const district = url.searchParams.get('district')
        const category = url.searchParams.get('category')
        const q = (url.searchParams.get('q') ?? '').trim().slice(0, 80)
        const conditions = ["l.status = 'published'"]
        const binds: (string | number)[] = []
        if (district) { conditions.push('d.slug = ?'); binds.push(district.slice(0, 80)) }
        if (category) { conditions.push('c.slug = ?'); binds.push(category.slice(0, 80)) }
        if (q) { conditions.push('(l.name LIKE ? OR l.description LIKE ? OR l.address LIKE ?)'); const term = `%${q.replace(/[\\%_]/g, '\\$&')}%`; binds.push(term, term, term) }
        const sql = `SELECT l.id, l.name, l.description, l.phone, l.address, l.verification_status, d.name_en AS district_name, d.slug AS district_slug, c.name_en AS category_name, c.slug AS category_slug FROM listings l JOIN districts d ON d.id = l.district_id JOIN categories c ON c.id = l.category_id WHERE ${conditions.join(' AND ')} ORDER BY l.created_at DESC LIMIT 100`
        const result = await env.DB.prepare(sql).bind(...binds).all()
        return response(request, env, result.results)
      }
      const single = path.match(/^\/api\/listings\/([a-f0-9-]{36})$/i)
      if (method === 'GET' && single) {
        const item = await env.DB.prepare("SELECT l.id, l.name, l.description, l.phone, l.address, l.verification_status, d.name_en AS district_name, d.slug AS district_slug, c.name_en AS category_name, c.slug AS category_slug FROM listings l JOIN districts d ON d.id=l.district_id JOIN categories c ON c.id=l.category_id WHERE l.id=? AND l.status='published'").bind(single[1]).first()
        return item ? response(request, env, item) : response(request, env, { error: 'Listing not found' }, 404)
      }
      if (method === 'POST' && path === '/api/listings') {
        const contentType = request.headers.get('Content-Type') ?? ''
        if (!contentType.includes('application/json')) return response(request, env, { error: 'Content-Type must be application/json' }, 415)
        const length = Number(request.headers.get('Content-Length') ?? '0')
        if (length > 12000) return response(request, env, { error: 'Request too large' }, 413)
        const body = await request.json() as ListingBody
        const name = safeText(body.name, 100)
        const description = safeText(body.description, 600)
        const phone = body.phone === '' || body.phone == null ? null : safeText(body.phone, 25)
        const address = body.address === '' || body.address == null ? null : safeText(body.address, 240)
        const districtId = Number(body.district_id)
        const categoryId = Number(body.category_id)
        if (!name || !description || (body.phone && !phone) || (body.address && !address) || !isValidPhone(phone) || !Number.isInteger(districtId) || !Number.isInteger(categoryId)) {
          return response(request, env, { error: 'Check required fields and input lengths.' }, 400)
        }
        const valid = await env.DB.prepare('SELECT (SELECT COUNT(*) FROM districts WHERE id=? AND active=1) AS district_ok, (SELECT COUNT(*) FROM categories WHERE id=? AND active=1) AS category_ok').bind(districtId, categoryId).first<{ district_ok: number; category_ok: number }>()
        if (!valid?.district_ok || !valid?.category_ok) return response(request, env, { error: 'Choose a valid district and category.' }, 400)
        // Production TODO: persistent per-IP rate limit, CAPTCHA, and abuse monitoring.
        const id = uuid()
        await env.DB.prepare("INSERT INTO listings (id, district_id, category_id, name, description, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')").bind(id, districtId, categoryId, name, description, phone, address).run()
        return response(request, env, { id, status: 'pending', message: 'Submitted for moderator review.' }, 201)
      }
      if (path.startsWith('/api/admin/')) {
        if (!(await requireAdmin(request, env))) return response(request, env, { error: 'Unauthorized' }, 401)
        if (method === 'GET' && path === '/api/admin/pending') {
          const result = await env.DB.prepare("SELECT l.id, l.name, l.description, l.phone, l.address, l.created_at, d.name_en AS district_name, c.name_en AS category_name FROM listings l JOIN districts d ON d.id=l.district_id JOIN categories c ON c.id=l.category_id WHERE l.status='pending' ORDER BY l.created_at ASC LIMIT 100").all()
          return response(request, env, result.results)
        }
        const review = path.match(/^\/api\/admin\/listings\/([a-f0-9-]{36})\/review$/i)
        if (method === 'POST' && review) {
          const body = await request.json() as { decision?: unknown; note?: unknown }
          if (body.decision !== 'publish' && body.decision !== 'reject') return response(request, env, { error: 'Decision must be publish or reject.' }, 400)
          const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
          const id = review[1]
          const result = await env.DB.prepare("UPDATE listings SET status=?, moderator_note=?, reviewed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(body.decision === 'publish' ? 'published' : 'rejected', note || null, id).run()
          if (!result.meta.changes) return response(request, env, { error: 'Pending listing not found or already reviewed.' }, 404)
          await env.DB.prepare('INSERT INTO moderation_logs (id, listing_id, decision, moderator_id, note) VALUES (?, ?, ?, ?, ?)').bind(uuid(), id, body.decision, 'static-admin-token', note || null).run()
          return response(request, env, { id, status: body.decision === 'publish' ? 'published' : 'rejected' })
        }
        return response(request, env, { error: 'Admin route not found.' }, 404)
      }
      return response(request, env, { error: 'Not found' }, 404)
    } catch {
      // Do not leak SQL statements, binding values, or stack traces to public clients.
      return response(request, env, { error: 'Internal server error' }, 500)
    }
  },
}
