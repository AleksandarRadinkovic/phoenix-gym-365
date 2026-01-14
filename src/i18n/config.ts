export const i18n = {
  defaultLocale: 'sr',
  locales: ['sr', 'en'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
