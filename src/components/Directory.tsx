'use client'

import { useState } from 'react'
import { Contact, Intent } from '@/types'

const nudgeTypes = [
  { id: 'checkin', label: '👋 just checking in', desc: 'casual, no agenda' },
  { id: 'article', label: '📰 share an article', desc: 'relevant to what you discussed' },
  { id: 'intro', label: '🤝 make an intro', desc: 'connect with someone similar' },
  { id: 'custom', label: '✏️ custom', desc: 'describe what you want' },
]

interface DirectoryProps {
  contacts: Contact[]
  onAddPerson: () => void
  onGetNudge: (contact: Contact, nudgeType: string, customText?: string) => void
  onMarkContacted: (id: string) => void
  onShowHistory: (contact: Contact) => void
}

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
}

function urgencyLevel(days: number): 'warm' | 'cooling' | 'cold' {
  if (days < 14) return 'warm'
  if (days <= 30) return 'cooling'
  return 'cold'
}

function urgencyColor(level: string): string {
  if (level === 'warm') return '#81b29a'
  if (level === 'cooling') return '#f2b155'
  return '#e07a5f'
}

function intentBadgeClass(intent: Intent | string): string {
  const i = intent as string
  if (i === 'job') return 'bg-blue-50 text-blue-700'
  if (i === 'mentorship') return 'bg-green-50 text-green-700'
  if (i === 'connection') return 'bg-orange-50 text-orange-700'
  return 'bg-gray-50 text-gray-600'
}

function intentLabel(intent: Intent | string): string {
  switch (intent) {
    case 'job':
      return '🚀 Job referral'
    case 'mentorship':
      return '🌱 Mentorship'
    case 'connection':
      return '☕ Connected'
    case 'unsure':
      return '🤷 Unsure'
    default:
      return String(intent)
  }
}

function ContactCard({
  contact,
  nudgeExpanded,
  toggleNudge,
  onGetNudge,
  onMarkContacted,
  onShowHistory,
  nudgeLoading,
}: {
  contact: Contact
  nudgeExpanded: boolean
  toggleNudge: () => void
  onGetNudge: (c: Contact, t: string, ct?: string) => void
  onMarkContacted: (id: string) => void
  onShowHistory: (c: Contact) => void
  nudgeLoading: boolean
}) {
  const days = daysSince(contact.last_contact)
  const urg = urgencyLevel(days)
  const dotColor = urgencyColor(urg)
  const snippet = contact.talked_about.length > 60
    ? `${contact.talked_about.slice(0, 60)}…`
    : contact.talked_about

  const noteSnippet =
    contact.additional_notes && contact.additional_notes.length > 0
      ? contact.additional_notes.length > 60
        ? `${contact.additional_notes.slice(0, 60)}…`
        : contact.additional_notes
      : null

  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')

  const r = contact.role?.trim()
  const co = contact.company?.trim()
  const roleLine = r && co ? `${r} at ${co}` : r || co ? (r ?? co) : null

  const daysLabel =
    days === 0 ? 'today' : `${days}d ago`

  const generateNudge = () => {
    if (!selectedType) return
    onGetNudge(contact, selectedType, selectedType === 'custom' ? customText : undefined)
    toggleNudge()
    setSelectedType(null)
    setCustomText('')
  }

  return (
    <div
      className="bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow border-[#f0e6de]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold font-sans truncate" style={{ color: '#3d2314' }}>
            {contact.name}
          </span>
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
            title={urg}
            aria-hidden
          />
        </div>
      </div>

      {roleLine && (
        <p className="text-xs font-sans mb-2" style={{ color: '#9a7060' }}>
          {roleLine}
        </p>
      )}

      <span
        className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full font-sans mb-2 ${intentBadgeClass(contact.intent)}`}
      >
        {intentLabel(contact.intent)}
      </span>

      <p className="text-xs font-sans mb-2 font-semibold" style={{ color: dotColor }}>
        {daysLabel}
      </p>

      <p className="text-xs font-sans mb-2 leading-relaxed line-clamp-2" style={{ color: '#9a7060' }}>
        {snippet}
      </p>
      {noteSnippet && (
        <p className="text-xs font-sans mb-4 italic leading-relaxed line-clamp-2" style={{ color: '#b8a098' }}>
          {noteSnippet}
        </p>
      )}

      <div className="flex gap-2 flex-wrap pt-1">
        <button
          type="button"
          onClick={() => {
            if (!nudgeLoading) toggleNudge()
          }}
          disabled={nudgeLoading}
          className="text-xs font-sans font-semibold px-3 py-1.5 rounded-lg border cursor-pointer disabled:opacity-50"
          style={{
            borderColor: nudgeExpanded ? '#c17d5a' : '#e8ddd5',
            backgroundColor: nudgeExpanded ? '#fff0e8' : '#faf5f1',
            color: '#c17d5a',
          }}
        >
          nudge
        </button>
        <button
          type="button"
          onClick={() => onShowHistory(contact)}
          className="text-xs font-sans px-3 py-1.5 rounded-lg border cursor-pointer"
          style={{ backgroundColor: '#f0f0ff', borderColor: '#d8d8f0', color: '#6060aa' }}
        >
          history
        </button>
        <button
          type="button"
          onClick={() => onMarkContacted(contact.id)}
          className="text-xs font-sans px-3 py-1.5 rounded-lg border cursor-pointer"
          style={{ backgroundColor: '#f0f7f4', borderColor: '#d0e8dc', color: '#4a8c6a' }}
          title="mark as contacted today"
        >
          ✓
        </button>
      </div>

      {nudgeExpanded && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#f0e6de' }}>
          <p className="text-xs font-sans font-semibold uppercase tracking-widest mb-2" style={{ color: '#9a7060' }}>
            what kind of nudge?
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {nudgeTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className="text-left rounded-lg px-3 py-2 border text-xs font-sans transition-colors"
                style={{
                  backgroundColor: selectedType === type.id ? '#fff0e8' : '#ffffff',
                  borderColor: selectedType === type.id ? '#c17d5a' : '#e8ddd5',
                  color: selectedType === type.id ? '#c17d5a' : '#7a5c4a',
                }}
              >
                <div className="font-semibold">{type.label}</div>
                <div style={{ color: '#b8a098' }}>{type.desc}</div>
              </button>
            ))}
          </div>
          {selectedType === 'custom' && (
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="describe the nudge you want..."
              rows={2}
              className="w-full rounded-lg px-3 py-2 text-xs font-sans border mb-3 resize-none"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e8ddd5',
                color: '#3d2314',
                outline: 'none',
              }}
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={generateNudge}
              disabled={
                !selectedType || (selectedType === 'custom' && !customText.trim()) || nudgeLoading
              }
              className="flex-1 py-2 rounded-lg text-xs font-sans font-semibold transition-opacity"
              style={{
                backgroundColor:
                  selectedType && !(selectedType === 'custom' && !customText.trim()) && !nudgeLoading
                    ? '#c17d5a'
                    : '#e8ddd5',
                color:
                  selectedType && !(selectedType === 'custom' && !customText.trim()) && !nudgeLoading
                    ? '#ffffff'
                    : '#b8a098',
                cursor:
                  selectedType && !(selectedType === 'custom' && !customText.trim()) && !nudgeLoading
                    ? 'pointer'
                    : 'not-allowed',
              }}
            >
              generate →
            </button>
            <button
              type="button"
              onClick={() => {
                toggleNudge()
                setSelectedType(null)
                setCustomText('')
              }}
              className="px-4 py-2 rounded-lg text-xs font-sans border transition-colors"
              style={{ backgroundColor: '#ffffff', borderColor: '#e8ddd5', color: '#9a7060' }}
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Directory({
  contacts,
  onAddPerson,
  onGetNudge,
  onMarkContacted,
  onShowHistory,
}: DirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [intentFilter, setIntentFilter] = useState<string>('all')
  const [warmthFilter, setWarmthFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')
  const [expandedNudgeId, setExpandedNudgeId] = useState<string | null>(null)
  const [nudgeBusyContactId, setNudgeBusyContactId] = useState<string | null>(null)

  const filtered = contacts
    .filter((c) => {
      const q = searchQuery.toLowerCase()
      if (q) {
        const matches =
          c.name.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.role?.toLowerCase().includes(q) ||
          c.talked_about.toLowerCase().includes(q) ||
          c.additional_notes?.toLowerCase().includes(q) ||
          c.where_met.toLowerCase().includes(q)
        if (!matches) return false
      }
      if (intentFilter !== 'all' && c.intent !== intentFilter) return false
      if (warmthFilter !== 'all' && urgencyLevel(daysSince(c.last_contact)) !== warmthFilter) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'oldest')
        return new Date(a.last_contact).getTime() - new Date(b.last_contact).getTime()
      return new Date(b.last_contact).getTime() - new Date(a.last_contact).getTime()
    })

  const wrappedGetNudge = async (c: Contact, t: string, ct?: string) => {
    setNudgeBusyContactId(c.id)
    try {
      await Promise.resolve(onGetNudge(c, t, ct))
    } finally {
      setNudgeBusyContactId(null)
    }
  }

  const intentPills: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'job', label: '🚀 Job referral' },
    { key: 'mentorship', label: '🌱 Mentorship' },
    { key: 'connection', label: '☕ Connected' },
    { key: 'unsure', label: '🤷 Unsure' },
  ]

  const warmthPills: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'warm', label: '✅ Warm' },
    { key: 'cooling', label: '🌡 Cooling' },
    { key: 'cold', label: '🥶 Cold' },
  ]

  return (
    <div className="max-w-5xl mx-auto pt-8 px-6 pb-24">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold" style={{ color: '#3d2314' }}>
            your network directory
          </h2>
          <p className="text-sm font-sans mt-1" style={{ color: '#9a7060' }}>
            {contacts.length} connections
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPerson}
          className="text-sm font-sans font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#c17d5a', color: '#ffffff' }}
        >
          + add person
        </button>
      </div>

      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-60" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="search by name, company, role, or topic..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border font-sans text-sm outline-none"
          style={{ borderColor: '#e8ddd5', backgroundColor: '#ffffff', color: '#3d2314' }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {intentPills.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setIntentFilter(key)}
            className="rounded-full px-3 py-1 text-xs font-sans border transition-colors"
            style={{
              borderColor: intentFilter === key ? '#c17d5a' : '#e8ddd5',
              backgroundColor: intentFilter === key ? '#fff0e8' : '#ffffff',
              color: intentFilter === key ? '#c17d5a' : '#7a5c4a',
              fontWeight: intentFilter === key ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {warmthPills.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setWarmthFilter(key)}
            className="rounded-full px-3 py-1 text-xs font-sans border transition-colors"
            style={{
              borderColor: warmthFilter === key ? '#c17d5a' : '#e8ddd5',
              backgroundColor: warmthFilter === key ? '#fff0e8' : '#ffffff',
              color: warmthFilter === key ? '#c17d5a' : '#7a5c4a',
              fontWeight: warmthFilter === key ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs font-sans" style={{ color: '#7a5c4a' }}>
          <span className="shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border px-3 py-1.5 text-xs font-sans outline-none bg-white"
            style={{ borderColor: '#e8ddd5', color: '#3d2314' }}
          >
            <option value="recent">Recently contacted</option>
            <option value="name">Name A–Z</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-4 mt-8">
          <span className="text-5xl">🌱</span>
          <p className="font-sans text-base max-w-xs mx-auto leading-relaxed" style={{ color: '#9a7060' }}>
            your network is empty
          </p>
          <button
            type="button"
            onClick={onAddPerson}
            className="text-sm font-sans font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#c17d5a', color: '#ffffff' }}
          >
            + add person
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="font-sans mb-4" style={{ color: '#9a7060' }}>
            no contacts match your search
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setIntentFilter('all')
              setWarmthFilter('all')
            }}
            className="text-sm font-sans font-semibold px-4 py-2 rounded-xl border cursor-pointer"
            style={{ borderColor: '#e8ddd5', color: '#c17d5a', backgroundColor: '#ffffff' }}
          >
            clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              nudgeExpanded={expandedNudgeId === c.id}
              toggleNudge={() => setExpandedNudgeId((id) => (id === c.id ? null : c.id))}
              onGetNudge={wrappedGetNudge}
              onMarkContacted={onMarkContacted}
              onShowHistory={onShowHistory}
              nudgeLoading={nudgeBusyContactId === c.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
