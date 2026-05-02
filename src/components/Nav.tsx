interface NavProps {
  setView: (view: string) => void
  contactCount: number
  currentUser: string | null
  onLogout: () => void
  onDirectoryClick: () => void
}

export default function Nav({
  setView,
  contactCount,
  currentUser,
  onLogout,
  onDirectoryClick,
}: NavProps) {
  return (
    <nav
      className="w-full px-6 py-5 flex justify-between items-center border-b"
      style={{ backgroundColor: '#fdf8f4', borderColor: '#e8ddd5' }}
    >
      {/* Logo */}
      <span
        onClick={() => setView('home')}
        className="font-serif text-2xl font-bold tracking-tight cursor-pointer select-none"
        style={{ color: '#3d2314' }}
      >
        warmline
      </span>

      {/* Right actions */}
      <div className="flex items-center gap-3 flex-wrap justify-end">
        <button
          onClick={() => setView('tracker')}
          className="text-sm font-sans rounded-full px-4 py-2 border transition-colors"
          style={{ color: '#9a7060', backgroundColor: 'transparent', borderColor: '#e8ddd5' }}
        >
          my network
          {contactCount > 0 && (
            <span
              className="text-xs rounded-full px-2 py-0.5 ml-1"
              style={{ backgroundColor: '#c17d5a', color: '#ffffff' }}
            >
              {contactCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setView('directory')
            onDirectoryClick()
          }}
          className="text-sm font-sans rounded-full px-4 py-2 border transition-colors"
          style={{ color: '#9a7060', backgroundColor: 'transparent', borderColor: '#e8ddd5' }}
        >
          directory
        </button>

        {currentUser && (
          <span className="text-xs font-sans hidden sm:inline" style={{ color: '#b8a098' }}>
            {currentUser}
          </span>
        )}

        <button
          onClick={onLogout}
          className="text-xs font-sans rounded-full px-3 py-1.5 border transition-colors"
          style={{ color: '#b8a098', backgroundColor: 'transparent', borderColor: '#e8ddd5' }}
        >
          log out
        </button>

        <button
          onClick={() => setView('add')}
          className="text-sm font-sans font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#c17d5a', color: '#ffffff' }}
        >
          + add person
        </button>
      </div>
    </nav>
  )
}
