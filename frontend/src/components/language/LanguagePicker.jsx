import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { BHASHINI_LANGUAGES } from '../../utils/constants'
import { useLanguage } from '../../hooks/useLanguage'

function LanguageChip({ lang, selected, onClick }) {
  return (
    <motion.button
      className="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg cursor-pointer transition-all min-w-[72px]"
      style={{
        background: selected ? 'var(--aura-accent)' : 'transparent',
        border: `1px solid ${selected ? 'var(--aura-accent)' : 'var(--aura-border)'}`,
        color: selected ? 'white' : 'var(--text-secondary)',
        direction: lang.rtl ? 'rtl' : 'ltr',
      }}
      whileHover={{ scale: 1.03, borderColor: 'var(--aura-border-hover)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={() => onClick(lang.code)}
    >
      <span className="text-sm font-medium leading-tight">{lang.nativeName}</span>
      <span className="text-[10px] mt-0.5 opacity-60">{lang.script}</span>
    </motion.button>
  )
}

export default function LanguagePicker({ compact = false }) {
  const { currentLang, setLanguage } = useLanguage()
  const [showSheet, setShowSheet] = useState(false)
  const [search, setSearch] = useState('')
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const currentLangObj = BHASHINI_LANGUAGES.find(l => l.code === currentLang) || BHASHINI_LANGUAGES[0]

  const filteredLangs = BHASHINI_LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.nativeName.includes(search)
  )

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    checkScroll()
  }, [])

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 200, behavior: 'smooth' })
    setTimeout(checkScroll, 300)
  }

  const handleSelect = (code) => {
    setLanguage(code)
    setShowSheet(false)
    setSearch('')
  }

  // Mobile: bottom sheet trigger
  if (compact || typeof window !== 'undefined' && window.innerWidth < 768) {
    return (
      <>
        <button
          onClick={() => setShowSheet(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
          style={{
            background: 'var(--aura-bg-surface)',
            border: '1px solid var(--aura-border)',
            color: 'var(--text-primary)',
          }}
        >
          <span className="text-sm font-medium">{currentLangObj.nativeName}</span>
          <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
        </button>

        <AnimatePresence>
          {showSheet && (
            <>
              <motion.div
                className="fixed inset-0 z-40"
                style={{ background: 'var(--aura-bg-overlay)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSheet(false)}
              />
              <motion.div
                className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto"
                style={{
                  background: 'var(--aura-bg-elevated)',
                  border: '1px solid var(--aura-border)',
                }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100) setShowSheet(false)
                }}
              >
                {/* Handle */}
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full" style={{ background: 'var(--aura-border-hover)' }} />
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search language..."
                    className="w-full h-10 pl-9 pr-8 rounded-lg text-sm outline-none"
                    style={{
                      background: 'var(--aura-bg-surface)',
                      border: '1px solid var(--aura-border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                      <X size={14} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                  )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {filteredLangs.map(lang => (
                    <motion.button
                      key={lang.code}
                      className="flex flex-col items-center py-3 px-2 rounded-lg cursor-pointer"
                      style={{
                        background: lang.code === currentLang ? 'var(--aura-accent-subtle)' : 'var(--aura-bg-surface)',
                        border: `1px solid ${lang.code === currentLang ? 'var(--aura-accent)' : 'var(--aura-border)'}`,
                        direction: lang.rtl ? 'rtl' : 'ltr',
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelect(lang.code)}
                    >
                      <span className="text-sm font-medium" style={{ color: lang.code === currentLang ? 'var(--aura-accent-light)' : 'var(--text-primary)' }}>
                        {lang.nativeName}
                      </span>
                      <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {lang.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Desktop: horizontal scrollable row
  return (
    <div className="relative flex items-center gap-1">
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
          style={{ background: 'var(--aura-bg-base)', border: '1px solid var(--aura-border)' }}
        >
          <ChevronLeft size={14} style={{ color: 'var(--text-secondary)' }} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-none px-1 py-1"
        style={{ scrollbarWidth: 'none' }}
        onScroll={checkScroll}
      >
        {BHASHINI_LANGUAGES.map(lang => (
          <LanguageChip
            key={lang.code}
            lang={lang}
            selected={lang.code === currentLang}
            onClick={handleSelect}
          />
        ))}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
          style={{ background: 'var(--aura-bg-base)', border: '1px solid var(--aura-border)' }}
        >
          <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
        </button>
      )}
    </div>
  )
}

export function LanguageChipCompact({ code, onClick }) {
  const lang = BHASHINI_LANGUAGES.find(l => l.code === code)
  if (!lang) return null

  return (
    <button
      onClick={() => onClick?.(code)}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer"
      style={{
        background: 'var(--aura-accent-subtle)',
        border: '1px solid var(--aura-accent-glow)',
        color: 'var(--text-accent)',
        direction: lang.rtl ? 'rtl' : 'ltr',
      }}
    >
      {lang.nativeName}
    </button>
  )
}
