import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BHASHINI_LANGUAGES } from '../utils/constants'

export function useLanguage() {
  const { i18n } = useTranslation()
  const [currentLang, setCurrentLang] = useState(
    () => localStorage.getItem('aura_lang') || 'en'
  )

  const langObj = BHASHINI_LANGUAGES.find(l => l.code === currentLang) || BHASHINI_LANGUAGES[0]

  const setLanguage = useCallback((code) => {
    setCurrentLang(code)
    localStorage.setItem('aura_lang', code)
    i18n.changeLanguage(code)
    const lang = BHASHINI_LANGUAGES.find(l => l.code === code)
    if (lang?.rtl) {
      document.documentElement.setAttribute('dir', 'rtl')
    } else {
      document.documentElement.setAttribute('dir', 'ltr')
    }
  }, [i18n])

  useEffect(() => {
    if (langObj?.rtl) {
      document.documentElement.setAttribute('dir', 'rtl')
    }
  }, [langObj])

  return {
    currentLang,
    setLanguage,
    isRTL: langObj?.rtl || false,
    langName: langObj?.name || 'English',
    nativeName: langObj?.nativeName || 'English',
    script: langObj?.script || 'Latin',
  }
}
