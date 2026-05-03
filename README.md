# Warmline 🌿

**Networking that actually feels human**

> An AI-powered relationship management tool that helps you keep professional connections warm — without the awkward, transactional feeling of traditional networking.

🔗 **Live demo:** [warmline-inky.vercel.app](https://warmline-inky.vercel.app)

> Try it instantly with the demo account — no sign-up needed.

---

## ✨ What It Does

Most networking tools help you organize contacts. Warmline helps you know what to actually *do* with them.

| Feature | Description |
|---|---|
| ➕ Add a connection | Tell Warmline who you met, where, and what you talked about |
| ✉️ Get a follow-up | AI generates a warm, personalized message and a relevant article to share |
| 📋 Track your network | See who's going cold before you lose the connection |
| 💬 Get nudges | Choose how to reconnect: check-in, share an article, make an intro, or go custom |
| 🕰️ Interaction history | Every nudge is saved, editable, and builds context over time |
| 🧠 RAG-powered intelligence | The more you use it, the smarter it gets about your specific relationships |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Database | Supabase (PostgreSQL + pgvector) |
| AI | Anthropic Claude API (message generation + web search) |
| Embeddings | Google Gemini API (gemini-embedding-001) |
| RAG | pgvector similarity search for cross-contact context |
| Auth | Custom JWT auth with bcrypt password hashing |
| Hosting | Vercel |

---

## 🧠 How the RAG Pipeline Works

```
User adds contact
      ↓
Gemini embeds their details → stored as 3072-dim vector in pgvector
      ↓
User clicks "get nudge"
      ↓
┌─────────────────────────────────┬──────────────────────────────────┐
│ Personal History RAG            │ Network RAG                      │
│ Past interactions with this     │ Other contacts with semantically │
│ specific person                 │ similar conversations            │
└─────────────────────────────────┴──────────────────────────────────┘
      ↓
Both contexts passed to Claude
      ↓
Nudge references your relationship history + suggests network connections
```

---

## 🎮 Demo Account

Not ready to sign up? Log in instantly with:

```
Username: demo
Password: warmline2026
```

The demo account has **12 pre-loaded contacts** across warm, cooling, and cold states so you can explore the full experience right away.

---

## 🚀 Running Locally

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- An [Anthropic](https://console.anthropic.com) API key
- A [Google AI Studio](https://aistudio.google.com) API key (for Gemini embeddings)

---

### 1. Clone the Repo

```bash
git clone https://github.com/Sukritidubey31/warmline.git
cd warmline
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

Create a new project at [supabase.com](https://supabase.com). Go to **SQL Editor** and run these queries in order.

#### Enable pgvector

```sql
create extension if not exists vector;
```

#### Create Tables

```sql
create table users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

create table contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  name text not null,
  where_met text not null,
  talked_about text not null,
  intent text not null,
  role text,
  company text,
  additional_notes text,
  last_contact timestamptz default now(),
  created_at timestamptz default now()
);

create table interactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  date timestamptz default now(),
  note text,
  type text not null,
  article_url text,
  article_title text,
  used boolean default false,
  edited boolean default false
);

create table articles (
  id uuid default gen_random_uuid() primary key,
  url text unique not null,
  title text not null,
  summary text,
  topic text,
  fetched_at timestamptz default now()
);

create table embeddings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  content text not null,
  embedding vector(3072),
  created_at timestamptz default now()
);
```

#### Create the RAG Similarity Search Function

```sql
create or replace function match_embeddings(
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table(id uuid, contact_id uuid, content text, similarity float)
language sql stable as $$
  select id, contact_id, content,
    1 - (embedding <=> query_embedding) as similarity
  from embeddings
  where user_id = filter_user_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

---

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase — find these under Settings → API in your project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Anthropic — console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini — aistudio.google.com → Get API Key
GEMINI_API_KEY=your_gemini_key

# JWT — any random string works
JWT_SECRET=your-random-secret-string-here
```

---

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### 6. (Optional) Seed Demo Data

```bash
npx ts-node --project tsconfig.json src/scripts/seed-demo.ts
```

This creates a demo account with 12 pre-loaded contacts:

- **Username:** `demo`
- **Password:** `warmline2026`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # Register + login routes
│   │   ├── contacts/          # CRUD + [id] patch
│   │   ├── generate/          # AI follow-up generation
│   │   ├── nudge/             # RAG-powered nudge generation
│   │   └── interactions/      # Interaction history CRUD
│   ├── page.tsx               # Main app shell + state
│   └── globals.css
├── components/
│   ├── AuthScreen.tsx         # Login + register UI
│   ├── ContactForm.tsx        # Multi-step add contact form
│   ├── ResultView.tsx         # AI result display
│   ├── Tracker.tsx            # Warm/cooling/cold tracker
│   ├── Directory.tsx          # Searchable network directory
│   ├── Nav.tsx                # Top navigation
│   └── InteractionHistory.tsx # Per-contact history modal
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── anthropic.ts           # Anthropic client
│   ├── embeddings.ts          # Gemini embeddings + pgvector search
│   ├── auth.ts                # bcrypt password hashing
│   ├── jwt.ts                 # JWT create + verify
│   └── getUser.ts             # Extract user ID from request headers
├── types/index.ts             # TypeScript interfaces
├── middleware.ts              # JWT auth middleware for API routes
└── scripts/
    └── seed-demo.ts           # Demo account seeder
```

---

## ☁️ Deploying to Vercel

1. Push your repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Add all variables from `.env.local` under **Environment Variables** in the Vercel dashboard
4. Click **Deploy** — Vercel auto-detects Next.js

---

## ⚠️ Notes

- This is a **prototype** and is not production-grade security
- The auth system uses bcrypt hashing but has no email verification or password reset
- When creating an account, use a unique password that you have not used elsewhere
- All data is isolated per user in Supabase

---

Built with ☕ by [Sukriti Dubey](https://github.com/Sukritidubey31)
