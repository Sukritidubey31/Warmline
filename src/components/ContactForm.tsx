'use client'

import { useState } from 'react'
import { Contact, Intent } from '@/types'

interface ContactFormProps {
  onSubmit: (formData: Partial<Contact>) => void
  loading: boolean
}

const intentOptions: { value: Intent; label: string; emoji: string }[] = [
  { value: 'job',        emoji: '🚀', label: 'job referral / intro' },
  { value: 'mentorship', emoji: '🌱', label: 'mentorship / advice' },
  { value: 'connection', emoji: '☕', label: 'just staying connected' },
  { value: 'unsure',     emoji: '🤷', label: 'not sure yet' },
]

const timeAgoOptions = [
  'Just now / today',
  'A few days ago',
  'About a week ago',
  '2-3 weeks ago',
  'Over a month ago',
]

const samples = [
  {
    name: 'Sarah Chen',
    where_met: 'ProductCon conference',
    talked_about:
      'Her transition from software engineering to product management at Stripe, we bonded over Cornell and the challenge of stakeholder alignment',
    role: 'Senior PM',
    company: 'Stripe',
    additional_notes:
      'Super warm, offered to intro me to her hiring manager. Loves hiking.',
    time_ago: 'A few days ago',
    intent: 'job' as Intent,
  },
  {
    name: 'Marcus Williams',
    where_met: 'LinkedIn cold outreach',
    talked_about:
      'His experience building 0-to-1 products at early stage startups, we talked about finding PMF and his recent raise',
    role: 'Founder',
    company: 'Stealth startup',
    additional_notes: 'Ex-Google. Looking to hire PMs in Q3. Follow up after his launch.',
    time_ago: 'About a week ago',
    intent: 'mentorship' as Intent,
  },
  {
    name: 'Priya Patel',
    where_met: 'WIP hackathon',
    talked_about:
      'AI tools for productivity, she is building a B2B SaaS for legal teams, we collaborated on the pitch deck',
    role: 'Co-founder & CEO',
    company: 'LexAI',
    additional_notes:
      'We were on the same team. Incredibly smart. Stay in touch — potential collaborator.',
    time_ago: 'Just now / today',
    intent: 'connection' as Intent,
  },
  {
    name: 'Jordan Kim',
    where_met: 'Cornell alumni network event',
    talked_about:
      'Data science career paths, transitioning from analytics to ML engineering, his work at Netflix on recommendation systems',
    role: 'ML Engineer',
    company: 'Netflix',
    additional_notes: 'Gave great advice on SQL interviews. Offered to review my resume.',
    time_ago: '2-3 weeks ago',
    intent: 'mentorship' as Intent,
  },
  {
    name: 'Aisha Thompson',
    where_met: 'Women in Tech meetup',
    talked_about:
      'Navigating salary negotiations as a woman in tech, her work on fintech products at Plaid, building in public',
    role: 'PM II',
    company: 'Plaid',
    additional_notes: 'Passionate about pay equity. Mentioned her team has openings.',
    time_ago: 'A few days ago',
    intent: 'job' as Intent,
  },
]

export default function ContactForm({ onSubmit, loading }: ContactFormProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [where_met, setWhereMet] = useState('')
  const [talked_about, setTalkedAbout] = useState('')
  const [time_ago, setTimeAgo] = useState('')
  const [intent, setIntent] = useState<Intent | ''>('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [additional_notes, setAdditionalNotes] = useState('')

  const step1Valid = name.trim() && where_met.trim() && talked_about.trim() && time_ago
  const isValid = step1Valid && intent

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || loading) return
    onSubmit({
      name: name.trim(),
      where_met: where_met.trim(),
      talked_about: talked_about.trim(),
      intent: intent as Intent,
      role: role.trim() || undefined,
      company: company.trim() || undefined,
      additional_notes: additional_notes.trim() || undefined,
    })
  }

  const inputStyle: React.CSSProperties = {
    borderColor: '#e8ddd5',
    backgroundColor: '#fdf8f4',
    color: '#3d2314',
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border font-sans text-sm outline-none transition-colors'
  const labelClass = 'text-sm font-sans font-medium mb-2 block'

  return (
    <div>
      {/* Step indicator */}
      <div className="flex gap-6 items-center max-w-lg mx-auto pt-8 px-6 mb-6">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: step === 1 ? '#c17d5a' : '#e8ddd5' }}
          />
          <span className="text-sm font-sans" style={{ color: '#7a5c4a' }}>about them</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: step === 2 ? '#c17d5a' : '#e8ddd5' }}
          />
          <span className="text-sm font-sans" style={{ color: '#7a5c4a' }}>your goal</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 pb-16">
        {step === 1 && (
          <div
            className="rounded-2xl p-8 shadow-sm border relative"
            style={{ backgroundColor: '#ffffff', borderColor: '#f0e6de' }}
          >
            <button
              type="button"
              className="absolute top-8 right-8 bg-[#faf5f1] border border-[#e8ddd5] text-[#9a7060] text-xs font-sans px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap"
              onClick={() => {
                const s = samples[Math.floor(Math.random() * samples.length)]
                setName(s.name)
                setWhereMet(s.where_met)
                setTalkedAbout(s.talked_about)
                setRole(s.role)
                setCompany(s.company)
                setAdditionalNotes(s.additional_notes)
                setTimeAgo(s.time_ago)
                setIntent(s.intent)
              }}
            >
              fill with sample ✨
            </button>
            <p
              className="text-xs uppercase tracking-widest font-bold font-sans mb-6 pr-[9.5rem]"
              style={{ color: '#c17d5a' }}
            >
              tell me about them
            </p>

            <div className="flex flex-col gap-5">
              {/* Name */}
              <div>
                <label className={labelClass} style={{ color: '#5a3e32' }}>their name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Chen"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* Where met */}
              <div>
                <label className={labelClass} style={{ color: '#5a3e32' }}>where did you meet?</label>
                <input
                  type="text"
                  value={where_met}
                  onChange={(e) => setWhereMet(e.target.value)}
                  placeholder="e.g. coffee chat, linkedin, conference..."
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* Talked about */}
              <div>
                <label className={labelClass} style={{ color: '#5a3e32' }}>what did you talk about?</label>
                <textarea
                  value={talked_about}
                  onChange={(e) => setTalkedAbout(e.target.value)}
                  placeholder="e.g. her transition from eng to PM, we bonded over Cornell..."
                  className={`${inputClass} min-h-[88px] resize-y`}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={labelClass} style={{ color: '#5a3e32' }}>their role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior PM, Founder, Engineer"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={labelClass} style={{ color: '#5a3e32' }}>company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Google, early-stage startup"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={labelClass} style={{ color: '#5a3e32' }}>additional notes</label>
                <textarea
                  value={additional_notes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="anything else to help you remember them..."
                  className={`${inputClass} min-h-[72px] resize-y`}
                  style={inputStyle}
                />
              </div>

              {/* Time ago */}
              <div>
                <label className={labelClass} style={{ color: '#5a3e32' }}>how long ago?</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {timeAgoOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTimeAgo(opt)}
                      className="px-4 py-2 rounded-full text-xs font-sans cursor-pointer border-none transition-colors"
                      style={{
                        backgroundColor: time_ago === opt ? '#c17d5a' : '#f5ede7',
                        color:           time_ago === opt ? '#ffffff' : '#7a5c4a',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue */}
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="w-full py-4 rounded-xl font-sans font-semibold mt-6 transition-opacity"
                style={{
                  backgroundColor: '#c17d5a',
                  color: '#ffffff',
                  opacity: step1Valid ? 1 : 0.4,
                  cursor: step1Valid ? 'pointer' : 'not-allowed',
                }}
              >
                continue →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <div
              className="rounded-2xl p-8 shadow-sm border relative"
              style={{ backgroundColor: '#ffffff', borderColor: '#f0e6de' }}
            >
              <button
                type="button"
                className="absolute top-8 right-8 bg-[#faf5f1] border border-[#e8ddd5] text-[#9a7060] text-xs font-sans px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap"
                onClick={() => {
                  const s = samples[Math.floor(Math.random() * samples.length)]
                  setName(s.name)
                  setWhereMet(s.where_met)
                  setTalkedAbout(s.talked_about)
                  setRole(s.role)
                  setCompany(s.company)
                  setAdditionalNotes(s.additional_notes)
                  setTimeAgo(s.time_ago)
                  setIntent(s.intent)
                }}
              >
                fill with sample ✨
              </button>
              <p
                className="text-xs uppercase tracking-widest font-bold font-sans mb-4 pr-[9.5rem]"
                style={{ color: '#c17d5a' }}
              >
                one honest question
              </p>
              <p className="font-serif text-lg mb-2 leading-snug" style={{ color: '#3d2314' }}>
                what do you actually want from your relationship with{' '}
                <span style={{ color: '#c17d5a' }}>{name || 'them'}</span>?
              </p>
              <p className="text-sm font-sans mb-6" style={{ color: '#9a7060' }}>
                be honest — it helps us give you better advice.
              </p>

              {/* Intent grid */}
              <div className="grid grid-cols-2 gap-3">
                {intentOptions.map(({ value, emoji, label }) => {
                  const selected = intent === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setIntent(value)}
                      className="py-5 rounded-xl border font-sans text-sm font-medium flex flex-col items-center gap-2 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: selected ? '#c17d5a' : '#faf5f1',
                        borderColor:     selected ? '#c17d5a' : '#e8ddd5',
                        color:           selected ? '#ffffff' : '#5a3e32',
                      }}
                    >
                      <span className="text-2xl">{emoji}</span>
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Bottom row */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-4 rounded-xl font-sans text-sm border transition-colors"
                  style={{ backgroundColor: '#ffffff', borderColor: '#e8ddd5', color: '#9a7060' }}
                >
                  ← back
                </button>
                <button
                  type="submit"
                  disabled={!isValid || loading}
                  className="flex-1 py-4 rounded-xl font-sans font-semibold transition-opacity"
                  style={{
                    backgroundColor: '#c17d5a',
                    color: '#ffffff',
                    opacity: !isValid || loading ? 0.4 : 1,
                    cursor: !isValid || loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'thinking...' : 'show me what to do →'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
