'use client'

import { useState, useEffect, useCallback } from 'react'
import Nav from '@/components/Nav'
import AuthScreen from '@/components/AuthScreen'
import Directory from '@/components/Directory'
import InteractionHistory from '@/components/InteractionHistory'
import { Contact, GenerateResult } from '@/types'
import ContactForm from '@/components/ContactForm'
import ResultView from '@/components/ResultView'
import Tracker from '@/components/Tracker'

type AppView = 'home' | 'add' | 'result' | 'tracker' | 'directory'

const featureCards = [
  {
    icon: '✉️',
    title: 'Ready-to-send message',
    desc: 'Personalized follow-up that references your actual conversation.',
  },
  {
    icon: '🎁',
    title: 'Give first',
    desc: 'Something to offer before you ask for anything.',
  },
  {
    icon: '📰',
    title: 'Relevant article',
    desc: 'A recent, real article to share as a conversation starter.',
  },
  {
    icon: '📋',
    title: 'Relationship tracker',
    desc: "Know who's going cold and get nudges before you lose the connection.",
  },
]

export default function Home() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('warmline_token')
    return null
  })
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('warmline_username')
    return null
  })
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('warmline_user_id')
    return null
  })

  const [view, setView] = useState<AppView>('home')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [currentContact, setCurrentContact] = useState<Partial<Contact> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nudgeLoading, setNudgeLoading] = useState(false)
  const [nudgeResult, setNudgeResult] = useState<{
    contact: Contact
    nudgeMessage: string
    article: { title: string; url: string; reason: string }
  } | null>(null)
  const [historyContactId, setHistoryContactId] = useState<string | null>(null)

  function handleAuth(token: string, username: string, userId: string) {
    localStorage.setItem('warmline_token', token)
    localStorage.setItem('warmline_username', username)
    localStorage.setItem('warmline_user_id', userId)
    setAuthToken(token)
    setCurrentUser(username)
    setCurrentUserId(userId)
  }

  function handleLogout() {
    localStorage.removeItem('warmline_token')
    localStorage.removeItem('warmline_username')
    localStorage.removeItem('warmline_user_id')
    setAuthToken(null)
    setCurrentUser(null)
    setCurrentUserId(null)
    setContacts([])
    setView('home')
    setHistoryContactId(null)
    setNudgeResult(null)
    setResult(null)
    setCurrentContact(null)
  }

  const authFetch = useCallback(
    (input: RequestInfo | URL, options: RequestInit = {}) => {
      const headers = new Headers(options.headers ?? undefined)
      headers.set('Content-Type', 'application/json')
      headers.set('Authorization', `Bearer ${authToken}`)
      return fetch(input, { ...options, headers })
    },
    [authToken]
  )

  const fetchContacts = useCallback(async () => {
    const res = await authFetch('/api/contacts')
    if (res.ok) {
      const data = await res.json()
      setContacts(data)
    }
  }, [authFetch])

  useEffect(() => {
    if (!authToken) return
    fetchContacts()
  }, [authToken, fetchContacts])

  const handleFormSubmit = async (formData: Partial<Contact>) => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data)
      setCurrentContact(formData)
      setView('result')
      fetchContacts()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGetNudge = async (contact: Contact, nudgeType: string, customText?: string) => {
    setNudgeLoading(true)
    try {
      const res = await authFetch('/api/nudge', {
        method: 'POST',
        body: JSON.stringify({
          contact_id: contact.id,
          nudge_type: nudgeType,
          custom_text: customText,
        }),
      })
      const data = await res.json()
      setNudgeResult({
        contact,
        nudgeMessage: data.nudgeMessage,
        article: data.article,
      })
    } catch (e) {
      console.error('nudge failed', e)
    } finally {
      setNudgeLoading(false)
    }
  }

  const handleMarkContacted = async (id: string) => {
    const res = await authFetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_contact: new Date().toISOString() }),
    })
    if (res.ok) fetchContacts()
  }

  const coldContacts = contacts.filter((c) => {
    const days = Math.floor(
      (Date.now() - new Date(c.last_contact).getTime()) / (1000 * 60 * 60 * 24)
    )
    return days > 30
  })

  if (!authToken) {
    return <AuthScreen onAuth={handleAuth} />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf8f4' }}>
      <Nav
        setView={(v) => setView(v as AppView)}
        contactCount={contacts.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onDirectoryClick={() => {}}
      />

      <main>
        {view === 'home' && (
          <div className="pt-24 pb-16 px-6 max-w-xl mx-auto text-center">
            {/* Eyebrow */}
            <p
              className="text-xs font-sans font-semibold uppercase tracking-widest mb-4"
              style={{ color: '#c17d5a' }}
            >
              warm, human networking
            </p>

            {/* Headline */}
            <h1 className="font-serif text-5xl font-bold leading-tight mb-5" style={{ color: '#3d2314' }}>
              networking that<br />
              <em>actually feels human</em>
            </h1>

            {/* Subtext */}
            <p
              className="font-sans text-lg leading-relaxed mb-10 max-w-md mx-auto"
              style={{ color: '#7a5c4a' }}
            >
              tell warmline about someone you met. get a genuine follow-up, a way to give first, and a relevant
              article.
            </p>

            {/* Buttons */}
            <div className="flex gap-3 justify-center mb-10">
              <button
                onClick={() => setView('add')}
                className="font-sans font-semibold px-7 py-3 rounded-xl hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#c17d5a', color: '#ffffff' }}
              >
                get started →
              </button>
              {contacts.length > 0 && (
                <button
                  onClick={() => setView('tracker')}
                  className="font-sans px-6 py-3 rounded-xl border transition-colors"
                  style={{ backgroundColor: '#ffffff', color: '#c17d5a', borderColor: '#e8ddd5' }}
                >
                  view my network
                </button>
              )}
            </div>

            {/* Cold contacts alert banner */}
            {coldContacts.length > 0 && (
              <div
                className="rounded-xl px-5 py-4 flex items-start gap-3 text-sm font-sans max-w-xl mx-auto mb-10 border"
                style={{ backgroundColor: '#fff8f3', borderColor: '#f5d9c8', color: '#5a3e32' }}
              >
                <span className="text-lg shrink-0">🥶</span>
                <p>
                  <strong>
                    {coldContacts.length}{' '}
                    {coldContacts.length === 1 ? 'contact is' : 'contacts are'} going cold.
                  </strong>{' '}
                  <button onClick={() => setView('tracker')} className="underline cursor-pointer">
                    View your network
                  </button>{' '}
                  and send a nudge before you lose the connection.
                </p>
              </div>
            )}

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
              {featureCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl p-6 shadow-sm border text-left"
                  style={{ backgroundColor: '#ffffff', borderColor: '#f0e6de' }}
                >
                  <div className="text-2xl mb-3">{card.icon}</div>
                  <p className="font-sans font-semibold text-sm mb-1" style={{ color: '#3d2314' }}>
                    {card.title}
                  </p>
                  <p className="font-sans text-xs leading-relaxed" style={{ color: '#9a7060' }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p className="text-center text-xs font-sans tracking-wide mt-16" style={{ color: '#c8b0a4' }}>
              signed in · your contacts live with your account
            </p>
          </div>
        )}

        {view === 'add' && <ContactForm onSubmit={handleFormSubmit} loading={loading} />}

        {view === 'result' && result && (
          <ResultView
            result={result}
            contact={currentContact}
            onAddAnother={() => setView('add')}
            onViewTracker={() => setView('tracker')}
          />
        )}

        {view === 'tracker' && (
          <Tracker
            contacts={contacts}
            onMarkContacted={handleMarkContacted}
            onAddPerson={() => setView('add')}
            onGetNudge={handleGetNudge}
            onShowHistory={(c) => setHistoryContactId(c.id)}
            nudgeLoading={nudgeLoading}
            nudgeResult={nudgeResult}
            onCloseNudge={() => setNudgeResult(null)}
          />
        )}

        {view === 'directory' && (
          <Directory
            contacts={contacts}
            onAddPerson={() => setView('add')}
            onGetNudge={handleGetNudge}
            onMarkContacted={handleMarkContacted}
            onShowHistory={(c) => setHistoryContactId(c.id)}
          />
        )}

        {historyContactId && (
          <InteractionHistory
            contactId={historyContactId}
            onClose={() => setHistoryContactId(null)}
            authFetch={authFetch}
          />
        )}

        {error && (
          <p className="text-center text-sm mt-6 font-sans" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}
      </main>
    </div>
  )
}
