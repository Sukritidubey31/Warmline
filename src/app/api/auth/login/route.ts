import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return Response.json({ error: 'Username and password required' }, { status: 400 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createToken(user.id, user.username)
    return Response.json({ token, username: user.username, userId: user.id })
  } catch (e) {
    console.error('[POST /api/auth/login]', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
