import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowDownRight, ArrowRight, BadgeCheck, BookOpen, BriefcaseBusiness, ChevronDown, Compass, Languages, MapPin, Menu, Search, ShieldCheck, ShoppingBag, Store, Trees, Users, X } from 'lucide-react'
import { api } from './api'
import type { Category, District, Listing } from './types'

const fallbackCategories: Category[] = [
  { id: 1, name_en: 'Shops & markets', name_as: 'দোকান-পোহাৰ', slug: 'shops' },
  { id: 2, name_en: 'Home services', name_as: 'ঘৰুৱা সেৱা', slug: 'home-services' },
  { id: 3, name_en: 'Learning', name_as: 'শিক্ষা', slug: 'learning' },
  { id: 4, name_en: 'Food & crafts', name_as: 'খাদ্য আৰু হস্তশিল্প', slug: 'food-crafts' },
  { id: 5, name_en: 'Travel & places', name_as: 'ভ্ৰমণ আৰু ঠাই', slug: 'travel' },
  { id: 6, name_en: 'Opportunities', name_as: 'সুযোগ', slug: 'opportunities' },
]
const demoListings: Listing[] = [
  { id: 'demo-1', name: 'Brahmaputra Handloom Studio', description: 'Handwoven textiles and locally made gifts.', phone: null, address: 'Pilot listing · replace with a verified local business', district_name: 'Sample district', district_slug: '', category_name: 'Food & crafts', category_slug: 'food-crafts', verification_status: 'unverified' },
  { id: 'demo-2', name: 'Community Learning Circle', description: 'Local learning support and study resources.', phone: null, address: 'Illustrative example, not a real listing', district_name: 'Sample district', district_slug: '', category_name: 'Learning', category_slug: 'learning', verification_status: 'unverified' },
  { id: 'demo-3', name: 'Neighbourhood Repair Desk', description: 'A sample listing showing how a local service card works.', phone: null, address: 'Illustrative example, not a real listing', district_name: 'Sample district', district_slug: '', category_name: 'Home services', category_slug: 'home-services', verification_status: 'unverified' },
]
const icons = [ShoppingBag, Store, BookOpen, Trees, Compass, BriefcaseBusiness]

export default function App() {
  const [districts, setDistricts] = useState<District[]>([])
  const [categories, setCategories] = useState<Category[]>(fallbackCategories)
  const [listings, setListings] = useState<Listing[]>(demoListings)
  const [district, setDistrict] = useState('')
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState<'en' | 'as'>('en')
  const [menuOpen, setMenuOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiAvailable, setApiAvailable] = useState(false)

  useEffect(() => {
    Promise.all([api.districts(), api.categories(), api.listings({})]).then(([d, c, l]) => {
      setDistricts(d); setCategories(c.length ? c : fallbackCategories); setListings(l); setApiAvailable(true)
    }).catch(() => { setApiAvailable(false) })
  }, [])

  async function search() {
    setLoading(true)
    try {
      const result = await api.listings({ district, category, q: query })
      setListings(result); setApiAvailable(true)
    } catch {
      const needle = query.toLowerCase()
      setListings(demoListings.filter(x =>
        (!category || x.category_slug === category) &&
        (!needle || `${x.name} ${x.description} ${x.category_name}`.toLowerCase().includes(needle)),
      ))
      setNotice('Showing illustrative demo listings. Connect the API and add approved local listings to go live.')
    } finally { setLoading(false) }
  }

  const shownCategories = categories.length ? categories : fallbackCategories
  const title = language === 'as' ? 'আপোনাৰ ওচৰৰ অসমক আৱিষ্কাৰ কৰক' : 'Discover the Assam around you.'
  const subtitle = language === 'as' ? 'স্থানীয় সেৱা, ব্যৱসায় আৰু নতুন সুযোগ — একে ঠাইতে।' : 'Local services, independent businesses and new opportunities — all in one place.'
  const filtered = useMemo(() => listings, [listings])

  return <div className="app-shell">
    <div className="topline"><span className="woven-mini" /> <span>BUILT FOR ASSAM, ROOTED IN COMMUNITY</span><span className="topline-right">A community discovery project <ArrowDownRight size={13}/></span></div>
    <header className="site-header wrap">
      <a className="brand" href="#" aria-label="AXOM ONE home"><span className="brand-mark">অ</span><span><strong>AXOM<span> ONE</span></strong><small>DISCOVER LOCAL. CONNECT ASSAM.</small></span></a>
      <nav className={menuOpen ? 'nav nav-open' : 'nav'}>
        <a href="#explore">Explore</a><a href="#categories">Categories</a><a href="#about">Our idea</a>
        <button className="language-btn" onClick={() => setLanguage(language === 'en' ? 'as' : 'en')}><Languages size={16}/>{language === 'en' ? 'অসমীয়া' : 'English'}</button>
        <button className="button button-red button-small" onClick={() => setSubmitOpen(true)}>Add a listing <ArrowRight size={15}/></button>
      </nav>
      <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
    </header>

    <main>
      <section className="hero">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot"/> LOCAL KNOWLEDGE. SHARED PROGRESS.</div>
            <h1>{title.split('Assam')[0]}<em>{language === 'as' ? '' : 'Assam.'}</em></h1>
            <p className="hero-sub">{subtitle}</p>
            <div className="hero-search">
              <div className="search-input"><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Try “electrician”, “handloom”, “tutor”…" aria-label="Search local listings"/></div>
              <div className="select-wrap"><MapPin size={17}/><select aria-label="Choose district" value={district} onChange={e => setDistrict(e.target.value)}><option value="">All districts</option>{districts.map(d => <option key={d.id} value={d.slug}>{d.name_en}</option>)}</select><ChevronDown size={15}/></div>
              <button className="button button-red search-submit" onClick={search}><span>Explore</span><ArrowRight size={17}/></button>
            </div>
            <div className="hero-meta"><span><ShieldCheck size={15}/> Community-reviewed listings</span><span><MapPin size={15}/> District-first discovery</span></div>
          </div>
          <div className="hero-art">
            <div className="art-sun"/>
            <div className="art-label art-label-top"><span className="label-dot"/> LOCAL, NOT LOST</div>
            <div className="art-river"/>
            <div className="art-hill hill-one"/><div className="art-hill hill-two"/><div className="art-hill hill-three"/>
            <div className="art-house"><div className="house-roof"/><div className="house-body"><span/><span/><span/></div><div className="house-door"/></div>
            <div className="art-pin pin-one"><MapPin size={18}/></div><div className="art-pin pin-two"><Store size={16}/></div>
            <div className="art-caption"><span>01 / THE LOCAL LAYER</span><strong>Small places.<br/>Big possibilities.</strong></div>
            <div className="art-gamusa"><span/><span/><span/><span/><span/><span/><span/></div>
          </div>
        </div>
        <div className="hero-bottom wrap"><span>FROM YOUR LANE TO YOUR DISTRICT</span><span className="hero-bottom-line"/><span>অসম • ASSAM</span></div>
      </section>

      <section className="quick wrap" id="categories">
        <div className="section-kicker">START WITH WHAT YOU NEED <span>01 — DISCOVER</span></div>
        <div className="category-grid">{shownCategories.slice(0, 6).map((cat, i) => {
          const Icon = icons[i % icons.length]
          return <button className={`category-card ${category === cat.slug ? 'category-active' : ''}`} key={cat.id} onClick={() => { setCategory(category === cat.slug ? '' : cat.slug); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' }) }}>
            <span className="category-icon"><Icon size={21}/></span><span className="category-name">{language === 'as' && cat.name_as ? cat.name_as : cat.name_en}</span><ArrowDownRight size={16} className="category-arrow"/>
          </button>
        })}</div>
      </section>

      <section className="explore-section" id="explore">
        <div className="wrap">
          <div className="section-heading"><div><div className="section-kicker">GOOD THINGS, CLOSER <span>02 — THE COMMUNITY</span></div><h2>Discover what's <em>around.</em></h2><p>Useful local knowledge, made easier to find.</p></div><button className="text-link" onClick={() => { setCategory(''); setQuery(''); setDistrict(''); search() }}>Reset filters <ArrowRight size={16}/></button></div>
          {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={15}/></button></div>}
          <div className="listing-toolbar"><span>{apiAvailable ? `${filtered.length} published listing${filtered.length === 1 ? '' : 's'}` : 'Preview mode · sample cards'}</span><span className="toolbar-status"><span className={`status-dot ${apiAvailable ? 'online' : ''}`}/>{apiAvailable ? 'Live directory' : 'Starter preview'}</span></div>
          <div className="listing-grid">{filtered.length ? filtered.map((item, i) => <article className="listing-card" key={item.id}>
            <div className={`listing-visual visual-${i % 3}`}><span className="listing-number">AO / {String(i + 1).padStart(2, '0')}</span><span className="visual-symbol">{i % 3 === 0 ? <Trees size={42}/> : i % 3 === 1 ? <Store size={42}/> : <BookOpen size={42}/>}</span><span className="visual-tag">{item.category_name}</span></div>
            <div className="listing-content"><div className="listing-location"><MapPin size={13}/>{item.district_name}</div><h3>{item.name}</h3><p>{item.description || 'A local listing shared with the AXOM ONE community.'}</p><div className="listing-bottom">{item.verification_status === 'verified' ? <span className="verified"><BadgeCheck size={14}/> Verified details</span> : <span className="unverified">Community listing</span>}<button aria-label={`View ${item.name}`} className="circle-arrow" onClick={() => setNotice('Listing detail pages are the next MVP step. Contact details are shown only when the listing owner has provided permission.') }><ArrowRight size={16}/></button></div></div>
          </article>) : <div className="empty-state"><Search size={28}/><h3>No listings found yet</h3><p>Try another search or remove a filter. New submissions appear after moderator approval.</p><button className="button button-red" onClick={() => setSubmitOpen(true)}>Submit a local listing <ArrowRight size={16}/></button></div>}</div>
          {loading && <p className="loading" role="status">Searching the directory…</p>}
        </div>
      </section>

      <section className="manifesto wrap" id="about">
        <div className="manifesto-mark">অ</div><div className="manifesto-copy"><div className="section-kicker">A BETTER LOCAL INTERNET <span>03 — WHY AXOM ONE</span></div><h2>Good things are already here.<br/><em>Let's make them easier to find.</em></h2><p>From a family-run shop to a neighbourhood tutor, local knowledge deserves a place that's easy to use, respectful of culture, and built around the people who live here.</p></div><div className="manifesto-aside"><Users size={24}/><strong>Made with the community</strong><span>Submissions are reviewed before they appear publicly.</span><button className="text-link" onClick={() => setSubmitOpen(true)}>Help build the directory <ArrowRight size={16}/></button></div>
      </section>

      <section className="join-band"><div className="wrap join-inner"><div><span className="join-kicker">YOUR COMMUNITY KNOWS BEST</span><h2>Know a place worth finding?</h2><p>Help someone discover a great local business, service or resource.</p></div><button className="button button-cream" onClick={() => setSubmitOpen(true)}>Add a local listing <ArrowRight size={17}/></button><span className="join-watermark">অসম</span></div></section>
    </main>

    <footer className="footer wrap"><a className="brand footer-brand" href="#"><span className="brand-mark">অ</span><span><strong>AXOM<span> ONE</span></strong><small>DISCOVER LOCAL. CONNECT ASSAM.</small></span></a><p>A community discovery project for Assam.<br/><span>Independent project · Listings subject to review.</span></p><div className="footer-links"><a href="#about">About</a><a href="mailto:hello@example.com">Contact placeholder</a><a href="#about">Community guidelines</a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} AXOM ONE · MVP</span><span>Designed with roots, built for everyone.</span></div></footer>

    {submitOpen && <SubmitModal districts={districts} categories={shownCategories} onClose={() => setSubmitOpen(false)} onSubmitted={message => { setSubmitOpen(false); setNotice(message) }}/>}
  </div>
}

function SubmitModal({ districts, categories, onClose, onSubmitted }: { districts: District[]; categories: Category[]; onClose: () => void; onSubmitted: (message: string) => void }) {
  const [form, setForm] = useState({ name: '', description: '', phone: '', address: '', district_id: '', category_id: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function update(key: keyof typeof form, value: string) { setForm(old => ({ ...old, [key]: value })) }
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('')
    if (!form.district_id || !form.category_id) { setError('Choose a district and category.'); return }
    setBusy(true)
    try {
      await api.submit({ ...form, district_id: Number(form.district_id), category_id: Number(form.category_id) })
      onSubmitted('Thanks! Your listing has been submitted for moderator review. It will not appear publicly until approved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit. Check that the API is running.')
    } finally { setBusy(false) }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><div className="section-kicker">COMMUNITY SUBMISSION</div><h2 id="modal-title">Add a local listing.</h2></div><button className="modal-close" onClick={onClose} aria-label="Close"><X/></button></div><p className="modal-intro">Share a useful local business or service. A moderator reviews submissions before publication.</p><form onSubmit={submit} className="submit-form">
    <label>Business or service name<input required maxLength={100} value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Local handloom studio"/></label>
    <label>Short description<textarea required maxLength={600} rows={3} value={form.description} onChange={e => update('description', e.target.value)} placeholder="What should people know?"/></label>
    <div className="form-row"><label>District<select required value={form.district_id} onChange={e => update('district_id', e.target.value)}><option value="">Choose district</option>{districts.map(d => <option key={d.id} value={d.id}>{d.name_en}</option>)}</select></label><label>Category<select required value={form.category_id} onChange={e => update('category_id', e.target.value)}><option value="">Choose category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}</select></label></div>
    <label>Address or locality<input maxLength={240} value={form.address} onChange={e => update('address', e.target.value)} placeholder="Town, locality (optional)"/></label>
    <label>Contact phone (optional)<input type="tel" maxLength={25} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="Only share with permission"/></label>
    <p className="form-consent"><ShieldCheck size={15}/> Submission is not published immediately. Submit only information you are authorized to share.</p>
    {error && <p className="form-error" role="alert">{error}</p>}<button disabled={busy} className="button button-red form-submit">{busy ? 'Submitting…' : 'Submit for review'} <ArrowRight size={16}/></button>
  </form></section></div>
}
