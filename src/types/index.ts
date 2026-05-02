export type Intent = 'job' | 'mentorship' | 'connection' | 'unsure'

export interface Contact {
  id: string
  name: string
  where_met: string
  talked_about: string
  intent: Intent
  last_contact: string
  created_at: string
  role?: string | null
  company?: string | null
  additional_notes?: string | null
  user_id?: string | null
}

export interface Interaction {
  id: string
  contact_id: string
  user_id?: string | null
  date: string
  note: string
  type: 'met' | 'followup' | 'nudge' | 'manual'
  article_url?: string
  article_title?: string
  used?: boolean
  edited?: boolean
}

export interface Article {
  id: string
  url: string
  title: string
  summary: string
  topic: string
  fetched_at: string
}

export interface GenerateResult {
  message: string
  giveFirst: string
  timeline: string
  insight: string
  article: {
    title: string
    url: string
    reason: string
  }
}