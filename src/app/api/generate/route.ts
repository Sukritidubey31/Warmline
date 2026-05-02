import { anthropic } from '@/lib/anthropic'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { embedText } from '@/lib/embeddings'
import { getUserId } from '@/lib/getUser'

async function callWithRetry(fn: () => Promise<any>, retries = 3, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e: any) {
      if (e?.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw e
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, where_met, talked_about, intent, role, company, additional_notes } = body

    const prompt = `Search for a recent article about "${talked_about}". Then give networking advice for someone who just met ${name} (met at ${where_met}, talked about ${talked_about}, goal: ${intent}).

You MUST respond with ONLY a valid JSON object. No introduction, no explanation, no markdown. The ENTIRE response must be parseable by JSON.parse(). Start your response with { and end with }.

{"message":"...","giveFirst":"...","timeline":"...","insight":"...","articleTitle":"...","articleUrl":"..."}`

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any,
        messages: [{ role: 'user', content: prompt }],
      })
    )

    const textBlock = response.content.filter((b: any) => b.type === 'text').pop()
    const raw = textBlock?.type === 'text' ? (textBlock as any).text : ''
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const parsed = JSON.parse(clean)

      // Save contact to database (need id for intro / RAG embeddings)
      const { data: savedContact, error: saveError } = await supabaseAdmin
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
        .select('id')
        .single()

      if (saveError || !savedContact?.id) {
        console.error('Failed to save contact:', saveError)
      } else {
        ;(async () => {
          try {
            const embeddingText = `${name} - met at ${where_met} - talked about: ${talked_about}`
            const embedding = await embedText(embeddingText)
            const { error: embedError } = await supabaseAdmin.from('embeddings').insert({
              contact_id: savedContact.id,
              user_id: userId,
              content: embeddingText,
              embedding,
            })
            if (embedError)
              console.error('[/api/generate] Embedding save failed:', embedError)
          } catch (e) {
            console.error('[/api/generate] Embedding error:', e)
          }
        })()
      }

      return Response.json({
        ...parsed,
        article: {
          title: parsed.articleTitle || 'No relevant article found',
          url: parsed.articleUrl || '#',
          reason: `Shared because you talked about ${talked_about}`,
        },
      })
    } catch {
      return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
