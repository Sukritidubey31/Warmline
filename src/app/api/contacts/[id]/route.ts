import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/getUser'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getUserId(request)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('contacts')
      .update({ last_contact: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 })
    }

    const { error: interactionError } = await supabaseAdmin
      .from('interactions')
      .insert({
        contact_id: id,
        user_id: userId,
        type: 'followup',
        note: 'Marked as contacted',
        date: new Date().toISOString()
      })

    if (interactionError) {
      return Response.json({ error: interactionError.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('[PATCH /api/contacts/[id]]', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
