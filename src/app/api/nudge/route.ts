import { supabaseAdmin } from '@/lib/supabase'
import { anthropic } from '@/lib/anthropic'
import { embedText, searchSimilar } from '@/lib/embeddings'
import { Contact } from '@/types'
import { getUserId } from '@/lib/getUser'

function extractJSON(text: string): string {
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1)
  }
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
}

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

export async function POST(req: Request) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contact_id, nudge_type = 'checkin', custom_text } = await req.json()

    // 1. Fetch contact from Supabase
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', contact_id)
      .eq('user_id', userId)
      .single()

    if (error || !contact) {
      return Response.json({ error: 'Contact not found' }, { status: 404 })
    }

    const typedContact = contact as Contact

    // 2. Calculate days since last contact
    const daysSince = Math.floor(
      (Date.now() - new Date(typedContact.last_contact).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // 3. RAG Query 1 — personal history: past embeddings for THIS contact only
    const contactEmbedding = await embedText(typedContact.talked_about)

    const { data: personalHistory } = await supabaseAdmin
      .from('embeddings')
      .select('content')
      .eq('contact_id', contact_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    const personalContext = personalHistory && personalHistory.length > 0
      ? `What you've talked about with ${typedContact.name} before: ${personalHistory.map((e: any) => e.content).join(' | ')}`
      : ''

    // 4. RAG Query 2 — network similarity (only for 'intro' type).
    // Vector search reads `embeddings` rows — contacts added via /api/generate had no embeddings until fixed;
    // if RPC returns none (or thresholds filter all), fall back to other contacts' profiles so intros still work.
    let networkContext = ''
    let similarPeople: any[] = []
    let otherPeople: any[] = []
    if (nudge_type === 'intro') {
      try {
        similarPeople = await searchSimilar(supabaseAdmin, contactEmbedding, userId, 0.35, 8)
      } catch (e: any) {
        console.warn('[/api/nudge] searchSimilar failed:', e?.message ?? e)
        similarPeople = []
      }
      otherPeople = similarPeople.filter((s: any) => s.contact_id && s.contact_id !== contact_id)
      if (otherPeople.length > 0) {
        networkContext = `Others with similar embedding matches: ${otherPeople.map((s: any) => s.content).join(' | ')}`
      } else {
        const { data: others } = await supabaseAdmin
          .from('contacts')
          .select('name,talked_about,company,role')
          .eq('user_id', userId)
          .neq('id', contact_id)
          .limit(15)

        if (others && others.length > 0) {
          networkContext = others
            .map((o: any) => {
              const label = [o.role, o.company].filter(Boolean).join(' at ')
              return `- ${o.name}${label ? ` (${label})` : ''}: ${o.talked_about}`
            })
            .join('\n')
        }
      }
    }

    console.log('=== RAG DEBUG ===')
    console.log('contact_id:', contact_id)
    console.log('nudge_type:', nudge_type)
    console.log('personalHistory:', JSON.stringify(personalHistory, null, 2))
    console.log('similarPeople raw:', JSON.stringify(similarPeople, null, 2))
    console.log('otherPeople filtered:', JSON.stringify(otherPeople, null, 2))
    console.log('networkContext:', networkContext)
    console.log('personalContext:', personalContext)
    console.log('=================')

    // 5. For 'article' type — fetch past article URLs to avoid duplicates
    let usedArticleUrls: string[] = []
    if (nudge_type === 'article') {
      const { data: pastInteractions } = await supabaseAdmin
        .from('interactions')
        .select('article_url')
        .eq('contact_id', contact_id)
        .eq('user_id', userId)
        .not('article_url', 'is', null)
      usedArticleUrls = (pastInteractions ?? [])
        .map((i: any) => i.article_url)
        .filter(Boolean)
    }

    // 6. Build type-specific prompt
    const baseInfo = `CONTACT INFO:
Name: ${typedContact.name}
Last talked about: ${typedContact.talked_about}
Days since last contact: ${daysSince}

${personalContext ? `YOUR HISTORY WITH ${typedContact.name.toUpperCase()}:\n${personalContext}\n` : ''}`

    let prompt: string
    let useWebSearch = false

    if (nudge_type === 'checkin') {
      prompt = `You are a warm networking coach. Write a casual check-in message to reconnect.

${baseInfo}
Write a warm, casual 2-3 sentence check-in. Reference something specific from your history. No sales pitch, no agenda — just genuine human connection.

You MUST respond with ONLY valid JSON:
{
  "nudgeMessage": "casual warm check-in message",
  "articleTitle": "",
  "articleUrl": ""
}
Start with { and end with }. No other text.`

    } else if (nudge_type === 'article') {
      const excludeNote = usedArticleUrls.length > 0
        ? `\nDo NOT share these URLs you've already sent: ${usedArticleUrls.join(', ')}\n`
        : ''
      prompt = `You are a warm networking coach. Find a recent article to share as a natural conversation starter.

${baseInfo}${excludeNote}
Search the web for one recent, relevant article about "${typedContact.talked_about}". Pick something genuinely interesting, not generic.

Write a warm 1-2 sentence intro to the article that feels like something a friend would send.

You MUST respond with ONLY valid JSON:
{
  "nudgeMessage": "warm 1-2 sentence message introducing the article",
  "articleTitle": "real article title from web search",
  "articleUrl": "real article url"
}
Start with { and end with }. No other text.`
      useWebSearch = true

    } else if (nudge_type === 'intro') {
      prompt = `You are a warm networking coach. Help make a thoughtful introduction between two people in your network.

${baseInfo}
${networkContext ? `OTHER PEOPLE IN THEIR NETWORK YOU CAN REFERENCE:\n${networkContext}\n` : ''}
${networkContext
  ? 'Pick one or two specific people from the list above whose interests overlap with THIS contact\'s conversation topic. Mention them by name and suggest why an intro makes sense. Write a warm message to send THIS contact about a potential introduction.'
  : 'They have no other contacts stored yet besides this person — write a warm message about staying in touch and expanding their network.'}

You MUST respond with ONLY valid JSON:
{
  "nudgeMessage": "warm message about making an introduction",
  "articleTitle": "",
  "articleUrl": ""
}
Start with { and end with }. No other text.`

    } else {
      // custom
      prompt = `You are a warm networking coach. Help craft a personalized outreach message.

${baseInfo}
USER'S GOAL: ${custom_text}

Use the contact's history and context to craft a message that achieves this goal in a warm, genuine way.
${custom_text?.toLowerCase().includes('article') || custom_text?.toLowerCase().includes('resource') ? 'Search the web for a relevant resource if helpful.' : ''}

You MUST respond with ONLY valid JSON:
{
  "nudgeMessage": "personalized message based on the user's goal",
  "articleTitle": "article title if relevant, otherwise empty string",
  "articleUrl": "article url if relevant, otherwise empty string"
}
Start with { and end with }. No other text.`
      useWebSearch = custom_text?.toLowerCase().includes('article') || custom_text?.toLowerCase().includes('resource') || false
    }

    // 7. Call Claude (with or without web search depending on type)
    const tools = useWebSearch
      ? [{ type: 'web_search_20250305', name: 'web_search' }] as any
      : undefined

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        ...(tools ? { tools } : {}),
        messages: [{ role: 'user', content: prompt }],
      })
    )

    // 8. Parse Claude's response — use last text block
    const textBlock = response.content.filter((b: any) => b.type === 'text').pop()
    const raw = textBlock?.type === 'text' ? (textBlock as any).text : ''
    const clean = extractJSON(raw)
    const parsed = JSON.parse(clean)

    const nudgeMessage: string = parsed.nudgeMessage
    const article = {
      title: parsed.articleTitle || 'No article found',
      url: parsed.articleUrl || '#',
    }

    // 9. Save interaction to Supabase
    const { error: insertError } = await supabaseAdmin
      .from('interactions')
      .insert({
        contact_id,
        user_id: userId,
        type: 'nudge',
        note: nudgeMessage,
        article_url: article.url,
        article_title: article.title,
        used: false,
        edited: false,
        date: new Date().toISOString(),
      })

    if (insertError) {
      console.error('[/api/nudge] Failed to save interaction:', insertError)
    }

    // 10. Embed the interaction in the background
    const embeddingContent = `${typedContact.name} - nudge - ${nudgeMessage}`
    embedText(embeddingContent)
      .then((embedding) => {
        supabaseAdmin.from('embeddings').insert({
          contact_id,
          user_id: userId,
          content: embeddingContent,
          embedding,
        })
      })
      .catch((err) => console.error('Interaction embedding failed:', err))

    // 11. Return nudge message and article
    return Response.json({
      nudgeMessage,
      article: {
        title: article.title,
        url: article.url,
        reason: `Related to your conversation about "${typedContact.talked_about}"`,
      },
    })
  } catch (err) {
    console.error('[/api/nudge]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
