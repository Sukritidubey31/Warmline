import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Article } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const topic = request.nextUrl.searchParams.get('topic')

    if (!topic) {
      return Response.json({ error: 'Missing topic query param' }, { status: 400 })
    }

    // 1. Check Supabase cache (fetched within the last 24 hours)
    const { data: cached } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('topic', topic)
      .gte('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single()

    if (cached) {
      return Response.json(cached as Article)
    }

    // 2. Fetch from NewsAPI
    const newsRes = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&pageSize=1&apiKey=${process.env.NEWS_API_KEY}`
    )
    const newsData = await newsRes.json()

    if (!newsData.articles || newsData.articles.length === 0) {
      return Response.json({ error: 'No articles found for this topic' }, { status: 404 })
    }

    const raw = newsData.articles[0]
    const now = new Date().toISOString()

    const article = {
      url: raw.url,
      title: raw.title,
      summary: raw.description ?? '',
      topic,
      fetched_at: now,
    }

    // 3. Upsert into Supabase (avoids duplicate url errors)
    const { data: saved, error: upsertError } = await supabaseAdmin
      .from('articles')
      .upsert(article, { onConflict: 'url' })
      .select()
      .single()

    if (upsertError) {
      console.error('[/api/articles] upsert error:', upsertError)
      return Response.json({ error: 'Failed to save article' }, { status: 500 })
    }

    return Response.json(saved as Article)
  } catch (err) {
    console.error('[/api/articles]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
