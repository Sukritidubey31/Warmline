'use client'

import { useState } from 'react'
import { Contact, GenerateResult } from '@/types'

interface ResultViewProps {
  result: GenerateResult
  contact: Partial<Contact> | null
  onAddAnother: () => void
  onViewTracker: () => void
}

function ResultCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm border"
      style={{ backgroundColor: '#ffffff', borderColor: '#f0e6de' }}
    >
      <p
        className="text-xs uppercase tracking-widest font-bold font-sans mb-3"
        style={{ color: '#c17d5a' }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

export default function ResultView({ result, contact, onAddAnother, onViewTracker }: ResultViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(result.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto pt-8 px-6 pb-16">
      {/* Header */}
      <h2 className="font-serif text-2xl mb-6 leading-snug" style={{ color: '#3d2314' }}>
        here's how to keep{' '}
        <span style={{ color: '#c17d5a' }}>{contact?.name ?? 'them'}</span> warm
      </h2>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        {/* Message card */}
        <ResultCard label="✉️ send this message">
          <p className="text-sm font-sans leading-relaxed whitespace-pre-wrap" style={{ color: '#3d2314' }}>
            {result.message}
          </p>
          <button
            onClick={handleCopy}
            className="mt-3 px-4 py-1.5 rounded-lg text-xs font-sans cursor-pointer border transition-colors"
            style={{
              backgroundColor: '#faf5f1',
              borderColor: '#e8ddd5',
              color: copied ? '#16a34a' : '#7a5c4a',
            }}
          >
            {copied ? '✓ copied!' : 'copy message'}
          </button>
        </ResultCard>

        {/* Give first */}
        <ResultCard label="🎁 give first">
          <p className="text-sm font-sans leading-relaxed" style={{ color: '#3d2314' }}>{result.giveFirst}</p>
        </ResultCard>

        {/* Insight */}
        <ResultCard label="💡 insight">
          <p className="text-sm font-sans leading-relaxed" style={{ color: '#3d2314' }}>{result.insight}</p>
        </ResultCard>

        {/* Timing */}
        <ResultCard label="⏱ timing">
          <p className="text-sm font-sans leading-relaxed" style={{ color: '#3d2314' }}>{result.timeline}</p>
        </ResultCard>

        {/* Article */}
        {result.article &&
        result.article.url &&
        result.article.url !== '#' &&
        result.article.title &&
        result.article.title !== '' &&
        result.article.title !== 'Unable to locate specific article' &&
        result.article.title !== 'No article found' ? (
          <ResultCard label="📰 share this article">
            <a
              href={result.article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-sans hover:underline block"
              style={{ color: '#c17d5a' }}
            >
              {result.article.title} ↗
            </a>
            {result.article.reason && (
              <p className="text-xs font-sans mt-2" style={{ color: '#9a7060' }}>{result.article.reason}</p>
            )}
          </ResultCard>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-4">
        <button
          onClick={onViewTracker}
          className="w-full py-4 rounded-xl font-sans font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#c17d5a', color: '#ffffff' }}
        >
          view my network →
        </button>
        <button
          onClick={onAddAnother}
          className="w-full py-4 rounded-xl font-sans border transition-colors"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8ddd5', color: '#9a7060' }}
        >
          + add another person
        </button>
      </div>
    </div>
  )
}
