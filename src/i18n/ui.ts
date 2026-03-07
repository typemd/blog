export const languages = {
  en: 'English',
  'zh-tw': '繁體中文',
} as const;

export type Locale = keyof typeof languages;

export const defaultLocale: Locale = 'en';

export const ui = {
  en: {
    'site.title': 'TypeMD Blog',
    'site.description': 'Development journal for TypeMD — a local-first knowledge management tool.',
    'hero.title': 'Dev Log',
    'hero.subtitle': 'Notes on building TypeMD — a local-first CLI for thinking in objects.',
    'nav.home': 'Home',
    'nav.docs': 'Docs',
    'post.readMore': 'Read',
    'post.allPosts': 'All posts',
    'footer.tagline': 'Think in objects, not files.',
  },
  'zh-tw': {
    'site.title': 'TypeMD 部落格',
    'site.description': 'TypeMD 開發日誌 — 一個 local-first 的知識管理工具。',
    'hero.title': '開發日誌',
    'hero.subtitle': '記錄打造 TypeMD 的過程 — 一個 local-first 的 CLI 知識管理工具。',
    'nav.home': '首頁',
    'nav.docs': '文件',
    'post.readMore': '閱讀',
    'post.allPosts': '所有文章',
    'footer.tagline': '用物件思考，而非檔案。',
  },
} as const;

export function t(locale: Locale, key: keyof (typeof ui)['en']): string {
  return ui[locale]?.[key] ?? ui[defaultLocale][key];
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, segment] = url.pathname.split('/');
  if (segment in languages) return segment as Locale;
  return defaultLocale;
}

export function getLocalePath(locale: Locale, path: string): string {
  if (locale === defaultLocale) return path;
  return `/${locale}${path}`;
}
