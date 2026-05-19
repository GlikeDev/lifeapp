import { useLanguageStore } from '../store/useLanguageStore';
import { TRANSLATIONS } from './translations';

export function useTranslation() {
  const { lang, setLang } = useLanguageStore();
  const dict = TRANSLATIONS[lang];

  function t(key: string, vars?: Record<string, string | number>): string {
    let str = dict[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  }

  const locale = lang === 'en' ? 'en-US' : 'ru-RU';

  return { t, lang, setLang, locale };
}
