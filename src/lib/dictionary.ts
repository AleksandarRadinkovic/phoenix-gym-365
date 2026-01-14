import 'server-only';
import type { Locale } from '@/i18n/config';

const dictionaries = {
  sr: () => import('@/i18n/locales/sr.json').then((module) => module.default),
  en: () => import('@/i18n/locales/en.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => dictionaries[locale]();
