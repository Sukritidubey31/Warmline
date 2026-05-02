import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/getUser'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contact_id = request.nextUrl.searchParams.get('contact_id')

    if (!contact_id) {
      return Response.json({ error: 'Missing contact_id' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('interactions')
      .select('*')
      .eq('contact_id', contact_id)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      console.error('[GET /api/interactions]', error)
      return Response.json({ error: 'Failed to fetch interactions' }, { status: 500 })
    }

    return Response.json(data)
  } catch (err) {
    console.error('[GET /api/interactions]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contact_id, type, note, article_url, article_title } = body

    if (!contact_id || !note) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('interactions')
      .insert({
        contact_id,
        user_id: userId,
        type: type ?? 'manual',
        note,
        article_url: article_url ?? null,
        article_title: article_title ?? null,
        used: false,
        edited: false,
        date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/interactions]', error)
      return Response.json({ error: 'Failed to save interaction' }, { status: 500 })
    }

    return Response.json(data)
  } catch (err) {
    console.error('[POST /api/interactions]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
