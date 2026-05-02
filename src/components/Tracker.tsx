'use client'

import { useState, useEffect } from 'react'
import { Contact } from '@/types'

interface NudgeResult {
  contact: Contact
  nudgeMessage: string
  article: { title: string; url: string; reason: string }
}

interface TrackerProps {
  contacts: Contact[]
  onMarkContacted: (id: string) => void
  onAddPerson: () => void
  onGetNudge: (contact: Contact, nudgeType: string, customText?: string) => void
  onShowHistory: (contact: Contact) => void
  nudgeLoading: boolean
  nudgeResult: NudgeResult | null
  onCloseNudge: () => void
}

const nudgeTypes = [
  { id: 'checkin', label: '👋 just checking in', desc: 'casual, no agenda' },
  { id: 'article', label: '📰 share an article', desc: 'relevant to what you discussed' },
  { id: 'intro', label: '🤝 make an intro', desc: 'connect with someone similar' },
  { id: 'custom', label: '✏️ custom', desc: 'describe what you want' },
]

function LoadingDots() {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 400)
    return () => clearInterval(t)
  }, [])
  return <span>{dots}</span>
}

type Urgency = 'warm' | 'cooling' | 'cold'

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
}

function urgencyLevel(days: number): Urgency {
  if (days < 14) return 'warm'
  if (days <= 30) return 'cooling'
  return 'cold'
}

const urgencyConfig: Record<Urgency, { border: string; textColor: string; label: string }> = {
  cold:    { border: '#e07a5f', textColor: '#e07a5f', label: 'cold' },
  cooling: { border: '#f2b155', textColor: '#e09a40', label: 'cooling' },
  warm:    { border: '#81b29a', textColor: '#81b29a', label: 'warm' },
}

const intentLabel: Record<string, string> = {
  job:        'job referral',
  mentorship: 'mentorship',
  connection: 'staying connected',
  unsure:     'not sure yet',
}

function ContactRow({
  contact,
  onMarkContacted,
  onGetNudge,
  onShowHistory,
  isNudgeLoading,
}: {
  contact: Contact
  onMarkContacted: (id: string) => void
  onGetNudge: (contact: Contact, nudgeType: string, customText?: string) => void
  onShowHistory: (contact: Contact) => void
  isNudgeLoading: boolean
}) {
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')

  const days = daysSince(contact.last_contact)
  const urgency = urgencyLevel(days)
  const { border, textColor } = urgencyConfig[urgency]
  const snippet = contact.talked_about.length > 80
    ? contact.talked_about.slice(0, 80) + '…'
    : contact.talked_about

  const handleGenerate = () => {
    if (!selectedType) return
    setShowTypeSelector(false)
    setSelectedType(null)
    setCustomText('')
    onGetNudge(contact, selectedType, selectedType === 'custom' ? customText : undefined)
  }

  return (
    <div
      className="rounded-xl mb-3 shadow-sm border overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#f0e6de',
        borderLeft: `3px solid ${border}`,
      }}
    >
      {/* Main row */}
      <div className="p-4 flex justify-between items-start gap-3">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-sans" style={{ color: '#3d2314' }}>{contact.name}</p>
          <p className="text-xs font-sans mt-0.5" style={{ color: '#9a7060' }}>
            {contact.where_met} · {intentLabel[contact.intent] ?? contact.intent}
          </p>
          <p className="text-xs font-sans mt-1 truncate" style={{ color: '#b8a098' }}>{snippet}</p>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-xs font-semibold font-sans" style={{ color: textColor }}>
            {days === 0 ? 'today' : `${days}d ago`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (isNudgeLoading) return
                setShowTypeSelector((v) => !v)
                setSelectedType(null)
                setCustomText('')
              }}
              disabled={isNudgeLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold font-sans border transition-colors whitespace-nowrap"
              style={{
                backgroundColor: showTypeSelector ? '#f5ede7' : isNudgeLoading ? '#f5ede7' : '#faf5f1',
                borderColor: showTypeSelector ? '#c17d5a' : '#e8ddd5',
                color: '#c17d5a',
                cursor: isNudgeLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isNudgeLoading ? <>thinking<LoadingDots /></> : 'get nudge'}
            </button>
            <button
              onClick={() => onShowHistory(contact)}
              className="px-3 py-1.5 rounded-lg text-xs font-sans cursor-pointer border transition-colors whitespace-nowrap"
              style={{ backgroundColor: '#f0f0ff', borderColor: '#d8d8f0', color: '#6060aa' }}
              title="view interaction history"
            >
              📋
            </button>
            <button
              onClick={() => onMarkContacted(contact.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-sans cursor-pointer border transition-colors whitespace-nowrap"
              style={{ backgroundColor: '#f0f7f4', borderColor: '#d0e8dc', color: '#4a8c6a' }}
              title="mark as contacted today"
            >
              ✓
            </button>
          </div>
        </div>
      </div>

      {/* Inline nudge type selector */}
      {showTypeSelector && (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: '#f0e6de', backgroundColor: '#fdf8f4' }}>
          <p className="text-xs font-sans font-semibold uppercase tracking-widest mb-2" style={{ color: '#9a7060' }}>
            what kind of nudge?
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {nudgeTypes.map((type) => (
              <button
                key={type.id}
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
              onClick={handleGenerate}
              disabled={!selectedType || (selectedType === 'custom' && !customText.trim())}
              className="flex-1 py-2 rounded-lg text-xs font-sans font-semibold transition-opacity"
              style={{
                backgroundColor: selectedType && !(selectedType === 'custom' && !customText.trim()) ? '#c17d5a' : '#e8ddd5',
                color: selectedType && !(selectedType === 'custom' && !customText.trim()) ? '#ffffff' : '#b8a098',
                cursor: selectedType && !(selectedType === 'custom' && !customText.trim()) ? 'pointer' : 'not-allowed',
              }}
            >
              generate nudge →
            </button>
            <button
              onClick={() => { setShowTypeSelector(false); setSelectedType(null); setCustomText('') }}
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

function Section({
  title,
  contacts,
  onMarkContacted,
  onGetNudge,
  onShowHistory,
  activeNudgeId,
  nudgeLoading,
}: {
  title: string
  contacts: Contact[]
  onMarkContacted: (id: string) => void
  onGetNudge: (contact: Contact, nudgeType: string, customText?: string) => void
  onShowHistory: (contact: Contact) => void
  activeNudgeId: string | null
  nudgeLoading: boolean
}) {
  if (contacts.length === 0) return null
  return (
    <div>
      <p
        className="text-xs uppercase tracking-widest font-bold font-sans mb-3 mt-6"
        style={{ color: '#9a7060' }}
      >
        {title}
      </p>
      {contacts.map((c) => (
        <ContactRow
          key={c.id}
          contact={c}
          onMarkContacted={onMarkContacted}
          onGetNudge={onGetNudge}
          onShowHistory={onShowHistory}
          isNudgeLoading={nudgeLoading && activeNudgeId === c.id}
        />
      ))}
    </div>
  )
}

function NudgePanel({
  nudgeResult,
  onMarkContacted,
  onCloseNudge,
}: {
  nudgeResult: NudgeResult
  onMarkContacted: (id: string) => void
  onCloseNudge: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(nudgeResult.nudgeMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMarkContacted = () => {
    onMarkContacted(nudgeResult.contact.id)
    onCloseNudge()
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4"
      style={{ backgroundColor: 'rgba(253,248,244,0.95)', borderTop: '1px solid #e8ddd5' }}
    >
      <div className="max-w-2xl mx-auto rounded-2xl border shadow-lg p-5"
        style={{ backgroundColor: '#ffffff', borderColor: '#f0e6de' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-sans font-bold uppercase tracking-widest" style={{ color: '#c17d5a' }}>
            nudge for {nudgeResult.contact.name}
          </p>
          <button
            onClick={onCloseNudge}
            className="text-xs font-sans px-3 py-1 rounded-lg border transition-colors"
            style={{ color: '#9a7060', borderColor: '#e8ddd5', backgroundColor: '#fdf8f4' }}
          >
            dismiss
          </button>
        </div>

        {/* Message */}
        <p className="text-xs font-sans font-bold uppercase tracking-widest mb-2" style={{ color: '#c17d5a' }}>
          💬 message to send
        </p>
        <div className="rounded-xl px-4 py-3 mb-2" style={{ backgroundColor: '#fdf8f4' }}>
          <p className="text-sm font-sans leading-relaxed" style={{ color: '#3d2314' }}>
            {nudgeResult.nudgeMessage}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs font-sans px-3 py-1.5 rounded-lg border mb-4 transition-colors"
          style={{
            backgroundColor: '#faf5f1',
            borderColor: '#e8ddd5',
            color: copied ? '#4a8c6a' : '#7a5c4a',
          }}
        >
          {copied ? '✓ copied!' : 'copy'}
        </button>

        {/* Article */}
        {nudgeResult.article && nudgeResult.article.url !== '#' && (
          <div className="mb-4">
            <p className="text-xs font-sans font-bold uppercase tracking-widest mb-1" style={{ color: '#c17d5a' }}>
              📰 share this article
            </p>
            <a
              href={nudgeResult.article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-sans hover:underline block"
              style={{ color: '#c17d5a' }}
            >
              {nudgeResult.article.title} ↗
            </a>
            {nudgeResult.article.reason && (
              <p className="text-xs font-sans mt-1" style={{ color: '#9a7060' }}>
                {nudgeResult.article.reason}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleMarkContacted}
            className="flex-1 py-2.5 rounded-xl text-sm font-sans font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#c17d5a', color: '#ffffff' }}
          >
            ✓ mark as contacted
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Tracker({
  contacts,
  onMarkContacted,
  onAddPerson,
  onGetNudge,
  onShowHistory,
  nudgeLoading,
  nudgeResult,
  onCloseNudge,
}: TrackerProps) {
  const [activeNudgeId, setActiveNudgeId] = useState<string | null>(null)

  useEffect(() => {
    if (!nudgeLoading) setActiveNudgeId(null)
  }, [nudgeLoading])

  const cold    = contacts.filter((c) => urgencyLevel(daysSince(c.last_contact)) === 'cold')
  const cooling = contacts.filter((c) => urgencyLevel(daysSince(c.last_contact)) === 'cooling')
  const warm    = contacts.filter((c) => urgencyLevel(daysSince(c.last_contact)) === 'warm')

  return (
    <div className="max-w-2xl mx-auto pt-8 px-6 pb-16">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <p
            className="text-xs uppercase tracking-widest font-bold font-sans mb-1"
            style={{ color: '#c17d5a' }}
          >
            your network
          </p>
          <h2 className="font-serif text-2xl font-bold" style={{ color: '#3d2314' }}>
            {contacts.length > 0
              ? `${contacts.length} ${contacts.length === 1 ? 'person' : 'people'} in your warmline`
              : 'your warmline'}
          </h2>
        </div>
        <button
          onClick={onAddPerson}
          className="text-sm font-sans font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity shrink-0"
          style={{ backgroundColor: '#c17d5a', color: '#ffffff' }}
        >
          + add person
        </button>
      </div>

      {/* Empty state */}
      {contacts.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <span className="text-5xl">🌱</span>
          <p className="font-sans text-base max-w-xs mx-auto leading-relaxed" style={{ color: '#9a7060' }}>
            no one here yet. add someone you met and we'll help you stay warm.
          </p>
          <button
            onClick={onAddPerson}
            className="text-sm font-sans font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#c17d5a', color: '#ffffff' }}
          >
            + add your first contact
          </button>
        </div>
      ) : (
        <div>
          <Section title="🥶 going cold"   contacts={cold}    onMarkContacted={onMarkContacted} onGetNudge={(c, t, ct) => { setActiveNudgeId(c.id); onGetNudge(c, t, ct) }} onShowHistory={onShowHistory} activeNudgeId={activeNudgeId} nudgeLoading={nudgeLoading} />
          <Section title="🌡 cooling down" contacts={cooling} onMarkContacted={onMarkContacted} onGetNudge={(c, t, ct) => { setActiveNudgeId(c.id); onGetNudge(c, t, ct) }} onShowHistory={onShowHistory} activeNudgeId={activeNudgeId} nudgeLoading={nudgeLoading} />
          <Section title="✅ still warm"   contacts={warm}    onMarkContacted={onMarkContacted} onGetNudge={(c, t, ct) => { setActiveNudgeId(c.id); onGetNudge(c, t, ct) }} onShowHistory={onShowHistory} activeNudgeId={activeNudgeId} nudgeLoading={nudgeLoading} />
        </div>
      )}

      {/* Nudge result panel */}
      {nudgeResult && (
        <NudgePanel
          nudgeResult={nudgeResult}
          onMarkContacted={onMarkContacted}
          onCloseNudge={onCloseNudge}
        />
      )}
    </div>
  )
}
