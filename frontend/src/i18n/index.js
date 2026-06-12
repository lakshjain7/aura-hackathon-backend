import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import hi from './locales/hi.json'
import te from './locales/te.json'
import ta from './locales/ta.json'
import kn from './locales/kn.json'
import ml from './locales/ml.json'
import bn from './locales/bn.json'
import mr from './locales/mr.json'
import gu from './locales/gu.json'
import pa from './locales/pa.json'
import or_lang from './locales/or.json'
import as_lang from './locales/as.json'
import ur from './locales/ur.json'
import mai from './locales/mai.json'
import sat from './locales/sat.json'
import ks from './locales/ks.json'
import ne from './locales/ne.json'
import kok from './locales/kok.json'
import doi from './locales/doi.json'
import brx from './locales/brx.json'
import mni from './locales/mni.json'
import sa from './locales/sa.json'

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  te: { translation: te },
  ta: { translation: ta },
  kn: { translation: kn },
  ml: { translation: ml },
  bn: { translation: bn },
  mr: { translation: mr },
  gu: { translation: gu },
  pa: { translation: pa },
  or: { translation: or_lang },
  as: { translation: as_lang },
  ur: { translation: ur },
  mai: { translation: mai },
  sat: { translation: sat },
  ks: { translation: ks },
  ne: { translation: ne },
  kok: { translation: kok },
  doi: { translation: doi },
  brx: { translation: brx },
  mni: { translation: mni },
  sa: { translation: sa },
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('aura_lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
