import { supabaseAdmin } from '@/lib/supabase'
import { embedText } from '@/lib/embeddings'
import { getUserId } from '@/lib/getUser'

export async function GET(request: Request) {
  const userId = getUserId(request)
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('last_contact', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function POST(req: Request) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, where_met, talked_about, intent, role, company, additional_notes } = await req.json()

    const { data: savedContact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        name,
        where_met,
        talked_about,
        intent,
        user_id: userId,
        role: role ?? null,
        company: company ?? null,
        additional_notes: additional_notes ?? null,
        last_contact: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const responseData = Response.json(savedContact)

    // Run in background, don't block response
    ;(async () => {
      try {
        const embeddingText = `${name} - met at ${where_met} - talked about: ${talked_about}`
        console.log('Starting background embedding...')
        const embedding = await embedText(embeddingText)
        const { error: embedError } = await supabaseAdmin
          .from('embeddings')
          .insert({
            contact_id: savedContact.id,
            user_id: userId,
            content: embeddingText,
            embedding
          })
        if (embedError) console.error('Embedding save failed:', embedError)
        else console.log('Background embedding saved!')
      } catch (e) {
        console.error('Background embedding error:', e)
      }
    })()

    return responseData
  } catch (err) {
    console.error('[POST /api/contacts]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
