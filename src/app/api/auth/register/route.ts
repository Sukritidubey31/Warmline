import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, createToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return Response.json({ error: 'Username and password required' }, { status: 400 })
    }

    const password_hash = await hashPassword(password)

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({ username, password_hash })
      .select('id, username')
      .single()

    if (error) {
      if (error.code === '23505') {
        return Response.json({ error: 'Username already taken' }, { status: 409 })
      }
      console.error('[POST /api/auth/register]', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    const token = await createToken(user.id, user.username)
    return Response.json({ token, username: user.username, userId: user.id })
  } catch (e) {
    console.error('[POST /api/auth/register]', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
