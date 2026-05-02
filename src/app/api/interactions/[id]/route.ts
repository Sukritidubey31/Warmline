import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/getUser'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { note, article_url, article_title, used, edited } = body

    const updates: Record<string, unknown> = {}
    if (note !== undefined)          updates.note = note
    if (article_url !== undefined)   updates.article_url = article_url
    if (article_title !== undefined) updates.article_title = article_title
    if (used !== undefined)          updates.used = used
    if (edited !== undefined)        updates.edited = edited

    const { data, error } = await supabaseAdmin
      .from('interactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/interactions/[id]]', error)
      return Response.json({ error: 'Failed to update interaction' }, { status: 500 })
    }

    return Response.json(data)
  } catch (err) {
    console.error('[PATCH /api/interactions/[id]]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
