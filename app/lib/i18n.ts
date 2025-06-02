import { setupI18n, type Messages } from '@lingui/core';
import { useRouteLoaderData } from 'react-router';

export const en_locale = 'en-GB' as const;
export const fr_locale = 'fr-FR' as const;
export const locales = [en_locale, fr_locale] as const;

export function useI18n() {
  const data = useRouteLoaderData<{ locale: string; messages: Messages }>(
    'root',
  );
  const locale = data?.locale ?? en_locale;
  const messages: Messages = data?.messages ?? {};
  return setupI18n({ locale, messages: { [locale]: messages } });
}
