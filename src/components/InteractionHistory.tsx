'use client'

import { useState, useEffect, useCallback } from 'react'
import { Interaction } from '@/types'

interface InteractionHistoryProps {
  contactId: string
  onClose: () => void
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

const typeBadge: Record<string, { label: string; bg: string; color: string }> = {
  nudge:    { label: 'nudge',    bg: '#fff3e8', color: '#c17d5a' },
  followup: { label: 'follow-up', bg: '#e8f0ff', color: '#4a6ec0' },
  met:      { label: 'met',      bg: '#e8f5ee', color: '#4a8c6a' },
  manual:   { label: 'note',     bg: '#f5f0ff', color: '#7a5aaa' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function InteractionHistory({ contactId, onClose, authFetch }: InteractionHistoryProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)

  // Editing state per interaction
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  // New note form
  const [newNote, setNewNote] = useState('')
  const [newArticleUrl, setNewArticleUrl] = useState('')
  const [newArticleTitle, setNewArticleTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchInteractions = useCallback(async () => {
    setLoading(true)
    const res = await authFetch(`/api/interactions?contact_id=${contactId}`)
    if (res.ok) {
      const data = await res.json()
      setInteractions(data)
    }
    setLoading(false)
  }, [authFetch, contactId])

  useEffect(() => {
    fetchInteractions()
  }, [fetchInteractions])

  const handleMarkUsed = async (id: string) => {
    const res = await authFetch(`/api/interactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ used: true }),
    })
    if (res.ok) fetchInteractions()
  }

  const handleSaveEdit = async (id: string) => {
    const note = editNotes[id]
    if (!note) return
    const res = await authFetch(`/api/interactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ note, edited: true }),
    })
    if (res.ok) {
      setEditingId(null)
      fetchInteractions()
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setSubmitting(true)
    const res = await authFetch('/api/interactions', {
      method: 'POST',
      body: JSON.stringify({
        contact_id: contactId,
        type: 'manual',
        note: newNote.trim(),
        article_url: newArticleUrl.trim() || undefined,
        article_title: newArticleTitle.trim() || undefined,
      }),
    })
    if (res.ok) {
      setNewNote('')
      setNewArticleUrl('')
      setNewArticleTitle('')
      fetchInteractions()
    }
    setSubmitting(false)
  }

  const badge = (type: string) => typeBadge[type] ?? typeBadge.manual

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-16 px-4"
      style={{ backgroundColor: 'rgba(61,35,20,0.35)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-xl border"
        style={{ backgroundColor: '#fdf8f4', borderColor: '#e8ddd5' }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-6 py-4 border-b rounded-t-2xl"
          style={{ backgroundColor: '#ffffff', borderColor: '#f0e6de' }}
        >
          <h3 className="font-serif text-lg font-bold" style={{ color: '#3d2314' }}>
            interaction history
          </h3>
          <button
            onClick={onClose}
            className="text-sm font-sans px-3 py-1 rounded-lg border transition-colors"
            style={{ color: '#9a7060', borderColor: '#e8ddd5', backgroundColor: '#fdf8f4' }}
          >
            close
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Interactions list */}
          {loading ? (
            <p className="text-sm font-sans text-center py-6" style={{ color: '#9a7060' }}>
              loading...
            </p>
          ) : interactions.length === 0 ? (
            <p className="text-sm font-sans text-center py-6" style={{ color: '#9a7060' }}>
              no interactions yet
            </p>
          ) : (
            interactions.map((item) => {
              const b = badge(item.type)
              const isEditing = editingId === item.id
              const editNote = editNotes[item.id] ?? item.note

              return (
                <div
                  key={item.id}
                  className="rounded-xl border p-4"
                  style={{ backgroundColor: '#ffffff', borderColor: '#f0e6de' }}
                >
                  {/* Top row */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: b.bg, color: b.color }}
                    >
                      {b.label}
                    </span>
                    <span className="text-xs font-sans" style={{ color: '#9a7060' }}>
                      {formatDate(item.date)}
                    </span>
                    {item.used && (
                      <span className="text-xs font-sans ml-auto" style={{ color: '#81b29a' }}>
                        ✓ used
                      </span>
                    )}
                    {item.edited && (
                      <span className="text-xs font-sans" style={{ color: '#b8a098' }}>
                        edited
                      </span>
                    )}
                  </div>

                  {/* Note */}
                  {isEditing ? (
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      className="w-full text-sm font-sans rounded-xl border px-3 py-2 outline-none resize-y"
                      style={{ borderColor: '#c17d5a', backgroundColor: '#fdf8f4', color: '#3d2314' }}
                      rows={3}
                    />
                  ) : (
                    <p
                      className="text-sm font-sans leading-relaxed cursor-text"
                      style={{ color: '#3d2314' }}
                      onClick={() => {
                        setEditingId(item.id)
                        setEditNotes((prev) => ({ ...prev, [item.id]: item.note }))
                      }}
                    >
                      {item.note}
                    </p>
                  )}

                  {/* Article link */}
                  {item.article_url && item.article_url !== '#' && (
                    <a
                      href={item.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-sans mt-2 block hover:underline"
                      style={{ color: '#c17d5a' }}
                    >
                      📰 {item.article_title || item.article_url} ↗
                    </a>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="text-xs font-sans font-semibold px-3 py-1.5 rounded-lg border"
                          style={{ backgroundColor: '#c17d5a', color: '#ffffff', borderColor: '#c17d5a' }}
                        >
                          save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs font-sans px-3 py-1.5 rounded-lg border"
                          style={{ backgroundColor: '#ffffff', color: '#9a7060', borderColor: '#e8ddd5' }}
                        >
                          cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(item.id)
                            setEditNotes((prev) => ({ ...prev, [item.id]: item.note }))
                          }}
                          className="text-xs font-sans px-3 py-1.5 rounded-lg border transition-colors"
                          style={{ backgroundColor: '#fdf8f4', color: '#9a7060', borderColor: '#e8ddd5' }}
                        >
                          edit
                        </button>
                        {!item.used && (
                          <button
                            onClick={() => handleMarkUsed(item.id)}
                            className="text-xs font-sans px-3 py-1.5 rounded-lg border transition-colors"
                            style={{ backgroundColor: '#f0f7f4', color: '#4a8c6a', borderColor: '#d0e8dc' }}
                          >
                            mark as used
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* Add note section */}
          <div
            className="rounded-xl border p-4 mt-2"
            style={{ backgroundColor: '#ffffff', borderColor: '#f0e6de' }}
          >
            <p className="text-xs font-sans font-semibold uppercase tracking-widest mb-3" style={{ color: '#c17d5a' }}>
              add your own note
            </p>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="what happened? how did it go?"
              rows={3}
              className="w-full text-sm font-sans rounded-xl border px-3 py-2 outline-none resize-y mb-3"
              style={{ borderColor: '#e8ddd5', backgroundColor: '#fdf8f4', color: '#3d2314' }}
            />
            <input
              type="url"
              value={newArticleUrl}
              onChange={(e) => setNewArticleUrl(e.target.value)}
              placeholder="article URL (optional)"
              className="w-full text-sm font-sans rounded-xl border px-3 py-2 outline-none mb-2"
              style={{ borderColor: '#e8ddd5', backgroundColor: '#fdf8f4', color: '#3d2314' }}
            />
            <input
              type="text"
              value={newArticleTitle}
              onChange={(e) => setNewArticleTitle(e.target.value)}
              placeholder="article title (optional)"
              className="w-full text-sm font-sans rounded-xl border px-3 py-2 outline-none mb-3"
              style={{ borderColor: '#e8ddd5', backgroundColor: '#fdf8f4', color: '#3d2314' }}
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || submitting}
              className="w-full py-3 rounded-xl text-sm font-sans font-semibold transition-opacity"
              style={{
                backgroundColor: '#c17d5a',
                color: '#ffffff',
                opacity: !newNote.trim() || submitting ? 0.45 : 1,
                cursor: !newNote.trim() || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'saving...' : 'save note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
