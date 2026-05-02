import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
  const result = await model.embedContent(text)
  return result.embedding.values
}

export async function searchSimilar(
  supabaseAdmin: any,
  queryEmbedding: number[],
  userId: string,
  matchThreshold = 0.4,
  matchCount = 5
) {
  const { data, error } = await supabaseAdmin.rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_user_id: userId
  })
  if (error) throw error
  return data || []
}
