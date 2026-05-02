/**
 * Seeds the demo account (demo / warmline2026) and 12 contacts.
 * Run from the warmline directory:
 *   npx ts-node --project tsconfig.json src/scripts/seed-demo.ts
 */
import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'

function loadDotEnvLocal() {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) {
    console.warn('[seed-demo] No .env.local found at', p)
    return
  }
  readFileSync(p, 'utf8').split(/\r?\n/).forEach((line) => {
    const t = line.trim()
    if (!t || t.startsWith('#')) return
    const i = t.indexOf('=')
    if (i === -1) return
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  })
}

const DEMO_USERNAME = 'demo'
const DEMO_PASSWORD = 'warmline2026'

type Intent = 'job' | 'mentorship' | 'connection' | 'unsure'

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

const demoContacts: {
  name: string
  role: string
  company: string
  where_met: string
  intent: Intent
  talked_about: string
  additional_notes: string
  last_contact_days_ago: number
}[] = [
  {
    name: 'Alex Rivera',
    role: 'VP Engineering',
    company: 'Notion',
    where_met: 'Tech conference',
    intent: 'job',
    talked_about:
      'Engineering leadership, scaling teams, his open senior PM role',
    additional_notes: 'Mentioned they are hiring aggressively in Q2',
    last_contact_days_ago: 45,
  },
  {
    name: 'Jamie Lee',
    role: 'Product Lead',
    company: 'Figma',
    where_met: 'Dribbble meetup',
    intent: 'mentorship',
    talked_about:
      'Design systems thinking, product intuition, her path from design to PM',
    additional_notes:
      'Super generous with her time. She said reach out anytime.',
    last_contact_days_ago: 52,
  },
  {
    name: 'David Park',
    role: 'Founder',
    company: 'Zerve AI',
    where_met: 'HackerEarth hackathon',
    intent: 'connection',
    talked_about:
      'AI behavioral analytics, agent usage patterns, his vision for developer tools',
    additional_notes: 'We won 2nd place together. Brilliant technical mind.',
    last_contact_days_ago: 60,
  },
  {
    name: 'Meera Nair',
    role: 'Data Scientist',
    company: 'Spotify',
    where_met: 'LinkedIn message',
    intent: 'mentorship',
    talked_about:
      'Recommendation systems, ML model deployment, transitioning from research to industry',
    additional_notes:
      'PhD from MIT. Incredibly helpful. Send her my portfolio project.',
    last_contact_days_ago: 41,
  },
  {
    name: 'Carlos Mendez',
    role: 'GTM Engineer',
    company: 'Rippling',
    where_met: 'Forward Deployed Engineer event',
    intent: 'job',
    talked_about:
      'Technical sales engineering, FDE role expectations, SQL assessments',
    additional_notes: 'Said he could refer me if a role opens up',
    last_contact_days_ago: 18,
  },
  {
    name: 'Sophie Turner',
    role: 'PM Manager',
    company: 'Airbnb',
    where_met: 'Women in Product conference',
    intent: 'mentorship',
    talked_about:
      'Managing up, career laddering in product, her 2-year journey to PM Manager',
    additional_notes: 'Offered to do a mock PM interview with me',
    last_contact_days_ago: 22,
  },
  {
    name: 'Raj Sharma',
    role: 'Senior SWE',
    company: 'JP Morgan Chase',
    where_met: 'Code for Good event',
    intent: 'connection',
    talked_about:
      'Java Spring Boot microservices, Kafka event streaming, AWS architecture',
    additional_notes: 'We worked together at JPMC. Good friend. Check in regularly.',
    last_contact_days_ago: 16,
  },
  {
    name: 'Nina Kovacs',
    role: 'Venture Associate',
    company: 'Sequoia',
    where_met: 'Startup networking dinner',
    intent: 'connection',
    talked_about:
      'Early stage investing thesis, what they look for in B2B SaaS founders, portfolio companies',
    additional_notes:
      'Very well connected. Follow up when I have traction on a project.',
    last_contact_days_ago: 24,
  },
  {
    name: 'Ananya Krishnan',
    role: 'Product Manager',
    company: 'Spring Health',
    where_met: 'Coffee chat via mutual friend',
    intent: 'job',
    talked_about:
      'Mental health tech, Spring Health product roadmap, PM interview process there',
    additional_notes:
      'Referred me to the hiring manager. Keep her updated on my application.',
    last_contact_days_ago: 2,
  },
  {
    name: 'Tyler Brooks',
    role: 'Engineer',
    company: 'PostHog',
    where_met: 'Twitter/X DMs',
    intent: 'connection',
    talked_about:
      'Open source product analytics, self-hosted vs cloud, developer experience',
    additional_notes:
      'Super active in open source. Introduced me to the PostHog team.',
    last_contact_days_ago: 1,
  },
  {
    name: 'Fatima Al-Hassan',
    role: 'Chief of Staff',
    company: 'Anthropic',
    where_met: 'AI networking event',
    intent: 'mentorship',
    talked_about:
      'Operating at early stage AI companies, cross-functional leadership, her path from consulting',
    additional_notes:
      'Brilliant. She volunteered to review my application materials.',
    last_contact_days_ago: 3,
  },
  {
    name: 'Leo Zhang',
    role: 'PM',
    company: 'Arcade',
    where_met: 'Product Hunt launch event',
    intent: 'job',
    talked_about:
      'Interactive demo tools, PLG growth strategies, their hiring bar for PMs',
    additional_notes:
      'Mentioned they are looking for someone with my exact background.',
    last_contact_days_ago: 5,
  },
]

async function main() {
  loadDotEnvLocal()

  const [{ supabaseAdmin }, { hashPassword }] = await Promise.all([
    import('../lib/supabase'),
    import('../lib/auth'),
  ])

  console.log('[seed-demo] Starting…')

  const password_hash = await hashPassword(DEMO_PASSWORD)
  console.log('[seed-demo] Password hashed for demo user')

  let userId: string

  const { data: existing, error: findErr } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', DEMO_USERNAME)
    .maybeSingle()

  if (findErr) {
    console.error('[seed-demo] Failed to check existing user:', findErr)
    process.exitCode = 1
    return
  }

  if (existing?.id) {
    userId = existing.id as string
    console.log('[seed-demo] Demo user already exists:', userId)
  } else {
    const { data: created, error: insertErr } = await supabaseAdmin
      .from('users')
      .insert({ username: DEMO_USERNAME, password_hash })
      .select('id')
      .single()

    if (insertErr || !created?.id) {
      console.error('[seed-demo] Failed to create demo user:', insertErr)
      process.exitCode = 1
      return
    }
    userId = created.id as string
    console.log('[seed-demo] Created demo user:', userId)
  }

  const { error: delErr } = await supabaseAdmin
    .from('contacts')
    .delete()
    .eq('user_id', userId)

  if (delErr) {
    console.error('[seed-demo] Failed to clear existing contacts for demo user:', delErr)
    process.exitCode = 1
    return
  }
  console.log('[seed-demo] Cleared previous contacts for demo user (if any)')

  const rows = demoContacts.map((c) => ({
    user_id: userId,
    name: c.name,
    role: c.role,
    company: c.company,
    where_met: c.where_met,
    talked_about: c.talked_about,
    intent: c.intent,
    additional_notes: c.additional_notes,
    last_contact: daysAgoIso(c.last_contact_days_ago),
  }))

  const { error: batchErr } = await supabaseAdmin.from('contacts').insert(rows)

  if (batchErr) {
    console.error('[seed-demo] Failed to insert contacts:', batchErr)
    process.exitCode = 1
    return
  }

  console.log(`[seed-demo] Inserted ${rows.length} contacts for demo account.`)
  console.log(
    `[seed-demo] Done. Log in as username "${DEMO_USERNAME}" / password "${DEMO_PASSWORD}".`
  )
}

main().catch((err) => {
  console.error('[seed-demo] Unexpected error:', err)
  process.exitCode = 1
})
