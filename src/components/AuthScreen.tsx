'use client'

import { useState } from 'react'
import { generateGuestCredentials } from '@/lib/auth'

interface AuthScreenProps {
  onAuth: (token: string, username: string, userId: string) => void
}

type TabId = 'login' | 'start'

async function parseJsonSafely(res: Response) {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [tab, setTab] = useState<TabId>('start')

  const [loginUser, setLoginUser] = useState('')
  const [loginPwd, setLoginPwd] = useState('')
  const [showLoginPwd, setShowLoginPwd] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [regUser, setRegUser] = useState('')
  const [regPwd, setRegPwd] = useState('')
  const [showRegPwd, setShowRegPwd] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [credBoxUser, setCredBoxUser] = useState('')
  const [credBoxPwd, setCredBoxPwd] = useState('')

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      console.log(`${label} copied`)
    } catch {
      console.error('copy failed')
    }
  }

  const handleLoginWithCredentials = async (usernameRaw: string, passwordRaw: string) => {
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameRaw.trim(), password: passwordRaw }),
      })
      const data = await parseJsonSafely(res)
      if (!res.ok) {
        setLoginError(typeof data?.error === 'string' ? data.error : 'Login failed')
        return
      }
      onAuth(data.token, data.username, data.userId)
    } catch {
      setLoginError('Something went wrong')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogin = async () => {
    await handleLoginWithCredentials(loginUser, loginPwd)
  }

  const handleRegister = async () => {
    setRegError('')
    setRegLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUser.trim(), password: regPwd }),
      })
      const data = await parseJsonSafely(res)
      if (!res.ok) {
        setRegError(typeof data?.error === 'string' ? data.error : 'Could not create account')
        return
      }
      onAuth(data.token, data.username, data.userId)
    } catch {
      setRegError('Something went wrong')
    } finally {
      setRegLoading(false)
    }
  }

  const handleGenerateGuest = () => {
    const { username, password } = generateGuestCredentials()
    setRegUser(username)
    setRegPwd(password)
    setCredBoxUser(username)
    setCredBoxPwd(password)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border font-sans text-sm outline-none transition-colors'
  const inputStyle: React.CSSProperties = {
    borderColor: '#e8ddd5',
    backgroundColor: '#fdf8f4',
    color: '#3d2314',
  }

  const tabUnderline = (active: boolean) => ({
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid' as const,
    borderBottomColor: active ? '#c17d5a' : 'transparent',
    color: active ? '#c17d5a' : '#9a7060',
  })

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ backgroundColor: '#fdf8f4' }}
    >
      <div className="w-full max-w-md">
        <h1 className="font-serif text-4xl font-bold text-center mb-2" style={{ color: '#3d2314' }}>
          warmline
        </h1>
        <p className="text-center font-sans text-sm mb-8" style={{ color: '#7a5c4a' }}>
          networking that actually feels human
        </p>

        <div
          className="rounded-2xl p-8 shadow-sm border bg-white mb-8"
          style={{ borderColor: '#f0e6de' }}
        >
          <div className="flex gap-6 mb-8 border-b" style={{ borderColor: '#f0e6de' }}>
            <button
              type="button"
              onClick={() => setTab('login')}
              className="flex-1 pb-3 font-sans font-semibold text-sm"
              style={tabUnderline(tab === 'login')}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setTab('start')}
              className="flex-1 pb-3 font-sans font-semibold text-sm"
              style={tabUnderline(tab === 'start')}
            >
              Get started
            </button>
          </div>

          {tab === 'login' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-sans font-medium mb-2 block" style={{ color: '#5a3e32' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  autoComplete="username"
                  className={inputClass}
                  style={inputStyle}
                  placeholder="your username"
                />
              </div>
              <div>
                <label className="text-sm font-sans font-medium mb-2 block" style={{ color: '#5a3e32' }}>
                  Password
                </label>
                <div className="relative flex">
                  <input
                    type={showLoginPwd ? 'text' : 'password'}
                    value={loginPwd}
                    onChange={(e) => setLoginPwd(e.target.value)}
                    autoComplete="current-password"
                    className={`${inputClass} flex-1 pr-10`}
                    style={inputStyle}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-sans uppercase"
                    style={{ color: '#c17d5a' }}
                  >
                    {showLoginPwd ? 'hide' : 'show'}
                  </button>
                </div>
              </div>
              {loginError && (
                <p className="text-sm font-sans" style={{ color: '#dc2626' }}>
                  {loginError}
                </p>
              )}
              <button
                type="button"
                onClick={handleLogin}
                disabled={loginLoading || !loginUser.trim() || !loginPwd}
                className="w-full py-3 rounded-xl font-sans font-semibold transition-opacity"
                style={{
                  backgroundColor: '#c17d5a',
                  color: '#ffffff',
                  opacity: loginLoading || !loginUser.trim() || !loginPwd ? 0.45 : 1,
                  cursor: loginLoading ? 'wait' : 'pointer',
                }}
              >
                {loginLoading ? 'Logging in…' : 'Log in'}
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-[#e8ddd5]" />
                <span className="text-xs font-sans text-[#9a7060] shrink-0">── or ──</span>
                <div className="flex-1 h-px bg-[#e8ddd5]" />
              </div>

              <button
                type="button"
                disabled={loginLoading}
                onClick={() => {
                  const u = 'demo'
                  const p = 'warmline2026'
                  setLoginUser(u)
                  setLoginPwd(p)
                  void handleLoginWithCredentials(u, p)
                }}
                className="w-full bg-[#faf5f1] border border-[#e8ddd5] text-[#5a3e32] font-sans font-medium py-3 rounded-xl cursor-pointer disabled:opacity-50"
              >
                🎮 try the demo
              </button>

              <p className="text-xs text-[#9a7060] text-center font-sans mt-2">
                Demo account has 12 real contacts pre-loaded across warm, cooling, and cold — no setup needed.
              </p>
            </div>
          )}

          {tab === 'start' && (
            <div className="flex flex-col gap-4">
              <div
                className="rounded-xl px-4 py-3 text-xs font-sans leading-relaxed"
                style={{ backgroundColor: '#fffbeb', color: '#92400e' }}
              >
                ⚠️ Prototype notice: Use a unique password not used elsewhere. Passwords are hashed but this is not
                production-grade security.
              </div>

              <button
                type="button"
                onClick={handleGenerateGuest}
                className="text-sm font-sans font-semibold text-left"
                style={{ color: '#c17d5a' }}
              >
                Generate credentials for me →
              </button>

              {(credBoxUser || credBoxPwd) && (
                <div
                  className="rounded-xl px-4 py-3 border text-sm font-sans"
                  style={{ borderColor: '#e8ddd5', backgroundColor: '#fdf8f4', color: '#5a3e32' }}
                >
                  <p className="text-xs uppercase tracking-wide font-semibold mb-3" style={{ color: '#9a7060' }}>
                    Save these somewhere safe:
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs shrink-0" style={{ color: '#9a7060' }}>
                        Username:
                      </span>
                      <code className="text-xs flex-1 min-w-0 break-all">{credBoxUser}</code>
                      <button
                        type="button"
                        onClick={() => copyText('username', credBoxUser)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg border shrink-0"
                        style={{ borderColor: '#e8ddd5', color: '#c17d5a' }}
                      >
                        copy
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs shrink-0" style={{ color: '#9a7060' }}>
                        Password:
                      </span>
                      <code className="text-xs flex-1 min-w-0 break-all">{credBoxPwd}</code>
                      <button
                        type="button"
                        onClick={() => copyText('password', credBoxPwd)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg border shrink-0"
                        style={{ borderColor: '#e8ddd5', color: '#c17d5a' }}
                      >
                        copy
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-sans font-medium mb-2 block" style={{ color: '#5a3e32' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={regUser}
                  onChange={(e) => setRegUser(e.target.value)}
                  autoComplete="username"
                  className={inputClass}
                  style={inputStyle}
                  placeholder="pick a username"
                />
              </div>
              <div>
                <label className="text-sm font-sans font-medium mb-2 block" style={{ color: '#5a3e32' }}>
                  Password
                </label>
                <div className="relative flex">
                  <input
                    type={showRegPwd ? 'text' : 'password'}
                    value={regPwd}
                    onChange={(e) => setRegPwd(e.target.value)}
                    autoComplete="new-password"
                    className={`${inputClass} flex-1 pr-10`}
                    style={inputStyle}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-sans uppercase"
                    style={{ color: '#c17d5a' }}
                  >
                    {showRegPwd ? 'hide' : 'show'}
                  </button>
                </div>
              </div>
              {regError && (
                <p className="text-sm font-sans" style={{ color: '#dc2626' }}>
                  {regError}
                </p>
              )}
              <button
                type="button"
                onClick={handleRegister}
                disabled={regLoading || !regUser.trim() || !regPwd}
                className="w-full py-3 rounded-xl font-sans font-semibold transition-opacity"
                style={{
                  backgroundColor: '#c17d5a',
                  color: '#ffffff',
                  opacity: regLoading || !regUser.trim() || !regPwd ? 0.45 : 1,
                  cursor: regLoading ? 'wait' : 'pointer',
                }}
              >
                {regLoading ? 'Creating…' : 'Create account'}
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-[#e8ddd5]" />
                <span className="text-xs font-sans text-[#9a7060] shrink-0 whitespace-nowrap">
                  ── or login using demo ──
                </span>
                <div className="flex-1 h-px bg-[#e8ddd5]" />
              </div>

              <button
                type="button"
                disabled={regLoading || loginLoading}
                onClick={() => {
                  const u = 'demo'
                  const p = 'warmline2026'
                  setLoginError('')
                  void handleLoginWithCredentials(u, p)
                }}
                className="w-full bg-[#faf5f1] border border-[#e8ddd5] text-[#5a3e32] font-sans font-medium py-3 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? 'Logging in…' : '🎮 try the demo'}
              </button>

              <p className="text-xs text-[#9a7060] text-center font-sans mt-2">
                Demo account has 12 real contacts pre-loaded across warm, cooling, and cold — no setup needed.
              </p>

              {loginError && (
                <p className="text-sm font-sans text-center" style={{ color: '#dc2626' }}>
                  {loginError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
